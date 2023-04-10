import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";
import { isRight } from "../either.js";

const isPositive = (n: number) => n >= 0;
const T = t.refinement(t.number, isPositive);

test("name", () => {
  assert.equal(T.name, "number≍isPositive");
  const T1 = t.refinement(t.number, (n) => n >= 0);
  assert.equal(T1.name, "number≍<function1>");
  const T2 = t.refinement(t.number, (n) => n >= 0, "T");
  assert.equal(T2.name, "T");
});

test("is", () => {
  const isInteger = (n: number) => n % 1 === 0;
  const T = t.refinement(t.number, isInteger);
  assert.ok(T.is(1));
  assert.not.ok(T.is("a"));
  assert.not.ok(T.is(1.2));

  const T2 = t.refinement(numberAsString, isInteger);
  assert.ok(T2.is(1));
  assert.not.ok(T2.is("a"));
  assert.not.ok(T2.is(1.2));
});

test("decode", () => {
  assertRight(validate(T, 0), 0);
  assertRight(validate(T, 1), 1);

  const T2 = t.refinement(t.unknownRecord, () => true);
  const value = {};
  const decoded = validate(T2, value);
  assert.ok(isRight(decoded));
  assert.is(decoded.right, value);

  assertFailure(validate(T, -1), "Invalid value -1 supplied to /(number≍isPositive)");
  assertFailure(validate(T, "a"), 'Invalid value "a" supplied to /(number≍isPositive)');
});

test("encode", () => {
  const T = t.refinement(t.array(numberAsString), () => true);
  assert.equal(T.encode([1]), ["1"]);
});

test.run();
