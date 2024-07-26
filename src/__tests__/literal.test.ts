import { test, expect } from "vitest";
import * as t from "../struct.js";
import { assertFailure, assertRight } from "./assertions.util.js";
import { validate } from "../decoder.js";
import { identity } from "../context.js";

const T = t.literal("a");

test("name", () => {
  expect(T.name).toEqual('"a"');
  const T1 = t.literal("a", "custom");
  expect(T1.name).toEqual("custom");
});

test("is", () => {
  expect(T.is("a")).toBeTruthy();
  expect(T.is("b")).toBeFalsy();
});

test("decode", () => {
  assertRight(validate(T, "a"), "a");
  assertFailure(validate(T, 1), 'Invalid value 1 supplied to /("a")');
});

test("encode", () => {
  expect(T.encode("a")).toEqual("a");
  expect(T.encode).toEqual(identity);
});
