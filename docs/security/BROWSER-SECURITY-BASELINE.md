# Browser security baseline

**Status:** foundation only. This is not a claim that VeilChat is secure or ready for private messages.

## Current controls

- React renders user-visible content as text by default; unsafe HTML sinks are prohibited by a static guard.
- Vite production preview emits a restrictive CSP and selected browser security headers.
- The project has no third-party runtime scripts, analytics, remote fonts, or link-preview fetchers.
- Trusted Types capability is feature-detected, but **no permissive Trusted Types policy is created**.
- Source maps remain disabled for production builds.
- No service worker, cryptographic key storage, messaging API, or E2EE implementation exists yet.

## CSP baseline

The preview configuration currently allows only same-origin scripts/styles/fonts/connections, same-origin or data images, same-origin manifest, and self/blob workers. It blocks objects, framing, base URL changes, and form submission.

This is a **development preview policy**. Production security headers must be emitted by the real reverse proxy/static server and tested against the deployed origin. When Matrix or another remote API is selected, `connect-src` must be changed narrowly to the exact required endpoint(s); do not broaden it to `*`.

Do not add `'unsafe-eval'` or `'unsafe-inline'` to make a dependency work. If a chosen WASM SDK requires a specific CSP capability, document and test the minimum browser-supported directive before changing policy.

## DOM and XSS rules

Do not introduce:

- `dangerouslySetInnerHTML` for chat content or profile data;
- direct `innerHTML` / `outerHTML` assignment;
- `document.write`;
- `eval` or `new Function`;
- executable HTML/Markdown rendering without a dedicated threat review;
- remote images or automatic URL previews in the MVP.

The static source check is a guardrail, **not an XSS proof**. Data-flow testing and browser-level XSS tests are still required.

## Trusted Types

Trusted Types can reduce DOM-XSS sink exposure on supporting browsers. It does not stop malicious same-origin JavaScript from reading plaintext or invoking authorized key operations. A future policy must be narrow and reviewed; never create a policy that simply returns arbitrary input unchanged.

## Service worker

No service worker is intentionally included at this stage. Before adding one:

1. Define an explicit allowlist of immutable/versioned shell assets.
2. Never cache API/auth responses, decrypted messages, decrypted attachments, tokens, or crypto state.
3. Test update activation, rollback, stale bundle/WASM combinations, and offline behavior.
4. Treat `Cache-Control: no-store` as insufficient by itself because service-worker Cache API code can still store a response.
5. Test storage eviction and lifecycle behavior on physical Android and iOS devices.

## Browser keys and plaintext

Do not store private keys, access tokens, decrypted message history, or plaintext messages in `localStorage`, URL parameters, logs, crash reports, or service-worker caches. IndexedDB persistence requires encrypted state, recovery semantics, and concurrency protection before use.

WebCrypto `extractable: false` is not equivalent to a universal hardware-backed key guarantee and cannot protect plaintext against malicious JavaScript already running in the application origin.

## Endpoint limitation

A PWA cannot guarantee confidentiality of visible plaintext when the browser, OS, accessibility stack, screen capture stack, extension environment, or remote-control software is hostile. Security messaging must state this limitation explicitly.

## Required tests before E2EE integration

- CSP is delivered as an HTTP response header on the deployed origin.
- Inline/eval execution is rejected.
- Representative DOM-XSS payloads render inertly.
- Chromium and Firefox tests pass; Safari/iOS and Android Chrome are tracked separately.
- No API or sensitive response enters Cache Storage.
- No secret-bearing data enters local/session storage or logs.
- Production `connect-src` is restricted to approved endpoints only.
