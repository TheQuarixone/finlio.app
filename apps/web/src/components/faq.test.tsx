import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Faq } from "@/components/faq";

/**
 * Example component test (Testing Library, jsdom project). Exercises the FAQ's
 * two pieces of state — which answer is open, and whether the list is
 * truncated — through the accessible API rather than internals.
 */

const INITIAL_COUNT = 5;

describe("Faq", () => {
  it("shows a truncated list behind a disclosure button", () => {
    render(<Faq />);
    expect(screen.getAllByRole("button", { expanded: false }).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /view all questions/i })
    ).toBeInTheDocument();
  });

  it("opens the first answer by default", () => {
    render(<Faq />);
    const questions = screen
      .getAllByRole("button")
      .filter((b) => b.hasAttribute("aria-controls"));
    expect(questions[0]).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles an answer open and closed", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    const second = screen
      .getAllByRole("button")
      .filter((b) => b.hasAttribute("aria-controls"))[1];

    await user.click(second);
    expect(second).toHaveAttribute("aria-expanded", "true");

    await user.click(second);
    expect(second).toHaveAttribute("aria-expanded", "false");
  });

  it("reveals the remaining questions and can collapse again", async () => {
    const user = userEvent.setup();
    render(<Faq />);

    const countQuestions = () =>
      screen.getAllByRole("button").filter((b) => b.hasAttribute("aria-controls"))
        .length;

    expect(countQuestions()).toBe(INITIAL_COUNT);

    await user.click(screen.getByRole("button", { name: /view all questions/i }));
    expect(countQuestions()).toBeGreaterThan(INITIAL_COUNT);

    await user.click(screen.getByRole("button", { name: /show less/i }));
    expect(countQuestions()).toBe(INITIAL_COUNT);
  });

  it("tells visitors the product grows past the morning brief", async () => {
    const user = userEvent.setup();
    render(<Faq />);
    await user.click(screen.getByRole("button", { name: /view all questions/i }));

    const roadmap = screen.getByRole("button", {
      name: /more than the morning message/i,
    });
    await user.click(roadmap);

    const panel = document.getElementById(
      roadmap.getAttribute("aria-controls")!
    )!;
    expect(within(panel).getByText(/net worth/i)).toBeInTheDocument();
  });
});
