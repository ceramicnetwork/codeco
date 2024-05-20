import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertDecode, assertFailure } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.intersection([t.type({ a: t.string }), t.type({ b: t.number })]);

test("mergeAll", () => {
  const result = t.mergeAll(undefined, [{ prop1: "b", prop2: 2 }, { prop1: "a" }, { prop2: 1 }]);
  assert.equal(result, { prop1: "a", prop2: 1 });
});

test("name", () => {
  assert.equal(T.name, "{a:string}&{b:number}");
  const T2 = t.intersection([t.type({ a: t.string }), t.type({ b: t.number })], "T");
  assert.equal(T2.name, "T");
});

test("is", () => {
  assert.ok(T.is({ a: "a", b: 1 }));
  assert.not.ok(T.is({}));
  assert.not.ok(T.is({ a: "a" }));
  assert.not.ok(T.is({ b: 1 }));

  const T2 = t.intersection([t.type({ a: t.string }), t.type({ b: numberAsString })]);
  assert.ok(T2.is({ a: "a", b: 1 }));
  assert.not.ok(T2.is({}));
  assert.not.ok(T2.is({ a: "a" }));
  assert.not.ok(T2.is({ b: 1 }));

  const A = t.exact(t.type({ a: t.string }));
  const B = t.exact(t.type({ b: t.number }));
  const T3 = t.intersection([A, B]);
  assert.ok(T3.is({ a: "a", b: 1 }));
});

test("decode", () => {
  assertDecode(T, { a: "a", b: 1 });
  const T1 = t.intersection([t.type({ a: t.string }), t.type({ b: numberAsString })]);
  assertDecode(T1, { a: "a", b: "1" }, { a: "a", b: 1 });
  const T2 = t.intersection([t.type({ b: numberAsString }), t.type({ a: t.string })]);
  assertDecode(T2, { a: "a", b: "1" }, { a: "a", b: 1 });
  const T3 = t.intersection([t.type({ b: numberAsString }), t.type({ a: t.string }), t.type({ c: t.string })]);
  assertDecode(T3, { a: "a", b: "1", c: "c" }, { a: "a", b: 1, c: "c" });
  const T4 = t.intersection([t.type({ b: numberAsString }), t.type({ a: t.string }), t.type({ c: numberAsString })]);
  assertDecode(T4, { a: "a", b: "1", c: "2" }, { a: "a", b: 1, c: 2 });
  const T5 = t.intersection([t.type({ b: numberAsString }), t.type({})]);
  assertDecode(T5, { b: "1" }, { b: 1 });
  assertFailure(
    validate(T, null as any),
    "Invalid value null supplied to /({a:string}&{b:number})/0({a:string})",
    "Invalid value null supplied to /({a:string}&{b:number})/1({b:number})",
  );
  assertFailure(
    validate(T, { a: 1 }),
    "Invalid value 1 supplied to /({a:string}&{b:number})/0({a:string})/a(string)",
    "Invalid value undefined supplied to /({a:string}&{b:number})/1({b:number})/b(number)",
  );
  // Keep unknown properties
  assertDecode(T, { a: "1", b: 1, c: true });

  // Play nice with exact
  const T6 = t.intersection([t.exact(t.type({ a: t.string })), t.exact(t.type({ b: t.number }))]);
  assertDecode(T6, { a: "a", b: 1 });
  assertDecode(T6, { a: "a", b: 1, c: true }, { a: "a", b: 1 });
  assertFailure(
    validate(T6, { a: "a" }),
    "Invalid value undefined supplied to /(Exact<{a:string}>&Exact<{b:number}>)/1(Exact<{b:number}>)/b(number)",
  );

  const T7 = t.intersection([t.exact(t.type({})), t.partial({ a: t.number })]);
  assertDecode(T7, {});
  assertDecode(T7, { a: 1 });
  assertDecode(T7, { a: undefined });
  assertDecode(T7, { a: 1, b: true });

  const T8 = t.intersection([t.exact(t.type({})), t.exact(t.partial({ a: t.number }))]);
  assertDecode(T8, {});
  assertDecode(T8, { a: 1 });
  assertDecode(T8, { a: undefined });
  assertDecode(T8, { a: 1, b: true }, { a: 1 });

  const T9 = t.intersection([t.type({ b: t.string }), t.exact(t.partial({ a: t.number }))]);
  assertDecode(T9, { b: "b" });
  assertDecode(T9, { b: "b", a: 1 });
  assertDecode(T9, { b: "b", a: undefined });
  assertDecode(T9, { b: "b", a: 1, c: 2 });
});

test("encode", () => {
  assert.equal(T.encode({ a: "a", b: 1 }), { a: "a", b: 1 });
  const T1 = t.intersection([t.type({ a: t.string }), t.type({ b: numberAsString })]);
  assert.equal(T1.encode({ a: "a", b: 1 }), { a: "a", b: "1" });
  const T2 = t.intersection([t.type({ b: numberAsString }), t.type({ a: t.string })]);
  assert.equal(T2.encode({ a: "a", b: 1 }), { a: "a", b: "1" });
  const T3 = t.intersection([t.type({ b: numberAsString }), t.type({ a: t.string }), t.type({ c: t.string })]);
  assert.equal(T3.encode({ a: "a", b: 1, c: "c" }), { a: "a", b: "1", c: "c" });
  const T4 = t.intersection([t.type({ b: numberAsString }), t.type({ a: t.string }), t.type({ c: numberAsString })]);
  assert.equal(T4.encode({ a: "a", b: 1, c: 2 }), { a: "a", b: "1", c: "2" });
  const T5 = t.intersection([t.type({ b: numberAsString }), t.type({})]);
  assert.equal(T5.encode({ b: 1 }), { b: "1" });

  const A = t.exact(t.type({ a: t.string }));
  const B = t.exact(t.type({ b: t.number }));
  const T6 = t.intersection([A, B]);
  assert.equal(T6.encode({ a: "a", b: 1 }), { a: "a", b: 1 });
  const x = { a: "a", b: 1, c: true };
  assert.equal(T6.encode(x), { a: "a", b: 1 });
});

test("handle zero codecs", () => {
  const T = t.intersection([]);
  assert.ok(T.is(1));
  assertDecode(T, 1, 1);
  assert.equal(T.encode("a"), "a");
});

test("handle one codec", () => {
  const T = t.intersection([t.string]);
  assert.ok(T.is("a"));
  assert.not.ok(T.is(1));
  assertDecode(T, "a");
  assertFailure(validate(T, 1), "Invalid value 1 supplied to /(string)/0(string)");
  assert.equal(T.encode("a"), "a");
});

test("handle primitives", () => {
  const T1 = t.intersection([t.string, t.string]);
  assert.ok(T1.is("a"));
  assert.not.ok(T1.is(1));
  assertDecode(T1, "a");
  assertFailure(
    validate(T1, 1),
    "Invalid value 1 supplied to /(string&string)/0(string)",
    "Invalid value 1 supplied to /(string&string)/1(string)",
  );
  assert.equal(T1.encode("a"), "a");
  const T2 = t.intersection([numberAsString, numberAsString]);
  assertDecode(T2, "1", 1);
  assert.equal(T2.encode(1), "1");
});

test.run();
