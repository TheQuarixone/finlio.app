"use client";

import { useState } from "react";

type FaqItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Finlio?",
    answer:
      "Finlio starts on the web, with iPhone and Android apps coming later. You tell it which stocks and mutual funds you own. Every morning it sends you one short message that explains why they may go up or down that day. It uses simple words, not share market language.",
  },
  {
    question: "How is this different from a news app?",
    answer:
      "A news app shows you everything. Most of it has nothing to do with your money. Finlio is the opposite. It only tells you about the stocks and funds that you own, so nothing is wasted on you.",
  },
  {
    question: "Will Finlio tell me what to buy or sell?",
    answer:
      "No. Finlio only explains what is happening and why. It never tells you to buy or sell. We are not SEBI registered investment advisers. Please speak to a registered adviser before you take any money decision.",
  },
  {
    question: "What can I add to Finlio?",
    answer:
      "Stocks and mutual funds. ETFs are coming soon. You add them one time, and Finlio remembers them for you.",
  },
  {
    question: "Will Finlio do more than the morning message?",
    answer:
      "Yes. The morning message is where we start. Finlio is being built to hold your whole money picture — your bank, SIPs, EPF, fixed deposits and gold in one place, with one honest net worth number. After that it will track where your money goes each month and tell you what to save for the things you want. Everything in the same easy words.",
  },
  {
    question: "Do I have to link my Demat account?",
    answer:
      "No. You just type the names of what you own. No login, no password, no OTP. If you want to link an account later to save time, that will be your choice.",
  },
  {
    question: "What time will I get the message?",
    answer:
      "Every market day, before the market opens at 9:15 AM. If something big happens during the day, we send one short alert. We will not spam you.",
  },
  {
    question: "Do I need to know about the share market?",
    answer:
      "No. That is the whole point of Finlio. If a word is hard, we explain it. If a number matters, we tell you why it matters. You do not need any training to understand your own money.",
  },
  {
    question: "Is Finlio free?",
    answer:
      "The morning message will be free. Later we will add a paid plan with extra features. People who join the waitlist now will get the paid plan free for the first few months.",
  },
  {
    question: "When is Finlio launching?",
    answer:
      "Soon. We are letting people in slowly, in the order they joined. Join now to get in early.",
  },
  {
    question: "Why should I join the waitlist?",
    answer:
      "Three reasons. You get in first. You get the paid features free at the start. And you can tell us what to build next.",
  },
];

function FaqRow({
  item,
  isOpen,
  onToggle,
  id,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <li className="border-b border-line">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`${id}-panel`}
          id={`${id}-button`}
          className="flex min-h-[44px] w-full items-center justify-between gap-4 py-5 text-left sm:gap-6 sm:py-6"
        >
          <span className="text-[17px] font-medium tracking-[-0.016em] text-ink sm:text-[19px]">
            {item.question}
          </span>
          <span
            aria-hidden="true"
            className="relative flex size-6 shrink-0 items-center justify-center"
          >
            <span className="absolute h-0.5 w-4 rounded-full bg-brand-orange" />
            <span
              className={`absolute h-0.5 w-4 rounded-full bg-brand-orange transition-[rotate] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                isOpen ? "rotate-0" : "rotate-90"
              }`}
            />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="max-w-xl pb-6 text-[15px] leading-[1.5] tracking-[-0.009em] text-body [text-wrap:pretty]">
            {item.answer}
          </p>
        </div>
      </div>
    </li>
  );
}

const INITIAL_COUNT = 5;

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);

  const visibleItems = showAll
    ? FAQ_ITEMS
    : FAQ_ITEMS.slice(0, INITIAL_COUNT);
  const hiddenCount = FAQ_ITEMS.length - INITIAL_COUNT;

  return (
    <div>
      <ul>
        {visibleItems.map((item, index) => (
          <FaqRow
            key={item.question}
            id={`faq-${index}`}
            item={item}
            isOpen={openIndex === index}
            onToggle={() =>
              setOpenIndex((current) => (current === index ? null : index))
            }
          />
        ))}
      </ul>

      {hiddenCount > 0 && (
        <div className="pt-6 sm:pt-8">
          <button
            type="button"
            onClick={() => {
              setShowAll((current) => !current);
              if (showAll) setOpenIndex((current) => (current !== null && current >= INITIAL_COUNT ? null : current));
            }}
            aria-expanded={showAll}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-[15px] font-medium tracking-[-0.011em] text-ink ring-1 ring-line transition-colors duration-200 hover:bg-cream sm:w-auto sm:justify-start"
          >
            {showAll ? "Show less" : `View all questions`}
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className={`size-4 text-brand-orange transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${
                showAll ? "-rotate-180" : "rotate-0"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
