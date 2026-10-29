# ADR-001: Browser E2EE protocol and backend selection

- **Status:** PROPOSED — **maintainer approval required**
- **Date:** 2026-10-30
- **Owners:** VeilChat maintainers
- **Scope:** 1:1 text-messaging PWA on Android, iOS and desktop; self-hosted with Docker/Coolify on a Proxmox VM
- **Supersedes:** No accepted ADR. Expands [architecture decisions](DECISIONS.md) and [PWA roadmap](../PWA-SECURITY-ROADMAP.md).

> This document does **not** approve production crypto. VeilChat is a synthetic UI prototype, not a secure messenger. Neither branch below may send real private messages before acceptance gates are passed.

## 1. Decision needed

Select exactly **one primary MVP messaging backend and E2EE integration path**:

- **A — Matrix:** React/Vite PWA + **matrix-js-sdk** with **Rust crypto/WASM** + self-hosted **Synapse/PostgreSQL** (or another independently evaluated compatible homeserver). The existing standalone Go relay is retained as separate research material, **not** a Matrix transport adapter.
- **B — Go + MLS:** React/Vite PWA + an independently vetted **browser-native MLS implementation** + a **hardened Go delivery service** and an explicit device/authentication service. This is **not** an automatic continuation of the previously tested Wire fork.

**Provisional product recommendation: A (Matrix)** if shipping a maintainable browser messaging MVP with a documented client SDK is the overriding goal. **B remains viable for dedicated R&D** if keeping Go as the production relay and accepting substantially greater protocol integration and audit work are hard requirements. This recommendation is **not authorization** to add either SDK or deploy a backend.

## 2. Constraints

1. Browser-first: Chrome on Android, Safari on iOS, Chromium and Firefox on desktop; PWA installation is an optional enhancement, not a native app dependency.
2. Frontend stack: Vite + React + TypeScript, no third-party scripts in message views.
3. Self-hostable on a Debian VM under Proxmox; Docker/Coolify; no mandatory external push, analytics or Google trust service.
4. Encrypt/decrypt on the client, authenticate *device identity* independently from server login, and minimize plaintext persistence and metadata.
5. Do not invent custom E2EE schemes or confuse TLS/WebCrypto primitives with an authenticated messaging protocol.
6. Do not claim the web app can prevent screenshots, inspect OS integrity, or keep plaintext secret on a fully compromised endpoint.
7. Do not ship unfixed or unassessed crypto dependency advisories as "safe because the PoC worked."
8. PRs stay small, CI and review mandatory, and no automatic merge.

## 3. Research-derived evidence (not new tests)

The research record in [PWA roadmap](../PWA-SECURITY-ROADMAP.md) covered 12 repositories. The reported laboratory PoC exchanged synthetic MLS ciphertext over a Go relay using CoreCrypto WASM in Chromium 153 and Firefox 157; 14 scenarios passed in the cross-engine run, including tamper/replay rejection **at the SDK**. Important limits:

- Device identities were compared with an **out-of-band test controller**, not production human QR/fingerprint verification.
- The original Go relay still accepted duplicate submissions and required authentication, ACK/TTL and resource hardening.
- The test used **HTTP loopback**, not an Internet-facing production TLS deployment.
- Safari/iOS, physical Android, real Coolify hosting, recovery, full membership/key rotation and adverse network load remain unverified.
- The examined Wire/CoreCrypto fork had **unresolved patch-provenance concerns** for OpenMLS advisories [GHSA-gc79-23g3-8g52](https://github.com/openmls/openmls/security/advisories/GHSA-gc79-23g3-8g52) and [GHSA-94v4-rg25-x625](https://github.com/openmls/openmls/security/advisories/GHSA-94v4-rg25-x625). **No claim that the fork is definitely exploitable or definitely fixed** is made without a source-level patch trace and applicable reproduction.

The prior Go performance results measured synthetic local POST/GET transactions, **not** end-to-end cryptographic throughput on phones or a sizing guarantee.

## 4. Technical comparison

| Dimension | A: Matrix JS SDK + homeserver | B: browser MLS + hardened Go |
|---|---|---|
| Browser client | Official JS/TS SDK supports Vite; Rust crypto exposed through WASM | CoreCrypto WASM PoC succeeded, but production SDK selection is not yet cleared |
| Server semantics | Must implement Matrix Client-Server API; use compatible homeserver | Custom auth/identity, KeyPackage, Welcome, MLS group epoch ordering, retry, ACK and TTL contracts |
| Existing Go starter | Not a drop-in Matrix backend | Repairable foundation **only after** serious auth, delivery and resource hardening |
| Client identity | Matrix device signing, verification and cross-signing require product UX | MLS credential reference identifiers, device verification, enrollment and transparency must be explicitly designed |
| E2EE security model | Olm for some peer/device flows and Megolm for encrypted room events; **do not attribute all Double Ratchet PCS properties to Megolm** | MLS continuous group key agreement with epochs and post-compromise security under its assumptions; authentication service and delivery behavior still matter |
| Offline/retry | SDK and server implement sync/queue abstractions; persistence/recovery UX still required | All loss, replay and state commit semantics must be implemented and tested by VeilChat |
| Operational footprint | Homeserver plus PostgreSQL and administration; benchmark on actual VM | Minimal relay possible, but identity and key-package services add complexity |
| Licensing | Matrix JS SDK Apache-2.0; Synapse has AGPL-3.0/commercial licensing; review obligations and distribution model | Every selected SDK/fork + transitive deps must be reviewed; a PoC package is not a license grant |
| Security review burden | Application integration and server configuration, update pipeline, SDK security | SDK fork advisories, custom identity/delivery correctness, group state, update/rollback and server hardening |
| Best fit | MVP browser integration speed and ecosystem | Strong requirement for custom Go backend and acceptance of substantial security R&D |

### Notes to prevent incorrect equivalence

- **Matrix room encryption** is not just "Signal Protocol in browser". Read the [Matrix Megolm limitations](https://spec.matrix.org/latest/olm-megolm/megolm/) about replay and post-compromise recovery; evaluate relevant device-level verification separately.
- **MLS** specifies a cryptographic protocol, **not an entire messenger**. The [RFC 9420](https://www.rfc-editor.org/rfc/rfc9420.html) architecture assumes device authentication/credentials and a delivery service; [RFC 9750](https://www.rfc-editor.org/rfc/rfc9750.html) expands these interfaces.
- **libsignal** publishes TypeScript APIs with native Node add-on bindings and explicitly does not support external consumers; it is not a proven drop-in web E2EE SDK. See [libsignal](https://github.com/signalapp/libsignal).
- An "E2EE" label must be withheld from the product until actual peer authentication, key lifecycle, replay/state handling, and safe release delivery are proven.

## 5. Proposed trust-boundary diagram

~~~mermaid
flowchart LR
  subgraph A["Untrusted network and hosting"]
    F["Frontend static origin / deployment pipeline"]
    S["Self-hosted messaging service"]
    D["Ciphertext + metadata storage"]
    S --> D
  end
  P1["Alice PWA: verified device identity + E2EE"] -->|"TLS: ciphertext + metadata"| S
  P2["Bob PWA: verified device identity + E2EE"] -->|"TLS: ciphertext + metadata"| S
  P1 <-->|"OOB identity comparison before trust"| P2
  F -. "loads JS/WASM: critical trust boundary" .-> P1
  F -. "loads JS/WASM: critical trust boundary" .-> P2
  OPS["Restricted CI / release approval"] --> F
~~~

This is a **logical design**, not a deployed environment. A compromised frontend release can read plaintext when clients decrypt it, even if a compromised *relay alone* cannot. Separating frontend and API subdomains helps scope credentials and CSP, but a single administrator controlling both origins remains highly trusted.

## 6. Decision gates (blocking)

**Architecture gate (maintainer sign-off):**
- [ ] Record **A or B** as accepted, with date, responsible reviewer, and rationale.
- [ ] Record whether the existing Go relay must remain a **production** component or only a research PoC.
- [ ] Confirm intended user enrollment, per-device identity, one-device MVP, peer verification UX, key-change policy and recovery model.
- [ ] Confirm how external push, history backup, lost browser storage and federated communication are handled or deferred.

**Dependency and legal gate:**
- [ ] Pin exact SDK/runtime versions and transitive package digests in reviewed lockfiles, record license notices and supply-chain provenance.
- [ ] Record relevant advisory applicability, fork-patch equivalence and remediation evidence. For MLS, explicitly resolve the two OpenMLS concerns in section 3 and check any newer advisories before integration.
- [ ] Test WebAssembly loading with production CSP; never add broad unsafe script permissions to "make it work."
- [ ] Validate actual Android/iOS compatibility; do not infer Safari support from desktop Chromium.

**Functional security gate before real messages:**
- [ ] Two **fresh, separately provisioned** devices verify peer identity over a meaningful OOB channel, then exchange only synthetic E2EE text.
- [ ] Demonstrate changed/counterfeit key and device re-enrollment are not silently trusted.
- [ ] Tamper, replay, duplicate delivery, lost ACK, reconnect, concurrent sessions, crash/reload and storage eviction tests.
- [ ] Inspect relay/homeserver payloads, logs, storage and backups for plaintext/secret exposure.
- [ ] Browser/runtime XSS/CSP/SW/cache tests; test signed and unauthorized frontend release scenarios at least in a controlled threat-model exercise.
- [ ] Run end-to-end over real TLS and verify certificate behavior and hostname policy.
- [ ] Document blocked capabilities and limitations honestly; independent review for any production confidentiality claim.

## 7. Consequences and rollback

**If A is approved:** start a **small isolated Synapse/PostgreSQL pilot**, without public registration or real user messages. Integrate Matrix JS SDK on a distinct PR, keep React fixture UI as safe fallback, and avoid treating unverified devices as trusted. Revisit CSP connect-src, WASM policy, crypto store, and operational budget with test evidence. No Go relay porting is implied.

**If B is approved:** do **not** adopt the prior Wire fork automatically. First close SDK patch/licensing questions and author an explicit MLS credential/authentication, KeyPackage, transport, ACK and state transaction contract. Then harden Go and run cross-browser PoCs with reproducible evidence. No plaintext fallback.

**If neither option is approved:** keep the synthetic UI and static Docker build; implement only independent documentation and defense-in-depth improvements. Never present the app as working E2EE.

A later change in protocol or homeserver is not a routine refactor. It may require user re-enrollment, changed trust/fingerprint representations, loss of previous encrypted history, migration UX and independent risk review.

## 8. References (primary)

- [Matrix JS SDK official README](https://github.com/matrix-org/matrix-js-sdk): browser/Vite support, Rust/WASM, IndexedDB caveats and single-client crypto-store warning.
- [Matrix.org SDK registry](https://www.matrix.org/ecosystem/sdks/): JS SDK Apache-2.0.
- [Matrix Olm/Megolm specification](https://spec.matrix.org/latest/olm-megolm/megolm/): replay and forward/post-compromise limitations.
- [Synapse repository](https://github.com/element-hq/synapse): homeserver and AGPL/commercial licensing.
- [Wire CoreCrypto](https://github.com/wireapp/core-crypto): WASM bindings, upstream source and licensing notices.
- [OpenMLS advisories](https://github.com/openmls/openmls/security/advisories): advisories and fix review.
- [RFC 9420 MLS protocol](https://www.rfc-editor.org/rfc/rfc9420.html) and [RFC 9750 architecture](https://www.rfc-editor.org/rfc/rfc9750.html).
- [W3C WebCrypto](https://www.w3.org/TR/WebCrypto/): API capabilities and threat model.

**End state:** ADR remains **PROPOSED** until the maintainer explicitly accepts A or B and the decision is recorded in this repository.