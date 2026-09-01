"use client";

import { useRef, useState } from "react";
import { exportMarkdown, importMarkdown, persistenceAvailable } from "@/lib/store/document-store";
import { Button } from "@/components/ui/button";

/**
 * Backup and restore.
 *
 * Per ADR-0005 the encryption key lives only in this browser and nobody — us
 * included — can recover it. An export the user has taken is therefore the only
 * backup that exists, which makes this feature load-bearing rather than a nicety.
 *
 * The warning is stated plainly and near the button that resolves it. Burying
 * "your data is unrecoverable" in a policy page would be technically honest and
 * practically useless.
 */
export function BackupPanel({ onImported }: { onImported?: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const markdown = await exportMarkdown();
      const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `finlio-${new Date().toISOString().slice(0, 10)}.md`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus({ kind: "ok", message: "Downloaded. Keep it somewhere you'll find it again." });
    } catch {
      setStatus({ kind: "error", message: "Couldn't export. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function restore(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const doc = await importMarkdown(await file.text());
      const count = doc.assets.length + doc.liabilities.length;
      setStatus({ kind: "ok", message: `Restored ${count} ${count === 1 ? "entry" : "entries"}.` });
      onImported?.();
    } catch {
      // The parser validates before writing, so a bad file cannot destroy
      // what is already stored.
      setStatus({
        kind: "error",
        message: "That doesn't look like a Finlio export. Nothing was changed.",
      });
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-base font-semibold">Back up your data</h2>

      <p className="mt-2 text-sm text-muted-foreground">
        Your holdings are encrypted with a key that exists only in this browser. That
        is what keeps them private — and it means{" "}
        <strong className="font-medium text-foreground">
          we cannot recover them for you
        </strong>
        . If you clear this browser&apos;s data or move to another device, a file you
        exported is the only way back.
      </p>

      {!persistenceAvailable() && (
        <p className="mt-3 rounded-lg bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] px-3 py-2 text-sm text-destructive">
          This browser can&apos;t store data privately, so nothing here survives closing
          the tab. Export before you leave.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="button" onClick={download} disabled={busy}>
          Export a copy
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          Restore from a file
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept=".md,text/markdown"
          onChange={restore}
          className="sr-only"
          aria-label="Choose a Finlio export to restore"
        />
      </div>

      {status && (
        <p
          role="status"
          className={`mt-4 text-sm ${
            status.kind === "error" ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {status.message}
        </p>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        The file is plain Markdown — open it in any editor and read it yourself.
      </p>
    </section>
  );
}
