import { test, expect } from "vitest";
import * as t from "../struct.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { numberAsString } from "./number-as-string.js";
import { validate } from "../decoder.js";

const T = t.type({ a: t.string });

test("name", () => {
  expect(T.name).toBe("{a:string}");
  expect(t.type({ a: t.string }, "T").name).toBe("T");
});

test("is", () => {
  expect(T.is({ a: "a" })).toBeTruthy();
  expect(T.is({})).toBeFalsy();
  expect(T.is({ a: 1 })).toBeFalsy();
  expect(T.is([])).toBeFalsy();

  const T2 = t.type({ a: t.unknown });
  expect(T2.is({})).toBeFalsy();
  expect(T.is({ a: "a", b: 1 })).toBeTruthy();

  class A {
    get a() {
      return "a";
    }
    get b() {
      return 1;
    }
  }
  expect(T.is(new A())).toBeTruthy();
});

test("decode", () => {
  assertRight(validate(T, { a: "a" }), { a: "a" });

  const T2 = t.type({ a: numberAsString });
  assertRight(validate(T2, { a: "1" }), { a: 1 });

  const T3 = t.type({ a: t.undefined });
  assertRight(validate(T3, { a: undefined }), { a: undefined });
  assertRight(validate(T3, {}), { a: undefined });

  const T4 = t.type({ a: t.unknown });
  assertRight(validate(T4, {}), { a: undefined });

  const T5 = t.type({ a: t.union([t.number, t.undefined]) });
  assertRight(validate(T5, { a: undefined }), { a: undefined });
  assertRight(validate(T5, { a: 1 }), { a: 1 });
  assertRight(validate(T5, {}), { a: undefined });

  assertFailure(validate(T, 1), "Invalid value 1 supplied to /({a:string})");
  assertFailure(validate(T, {}), "Invalid value undefined supplied to /({a:string})/a(string)");
  assertFailure(validate(T, { a: 1 }), "Invalid value 1 supplied to /({a:string})/a(string)");
  assertFailure(validate(T, { a: [] }), "Invalid value [] supplied to /({a:string})/a(string)");

  class A {
    get a() {
      return "a";
    }
    get b() {
      return "b";
    }
  }

  assertRight(validate(t.type({ a: t.string, b: t.string }), new A()), { a: "a", b: "b" });

  assertRight(validate(T, { a: "s", b: 1 }), { a: "s", b: 1 });
});

test("encode", () => {
  expect(T.encode({ a: "a" })).toEqual({ a: "a" });

  const T2 = t.type({ a: numberAsString });
  expect(T2.encode({ a: 1 })).toEqual({ a: "1" });
});
