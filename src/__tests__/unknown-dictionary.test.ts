import { test, expect } from "vitest";
import { assertLeft, assertRight } from "./assertions.util.js";
import * as t from "../struct.js";
import { validate } from "../decoder.js";

const dictionary = t.unknownRecord;

test("is", () => {
  expect(dictionary.is({})).toBeTruthy();
  expect(dictionary.is({ a: 1 })).toBeTruthy();
  expect(dictionary.is(new Number())).toBeFalsy();
  expect(dictionary.is([])).toBeFalsy();
  expect(dictionary.is(undefined)).toBeFalsy();
});

test("decode", () => {
  assertRight(validate(dictionary, {}), {});
  assertRight(validate(dictionary, { a: 1 }), { a: 1 });
  assertLeft(validate(dictionary, new Number()));
  assertLeft(validate(dictionary, "1"));
  assertLeft(validate(dictionary, 1));
  assertLeft(validate(dictionary, true));
  assertLeft(validate(dictionary, null));
  assertLeft(validate(dictionary, undefined));
  assertLeft(validate(dictionary, []));
});
