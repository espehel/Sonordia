import { FeatureGrid } from "@/components/feature-grid";
import { Hero } from "@/components/hero";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <SiteNav />
        <div className="flex-1 w-full max-w-5xl px-5">
          <Hero />
          <div className="border-t border-foreground/10" />
          <section className="py-12 lg:py-16 flex flex-col gap-2">
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">What&apos;s inside</h2>
            <p className="text-foreground/70 max-w-xl">
              A small, focused player. Everything you need to listen, nothing that gets in the way.
            </p>
            <FeatureGrid />
          </section>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
