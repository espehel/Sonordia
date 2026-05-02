import { ThemeSwitcher } from "@/components/theme-switcher";

export function SiteFooter() {
  return (
    <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-12 text-foreground/70">
      <p>© Sonordia</p>
      <ThemeSwitcher />
    </footer>
  );
}
