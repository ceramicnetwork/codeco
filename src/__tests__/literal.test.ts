import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";
import { identity } from "../context.js";

const T = t.literal("a");

test("name", () => {
  assert.equal(T.name, '"a"');
  const T1 = t.literal("a", "custom");
  assert.equal(T1.name, "custom");
});

test("is", () => {
  assert.ok(T.is("a"));
  assert.not.ok(T.is("b"));
});

test("decode", () => {
  assertRight(validate(T, "a"), "a");
  assertFailure(validate(T, 1), 'Invalid value 1 supplied to /("a")');
});

test("encode", () => {
  assert.equal(T.encode("a"), "a");
  assert.equal(T.encode, identity);
});

test.run();
