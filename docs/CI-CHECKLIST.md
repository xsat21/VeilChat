# CI and dependency verification gate

**Status: bootstrap CI only, NOT a security certification.**

The initial Vite/React scaffold was merged without a committed lockfile. This workflow is intentionally a temporary check using `npm install` because `npm ci` requires a lockfile. This is **not reproducible** and must be replaced before any deployment.

## Follow-up required before deployment

1. Run `npm install --package-lock-only --ignore-scripts` using a trusted networked development environment.
2. Review the generated `package-lock.json` for resolved packages, license compatibility and advisories; commit it in a separate reviewable change.
3. Update CI from `npm install` to `npm ci --ignore-scripts` after confirming the build and required postinstall scripts, if any.
4. Pin GitHub Actions by immutable commit hashes and review action dependencies.
5. Add linting, tests, dependency audit and browser test suites as the application grows.
6. Add PWA icons, installability tests, and service worker only after its security policy is reviewed.
7. Do not put secrets in frontend build-time variables or the generated static site.

## Gate results

- [ ] GitHub Actions dependency resolution succeeds.
- [ ] TypeScript check succeeds.
- [ ] Production bundle succeeds.
- [ ] `dist/index.html` exists.
- [ ] A reviewed lockfile is committed and `npm ci` replaces bootstrap install.
- [ ] Target browser tests pass, including mobile browsers.

This CI checks code mechanics, not E2EE, XSS resilience, deployment TLS, or device compromise.
