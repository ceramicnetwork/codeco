import { test } from "uvu";
import * as t from "../struct.js";
import { numberAsString } from "./number-as-string.js";
import { validate } from "../decoder.js";
import { assertRight } from "./assertions.util.js";

function fromContext(port?: string) {
  return t.replacement(numberAsString, port);
}

test("decode", () => {
  assertRight(validate(fromContext("10"), ""), 10);
  assertRight(validate(fromContext("10"), "3"), 3);
});

test.run();
