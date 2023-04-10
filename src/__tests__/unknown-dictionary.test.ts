import { test } from "uvu";
import * as assert from "uvu/assert";
import { assertLeft, assertRight } from "./assertions.util.js";
import * as t from "../struct.js";
import { validate } from "../decoder.js";

const dictionary = t.unknownRecord;

test("is", () => {
  assert.ok(dictionary.is({}));
  assert.ok(dictionary.is({ a: 1 }));
  assert.not.ok(dictionary.is(new Number()));
  assert.not.ok(dictionary.is([]));
  assert.not.ok(dictionary.is(undefined));
});

test("decode", () => {
  assertRight(validate(dictionary, {}), {});
  assertRight(validate(dictionary, { a: 1 }), { a: 1 });
  assertLeft(validate(dictionary, new Number()));
  assertLeft(validate(dictionary, "1"));
  assertLeft(validate(dictionary, 1));
  assertLeft(validate(dictionary, true));
  assertLeft(validate(dictionary, null));
  assertLeft(validate(dictionary, undefined));
  assertLeft(validate(dictionary, []));
});

test.run();
