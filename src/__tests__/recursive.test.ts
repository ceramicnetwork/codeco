import { test, expect } from "vitest";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertDecode, assertFailure } from "./assertions.util.js";
import { validate } from "../decoder.js";
import { Codec } from "../context.js";

type T = {
  a: number;
  b: T | undefined | null;
};

const T: Codec<T> = t.recursive("T", (self) =>
  t.type({
    a: t.number,
    b: t.union([self, t.undefined, t.null]),
  }),
);

test("is", () => {
  type A = {
    a: number;
    b: A | null;
  };
  const T: Codec<A> = t.recursive("T", (self) =>
    t.type({
      a: t.number,
      b: t.union([self, t.null]),
    }),
  );
  expect(T.is({ a: 0, b: null })).toBeTruthy();
  expect(T.is({ a: 0 })).toBeFalsy();

  type O = {
    a: string;
    b: O | null;
  };
  const T2: Codec<A, O> = t.recursive("T", (self) =>
    t.type({
      a: numberAsString,
      b: t.union([self, t.null]),
    }),
  );
  expect(T2.is({ a: 0, b: null })).toBeTruthy();
  expect(T2.is({ a: 0 })).toBeFalsy();
});

test("decode", () => {
  assertDecode(T, { a: 1, b: null });
  assertDecode(T, { a: 1, b: { a: 2, b: null } });
  assertFailure(validate(T, 1), "Invalid value 1 supplied to /(T)");
  assertFailure(validate(T, {}), "Invalid value undefined supplied to /(T)/a(number)");
  assertFailure(
    validate(T, { a: 1, b: {} }),
    "Invalid value undefined supplied to /(T)/b(T|undefined|null)/0(T)/a(number)",
    "Invalid value {} supplied to /(T)/b(T|undefined|null)/1(undefined)",
    "Invalid value {} supplied to /(T)/b(T|undefined|null)/2(null)",
  );
});

test("encode", () => {
  type A = {
    a: number;
    b: A | null;
  };
  type O = {
    a: string;
    b: O | null;
  };
  const T: Codec<A, O> = t.recursive("T", (self) =>
    t.type({
      a: numberAsString,
      b: t.union([self, t.null]),
    }),
  );
  expect(T.encode({ a: 0, b: null })).toEqual({ a: "0", b: null });
  expect(T.encode({ a: 0, b: { a: 1, b: null } })).toEqual({ a: "0", b: { a: "1", b: null } });
});

test("codec field", () => {
  type T = {
    a: number;
    b: T | null;
  };
  const T = t.recursive<T>("T", (self) =>
    t.type({
      a: t.number,
      b: t.union([self, t.null]),
    }),
  );
  expect(T.codec).toBeInstanceOf(Codec);
  expect(T.codec.name).toBe("T");
  const aCodec = (T.codec as any).props.a;
  expect(aCodec).toBeInstanceOf(t.TrivialCodec);
  expect(aCodec.name).toBe("number");
});

test("mutually recursive types", () => {
  type A = {
    b: A | B | null;
  };
  type B = {
    a: A | null;
  };
  const A: Codec<A> = t.recursive("A", () =>
    t.type({
      b: t.union([A, B, t.null]),
    }),
  );
  const B: Codec<B> = t.recursive("B", () =>
    t.type({
      a: t.union([A, t.null]),
    }),
  );
  expect(A.is({ b: { b: null } })).toBeTruthy();
  expect(A.is({ b: { a: { b: { a: null } } } })).toBeTruthy();

  // #354
  interface C1A {
    a: C1A | string;
  }
  const C1: Codec<C1A> = t.recursive("C1", () =>
    t.type({
      a: t.union([C2, t.string]),
    }),
  );
  const C2: Codec<C1A> = t.recursive("C2", () => C1);
  const C3 = t.union([C1, t.string]);

  expect(C3.is({ a: "a" })).toBeTruthy();
  expect(C3.is("a")).toBeTruthy();
  expect(C3.is({ a: { a: "a" } })).toBeTruthy();
});
