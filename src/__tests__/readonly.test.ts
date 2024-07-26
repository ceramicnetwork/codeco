import { test, expect } from "vitest";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.readonly(t.type({ a: t.number }));

test("name", () => {
  expect(T.name).toBe("Readonly<{a:number}>");
  const T2 = t.readonly(t.type({ a: t.number }), "T2");
  expect(T2.name).toBe("T2");
});

test("is", () => {
  expect(T.is({ a: 1 })).toBeTruthy();
  expect(T.is({ a: "foo" })).toBeFalsy();
  expect(T.is(undefined)).toBeFalsy();

  const T2 = t.readonly(t.type({ a: numberAsString }));
  expect(T2.is({ a: 1 })).toBeTruthy();
  expect(T2.is({ a: "1" })).toBeFalsy();
  expect(T2.is(undefined)).toBeFalsy();
});

test("decode", () => {
  assertRight(validate(T, { a: 1 }), { a: 1 });
  assertFailure(validate(T, {}), "Invalid value undefined supplied to /(Readonly<{a:number}>)/a(number)");
});

test("encode", () => {
  expect(T.encode({ a: 1 })).toEqual({ a: 1 });
  const T2 = t.readonly(t.type({ a: numberAsString }));
  expect(T2.encode({ a: 1 })).toEqual({ a: "1" });
});
