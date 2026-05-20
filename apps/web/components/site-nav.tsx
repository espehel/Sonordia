import Link from 'next/link';
import { Suspense } from 'react';

import { LogoMark } from '@sonordia/ui/logo-mark';

import { AuthButton } from '@/components/auth-button';
import { EnvVarWarning } from '@/components/env-var-warning';
import { hasEnvVars } from '@/lib/utils';

export function SiteNav() {
  return (
    <nav className="border-b-foreground/10 flex h-16 w-full justify-center border-b">
      <div className="flex w-full max-w-5xl items-center justify-between p-3 px-5 text-sm">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight"
          >
            <LogoMark className="size-6" />
            Sonordia
          </Link>
          <div className="text-foreground/70 hidden items-center gap-4 sm:flex">
            <Link href="/download" className="hover:text-foreground transition-colors">
              Download
            </Link>
          </div>
        </div>
        {!hasEnvVars ? (
          <EnvVarWarning />
        ) : (
          <Suspense>
            <AuthButton />
          </Suspense>
        )}
      </div>
    </nav>
  );
}
