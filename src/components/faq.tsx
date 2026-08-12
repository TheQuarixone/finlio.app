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
      "Finlio is a mobile app. You tell it which stocks and mutual funds you own. Every morning it sends you one short message that explains why they may go up or down that day. It uses simple words, not share market language.",
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
          className="flex min-h-[44px] w-full items-center justify-between gap-6 py-6 text-left"
        >
          <span className="text-[19px] font-medium tracking-[-0.016em] text-ink">
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

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul>
      {FAQ_ITEMS.map((item, index) => (
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
  );
}
