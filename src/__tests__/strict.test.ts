import { test, expect } from "vitest";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.strict({ a: t.number });

class A {
  get a() {
    return "a";
  }
  get b() {
    return "b";
  }
}

const T3 = t.strict({ a: t.string, b: t.string });

test("name", () => {
  expect(T.name).toEqual(`Exact<{a:number}>`);
  const T2 = t.strict({ a: t.number }, "T");
  expect(T2.name).toEqual("T");
});

test("is", () => {
  expect(T.is({ a: 0 })).toBeTruthy();
  expect(T.is({ a: 0, b: 1 })).toBeTruthy();
  expect(T.is(undefined)).toBeFalsy();
  const T2 = t.strict({ a: numberAsString });
  expect(T2.is({ a: 1 })).toBeTruthy();
  expect(T2.is({ a: 1, b: 1 })).toBeTruthy();
  expect(T2.is({ b: 1, c: 1 })).toBeFalsy();
  expect(T2.is(undefined)).toBeFalsy();
  expect(T3.is(new A())).toBeTruthy();
});

test("decode", () => {
  assertRight(validate(T, { a: 1 }), { a: 1 });
  const T2 = t.strict({ a: t.number, bar: t.union([t.string, t.undefined]) });
  assertRight(validate(T2, { a: 1 }), { a: 1, bar: undefined });
  assertFailure(validate(T, { a: "hello" }), 'Invalid value "hello" supplied to /(Exact<{a:number}>)/a(number)');
  assertRight(validate(T, { a: 1, b: 2 }), { a: 1 });
  assertRight(validate(T3, new A()), { a: "a", b: "b" });
});

test("encode", () => {
  const T1 = t.strict({ a: numberAsString });
  expect(T1.encode({ a: 1 })).toEqual({ a: "1" });
});
