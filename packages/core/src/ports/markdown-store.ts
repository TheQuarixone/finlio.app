/**
 * The on-device document store (architecture §4.4).
 *
 * Storage-agnostic on purpose: web writes to OPFS/IndexedDB under WebCrypto,
 * mobile writes an encrypted file via Expo FileSystem, tests write to a Map.
 * The interface carries no browser type, so `packages/core` stays portable and
 * the Phase-4 native adapter is an implementation, not a redesign.
 *
 * Adapters handle encryption. Callers see plaintext Markdown; what lands on
 * disk is ciphertext.
 */
export interface MarkdownStore {
  read(key: string): Promise<string | null>;
  write(key: string, contents: string): Promise<void>;
  remove(key: string): Promise<void>;
  list(): Promise<string[]>;
}

/** The single document key for the Phase-2 single-profile product. */
export const PRIMARY_DOCUMENT_KEY = "finlio.md" as const;
