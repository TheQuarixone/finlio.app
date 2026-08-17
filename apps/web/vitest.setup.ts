import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
// Testing Library's custom matchers (toBeInTheDocument, etc.).
import "@testing-library/jest-dom/vitest";

// Testing Library only auto-registers cleanup when Vitest runs with
// `globals: true`. We don't, so unmount explicitly — otherwise rendered trees
// pile up and queries start matching elements from previous tests.
afterEach(cleanup);
