import { test, expect } from "vitest";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertFailure, assertLeft, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.union([t.string, t.number]);

test("name", () => {
  expect(T.name).toBe("string|number");
  const T2 = t.union([t.string, t.number], "T");
  expect(T2.name).toBe("T");
});

test("is", () => {
  // Isomorphic value
  expect(T.is(0)).toBeTruthy();
  expect(T.is("foo")).toBeTruthy();
  expect(T.is(false)).toBeFalsy();
  // Prismatic value
  const T2 = t.union([t.string, numberAsString]);
  expect(T2.is(0)).toBeTruthy();
  expect(T2.is("foo")).toBeTruthy();
  expect(T2.is(false)).toBeFalsy();
});

test("decode", () => {
  assertRight(validate(T, "s"), "s");
  assertRight(validate(T, 1), 1);
  assertLeft(validate(T, true));
  assertFailure(
    validate(T, true),
    "Invalid value true supplied to /(string|number)/0(string)",
    "Invalid value true supplied to /(string|number)/1(number)",
  );
  const A = t.type({ type: t.literal("A"), a: t.number });
  const B = t.refinement(A, (x) => x.a > 0);
  const T2 = t.union([B, A]);
  assertRight(validate(T2, { type: "A", a: -1 }), { type: "A", a: -1 });
});

test("encode", () => {
  const T1 = t.union([t.type({ a: numberAsString }), t.number]);
  expect(T1.encode({ a: 1 })).toEqual({ a: "1" });
  expect(T1.encode(1)).toEqual(1);

  // Throw if none of the codecs are applicable
  const T2 = t.union([t.string, t.boolean]);
  // @ts-expect-error Invalid type
  expect(() => T2.encode(3)).toThrow();

  const x1 = { a: 1, c: true };
  const x2 = { b: 2, c: true };
  const T3 = t.union([t.strict({ a: t.number }), t.strict({ b: t.number })]);
  expect(T3.encode({ a: 1 })).toEqual({ a: 1 });
  expect(T3.encode({ b: 2 })).toEqual({ b: 2 });
  expect(T3.encode(x1)).toEqual({ a: 1 });
  expect(T3.encode(x2)).toEqual({ b: 2 });

  const T4 = t.union([t.strict({ a: t.number }), t.type({ b: numberAsString })]);
  expect(T4.encode({ a: 1 })).toEqual({ a: 1 });
  expect(T4.encode({ b: 2 })).toEqual({ b: "2" });
  expect(T4.encode(x1)).toEqual({ a: 1 });
  expect(T4.encode(x2)).toEqual({ b: "2", c: true });

  const T5 = t.union([t.strict({ a: t.number }), t.strict({ b: numberAsString })]);
  expect(T5.encode({ a: 1 })).toEqual({ a: 1 });
  expect(T5.encode({ b: 2 })).toEqual({ b: "2" });
  expect(T5.encode(x1)).toEqual({ a: 1 });
  expect(T5.encode(x2)).toEqual({ b: "2" });
});
