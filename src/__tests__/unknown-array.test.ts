import { test } from "vitest";
import { assertLeft, assertRight } from "./assertions.util.js";
import * as t from "../struct.js";
import { validate } from "../decoder.js";

test("unknownArray", () => {
  assertRight(validate(t.unknownArray, []), []);
  assertRight(validate(t.unknownArray, [1]), [1]);
  assertLeft(validate(t.unknownArray, "1"));
  assertLeft(validate(t.unknownArray, 1));
  assertLeft(validate(t.unknownArray, true));
  assertLeft(validate(t.unknownArray, null));
  assertLeft(validate(t.unknownArray, undefined));
});
