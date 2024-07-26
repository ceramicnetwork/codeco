import { test, expect } from "vitest";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { validate, decode } from "../decoder.js";
import { assertRight } from "./assertions.util.js";

test("replacement", () => {
  const T = t.replacement(numberAsString, "10");
  assertRight(validate(T, ""), 10);
  assertRight(validate(T, "3"), 3);
  expect(decode(T, "")).toBe(10);
  expect(decode(T, "3")).toBe(3);
});

test("defaults", () => {
  const T = t.defaults(numberAsString, 10);
  assertRight(validate(T, ""), 10);
  assertRight(validate(T, undefined), 10);
  assertRight(validate(T, "3"), 3);

  expect(decode(T, "")).toBe(10);
  expect(decode(T, undefined)).toBe(10);
  expect(decode(T, "3")).toBe(3);
});

test("postprocessDecode", () => {
  const T = t.postprocessDecode(t.string, (i) => i.replace("42", "10"));
  assertRight(validate(T, ""), "");
  assertRight(validate(T, "3"), "3");
  assertRight(validate(T, "42 behemoths"), "10 behemoths");

  expect(decode(T, "")).toBe("");
  expect(decode(T, "3")).toBe("3");
  expect(decode(T, "42 behemoths")).toBe("10 behemoths");

  expect(T.is("42")).toBeTruthy();
  expect(T.is(42)).toBeFalsy();

  expect(T.encode("")).toBe("");
  expect(T.encode("10")).toBe("10");
  expect(T.encode("42")).toBe("42");
});
