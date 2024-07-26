import { expect, test } from "vitest";
import * as t from "../struct.js";
import { assertDecode, assertFailure } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.keyof({ a: 1, b: 2 });

test("name", () => {
  expect(T.name).toEqual('"a"|"b"');
  const T2 = t.keyof({ a: 1, b: 2 }, "T");
  expect(T2.name).toEqual("T");
});

test("is", () => {
  expect(T.is("a")).toBeTruthy();
  expect(T.is("b")).toBeTruthy();
  expect(T.is("c")).toBeFalsy();
  expect(T.is(null)).toBeFalsy();
});

test("decode", () => {
  assertDecode(T, "a");
  assertDecode(T, "b");
  assertFailure(validate(T, "c"), 'Invalid value "c" supplied to /("a"|"b")');
  // check for hasOwnProperty oddity: { a: 1 }.hasOwnProperty(['a'] as any) === true
  assertFailure(validate(T, ["a"]), 'Invalid value ["a"] supplied to /("a"|"b")');
});
