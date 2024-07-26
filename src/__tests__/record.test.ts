import { test, expect, describe } from "vitest";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { hyphenatedString } from "./hyphenated-string.js";
import { assertDecode, assertFailure } from "./assertions.util.js";
import { validate } from "../decoder.js";

describe("non-enumerable domain", () => {
  test("name", () => {
    const T = t.record(t.string, t.number);
    expect(T.name).toEqual("{[string]:number}");
    const T2 = t.record(t.string, t.number, "T");
    expect(T2.name).toEqual("T");
  });

  test("is", () => {
    const T = t.record(t.string, t.number);
    expect(T.is({})).toBeTruthy();
    expect(T.is({ a: 1 })).toBeTruthy();
    expect(T.is(new Number())).toBeFalsy();
    expect(T.is({ a: "a" })).toBeFalsy();
    expect(T.is(null)).toBeFalsy();
    expect(T.is([])).toBeFalsy();

    const T1 = t.record(t.string, numberAsString);
    expect(T1.is({})).toBeTruthy();
    expect(T1.is({ a: 1 })).toBeTruthy();
    expect(T1.is({ a: "a" })).toBeFalsy();
    expect(T1.is(null)).toBeFalsy();
    expect(T1.is([])).toBeFalsy();

    const T2 = t.record(hyphenatedString, t.number);
    expect(T2.is({})).toBeTruthy();
    expect(T2.is({ "a-a": 1 })).toBeTruthy();
    expect(T2.is({ aa: 1 })).toBeFalsy();
    expect(T2.is([])).toBeFalsy();

    expect(t.record(t.string, t.unknown).is([])).toBeFalsy();
    expect(t.record(t.string, t.any).is([])).toBeFalsy();
  });

  test("decode", () => {
    const T = t.record(t.string, t.number);
    assertDecode(T, {});
    assertDecode(T, { a: 1 });
    assertFailure(validate(T, new Number()), "Invalid value 0 supplied to /({[string]:number})");
    assertFailure(validate(T, [1]), "Invalid value [1] supplied to /({[string]:number})");
    assertFailure(validate(T, 1), "Invalid value 1 supplied to /({[string]:number})");
    assertFailure(validate(T, { aa: "s" }), 'Invalid value "s" supplied to /({[string]:number})/aa(number)');

    const T2 = t.record(t.string, numberAsString);
    assertDecode(T2, { a: "1" }, { a: 1 });

    const T3 = t.record(hyphenatedString, t.number);
    assertDecode(T3, { ab: 1 }, { "a-b": 1 });
    assertFailure(
      validate(T3, { a: 1 }),
      'Invalid value "a" supplied to /({[HyphenatedString]:number})/a(HyphenatedString)',
    );

    const T4 = t.record(t.string, t.any);
    assertFailure(validate(T4, [1]), "Invalid value [1] supplied to /({[string]:any})");
  });

  test("encode", () => {
    const T = t.record(t.string, t.number);
    expect(T.encode({ a: 1 })).toEqual({ a: 1 });

    const T2 = t.record(t.string, numberAsString);
    expect(T2.encode({ a: 1 })).toEqual({ a: "1" });

    const T3 = t.record(hyphenatedString, t.number);
    expect(T3.encode({ "a-b": 1 })).toEqual({ ab: 1 });

    const T4 = t.record(t.string, t.any);
    expect(T4.encode([])).toEqual({});
  });
});

describe("enumerable domain", () => {
  test("name", () => {
    const T = t.record(t.literal("a"), t.number);
    expect(T.name).toEqual('{["a"]:number}');
    const T2 = t.record(t.literal("a"), t.number, "T");
    expect(T2.name).toEqual("T");
  });

  test("is", () => {
    const T = t.record(t.literal("a"), t.string);
    expect(T.is({ a: "a" })).toBeTruthy();
    expect(T.is({ a: "a", b: 1 })).toBeTruthy();
    expect(T.is({})).toBeFalsy();
  });

  test("decode", () => {
    const T = t.record(t.literal("a"), t.string);
    assertDecode(T, { a: "a" });
    assertDecode(T, { a: "a", b: 1 }, { a: "a" });
    assertFailure(validate(T, null), 'Invalid value null supplied to /({["a"]:string})');
    assertFailure(validate(T, {}), 'Invalid value undefined supplied to /({["a"]:string})/a(string)');
    assertFailure(validate(T, { a: 1 }), 'Invalid value 1 supplied to /({["a"]:string})/a(string)');

    const T2 = t.record(t.keyof({ a: null, b: null }), t.string);
    assertDecode(T2, { a: "a", b: "b" });
    assertDecode(T2, { a: "a", b: "b", c: 1 }, { a: "a", b: "b" });
    assertFailure(
      validate(T2, {}),
      'Invalid value undefined supplied to /({["a"|"b"]:string})/a(string)',
      'Invalid value undefined supplied to /({["a"|"b"]:string})/b(string)',
    );
    assertFailure(validate(T2, { a: "a" }), 'Invalid value undefined supplied to /({["a"|"b"]:string})/b(string)');
    assertFailure(validate(T2, { b: "b" }), 'Invalid value undefined supplied to /({["a"|"b"]:string})/a(string)');

    const T3 = t.intersection([t.record(t.literal("a"), t.string), t.record(t.string, t.unknown)]);
    assertDecode(T3, { a: "a", b: "b" });
    assertFailure(
      validate(T3, { b: "b" }),
      'Invalid value undefined supplied to /({["a"]:string}&{[string]:unknown})/0({["a"]:string})/a(string)',
    );
  });

  test("encode", () => {
    const T = t.record(t.literal("a"), t.number);
    expect(T.encode({ a: 1 })).toEqual({ a: 1 });
    const T2 = t.record(t.literal("a"), numberAsString);
    expect(T2.encode({ a: 1 })).toEqual({ a: "1" });
  });
});
