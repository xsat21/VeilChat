# Architecture decisions — pending approval

**Status:** PROPOSED — no production crypto or messaging architecture is approved.

- Frontend: Vite + React + TypeScript, mobile-first PWA.
- Backend **not selected**: Matrix homeserver and hardened Go relay + browser MLS are separate alternatives. Matrix JS SDK cannot use a simple Go queue as a drop-in homeserver.
- Do not invent cryptographic protocols or claim secure messaging before an audited E2EE SDK is integrated and tested.
- PWA cannot guarantee secrecy of visible plaintext on devices compromised by OS-level spyware, accessibility misuse, screen capture, or remote access.
- A compromised frontend origin can serve hostile JavaScript and defeat otherwise strong E2EE. Separate trust boundaries and constrain deploy rights.
- Service worker and offline ciphertext/key persistence are postponed until threat modeling and tests exist.

## Next gate

Approve backend choice, identity verification, recovery, and browser key-storage threat model before integration PRs.
