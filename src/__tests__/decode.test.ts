import { expect, test, vi } from "vitest";
import * as t from "../struct.js";
import { decode } from "../decoder.js";

const T = t.type({ a: t.string, b: t.number });

test("eager evaluation", () => {
  const decodeNumberFn = vi.spyOn(t.number, "decode");
  const T = t.type({ a: t.string, b: t.number });
  expect(() => decode(T, { a: 1, b: 2 })).toThrow();
  // Does not get to number
  expect(decodeNumberFn).not.toBeCalled();
});

test("decode successfully", () => {
  expect(decode(T, { a: "a", b: 1 })).toEqual({ a: "a", b: 1 });
});
