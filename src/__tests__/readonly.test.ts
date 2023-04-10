import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.readonly(t.type({ a: t.number }));

test("name", () => {
  assert.equal(T.name, `Readonly<{a:number}>`);
  const T2 = t.readonly(t.type({ a: t.number }), "T2");
  assert.equal(T2.name, "T2");
});

test("is", () => {
  assert.ok(T.is({ a: 1 }));
  assert.not.ok(T.is({ a: "foo" }));
  assert.not.ok(T.is(undefined));

  const T2 = t.readonly(t.type({ a: numberAsString }));
  assert.ok(T2.is({ a: 1 }));
  assert.not.ok(T2.is({ a: "1" }));
  assert.not.ok(T2.is(undefined));
});

test("decode", () => {
  assertRight(validate(T, { a: 1 }), { a: 1 });
  assertFailure(validate(T, {}), "Invalid value undefined supplied to /(Readonly<{a:number}>)/a(number)");
});

test("encode", () => {
  assert.equal(T.encode({ a: 1 }), { a: 1 });
  const T2 = t.readonly(t.type({ a: numberAsString }));
  assert.equal(T2.encode({ a: 1 }), { a: "1" });
});

test.run();
