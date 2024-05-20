import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.tuple([t.number, t.string]);

test("name", () => {
  assert.equal(T.name, "[number,string]");
  const T2 = t.tuple([t.number, t.string], "T");
  assert.equal(T2.name, "T");
});

test("is", () => {
  assert.ok(T.is([0, "foo"]));
  assert.not.ok(T.is([0, 2]));
  assert.not.ok(T.is(undefined));
  assert.not.ok(T.is([0]));

  const T2 = t.tuple([numberAsString, t.string]);
  assert.ok(T2.is([0, "foo"]));
  assert.not.ok(T2.is([0, 2]));
  assert.not.ok(T2.is(undefined));
  assert.not.ok(T2.is([0]));
  assert.not.ok(T2.is([0, "foo", true]));
});

test("decode", () => {
  assertRight(validate(T, [1, "a"]), [1, "a"]);
  const T0 = t.tuple([] as any) as any;
  assertRight(validate(T0, [] as any), []);
  const T1 = t.tuple([t.number]);
  assertRight(validate(T1, [1]), [1]);
  const T2 = t.tuple([numberAsString, t.string]);
  assertRight(validate(T2, ["1", "a"]), [1, "a"]);

  assertFailure(validate(T, 1), "Invalid value 1 supplied to /([number,string])");
  assertFailure(
    validate(T, []),
    "Invalid value undefined supplied to /([number,string])/0(number)",
    "Invalid value undefined supplied to /([number,string])/1(string)",
  );
  assertFailure(validate(T, [1]), "Invalid value undefined supplied to /([number,string])/1(string)");
  assertFailure(validate(T, [1, 1]), "Invalid value 1 supplied to /([number,string])/1(string)");

  // Strip additional components
  assertRight(validate(T, [1, "foo", true]), [1, "foo"]);
  assertRight(validate(T, [1, "foo", true, "a"]), [1, "foo"]);
});

test("encode", () => {
  assert.equal(T.encode([1, "a"]), [1, "a"]);
  const T2 = t.tuple([numberAsString, t.string]);
  assert.equal(T2.encode([1, "a"]), ["1", "a"]);
});

test.run();
