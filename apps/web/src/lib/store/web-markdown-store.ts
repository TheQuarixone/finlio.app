"use client";

import type { MarkdownStore } from "@finlio/core/ports";

/**
 * The web `MarkdownStore` adapter: OPFS for storage, WebCrypto (AES-GCM) for
 * encryption.
 *
 * Design notes that matter more than the code:
 *
 * - **OPFS, not localStorage.** The Origin Private File System is real
 *   browser-managed storage, not a 5MB string bucket, and it is not readable by
 *   scripts on other origins. A portfolio with a decade of holdings will not
 *   fit in localStorage.
 * - **The key never leaves the device.** It is generated here, stored
 *   non-extractable in IndexedDB, and used only to wrap/unwrap the document.
 *   The server has no copy and therefore cannot be compelled to produce one —
 *   that is the entire privacy claim, and it only holds if this stays true.
 * - **A fresh IV per write.** Reusing a nonce under AES-GCM is catastrophic,
 *   not merely untidy, so it is generated per write and stored with the
 *   ciphertext.
 *
 * Key lifecycle is the open problem (phase-2.md STORE-5): a user on a second
 * device, or one who clears site data, has no way to recover this key today.
 * Until opt-in encrypted backup ships, export is the only recovery path — which
 * is why STORE-7 exists and why the UI nudges toward it.
 */

const DB_NAME = "finlio";
const DB_STORE = "keys";
const KEY_ID = "document-key";
const IV_BYTES = 12;

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(DB_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(DB_STORE, "readonly").objectStore(DB_STORE).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * `extractable: false` means script cannot read the raw bytes back out — not
 * even ours. It can only be handed to `encrypt`/`decrypt`.
 */
async function documentKey(): Promise<CryptoKey> {
  const existing = await idbGet<CryptoKey>(KEY_ID);
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
  await idbPut(KEY_ID, key);
  return key;
}

async function rootDirectory(): Promise<FileSystemDirectoryHandle> {
  return navigator.storage.getDirectory();
}

/**
 * Ask the browser not to evict this origin under storage pressure (ADR-0005).
 *
 * Without it, OPFS is "best effort" and can be cleared silently — and since the
 * key lives in IndexedDB in the same origin, eviction destroys the data, not
 * just a cache of it. Best-effort itself: browsers may decline, and Safari
 * grants it based on engagement.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export function isSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.storage?.getDirectory === "function" &&
    typeof crypto?.subtle?.generateKey === "function"
  );
}

export function createWebMarkdownStore(): MarkdownStore {
  return {
    async read(key) {
      try {
        const dir = await rootDirectory();
        const handle = await dir.getFileHandle(key);
        const buffer = new Uint8Array(await (await handle.getFile()).arrayBuffer());
        if (buffer.byteLength <= IV_BYTES) return null;

        const iv = buffer.slice(0, IV_BYTES);
        const ciphertext = buffer.slice(IV_BYTES);
        const plaintext = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          await documentKey(),
          ciphertext
        );
        return new TextDecoder().decode(plaintext);
      } catch (error) {
        // A missing file is a legitimate empty state, not a failure.
        if (error instanceof DOMException && error.name === "NotFoundError") return null;
        throw error;
      }
    },

    async write(key, contents) {
      const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
      const ciphertext = new Uint8Array(
        await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          await documentKey(),
          new TextEncoder().encode(contents)
        )
      );

      const payload = new Uint8Array(iv.byteLength + ciphertext.byteLength);
      payload.set(iv, 0);
      payload.set(ciphertext, iv.byteLength);

      const dir = await rootDirectory();
      const handle = await dir.getFileHandle(key, { create: true });
      const writable = await handle.createWritable();
      await writable.write(payload);
      await writable.close();
    },

    async remove(key) {
      const dir = await rootDirectory();
      await dir.removeEntry(key).catch(() => undefined);
    },

    async list() {
      const dir = await rootDirectory() as FileSystemDirectoryHandle & {
        keys(): AsyncIterableIterator<string>;
      };
      const names: string[] = [];
      for await (const name of dir.keys()) names.push(name);
      return names;
    },
  };
}
