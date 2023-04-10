import { test } from "uvu";
import * as assert from "uvu/assert";
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
  assert.equal(T.name, `Exact<{a:number}>`);
  const T2 = t.strict({ a: t.number }, "T");
  assert.equal(T2.name, "T");
});

test("is", () => {
  assert.ok(T.is({ a: 0 }));
  assert.ok(T.is({ a: 0, b: 1 }));
  assert.not.ok(T.is(undefined));
  const T2 = t.strict({ a: numberAsString });
  assert.ok(T2.is({ a: 1 }));
  assert.ok(T2.is({ a: 1, b: 1 }));
  assert.not.ok(T2.is({ b: 1, c: 1 }));
  assert.not.ok(T2.is(undefined));
  assert.ok(T3.is(new A()));
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
  assert.equal(T1.encode({ a: 1 }), { a: "1" });
});

test.run();
