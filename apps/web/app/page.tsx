import { FeatureGrid } from '@/components/feature-grid';
import { Hero } from '@/components/hero';
import { SiteFooter } from '@/components/site-footer';
import { SiteNav } from '@/components/site-nav';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center">
        <SiteNav />
        <div className="w-full max-w-5xl flex-1 px-5">
          <Hero />
          <div className="border-foreground/10 border-t" />
          <section className="flex flex-col gap-2 py-12 lg:py-16">
            <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              What&apos;s inside
            </h2>
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
