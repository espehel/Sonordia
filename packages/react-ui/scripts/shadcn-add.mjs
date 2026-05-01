#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: npm run shadcn:add -- @shadcn/<name> [...]");
  process.exit(1);
}

// Default-deny shadcn's interactive overwrite prompt by piping "n" — we never
// want to silently clobber a customized component (e.g. button.tsx) just
// because a new component declared it as a dependency.
const result = spawnSync(
  "sh",
  ["-c", `yes n | npx shadcn@latest add ${args.map((a) => `'${a}'`).join(" ")} --yes`],
  {
    stdio: ["inherit", "inherit", "inherit"],
  }
);
if (result.status !== 0) process.exit(result.status ?? 1);

const uiDir = "src/components/ui";
let changed = 0;
for (const file of readdirSync(uiDir)) {
  if (!file.endsWith(".tsx")) continue;
  const path = join(uiDir, file);
  const original = readFileSync(path, "utf8");
  const fixed = original
    .replace(/from "@\/lib\/utils"/g, 'from "../../lib/utils"')
    .replace(/from "@\/components\/ui\/([\w-]+)"/g, 'from "./$1"');
  if (fixed !== original) {
    writeFileSync(path, fixed);
    console.log(`normalized imports in ${path}`);
    changed++;
  }
}

if (changed === 0) console.log("No imports needed rewriting.");
console.log(
  '\nReminder: add the new subpath to "exports" in package.json (e.g. "./<name>": "./src/components/ui/<name>.tsx").'
);
