# E2EE integration proof plan — browser-first

- **Status:** PLANNED / **no tests in this document have been executed**
- **Date:** 2026-10-30
- **Dependency:** [ADR-001](../architecture/ADR-001-E2EE-BACKEND.md) approval
- **Test data:** generated synthetic data only; never real credentials or private messages

This is the future *product integration* test matrix, not a retrospective report. Previous Chromium/Firefox CoreCrypto-through-Go results are in the [research roadmap](../PWA-SECURITY-ROADMAP.md) and do not constitute a pass here.

## Test environment manifest

Each run must record: repo commit SHA, dependency lockfile hash, E2EE SDK version/build digest, crypto WASM artifact digest, server image digests, OS/browser/engine versions, HTTPS origin, test-device model, network state, exact reproduction commands, actual observations and attachments (with secrets redacted). Report PASS, FAIL or BLOCKED honestly.

## Required matrix

| ID | Scenario | Pass criterion | Status |
|---|---|---|---|
| E2E-01 | Alice/Bob enroll separately in clean browsers | Device keys are independent and verified through documented OOB procedure | BLOCKED — no selected backend |
| E2E-02 | Alice sends to Bob; Bob replies | Only authorized endpoint decrypts; server-side capture contains ciphertext and routing metadata, not canary plaintext | BLOCKED |
| E2E-03 | Modified ciphertext | Recipient rejects authentication error without displaying forged plaintext | BLOCKED |
| E2E-04 | Exact replay/duplicate | SDK rejects replay; server duplicate and ACK behavior also measured separately | BLOCKED |
| E2E-05 | Peer key substitution | App does not show original verified state and blocks sensitive send pending re-verification | BLOCKED |
| E2E-06 | Device revocation | Session authorization is rejected and cryptographic consequences are documented | BLOCKED |
| E2E-07 | Offline receiver / reconnect | Ciphertext retained within bounded TTL; delivered exactly as specified after return | BLOCKED |
| E2E-08 | Lost ACK, retry, duplicate request | No unintended ciphertext loss, duplicate display, or state corruption | BLOCKED |
| E2E-09 | Crash/refresh mid-send or epoch change | SDK state remains consistent or exposes explicit recovery failure | BLOCKED |
| E2E-10 | Second tab on same crypto store | No concurrent unsafe writer, no ratchet/MLS state corruption | BLOCKED |
| E2E-11 | Browser storage deletion and rollback | Re-enrollment/recovery is explicit; previously verified identity is not silently reused | BLOCKED |
| E2E-12 | Invalid KeyPackage / Welcome (MLS path) or untrusted device event (Matrix path) | Rejected based on pinned SDK semantics; not accepted solely on server claim | BLOCKED |
| WEB-01 | XSS fixture through actual received message | Message rendered as literal text, no script execution or active HTML/link preview | BLOCKED |
| WEB-02 | CSP and WASM on deployed origin | No broad unsafe JS policy; chosen crypto WASM loads under reviewed exception if necessary | BLOCKED |
| WEB-03 | Service worker/cache/storage | No API, auth, plaintext, decrypted attachment, or secret exposure in tested persistent stores | BLOCKED |
| NET-01 | Public HTTPS, wrong certificate/hostname | Valid certificate required; invalid connection rejected; server sees no plaintext canary | BLOCKED |
| OPS-01 | Compromised/unavailable relay or dropped packets | DoS/metadata exposure documented; no forged decrypted message | BLOCKED |
| OPS-02 | Secret-bearing logs, deployment assets, backups | No unapproved secrets/plaintext in observed outputs | BLOCKED |
| PERF-01 | 2, 10, 50 sessions at realistic ciphertext/TTL | Latency, p50/p95, CPU/RAM, queue occupancy and retransmission measured (not guessed) | BLOCKED |
| MOBILE-01 | Android Chrome and iOS Safari installed/non-installed | Key store, reconnect, background pause, eviction and accessibility limitations documented | BLOCKED |

**BLOCKED** above means implementation and integrated test environment do not yet exist. Existing UI-only Chromium/NGINX smoke test success is **not** E2EE evidence.

## Failure classification

- **Security failure:** unauthenticated key acceptance, tamper/replay decrypted, plaintext transmitted or persisted unexpectedly, cross-device secret leak, unsafe frontend replacement, unsafe key-state rollback.
- **Reliability failure:** lost messages without explicit state, unjustified success ACK, retry-induced data corruption, unresolved migration.
- **Availability:** no push/background delivery, storage eviction or lost credentials may be known constraints. These cannot be re-labeled as confidentiality passes.
- **BLOCKED:** no physical device, no approved SDK, missing test authorization or unsupported browser. Do not guess outcomes.

## First PoC after ADR approval

1. Pin SDK version + hash and audit dependencies and licenses.
2. Start **isolated** backend with no public user data; record configuration.
3. Enroll two clean browser clients with synthetic identities and human-visible QR/fingerprint confirmation.
4. Exercise E2E-01 through E2E-05 and inspect server traffic/log output.
5. Expand to durability, crash, storage and mobile cases only after basic identity and crypto gates pass.
6. Keep experimental send disabled in the public UI; require maintainer review before deployment.

## Existing evidence / no retest claim

- Previous standalone research used CoreCrypto WASM with Go, Chromium and Firefox; it is not equivalent to Matrix SDK or to a maintained production MLS integration.
- PR #7 established a narrow CSP smoke check on Chromium Vite preview.
- PR #8 established NGINX static HTTP/caching checks under Docker GitHub Actions.
- PR #9 provides a proposed synthetic UI/XSS regression, currently independent of this ADR.
- None of these establishes end-to-end identity/security of a real VeilChat message.

## Reference specifications

- [Matrix JS SDK](https://github.com/matrix-org/matrix-js-sdk)
- [Matrix Olm/Megolm](https://spec.matrix.org/latest/olm-megolm/)
- [RFC 9420](https://www.rfc-editor.org/rfc/rfc9420.html)
- [RFC 9750](https://www.rfc-editor.org/rfc/rfc9750.html)
