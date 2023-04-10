import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.partial({ a: t.number });

test("name", () => {
  assert.equal(T.name, "Partial<{a:number}>");
  const T2 = t.partial({ a: t.number }, "T");
  assert.equal(T2.name, "T");
});

test("is", () => {
  assert.ok(T.is({}));
  assert.ok(T.is({ a: 1 }));
  assert.not.ok(T.is(undefined));
  assert.not.ok(T.is({ a: "foo" }));
  assert.not.ok(T.is([]));
  const T2 = t.partial({ a: numberAsString });
  assert.ok(T2.is({}));
  assert.ok(T2.is({ a: 1 }));
  assert.not.ok(T2.is(undefined));
  assert.not.ok(T2.is({ a: "foo" }));
  assert.not.ok(T2.is([]));
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
  assert.equal(T.encode({}), {});
  assert.equal(T.encode({ a: undefined }), { a: undefined });
  assert.equal(T.encode({ a: 1 }), { a: 1 });
  const T2 = t.partial({ a: numberAsString });
  assert.equal(T2.encode({}), {});
  assert.equal(T2.encode({ a: undefined }), { a: undefined });
  assert.equal(T2.encode({ a: 1 }), { a: "1" });
  // Preserve additional properties
  assert.equal(T2.encode({ a: 1, b: "foo" } as any), { a: "1", b: "foo" });
});

test.run();
