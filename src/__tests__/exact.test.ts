import { test, expect } from "vitest";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertDecode, assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.exact(t.type({ foo: t.string }));

test("name", () => {
  expect(T.name).toBe("Exact<{foo:string}>");
  const T2 = t.exact(t.type({ foo: t.string }), "Foo");
  expect(T2.name).toBe("Foo");
  const T3 = t.exact(t.type({ foo: t.string }, "Blah"));
  expect(T3.name).toBe("Exact<Blah>");
});

test("is", () => {
  const T = t.exact(t.type({ a: t.number }));
  expect(T.is({ a: 0 })).toBeTruthy();
  expect(T.is({ a: 0, b: 1 })).toBeTruthy();
  expect(T.is(undefined)).toBeFalsy();
  const T2 = t.exact(t.type({ a: numberAsString }));
  expect(T2.is({ a: 1 })).toBeTruthy();
  expect(T2.is({ a: 1, b: 1 })).toBeTruthy();
  expect(T2.is(undefined)).toBeFalsy();
});

test("decode", () => {
  const T = t.exact(t.type({ foo: t.string }));
  assertRight(validate(T, { foo: "foo" }), { foo: "foo" });
  assertRight(validate(T, { foo: "foo", bar: 1, baz: true }), { foo: "foo" });

  const T2 = t.exact(t.refinement(t.type({ foo: t.string }), (p) => p.foo.length > 2));
  assertRight(validate(T2, { foo: "foo" }), { foo: "foo" });
  assertRight(validate(T2, { foo: "foo", bar: 1 }), { foo: "foo" });

  const T3 = t.exact(t.type({ foo: t.string, bar: t.union([t.string, t.undefined]) }));
  assertRight(validate(T3, { foo: "foo" }), { foo: "foo", bar: undefined });

  assertFailure(validate(T, null), "Invalid value null supplied to /(Exact<{foo:string}>)");
  assertFailure(validate(T, undefined), "Invalid value undefined supplied to /(Exact<{foo:string}>)");
  assertFailure(validate(T, 1), "Invalid value 1 supplied to /(Exact<{foo:string}>)");
  assertFailure(validate(T, {}), "Invalid value undefined supplied to /(Exact<{foo:string}>)/foo(string)");

  const T4 = t.exact(t.readonly(t.type({ foo: t.string })));
  assertRight(validate(T4, { foo: "bar" }), { foo: "bar" });
  assertRight(validate(T4, { foo: "bar", baz: 1 }), { foo: "bar" });
  assertFailure(validate(T4, null), "Invalid value null supplied to /(Exact<Readonly<{foo:string}>>)");

  const T5 = t.exact(t.partial({ foo: t.string }));
  assertRight(validate(T5, { foo: "foo" }), { foo: "foo" });
  assertRight(validate(T5, { foo: undefined }), { foo: undefined });
  assertRight(validate(T5, {}), {});

  const T6 = t.exact(t.partial({ foo: t.string }));
  assertFailure(validate(T6, null), "Invalid value null supplied to /(Exact<Partial<{foo:string}>>)");
  assertRight(validate(T6, { var: 1 }), {});

  const T7 = t.exact(t.refinement(t.type({ foo: t.string }), (p) => p.foo.length > 2));
  assertFailure(validate(T7, null), "Invalid value null supplied to /(Exact<{foo:string}≍<function1>>)");
  assertFailure(validate(T7, { foo: "a" }), 'Invalid value {"foo":"a"} supplied to /(Exact<{foo:string}≍<function1>>)');
});

test("play nice with intersection", () => {
  const T = t.exact(t.intersection([t.type({ foo: t.string }), t.partial({ bar: t.number })]));
  assertDecode(T, { foo: "foo", bar: 1 });
  assertDecode(T, { foo: "foo", bar: undefined });
  assertDecode(T, { foo: "foo" });
  assertDecode(T, { foo: "foo", baz: true }, { foo: "foo" });
  // @ts-expect-error Invalid type
  assertFailure(validate(T, null), "Invalid value null supplied to /(Exact<{foo:string}&Partial<{bar:number}>>)");
});

test("encode", () => {
  expect(T.encode({ foo: "foo" })).toEqual({ foo: "foo" });
  // @ts-expect-error Extra parameter to be stripped
  expect(T.encode({ foo: "foo", b: 1 })).toEqual({ foo: "foo" });

  const T2 = t.exact(t.type({ a: numberAsString }));
  expect(T2.encode({ a: 1 })).toEqual({ a: "1" });
});
