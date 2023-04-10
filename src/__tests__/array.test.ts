import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { numberAsString } from "./number-as-string.js";
import { validate } from "../decoder.js";

const T = t.array(t.number);
const T2 = t.array(numberAsString);

test("name", () => {
  assert.equal(T.name, "number[]");
  assert.equal(t.array(t.number, "numbers").name, "numbers");
});

test("is", () => {
  assert.ok(T.is([]));
  assert.ok(T.is([0]));
  assert.not.ok(T.is([0, "foo"]));
});

test("decode", () => {
  assertRight(validate(T, []), []);
  assertRight(validate(T, [1, 2, 3]), [1, 2, 3]);
  assertRight(validate(T2, ["1", "2", "3"]), [1, 2, 3]);
  assertFailure(validate(T, 1), "Invalid value 1 supplied to /(number[])");
  assertFailure(validate(T, [1, "2", 3]), 'Invalid value "2" supplied to /(number[])/1(number)');
});

test("encode", () => {
  assert.equal(T.encode([1, 2, 3]), [1, 2, 3]);
  assert.equal(T2.encode([1, 2, 3]), ["1", "2", "3"]);
});

test.run();
