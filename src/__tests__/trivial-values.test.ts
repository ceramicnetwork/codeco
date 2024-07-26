import { test, expect, assert } from "vitest";
import * as t from "../struct.js";
import { assertRight, assertFailure } from "./assertions.util.js";
import { isRight } from "../either.js";
import { validate } from "../decoder.js";
import type { ANY } from "../context.js";

test("null", () => {
  assertRight(validate(t.null, null), null);
  assertFailure(validate(t.null, 1), "Invalid value 1 supplied to /(null)");
});

test("undefined", () => {
  assertRight(validate(t.undefined, undefined), undefined);
  assertFailure(validate(t.undefined, 1), "Invalid value 1 supplied to /(undefined)");
});

test("void", () => {
  assertRight(validate(t.void, undefined), undefined);
  assertFailure(validate(t.void, 1), "Invalid value 1 supplied to /(void)");
});

test("boolean", () => {
  assertRight(validate(t.boolean, true), true);
  assertRight(validate(t.boolean, false), false);
  assertFailure(validate(t.boolean, 1), "Invalid value 1 supplied to /(boolean)");
});

test("bigint", () => {
  assertRight(validate(t.bigint, 0n), 0n);
  assertRight(validate(t.bigint, 15n), 15n);
  const bigNumber = BigInt(Number.MAX_SAFE_INTEGER) + 4n;
  const decodedBigNumber = validate(t.bigint, bigNumber);
  assert(isRight(decodedBigNumber));
  expect(decodedBigNumber.right).toBe(bigNumber);
  expect(decodedBigNumber.right.toString()).toBe("9007199254740995");

  assertFailure(validate(t.bigint, true), "Invalid value true supplied to /(bigint)");
  assertFailure(validate(t.bigint, "string"), 'Invalid value "string" supplied to /(bigint)');
  assertFailure(validate(t.bigint, 1), "Invalid value 1 supplied to /(bigint)");
  assertFailure(validate(t.bigint, {}), "Invalid value {} supplied to /(bigint)");
  assertFailure(validate(t.bigint, []), "Invalid value [] supplied to /(bigint)");
  assertFailure(validate(t.bigint, null), "Invalid value null supplied to /(bigint)");
  assertFailure(validate(t.bigint, undefined), "Invalid value undefined supplied to /(bigint)");
});

test("unknown", () => {
  assertRight(validate(t.unknown, null), null);
  assertRight(validate(t.unknown, undefined), undefined);
  assertRight(validate(t.unknown, "foo"), "foo");
  assertRight(validate(t.unknown, 1), 1);
  assertRight(validate(t.unknown, true), true);
  assertRight(validate(t.unknown, {}), {});
  assertRight(validate(t.unknown, []), []);
  expect(t.unknown.is(null)).toBeTruthy();
  expect(t.unknown.is(undefined)).toBeTruthy();
  expect(t.unknown.is("foo")).toBeTruthy();
  expect(t.unknown.is(1)).toBeTruthy();
  expect(t.unknown.is(true)).toBeTruthy();
  expect(t.unknown.is({})).toBeTruthy();
  expect(t.unknown.is([])).toBeTruthy();
});

test("any", () => {
  assertRight(validate(t.any, null), null);
  assertRight(validate(t.any, undefined), undefined);
  assertRight(validate(t.any, "foo"), "foo");
  assertRight(validate(t.any, 1), 1);
  assertRight(validate(t.any, true), true);
  assertRight(validate(t.any, 1), 1);
  assertRight(validate(t.any, {}), {});
  assertRight(validate(t.any, []), []);
  expect(t.any.is(null)).toBeTruthy();
  expect(t.any.is(undefined)).toBeTruthy();
  expect(t.any.is("foo")).toBeTruthy();
  expect(t.any.is(1)).toBeTruthy();
  expect(t.any.is(true)).toBeTruthy();
  expect(t.any.is({})).toBeTruthy();
  expect(t.any.is([])).toBeTruthy();
});

test("never", () => {
  const T = t.never as ANY;
  assertFailure(validate(T, null), "Invalid value null supplied to /(never)");
  assertFailure(validate(T, undefined), "Invalid value undefined supplied to /(never)");
  assertFailure(validate(T, "foo"), 'Invalid value "foo" supplied to /(never)');
  assertFailure(validate(T, 1), "Invalid value 1 supplied to /(never)");
  assertFailure(validate(T, true), "Invalid value true supplied to /(never)");
  assertFailure(validate(T, {}), "Invalid value {} supplied to /(never)");
  assertFailure(validate(T, []), "Invalid value [] supplied to /(never)");

  expect(T.is(null)).toBeFalsy();
  expect(T.is(undefined)).toBeFalsy();
  expect(T.is("foo")).toBeFalsy();
  expect(T.is(1)).toBeFalsy();
  expect(T.is(true)).toBeFalsy();
  expect(T.is({})).toBeFalsy();
  expect(T.is([])).toBeFalsy();
});
