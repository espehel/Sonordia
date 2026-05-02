import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <SiteNav />
        <div className="flex-1 w-full max-w-5xl px-5 py-12 flex flex-col gap-12">
          {children}
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
