import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { validate, decode } from "../decoder.js";
import { assertRight } from "./assertions.util.js";

test("replacement", () => {
  const T = t.replacement(numberAsString, "10");
  assertRight(validate(T, ""), 10);
  assertRight(validate(T, "3"), 3);
  assert.equal(decode(T, ""), 10);
  assert.equal(decode(T, "3"), 3);
});

test("defaults", () => {
  const T = t.defaults(numberAsString, 10);
  assertRight(validate(T, ""), 10);
  assertRight(validate(T, undefined), 10);
  assertRight(validate(T, "3"), 3);

  assert.equal(decode(T, ""), 10);
  assert.equal(decode(T, undefined), 10);
  assert.equal(decode(T, "3"), 3);
});

test("postprocessDecode", () => {
  const T = t.postprocessDecode(t.string, (i) => i.replace("42", "10"));
  assertRight(validate(T, ""), "");
  assertRight(validate(T, "3"), "3");
  assertRight(validate(T, "42 behemoths"), "10 behemoths");

  assert.equal(decode(T, ""), "");
  assert.equal(decode(T, "3"), "3");
  assert.equal(decode(T, "42 behemoths"), "10 behemoths");

  assert.ok(T.is("42"));
  assert.not.ok(T.is(42));

  assert.equal(T.encode(""), "");
  assert.equal(T.encode("10"), "10");
  assert.equal(T.encode("42"), "42");
});

test.run();
