import { SiteFooter } from '@/components/site-footer';
import { SiteNav } from '@/components/site-nav';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center">
        <SiteNav />
        <div className="flex w-full max-w-5xl flex-1 flex-col gap-12 px-5 py-12">{children}</div>
        <SiteFooter />
      </div>
    </main>
  );
}
