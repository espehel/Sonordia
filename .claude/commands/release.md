---
description: Bump date-based version, commit, push, and create GitHub release (triggers build workflow)
argument-hint: [optional release notes]
allowed-tools: Bash(git:*), Bash(gh:*), Bash(npm:*), Bash(date:*)
---

Create a new date-based release. The version format is `vYYYY.M.D` (no leading zeros on month/day).

Execute these steps in order. If any step fails, stop and report the error to the user — do not attempt to roll back.

1. **Verify clean working tree.** Run `git status --porcelain`. If output is non-empty, abort and ask the user to commit or stash first.

2. **Verify on main and up to date.** Run `git rev-parse --abbrev-ref HEAD` (must be `main`) and `git fetch origin main && git status -uno` to confirm not behind. If behind, run `git pull --ff-only`.

3. **Compute today's version.** Run `date +"v%Y.%-m.%-d"` and capture the output as `VERSION`.

4. **Check the tag doesn't already exist.** Run `git ls-remote --tags origin "refs/tags/$VERSION"`. If output is non-empty, abort and tell the user a release already exists for today — they can delete it on GitHub first if they want to redo it.

5. **Bump the desktop package version.** Strip the leading `v` and run:
   ```
   npm version --no-git-tag-version --workspace=@sonordia/desktop --allow-same-version "${VERSION#v}"
   ```

6. **Commit the bump.** Stage `apps/desktop/package.json` and `package-lock.json` (only if changed) and commit with message `chore: release $VERSION`. Do not include any Claude co-author trailer.

7. **Push the commit.** Run `git push origin main`.

8. **Create the GitHub release.** This triggers `.github/workflows/release.yml` which will build and upload artifacts.
   - If `$ARGUMENTS` is non-empty, use it as release notes: `gh release create "$VERSION" --title "$VERSION" --notes "$ARGUMENTS"`
   - Otherwise auto-generate notes: `gh release create "$VERSION" --title "$VERSION" --generate-notes`

9. **Print the release URL** so the user can navigate to watch the build progress.

Before step 7 (the first irreversible step), briefly state what you're about to push and tag, so the user can interrupt if something looks off.
