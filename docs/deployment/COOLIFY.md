# VeilChat — Docker / Coolify static PWA deployment

**Status:** PROTOTYPE ONLY. This container serves a landing page. It does **not** implement authentication, E2EE, messaging, identities, browser key storage or safe persistence. **Do not transmit personal chats or production secrets.**

## Architecture and trust boundary

This image serves Vite static assets through non-root NGINX on internal port **8080**. Coolify's reverse proxy terminates public HTTPS and forwards to 8080. Static hosting and any future message API **must be reviewed separately**; this image never proxies requests to /api/ or /_matrix/.

A compromised frontend origin can deliver JavaScript that reads messages after decryption. Encrypted transport to a relay does not mitigate a malicious frontend release. Protect GitHub, the build/deploy identity, package registries, domains, TLS credentials and release approval rights.

## Local Docker smoke (synthetic prototype)

From repository root:

\`\`\`sh
docker compose up --build -d
curl -i http://127.0.0.1:8080/
curl -i http://127.0.0.1:8080/healthz
curl -i http://127.0.0.1:8080/api/private
docker compose logs --no-color
docker compose down
\`\`\`

The Compose example binds **127.0.0.1:8080** on the host, not the public interface. Container runs with a read-only root filesystem, writable /tmp tmpfs, dropped capabilities, no-new-privileges and explicit process/memory budgets. Verify these on the actual target system; do not equate lab values with measured production resource requirements.

## Deploy via Coolify (Dockerfile application)

1. Create a **Dockerfile** application connected to \`xsat21/VeilChat\`; choose an approved reviewed commit/branch, not an unreviewed PR.
2. Build context/base directory: repository root. Dockerfile location: \`Dockerfile\`.
3. Set **Ports Exposes: 8080**. The NGINX process listens on \`0.0.0.0:8080\` inside the container. Do not publish a second direct public port.
4. Assign a dedicated HTTPS domain to the *frontend* and configure DNS/certificates through the Coolify proxy. Do not expose admin control planes to the public app network.
5. No frontend secrets or private E2EE keys may be placed into Docker \`ARG\`, \`ENV\`, Vite variables, layers, logs or a static asset. The frontend currently requires **no environment variables**.
6. Review runtime resource limits, non-root UID, read-only filesystem, ephemeral /tmp, Linux capabilities, and health check configuration in the chosen Coolify deployment mode.
7. After deploying, verify **public HTTPS** on the real domain and run the endpoint checks below. Confirm the reverse proxy does not strip security headers or rewrite \`Cache-Control\`.

Coolify's Dockerfile instructions: https://coolify.io/docs/applications/builds/dockerfile

## Response header design

The static NGINX response sets:

- \`Content-Security-Policy\`: same-origin script/style/connect/font/manifest, no workers, objects, framing, forms or unsafe inline/eval. \`img-src\` permits local and data assets. **This may need carefully scoped changes for a selected crypto WASM SDK or external Matrix homeserver.**
- \`X-Content-Type-Options: nosniff\`, \`Referrer-Policy: no-referrer\`, \`X-Frame-Options: DENY\`, \`Cross-Origin-Opener-Policy: same-origin\`, \`Cross-Origin-Resource-Policy: same-origin\`, restrictive \`Permissions-Policy\`.
- \`Cache-Control: no-store\` for HTML, manifest, unknown routes, errors, and any non-fingerprinted asset; \`public, max-age=31536000, immutable\` only for strict Vite fingerprinted assets under \`/assets/\`.
- **HSTS** is deliberately **not** set by the internal HTTP container. Configure it at the externally validated HTTPS ingress after domain/TLS checks; deploy at an appropriate max-age with careful review before \`includeSubDomains\` or preload.

No per-location \`add_header\` directives are used because ordinary NGINX header inheritance would otherwise silently drop server-level CSP and other headers. \`always\` ensures they are present on errors as well.

Official NGINX header inheritance: https://nginx.org/en/docs/http/ngx_http_headers_module.html

## HTTP verification

Against the published HTTPS domain, inspect:

\`\`\`sh
curl -sSI https://YOUR-APP-DOMAIN/
curl -sSI https://YOUR-APP-DOMAIN/manifest.webmanifest
curl -sSI https://YOUR-APP-DOMAIN/assets/notfound-12345678.js
curl -sSI https://YOUR-APP-DOMAIN/api/private
\`\`\`

These checks need successful TLS chain validation and inspection of actual CSP, cache policy, and error status on **the public endpoint**. If routing through a proxy/CDN, verify headers again after every relevant proxy change. The Node smoke script can test HTTP responses with \`DEPLOY_URL=https://YOUR-APP-DOMAIN node scripts/deployment-http-test.mjs\`; run only against an approved test instance.

GitHub Actions exercises the Docker image using HTTP on localhost in an isolated runner with synthetic data. A CI pass does **not** validate production TLS, trusted identity verification, message confidentiality, SRI, mobile browsers or compromised-device resistance.

## Current release blockers

- [ ] Backend/E2EE protocol and SDK decision (Matrix vs Go+MLS); revisit \`connect-src\` and WASM CSP only after selection.
- [ ] Real message and account threat model, key recovery policy, and key verification.
- [ ] No installed PWA/offline service worker at this stage. \`worker-src 'none'\` intentionally disallows it.
- [ ] Physical Android/iOS/Safari tests.
- [ ] Production HTTPS domain, TLS and HSTS configuration, and actual reverse proxy testing.
- [ ] Pin build/runtime image digests and audit packages before any production release.
- [ ] Runtime container settings, SBOM/secret scanning, dependency/license review, backup strategy and release approval.

**Release policy:** THIS IS A TEST DEPLOYMENT, NOT A SECURE MESSENGER.
