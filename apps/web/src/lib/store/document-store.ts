"use client";

import { type FinlioDocument, emptyDocument } from "@finlio/schemas";
import { PRIMARY_DOCUMENT_KEY, type MarkdownStore } from "@finlio/core/ports";
import { parse, serialize } from "@finlio/core/domain";
import { createWebMarkdownStore, isSupported, requestPersistentStorage } from "./web-markdown-store";
import { createMemoryMarkdownStore } from "@finlio/data/store";

/**
 * The typed door onto the on-device document.
 *
 * Screens deal in `FinlioDocument`; the Markdown codec and the encrypted store
 * sit behind this. Nothing in the UI parses text.
 */

let store: MarkdownStore | null = null;

function activeStore(): MarkdownStore {
  if (store) return store;
  // A browser without OPFS still gets a working session — it just does not
  // persist. Better than a blank screen, and the UI says so.
  if (isSupported()) {
    store = createWebMarkdownStore();
    // Fire and forget: eviction destroys the key along with the data (ADR-0005),
    // so it is worth asking, and nothing should block on the answer.
    void requestPersistentStorage();
  } else {
    store = createMemoryMarkdownStore();
  }
  return store;
}

export async function loadDocument(): Promise<FinlioDocument> {
  const raw = await activeStore().read(PRIMARY_DOCUMENT_KEY);
  if (!raw) return emptyDocument("INR");
  try {
    return parse(raw);
  } catch {
    // A corrupt file must not brick the app. The bad copy is kept under a
    // salvage name so nothing is destroyed while the user carries on.
    await activeStore().write(`${PRIMARY_DOCUMENT_KEY}.corrupt`, raw);
    return emptyDocument("INR");
  }
}

export async function saveDocument(doc: FinlioDocument): Promise<void> {
  await activeStore().write(PRIMARY_DOCUMENT_KEY, serialize(doc));
}

/**
 * Raw Markdown for the export button.
 *
 * This is not a convenience feature. Per ADR-0005 the encryption key exists only
 * in this browser and cannot be recovered by anyone, so an export the user has
 * taken is the *only* backup that exists. Treat it as load-bearing.
 */
export async function exportMarkdown(): Promise<string> {
  return (await activeStore().read(PRIMARY_DOCUMENT_KEY)) ?? serialize(emptyDocument("INR"));
}

/** Restore from a previously exported file, after validating it parses. */
export async function importMarkdown(markdown: string): Promise<FinlioDocument> {
  const parsed = parse(markdown); // throws on anything that is not finlio/v1
  await activeStore().write(PRIMARY_DOCUMENT_KEY, serialize(parsed));
  return parsed;
}

export function persistenceAvailable(): boolean {
  return isSupported();
}
