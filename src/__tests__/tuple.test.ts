import { test, expect } from "vitest";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";

const T = t.tuple([t.number, t.string]);

test("name", () => {
  expect(T.name).toBe("[number,string]");
  const T2 = t.tuple([t.number, t.string], "T");
  expect(T2.name).toBe("T");
});

test("is", () => {
  expect(T.is([0, "foo"])).toBeTruthy();
  expect(T.is([0, 2])).toBeFalsy();
  expect(T.is(undefined)).toBeFalsy();
  expect(T.is([0])).toBeFalsy();

  const T2 = t.tuple([numberAsString, t.string]);
  expect(T2.is([0, "foo"])).toBeTruthy();
  expect(T2.is([0, 2])).toBeFalsy();
  expect(T2.is(undefined)).toBeFalsy();
  expect(T2.is([0])).toBeFalsy();
  expect(T2.is([0, "foo", true])).toBeFalsy();
});

test("decode", () => {
  assertRight(validate(T, [1, "a"]), [1, "a"]);
  const T0 = t.tuple([] as any) as any;
  assertRight(validate(T0, [] as any), []);
  const T1 = t.tuple([t.number]);
  assertRight(validate(T1, [1]), [1]);
  const T2 = t.tuple([numberAsString, t.string]);
  assertRight(validate(T2, ["1", "a"]), [1, "a"]);

  // @ts-expect-error Invalid type
  assertFailure(validate(T, 1), "Invalid value 1 supplied to /([number,string])");
  assertFailure(
    // @ts-expect-error Invalid type
    validate(T, []),
    "Invalid value undefined supplied to /([number,string])/0(number)",
    "Invalid value undefined supplied to /([number,string])/1(string)",
  );
  // @ts-expect-error Invalid type
  assertFailure(validate(T, [1]), "Invalid value undefined supplied to /([number,string])/1(string)");
  assertFailure(validate(T, [1, 1]), "Invalid value 1 supplied to /([number,string])/1(string)");

  // Strip additional components
  // @ts-expect-error Invalid type
  assertRight(validate(T, [1, "foo", true]), [1, "foo"]);
  // @ts-expect-error Invalid type
  assertRight(validate(T, [1, "foo", true, "a"]), [1, "foo"]);
});

test("encode", () => {
  expect(T.encode([1, "a"])).toEqual([1, "a"]);
  const T2 = t.tuple([numberAsString, t.string]);
  expect(T2.encode([1, "a"])).toEqual(["1", "a"]);
});
