# CI and dependency verification gate

**Status:** Clean-install verification configured; not a security certification.

The Vite/React scaffold originally shipped without a lockfile. A one-time GitHub Actions bootstrap on a feature branch generated `package-lock.json` and verified a clean `npm ci` build before committing it. The temporary contents-write workflow was removed before merge. The ongoing PWA workflow now uses `npm ci --ignore-scripts --no-audit --no-fund`.

## Review before merge

- [x] Generate and commit `package-lock.json` on an isolated branch.
- [x] Replace bootstrap `npm install` with `npm ci`.
- [x] Remove the temporary contents-write bootstrap workflow.
- [ ] Confirm final PR workflow run passed after changes.
- [ ] Review dependencies, licenses, security advisories and package scripts.
- [ ] Pin GitHub Actions to immutable commit SHA.
- [ ] Add lint, tests, SBOM, vulnerability review and browser security tests.
- [ ] Add icons and test installability on physical Android/iOS browsers when the app's service worker security policy is approved.

## Known limitations

- `--ignore-scripts` reduces install-time execution but may affect some future packages. Review any dependency requiring scripts explicitly.
- `--no-audit` skips the built-in npm audit; this workflow is **not** dependency vulnerability scanning.
- The workflow checks type correctness and build output, not E2EE, TLS, XSS safety, browser key management, or threat-model compliance.
- No secrets should be included in Vite public build variables or the static output.
