import { suite, test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { hyphenatedString } from "./hyphenated-string.js";
import { assertDecode, assertFailure } from "./assertions.util.js";
import { validate } from "../decoder.js";

const nonEnumerable = suite("non-enumerable domain");

nonEnumerable("name", () => {
  const T = t.record(t.string, t.number);
  assert.equal(T.name, "{[string]:number}");
  const T2 = t.record(t.string, t.number, "T");
  assert.equal(T2.name, "T");
});

nonEnumerable("is", () => {
  const T = t.record(t.string, t.number);
  assert.ok(T.is({}));
  assert.ok(T.is({ a: 1 }));
  assert.not.ok(T.is(new Number()));
  assert.not.ok(T.is({ a: "a" }));
  assert.not.ok(T.is(null));
  assert.not.ok(T.is([]));

  const T1 = t.record(t.string, numberAsString);
  assert.ok(T1.is({}));
  assert.ok(T1.is({ a: 1 }));
  assert.not.ok(T1.is({ a: "a" }));
  assert.not.ok(T1.is(null));
  assert.not.ok(T1.is([]));

  const T2 = t.record(hyphenatedString, t.number);
  assert.ok(T2.is({}));
  assert.ok(T2.is({ "a-a": 1 }));
  assert.not.ok(T2.is({ aa: 1 }));
  assert.not.ok(T2.is([]));

  assert.not.ok(t.record(t.string, t.unknown).is([]));
  assert.not.ok(t.record(t.string, t.any).is([]));
});

nonEnumerable("decode", () => {
  const T = t.record(t.string, t.number);
  assertDecode(T, {});
  assertDecode(T, { a: 1 });
  assertFailure(validate(T, new Number()), "Invalid value 0 supplied to /({[string]:number})");
  assertFailure(validate(T, [1]), "Invalid value [1] supplied to /({[string]:number})");
  assertFailure(validate(T, 1), "Invalid value 1 supplied to /({[string]:number})");
  assertFailure(validate(T, { aa: "s" }), 'Invalid value "s" supplied to /({[string]:number})/aa(number)');

  const T2 = t.record(t.string, numberAsString);
  assertDecode(T2, { a: "1" }, { a: 1 });

  const T3 = t.record(hyphenatedString, t.number);
  assertDecode(T3, { ab: 1 }, { "a-b": 1 });
  assertFailure(
    validate(T3, { a: 1 }),
    'Invalid value "a" supplied to /({[HyphenatedString]:number})/a(HyphenatedString)',
  );

  const T4 = t.record(t.string, t.any);
  assertFailure(validate(T4, [1]), "Invalid value [1] supplied to /({[string]:any})");
});

nonEnumerable("encode", () => {
  const T = t.record(t.string, t.number);
  assert.equal(T.encode({ a: 1 }), { a: 1 });

  const T2 = t.record(t.string, numberAsString);
  assert.equal(T2.encode({ a: 1 }), { a: "1" });

  const T3 = t.record(hyphenatedString, t.number);
  assert.equal(T3.encode({ "a-b": 1 }), { ab: 1 });

  const T4 = t.record(t.string, t.any);
  assert.equal(T4.encode([]), {});
});

nonEnumerable.run();

const enumerable = suite("enumerable domain");

enumerable("name", () => {
  const T = t.record(t.literal("a"), t.number);
  assert.equal(T.name, '{["a"]:number}');
  const T2 = t.record(t.literal("a"), t.number, "T");
  assert.equal(T2.name, "T");
});

enumerable("is", () => {
  const T = t.record(t.literal("a"), t.string);
  assert.ok(T.is({ a: "a" }));
  assert.ok(T.is({ a: "a", b: 1 }));
  assert.not.ok(T.is({}));
});

enumerable("decode", () => {
  const T = t.record(t.literal("a"), t.string);
  assertDecode(T, { a: "a" });
  assertDecode(T, { a: "a", b: 1 }, { a: "a" });
  assertFailure(validate(T, null), 'Invalid value null supplied to /({["a"]:string})');
  assertFailure(validate(T, {}), 'Invalid value undefined supplied to /({["a"]:string})/a(string)');
  assertFailure(validate(T, { a: 1 }), 'Invalid value 1 supplied to /({["a"]:string})/a(string)');

  const T2 = t.record(t.keyof({ a: null, b: null }), t.string);
  assertDecode(T2, { a: "a", b: "b" });
  assertDecode(T2, { a: "a", b: "b", c: 1 }, { a: "a", b: "b" });
  assertFailure(
    validate(T2, {}),
    'Invalid value undefined supplied to /({["a"|"b"]:string})/a(string)',
    'Invalid value undefined supplied to /({["a"|"b"]:string})/b(string)',
  );
  assertFailure(validate(T2, { a: "a" }), 'Invalid value undefined supplied to /({["a"|"b"]:string})/b(string)');
  assertFailure(validate(T2, { b: "b" }), 'Invalid value undefined supplied to /({["a"|"b"]:string})/a(string)');

  const T3 = t.intersection([t.record(t.literal("a"), t.string), t.record(t.string, t.unknown)]);
  assertDecode(T3, { a: "a", b: "b" });
  assertFailure(
    validate(T3, { b: "b" }),
    'Invalid value undefined supplied to /({["a"]:string}&{[string]:unknown})/0({["a"]:string})/a(string)',
  );
});

enumerable("encode", () => {
  const T = t.record(t.literal("a"), t.number);
  assert.equal(T.encode({ a: 1 }), { a: 1 });
  const T2 = t.record(t.literal("a"), numberAsString);
  assert.equal(T2.encode({ a: 1 }), { a: "1" });
});

enumerable.run();

test.run();
