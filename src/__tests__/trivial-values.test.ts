import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { assertRight, assertFailure } from "./assertions.util.js";
import { isRight } from "../either.js";
import { validate } from "../decoder.js";

test("null", () => {
  assertRight(validate(t.null, null), null);
  assertFailure(validate(t.null, 1), "Invalid value 1 supplied to /(null)");
});

test("undefined", () => {
  assertRight(validate(t.undefined, undefined), undefined);
  assertFailure(validate(t.undefined, 1), "Invalid value 1 supplied to /(undefined)");
});

test("void", () => {
  assertRight(validate(t.void, undefined), undefined);
  assertFailure(validate(t.void, 1), "Invalid value 1 supplied to /(void)");
});

test("boolean", () => {
  assertRight(validate(t.boolean, true), true);
  assertRight(validate(t.boolean, false), false);
  assertFailure(validate(t.boolean, 1), "Invalid value 1 supplied to /(boolean)");
});

test("bigint", () => {
  assertRight(validate(t.bigint, 0n), 0n);
  assertRight(validate(t.bigint, 15n), 15n);
  const bigNumber = BigInt(Number.MAX_SAFE_INTEGER) + 4n;
  const decodedBigNumber = validate(t.bigint, bigNumber);
  assert.ok(isRight(decodedBigNumber));
  assert.equal(decodedBigNumber.right, bigNumber);
  assert.equal(decodedBigNumber.right.toString(), "9007199254740995");

  assertFailure(validate(t.bigint, true), "Invalid value true supplied to /(bigint)");
  assertFailure(validate(t.bigint, "string"), 'Invalid value "string" supplied to /(bigint)');
  assertFailure(validate(t.bigint, 1), "Invalid value 1 supplied to /(bigint)");
  assertFailure(validate(t.bigint, {}), "Invalid value {} supplied to /(bigint)");
  assertFailure(validate(t.bigint, []), "Invalid value [] supplied to /(bigint)");
  assertFailure(validate(t.bigint, null), "Invalid value null supplied to /(bigint)");
  assertFailure(validate(t.bigint, undefined), "Invalid value undefined supplied to /(bigint)");
});

test("unknown", () => {
  assertRight(validate(t.unknown, null), null);
  assertRight(validate(t.unknown, undefined), undefined);
  assertRight(validate(t.unknown, "foo"), "foo");
  assertRight(validate(t.unknown, 1), 1);
  assertRight(validate(t.unknown, true), true);
  assertRight(validate(t.unknown, {}), {});
  assertRight(validate(t.unknown, []), []);
  assert.ok(t.unknown.is(null));
  assert.ok(t.unknown.is(undefined));
  assert.ok(t.unknown.is("foo"));
  assert.ok(t.unknown.is(1));
  assert.ok(t.unknown.is(true));
  assert.ok(t.unknown.is({}));
  assert.ok(t.unknown.is([]));
});

test("any", () => {
  assertRight(validate(t.any, null), null);
  assertRight(validate(t.any, undefined), undefined);
  assertRight(validate(t.any, "foo"), "foo");
  assertRight(validate(t.any, 1), 1);
  assertRight(validate(t.any, true), true);
  assertRight(validate(t.any, 1), 1);
  assertRight(validate(t.any, {}), {});
  assertRight(validate(t.any, []), []);
  assert.ok(t.any.is(null));
  assert.ok(t.any.is(undefined));
  assert.ok(t.any.is("foo"));
  assert.ok(t.any.is(1));
  assert.ok(t.any.is(true));
  assert.ok(t.any.is({}));
  assert.ok(t.any.is([]));
});

test("never", () => {
  const T = t.never as t.ANY;
  assertFailure(validate(T, null), "Invalid value null supplied to /(never)");
  assertFailure(validate(T, undefined), "Invalid value undefined supplied to /(never)");
  assertFailure(validate(T, "foo"), 'Invalid value "foo" supplied to /(never)');
  assertFailure(validate(T, 1), "Invalid value 1 supplied to /(never)");
  assertFailure(validate(T, true), "Invalid value true supplied to /(never)");
  assertFailure(validate(T, {}), "Invalid value {} supplied to /(never)");
  assertFailure(validate(T, []), "Invalid value [] supplied to /(never)");

  assert.not.ok(T.is(null));
  assert.not.ok(T.is(undefined));
  assert.not.ok(T.is("foo"));
  assert.not.ok(T.is(1));
  assert.not.ok(T.is(true));
  assert.not.ok(T.is({}));
  assert.not.ok(T.is([]));
});

test.run();
