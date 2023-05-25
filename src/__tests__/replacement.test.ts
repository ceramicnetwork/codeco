import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { validate, decode } from "../decoder.js";
import { assertRight } from "./assertions.util.js";

function fromContext(port?: string) {
  return t.replacement(numberAsString, port);
}

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

test.run();
