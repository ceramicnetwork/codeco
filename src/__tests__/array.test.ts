import { test, expect } from "vitest";
import * as t from "../struct.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { numberAsString } from "./number-as-string.js";
import { validate } from "../decoder.js";

const T = t.array(t.number);
const T2 = t.array(numberAsString);

test("name", () => {
  expect(T.name).toBe("number[]");
  expect(t.array(t.number, "numbers").name).toBe("numbers");
});

test("is", () => {
  expect(T.is([])).toBeTruthy();
  expect(T.is([0])).toBeTruthy();
  expect(T.is([0, "foo"])).toBeFalsy();
});

test("decode", () => {
  assertRight(validate(T, []), []);
  assertRight(validate(T, [1, 2, 3]), [1, 2, 3]);
  assertRight(validate(T2, ["1", "2", "3"]), [1, 2, 3]);
  assertFailure(validate(T, 1), "Invalid value 1 supplied to /(number[])");
  assertFailure(validate(T, [1, "2", 3]), 'Invalid value "2" supplied to /(number[])/1(number)');
});

test("encode", () => {
  expect(T.encode([1, 2, 3])).toEqual([1, 2, 3]);
  expect(T2.encode([1, 2, 3])).toEqual(["1", "2", "3"]);
});
