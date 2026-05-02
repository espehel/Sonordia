import Link from "next/link";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";

export function SiteNav() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex gap-6 items-center">
          <Link href="/" className="font-semibold tracking-tight text-base">
            Sonordia
          </Link>
          <div className="hidden sm:flex items-center gap-4 text-foreground/70">
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
