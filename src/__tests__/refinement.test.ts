import { test, expect, assert } from "vitest";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";
import { isRight } from "../either.js";

const isPositive = (n: number) => n >= 0;
const T = t.refinement(t.number, isPositive);

test("name", () => {
  expect(T.name).toBe("number≍isPositive");
  const T1 = t.refinement(t.number, (n) => n >= 0);
  expect(T1.name).toBe("number≍<function1>");
  const T2 = t.refinement(t.number, (n) => n >= 0, "T");
  expect(T2.name).toBe("T");
});

test("is", () => {
  const isInteger = (n: number) => n % 1 === 0;
  const T = t.refinement(t.number, isInteger);
  expect(T.is(1)).toBeTruthy();
  expect(T.is("a")).toBeFalsy();
  expect(T.is(1.2)).toBeFalsy();

  const T2 = t.refinement(numberAsString, isInteger);
  expect(T2.is(1)).toBeTruthy();
  expect(T2.is("a")).toBeFalsy();
  expect(T2.is(1.2)).toBeFalsy();
});

test("decode", () => {
  assertRight(validate(T, 0), 0);
  assertRight(validate(T, 1), 1);

  const T2 = t.refinement(t.unknownRecord, () => true);
  const value = {};
  const decoded = validate(T2, value);
  assert(isRight(decoded));
  expect(decoded.right).toBe(value);

  assertFailure(validate(T, -1), "Invalid value -1 supplied to /(number≍isPositive)");
  assertFailure(validate(T, "a"), 'Invalid value "a" supplied to /(number≍isPositive)');
});

test("encode", () => {
  const T = t.refinement(t.array(numberAsString), () => true);
  expect(T.encode([1])).toEqual(["1"]);
});
