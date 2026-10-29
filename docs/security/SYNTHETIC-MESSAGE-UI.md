# Synthetic Message UI & XSS Regression (PR #9)

**Status:** UI prototype. **Not secure messaging**. No E2EE, identity verification, backend connection, browser key storage, sending or receiving real messages.

## What this PR changes

- Introduces an accessible, responsive chat-like layout that can switch between two **public, source-bundled** synthetic conversations.
- Renders message body content using React's normal text interpolation (`{message.body}`). No HTML parsing, Markdown, auto-linking or link previews.
- Includes a deliberately malicious-looking **text fixture** with `<img>`, `<script>`, `<svg>`, a `javascript:` URL, and a formatting example.
- Keeps the message composer and send control **disabled**, with warnings that real conversations must not be entered.
- Uses in-memory React state **only** to select a fixture, with no local/session storage, IndexedDB, cookies, service worker or outgoing app requests.
- Does not add third-party dependencies or change the E2EE backend decision.

## Why this matters

E2EE decrypts messages at the client. A message body is still **untrusted input** even after authentication and decryption. If it is turned into HTML, it could exploit an XSS sink and steal future plaintext or key-operation capabilities. Message content must remain inert text by default, and link/attachment rendering requires a separate security review.

This demo verifies a narrow rendering invariant, not overall protection against XSS:

> Every fixture message produces exactly one plain text body; hostile-looking characters must remain text rather than active DOM elements.

CSP and Trusted Types remain important defense-in-depth. A CSP success alone is not proof the React UI does not parse hostile HTML; that is why the browser test checks both the text and the child elements in each message body.

## Run locally

After the lockfile is committed:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run verify
npm run security:browser-test
```

The browser test requires a locally available Chrome/Chromium binary and exercises built `vite preview` through CDP. CI also builds and tests the Docker/NGINX static delivery image in a separate job.

## Automated acceptance criteria

- [ ] TypeScript strict check and production build pass.
- [ ] Static HTML sink check passes.
- [ ] Runtime CSP and security header checks pass.
- [ ] Switching to `Rendering test fixtures` results in five expected **literal text** message bodies.
- [ ] Message bodies contain no nested elements, and the message list contains no executable tags or links.
- [ ] The composer and send controls remain disabled.
- [ ] After changing threads, storage and service worker counts are still empty in a fresh browser profile.
- [ ] Switching back to the benign sample conversation restores the expected four messages.
- [ ] Existing Docker HTTP header and cache tests remain green.

## Limitations and next steps

The fixtures are static and publicly included in the JavaScript bundle. This is not a fuzzing corpus or a full DOM-XSS proof. It does not test untrusted real network payloads, third-party rich-text renderers, all browsers, screen capture, OS compromise, key protection or delivery.

Before a future **real** composer or transport is enabled:

1. Approve the E2EE/identity/backend ADR (Matrix homeserver **or** hardened Go + vetted browser MLS), and review licensing/advisories.
2. Design message state, verification/key-change UX, error handling and message-length limits.
3. Build safe data types and API validation; keep message bodies text-only with no remote media/link preview.
4. Test network-sourced adversarial text, Unicode/bidi controls, large messages and rendering on physical Android/iOS as well as desktop.
5. Add a separate privacy review for plaintext lifetime in memory, logs, crash reports and browser storage.
6. Review frontend origin integrity: an attacker able to replace shipped JavaScript can compromise E2EE endpoints regardless of ciphertext at the relay.

**Release gate:** Treat this as a synthetic UX and security test tool, never as a messenger for real data.
