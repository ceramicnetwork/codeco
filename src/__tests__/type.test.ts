import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { numberAsString } from "./number-as-string.js";
import { validate } from "../decoder.js";

const T = t.type({ a: t.string });

test("name", () => {
  assert.equal(T.name, "{a:string}");
  assert.equal(t.type({ a: t.string }, "T").name, "T");
});

test("is", () => {
  assert.ok(T.is({ a: "a" }));
  assert.not.ok(T.is({}));
  assert.not.ok(T.is({ a: 1 }));
  assert.not.ok(T.is([]));
  // Fail on missing properties
  const T2 = t.type({ a: t.unknown });
  assert.not.ok(T2.is({}));
  // Allow additional properties
  assert.ok(T.is({ a: "a", b: 1 }));
  // Allow complex objects
  class A {
    get a() {
      return "a";
    }
    get b() {
      return 1;
    }
  }
  assert.ok(T.is(new A()));
});

test("decode", () => {
  // Simple value
  assertRight(validate(T, { a: "a" }), { a: "a" });
  // Prismatic value
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

  // Keep unknown properties
  assertRight(validate(T, { a: "s", b: 1 }), { a: "s", b: 1 });
});

test("encode", () => {
  assert.equal(T.encode({ a: "a" }), { a: "a" });
  const T2 = t.type({ a: numberAsString });
  assert.equal(T2.encode({ a: 1 }), { a: "1" });
});

test.run();
