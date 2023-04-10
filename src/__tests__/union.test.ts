import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertFailure, assertLeft, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.union([t.string, t.number]);

test("name", () => {
  assert.equal(T.name, "string|number");
  const T2 = t.union([t.string, t.number], "T");
  assert.equal(T2.name, "T");
});

test("is", () => {
  // Isomorphic value
  assert.ok(T.is(0));
  assert.ok(T.is("foo"));
  assert.not.ok(T.is(false));
  // Prismatic value
  const T2 = t.union([t.string, numberAsString]);
  assert.ok(T2.is(0));
  assert.ok(T2.is("foo"));
  assert.not.ok(T2.is(false));
});

test("decode", () => {
  assertRight(validate(T, "s"), "s");
  assertRight(validate(T, 1), 1);
  assertLeft(validate(T, true));
  assertFailure(
    validate(T, true),
    "Invalid value true supplied to /(string|number)/0(string)",
    "Invalid value true supplied to /(string|number)/1(number)"
  );
  const A = t.type({ type: t.literal("A"), a: t.number });
  const B = t.refinement(A, (x) => x.a > 0);
  const T2 = t.union([B, A]);
  assertRight(validate(T2, { type: "A", a: -1 }), { type: "A", a: -1 });
});

test("encode", () => {
  const T1 = t.union([t.type({ a: numberAsString }), t.number]);
  assert.equal(T1.encode({ a: 1 }), { a: "1" });
  assert.equal(T1.encode(1), 1);

  // Throw if none of the codecs are applicable
  const T2 = t.union([t.string, t.boolean]);
  assert.throws(() => T2.encode(3 as any));

  const x1 = { a: 1, c: true };
  const x2 = { b: 2, c: true };
  const T3 = t.union([t.strict({ a: t.number }), t.strict({ b: t.number })]);
  assert.equal(T3.encode({ a: 1 }), { a: 1 });
  assert.equal(T3.encode({ b: 2 }), { b: 2 });
  assert.equal(T3.encode(x1), { a: 1 });
  assert.equal(T3.encode(x2), { b: 2 });

  const T4 = t.union([t.strict({ a: t.number }), t.type({ b: numberAsString })]);
  assert.equal(T4.encode({ a: 1 }), { a: 1 });
  assert.equal(T4.encode({ b: 2 }), { b: "2" });
  assert.equal(T4.encode(x1), { a: 1 });
  assert.equal(T4.encode(x2), { b: "2", c: true });

  const T5 = t.union([t.strict({ a: t.number }), t.strict({ b: numberAsString })]);
  assert.equal(T5.encode({ a: 1 }), { a: 1 });
  assert.equal(T5.encode({ b: 2 }), { b: "2" });
  assert.equal(T5.encode(x1), { a: 1 });
  assert.equal(T5.encode(x2), { b: "2" });
});

test.run();
