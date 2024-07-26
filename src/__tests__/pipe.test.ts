import { test, expect } from "vitest";
import * as t from "../struct.js";
import { assertDecode, assertFailure } from "./assertions.util.js";
import { validate } from "../decoder.js";
import { Type, type Context } from "../context.js";

const floatAsString = new Type<number, string, string>(
  `float`,
  t.number.is,
  (input: string, context: Context) => {
    const n = parseFloat(input);
    return isNaN(n) ? context.failure() : context.success(n);
  },
  String,
);

const T = t.string.pipe(floatAsString);

test("name", () => {
  expect(T.name).toEqual("string→float");
  const T2 = t.string.pipe(floatAsString, "T");
  expect(T2.name).toEqual("T");
});

test("encode", () => {
  expect(T.encode(3.3)).toEqual("3.3");
});

test("decode", () => {
  assertDecode(T, "3.3", 3.3);
  const T2 = t.refinement(T, (n) => n >= 3);
  assertDecode(T2, "3.3", 3.3);
  assertFailure(validate(T2, "2.0"), 'Invalid value "2.0" supplied to /(string→float≍<function1>)');
});
