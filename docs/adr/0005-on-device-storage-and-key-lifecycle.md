# ADR-0005 — On-device storage and the encryption key lifecycle

- **Status:** Accepted
- **Date:** 2026-09-01
- **Deciders:** Gokulakrishnan
- **Resolves:** PRD §14 ("where does on-device live for a browser"), phase-2 `STORE-1`, `STORE-5`

## Context

[ADR-0004](./0004-what-may-leave-the-device.md) says positions stay on the
device. That raises two questions a browser makes harder than a phone: *where*
does data live, and *what protects it*.

The second question has a consequence that is easy to skip past. If the key is
held only by the browser, then losing the browser profile loses the data —
permanently, with no reset link, because there is nobody holding a copy to reset
it with. That is the direct cost of the privacy guarantee, and it needs to be
stated rather than discovered by a user who cleared their cache.

## Decision

### Storage: OPFS, with WebCrypto AES-GCM

- **Origin Private File System** for the document. Real browser-managed storage
  rather than a string bucket; not reachable from other origins; large enough for
  a portfolio with years of history, which `localStorage` (~5MB) is not.
- **AES-GCM 256** via WebCrypto. The key is generated in the browser with
  `extractable: false`, stored in IndexedDB, and can only be handed to
  `encrypt`/`decrypt` — script cannot read its bytes back out, ours included.
- **A fresh 12-byte IV per write**, stored alongside the ciphertext. Nonce reuse
  under GCM is catastrophic rather than untidy.
- Browsers without OPFS fall back to an in-memory store for the session, and the
  UI says so plainly instead of pretending the data was saved.

### Key lifecycle — the part that matters

**Generation.** On first write, in the browser. Never transmitted.

**Storage.** IndexedDB, non-extractable, same origin as the app.

**Scope.** One key per browser profile. This has consequences we accept:

| Situation | What happens |
|---|---|
| Same browser, later visit | Works. Key is found, document decrypts. |
| Second device, or a different browser | **Empty document.** The key does not exist there. Not a bug. |
| Private/incognito window | Works for the session, discarded on close. |
| Clearing site data / "Clear cookies and site data" | **Key destroyed. Data unrecoverable.** |
| Browser evicts storage under pressure | Same as above. Mitigated by requesting persistent storage. |
| User forgets which browser they used | No recovery path exists. |

**Recovery: there is none, by construction.** We cannot reset what we do not
hold. The only recovery is a copy the user made themselves.

### Therefore, and non-negotiably

1. **Export exists and is prominent** (`STORE-7`). Plain `finlio/v1` Markdown,
   readable in any editor. This is the backup, and it is the only one.
2. **The consequence is stated in the product**, at the point where a user has
   something to lose — not buried in a policy page.
3. **Persistent storage is requested** (`navigator.storage.persist()`) to reduce
   silent eviction.
4. A corrupt document is **set aside, never overwritten**, so a decode bug cannot
   destroy data that a later fix could have read.

## Consequences

**Positive**
- The privacy claim holds all the way down: no server-side key, so no server-side
  compulsion, breach, or insider access can reach the data.
- Simple, auditable crypto with no key-management service to run.

**Negative / costs**
- **Users will lose data.** Some will clear their cache and be surprised. This is
  a real, recurring support cost and the honest price of the guarantee. Export
  and clear warnings reduce it; they do not remove it.
- No cross-device use until encrypted cloud backup ships (Phase 4). Deliberate:
  wrong-and-early on key sync is worse than late.
- Support cannot reproduce a user's dashboard, by design.

## Alternatives considered

- **Key derived from the account password.** Enables recovery and cross-device
  use, but a password reset then means data loss anyway unless the server holds
  an escrow — which reintroduces the thing we are avoiding. Revisit with proper
  E2E backup in Phase 4.
- **Server-held key.** Solves recovery, deletes the guarantee. Rejected.
- **Plaintext in OPFS.** Origin-scoped and not readable cross-site, so arguably
  adequate against the realistic web threat model — but it makes "encrypted on
  your device" false, and local disk access or a malicious extension reads it.
  Rejected.
- **`localStorage`.** Too small, synchronous, and trivially readable. Rejected.
