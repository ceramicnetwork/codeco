import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { assertDecode, assertFailure } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.keyof({ a: 1, b: 2 });

test("name", () => {
  assert.equal(T.name, '"a"|"b"');
  const T2 = t.keyof({ a: 1, b: 2 }, "T");
  assert.equal(T2.name, "T");
});

test("is", () => {
  assert.ok(T.is("a"));
  assert.ok(T.is("b"));
  assert.not.ok(T.is("c"));
  assert.not.ok(T.is(null));
});

test("decode", () => {
  assertDecode(T, "a");
  assertDecode(T, "b");
  assertFailure(validate(T, "c"), 'Invalid value "c" supplied to /("a"|"b")');
  // check for hasOwnProperty oddity: { a: 1 }.hasOwnProperty(['a'] as any) === true
  assertFailure(validate(T, ["a"]), 'Invalid value ["a"] supplied to /("a"|"b")');
});

test.run();
