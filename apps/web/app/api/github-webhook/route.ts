import { createHmac, timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

const TAG = 'github-release';
const RELEASE_WORKFLOW_NAME = 'Release';

function verifySignature(body: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('x-hub-signature-256');
  if (!verifySignature(body, signature, secret)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  const event = req.headers.get('x-github-event');
  if (event === 'ping') {
    return NextResponse.json({ ok: true, ping: true });
  }

  const payload = JSON.parse(body) as {
    action?: string;
    workflow_run?: { name?: string; conclusion?: string | null };
  };

  let revalidated = false;

  if (event === 'release') {
    // Fires on publish/edit/etc. The assets may not all be uploaded yet — the
    // workflow_run handler below covers the moment when builds finish.
    revalidateTag(TAG, { expire: 0 });
    revalidated = true;
  } else if (
    event === 'workflow_run' &&
    payload.action === 'completed' &&
    payload.workflow_run?.name === RELEASE_WORKFLOW_NAME
  ) {
    revalidateTag(TAG, { expire: 0 });
    revalidated = true;
  }

  return NextResponse.json({ ok: true, event, revalidated });
}
