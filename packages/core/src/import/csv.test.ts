import { describe, expect, it } from "vitest";
import { findHeaderRow, normaliseHeader, parseCsv, parseNumber } from "./csv";

describe("parseCsv", () => {
  it("reads a plain file", () => {
    expect(parseCsv("a,b\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("keeps commas inside quoted fields", () => {
    // The failure this prevents: a company name shifting every later column.
    expect(parseCsv('name,qty\n"Reliance Industries Ltd., Mumbai",20')).toEqual([
      ["name", "qty"],
      ["Reliance Industries Ltd., Mumbai", "20"],
    ]);
  });

  it("unescapes doubled quotes", () => {
    expect(parseCsv('a\n"He said ""hi"""')).toEqual([["a"], ['He said "hi"']]);
  });

  it("handles CRLF from Windows exports", () => {
    expect(parseCsv("a,b\r\n1,2\r\n")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("strips the BOM Excel prepends", () => {
    expect(parseCsv("﻿Symbol,Qty\nINFY,10")[0]).toEqual(["Symbol", "Qty"]);
  });

  it("drops blank lines rather than emitting empty rows", () => {
    expect(parseCsv("a\n\n\nb")).toEqual([["a"], ["b"]]);
  });
});

describe("findHeaderRow", () => {
  it("skips the preamble brokers put above the header", () => {
    const rows = parseCsv(
      ["Holdings Report", "Account: XY1234", "", "Symbol,Quantity,Average Price", "INFY,10,1500"].join("\n")
    );
    // Index 2, not 3: the blank line was dropped, which shifts everything after it.
    expect(findHeaderRow(rows, ["Symbol", "Quantity"])).toBe(2);
  });

  it("returns -1 when the required columns are absent", () => {
    expect(findHeaderRow(parseCsv("foo,bar\n1,2"), ["Symbol", "Quantity"])).toBe(-1);
  });
});

describe("normaliseHeader", () => {
  it("ignores case, spacing and punctuation drift", () => {
    expect(normaliseHeader(" Average Price ")).toBe(normaliseHeader("average_price"));
    expect(normaliseHeader("Avg. cost")).toBe("avgcost");
  });
});

describe("parseNumber", () => {
  it("reads Indian-formatted amounts", () => {
    expect(parseNumber("1,23,456.78")).toBeCloseTo(123456.78);
  });

  it("strips currency symbols", () => {
    expect(parseNumber("₹2,850.00")).toBe(2850);
  });

  it("reads parenthesised negatives", () => {
    expect(parseNumber("(123.45)")).toBeCloseTo(-123.45);
  });

  it("returns null for absent values rather than NaN", () => {
    // NaN would propagate into a holding and render as ₹NaN.
    expect(parseNumber("-")).toBeNull();
    expect(parseNumber("")).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
    expect(parseNumber("n/a")).toBeNull();
  });
});
