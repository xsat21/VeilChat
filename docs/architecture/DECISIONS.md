# Architecture decisions — pending approval

**Current decision packet (2026-10-30):**

- [ADR-001 — E2EE backend and protocol](ADR-001-E2EE-BACKEND.md) (**PROPOSED; Matrix vs Go + MLS not yet approved**).
- [Browser identity and key lifecycle](../security/IDENTITY-KEY-LIFECYCLE.md).
- [Integration proof and release test plan](../security/E2EE-INTEGRATION-TEST-PLAN.md).

These documents provide gates for future PRs, not a production security approval. The synthetic UI/preview must remain non-messaging until an option is explicitly accepted and implemented with evidence.


**Status:** PROPOSED — no production crypto or messaging architecture is approved.

- Frontend: Vite + React + TypeScript, mobile-first PWA.
- Backend **not selected**: Matrix homeserver and hardened Go relay + browser MLS are separate alternatives. Matrix JS SDK cannot use a simple Go queue as a drop-in homeserver.
- Do not invent cryptographic protocols or claim secure messaging before an audited E2EE SDK is integrated and tested.
- PWA cannot guarantee secrecy of visible plaintext on devices compromised by OS-level spyware, accessibility misuse, screen capture, or remote access.
- A compromised frontend origin can serve hostile JavaScript and defeat otherwise strong E2EE. Separate trust boundaries and constrain deploy rights.
- Service worker and offline ciphertext/key persistence are postponed until threat modeling and tests exist.

## Next gate

Approve backend choice, identity verification, recovery, and browser key-storage threat model before integration PRs.
