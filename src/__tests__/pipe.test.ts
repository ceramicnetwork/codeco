import * as t from "../struct.js";
import { test } from "uvu";
import * as assert from "uvu/assert";
import { assertDecode, assertFailure } from "./assertions.util.js";
import { validate } from "../decoder";

const floatAsString = new t.Type<number, string, string>(
  `float`,
  t.number.is,
  (input: string, context: t.Context) => {
    const n = parseFloat(input);
    return isNaN(n) ? context.failure() : context.success(n);
  },
  String
);

const T = t.string.pipe(floatAsString);

test("name", () => {
  assert.equal(T.name, "string→float");
  const T2 = t.string.pipe(floatAsString, "T");
  assert.equal(T2.name, "T");
});

test("encode", () => {
  assert.equal(T.encode(3.3), "3.3");
});

test("decode", () => {
  assertDecode(T, "3.3", 3.3);
  const T2 = t.refinement(T, (n) => n >= 3);
  assertDecode(T2, "3.3", 3.3);
  assertFailure(validate(T2, "2.0"), 'Invalid value "2.0" supplied to /(string→float≍<function1>)');
});

test.run();
