import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll } from "vitest";
// Testing Library's custom matchers (toBeInTheDocument, etc.).
import "@testing-library/jest-dom/vitest";

// Testing Library only auto-registers cleanup when Vitest runs with
// `globals: true`. We don't, so unmount explicitly — otherwise rendered trees
// pile up and queries start matching elements from previous tests.
afterEach(cleanup);

// jsdom implements <dialog> markup but not its modal methods, so any component
// calling showModal() throws. Provide the minimum needed to exercise open/close
// behaviour. The real focus trap and ::backdrop are browser concerns and aren't
// asserted here.
beforeAll(() => {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.open = true;
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event("close"));
    };
  }
});
