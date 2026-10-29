# Security status

**NOT READY FOR REAL MESSAGES.** This PR scaffolds a UI only. No E2EE, no cryptographic identity, no server authentication and no safe message storage exist.

## Security work before real use

1. Decide and audit a browser-compatible E2EE SDK and verify its transitive dependencies and license.
2. Implement and test identity verification, session and key lifecycle, tamper/replay prevention, and ciphertext-only transport.
3. Specify deployment CSP and Trusted Types; reject unsafe HTML and all third-party scripts in messaging views.
4. Audit service-worker updates/caches, IndexedDB retention, loss/recovery and multi-tab state concurrency.
5. Validate with two browsers and physical Android/iOS devices. Never claim PWA can stop OS screenshots or a fully compromised endpoint.

This repository is a development prototype, not an alternative to an audited messenger.
