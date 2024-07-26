import { test, expect } from "vitest";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.partial({ a: t.number });

test("name", () => {
  expect(T.name).toBe("Partial<{a:number}>");
  const T2 = t.partial({ a: t.number }, "T");
  expect(T2.name).toBe("T");
});

test("is", () => {
  expect(T.is({})).toBeTruthy();
  expect(T.is({ a: 1 })).toBeTruthy();
  expect(T.is(undefined)).toBeFalsy();
  expect(T.is({ a: "foo" })).toBeFalsy();
  expect(T.is([])).toBeFalsy();

  const T2 = t.partial({ a: numberAsString });
  expect(T2.is({})).toBeTruthy();
  expect(T2.is({ a: 1 })).toBeTruthy();
  expect(T2.is(undefined)).toBeFalsy();
  expect(T2.is({ a: "foo" })).toBeFalsy();
  expect(T2.is([])).toBeFalsy();
});

test("decode", () => {
  assertRight(validate(T, {}), {});
  assertRight(validate(T, { a: undefined }), { a: undefined });
  assertRight(validate(T, { a: 1 }), { a: 1 });

  assertFailure(validate(T, null), "Invalid value null supplied to /(Partial<{a:number}>)");
  assertFailure(validate(T, { a: "s" }), 'Invalid value "s" supplied to /(Partial<{a:number}>)/a(number)');
  assertFailure(validate(T, []), "Invalid value [] supplied to /(Partial<{a:number}>)");
  assertRight(validate(T, { b: 1 }), { b: 1 });
  assertRight(validate(T, { a: undefined, b: 1 }), { a: undefined, b: 1 });

  const T2 = t.partial({ name: t.replacement(t.string, "foo") });
  assertRight(validate(T2, {}), { name: "foo" });
  assertRight(validate(T2, { name: "a" }), { name: "a" });
});

test("encode", () => {
  expect(T.encode({})).toEqual({});
  expect(T.encode({ a: undefined })).toEqual({ a: undefined });
  expect(T.encode({ a: 1 })).toEqual({ a: 1 });

  const T2 = t.partial({ a: numberAsString });
  expect(T2.encode({})).toEqual({});
  expect(T2.encode({ a: undefined })).toEqual({ a: undefined });
  expect(T2.encode({ a: 1 })).toEqual({ a: "1" });

  // @ts-expect-error Preserve additional properties
  expect(T2.encode({ a: 1, b: "foo" })).toEqual({ a: "1", b: "foo" });
});
