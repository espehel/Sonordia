#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
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

// Each component lives in its own folder: src/components/<name>/<name>.tsx.
// The shadcn CLI emits flat files into the `ui` alias dir (src/components),
// so anything sitting at the top level of components/ is a freshly added
// component we need to fold into a subfolder and normalize its imports.
const componentsDir = "src/components";
let moved = 0;
for (const entry of readdirSync(componentsDir)) {
  if (!entry.endsWith(".tsx")) continue;
  const flatPath = join(componentsDir, entry);
  if (!statSync(flatPath).isFile()) continue;

  const name = entry.replace(/\.tsx$/, "");
  const folder = join(componentsDir, name);
  const finalPath = join(folder, entry);

  const fixed = readFileSync(flatPath, "utf8")
    .replace(/from "@\/lib\/utils"/g, 'from "../../lib/utils"')
    // Sibling component imports — shadcn emits "@/components/<x>" because that's
    // what the `ui` alias points to in components.json.
    .replace(/from "@\/components\/([\w-]+)"/g, 'from "../$1/$1"');

  mkdirSync(folder, { recursive: true });
  writeFileSync(finalPath, fixed);
  unlinkSync(flatPath);

  console.log(`moved ${flatPath} → ${finalPath}`);
  moved++;
}

if (moved === 0) console.log("No new components to relocate.");
console.log(
  '\nReminder: add the new subpath to "exports" in package.json (e.g. "./<name>": "./src/components/<name>/<name>.tsx").'
);
