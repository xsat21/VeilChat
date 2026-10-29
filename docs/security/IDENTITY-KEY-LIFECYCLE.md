# Browser identity, key lifecycle and recovery

**Status:** PROPOSED — not implemented. **Date:** 2026-10-30.  
**Related:** [ADR-001](../architecture/ADR-001-E2EE-BACKEND.md), [browser baseline](BROWSER-SECURITY-BASELINE.md).

VeilChat currently has no production account system, cryptographic identities, keys, recovery, or real messaging.

## Distinguish four responsibilities

1. **Account authentication:** authority to use the service. Login does not by itself authenticate peer E2EE keys.
2. **Device identity:** the cryptographic key of a client device, created/managed using the selected SDK.
3. **Peer verification:** a person establishes that the other device key belongs to the intended contact, ideally using QR/fingerprint compared through an independent channel.
4. **Local state protection:** lifecycle of encryption state, recoverability, encrypted persistence and authorized decryption. Browser WebCrypto non-extractability is not equivalent to a hardware-backed assurance.

## Proposed one-device MVP policy

| Event | Required behavior | Fail-closed behavior |
|---|---|---|
| First enrollment | Generate SDK-managed device identity, bind to authenticated service account and provide verification UI | Enrollment or key creation failure disables real messaging |
| New conversation | Verify peer key by meaningful OOB QR/fingerprint before labeling trusted | Unverified contact cannot silently become verified; block sensitive send by default |
| Peer key changes | Show old/new fingerprint and require explicit re-verification | No silent trust-on-change or fallback |
| Logout | Stop sync, clear in-memory UI content and revoke service session | Surface failed server revocation; do not claim remote memory wipe |
| Device revocation | Revoke service authority and update crypto sessions as supported by SDK | Compromised OS may retain previously seen plaintext |
| Lost browser storage | Explicit recovery or re-enrollment with new identity plus peer re-verification | Never silently generate a new key while preserving old verified status |
| Two browser tabs | Only one writer per SDK crypto store or a demonstrated safe coordinated design | Lock/block additional active writer |
| Offline delivery | Ciphertext-only queue and transactional crypto state, ACK after durable commit | Never ACK state which was not committed |
| Account recovery | Follow selected SDK-supported recovery/cross-signing mechanism, document history loss | Never promise undecryptable history can be recovered |

A **single active device per account** is the proposed first MVP complexity limit. Adding multi-device/cross-signing inheritance requires a separate, reviewed design.

## Option A: Matrix-specific implementation gates

- Use the pinned Matrix JS SDK Rust crypto, device verification and secret storage APIs, not deprecated legacy APIs.
- Official docs indicate browser crypto defaults to **IndexedDB**. Verify what actually persists, how it is protected and recovered: IndexedDB alone is not a universal encrypted-at-rest user-passphrase guarantee.
- Matrix SDK explicitly warns that multiple client instances sharing a crypto IndexedDB can corrupt state; own one active client/store and test second-tab refusal, refresh and crashes.
- Do not equate an encrypted room badge with a manually verified peer/device identity.
- Design login/device sessions, cross-signing or verification, key backup/recovery, key change, logout/revoke and re-enrollment UX using documented SDK APIs.
- Evaluate Megolm replay/post-compromise limits separately from account and device crypto.

## Option B: MLS + Go-specific implementation gates

- RFC 9420/9750 require defined **Authentication Service** and **Delivery Service** roles; the existing Go queue is not itself a trustworthy device credential authority.
- Define reference identifiers, signed credentials, proof of possession, expiration, revocation, authenticated KeyPackage publication and retrieval.
- KeyPackages require validation and one-time-use policies; defend against key substitution, reuse and stock exhaustion.
- Define ordering and crash consistency across Welcome, Proposal, Commit and application ciphertext; epoch state must not silently roll back or fork.
- Make state commit, durable send, idempotent retry and authenticated ACK transaction semantics explicit. A successful HTTP response is not enough evidence of cryptographic state correctness.
- Do not assume Wire/CoreCrypto (or an alternative fork) is cleared until advisory fix status, license, version compatibility and browser tests are independently reviewed.

## Browser storage and plaintext safety

- Manage private keys/session state through the chosen SDK; do not roll a custom serialization or E2EE scheme.
- No persisted plaintext chat history by default for first MVP; future encrypted offline history needs explicit key/backup/TTL design.
- Do not store raw private keys, tokens or plaintext in localStorage, URL parameters, developer logs, analytics, crash reports or service-worker caches.
- SDK-managed IndexedDB crypto storage still requires review of encryption, migrations, eviction, rollback and single-writer coordination.
- Reduce decrypted UI lifetime on lock, blur/background and session expiry, **without** claiming JavaScript garbage collection erases every plaintext copy.
- Non-extractable WebCrypto keys can be *used* by a malicious same-origin script with authority; neither WebCrypto nor worker isolation guarantees against hostile application JS.
- Service worker stays disabled until separately approved; Web Push is optional and must not contain plaintext.

## UX wording examples

**Use:** "This contact's verified device key has changed. Stop sending until you verify it again over another channel."

**Avoid:** "Your contact is safe because our server says the key is valid."

**Use:** "Local encryption state is missing. Re-enrollment and verification may be required; some message history may be lost."

**Avoid:** "We silently recreated your identity and your old contacts are still verified."

**Use:** "A PWA cannot guarantee secrecy against OS-level spyware, accessibility capture or remote-controlled screens."

## Acceptance tests before real messages

- [ ] Replaced/revoked/unverified contact device key cannot silently inherit trust.
- [ ] Real human-driven OOB comparison rejects spoofed peer identity.
- [ ] Two tabs racing on same store do not corrupt keys or ratchet/group state.
- [ ] Crash between cryptographic state mutation, send, local persist and ACK recovers safely.
- [ ] Storage eviction and rollback produce explicit recovery/re-enrollment; identity trust never silently continues.
- [ ] Logged-out/revoked session credentials are rejected by server within documented limitations.
- [ ] Browser logs, network captures, caches and backups contain no plaintext or unauthorized secrets in tested paths.
- [ ] Actual Chrome Android, Safari iOS and Firefox/Chromium desktop tests report versions and results.
- [ ] Independent review of deployment-origin compromise and key management assumptions.

**NO-GO for sensitive user messages** until these tests and approved ADR have evidence.

### References

- [Matrix JS SDK](https://github.com/matrix-org/matrix-js-sdk)
- [RFC 9420 MLS](https://www.rfc-editor.org/rfc/rfc9420.html)
- [RFC 9750 MLS architecture](https://www.rfc-editor.org/rfc/rfc9750.html)
- [W3C Web Cryptography API](https://www.w3.org/TR/WebCrypto/)