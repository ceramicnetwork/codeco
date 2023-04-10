import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import { decode } from "../decoder.js";
import sinon from "sinon";

const T = t.type({ a: t.string, b: t.number });

test("eager evaluation", () => {
  const decodeNumber = sinon.spy(t.number, "decode");
  const T = t.type({ a: t.string, b: t.number });
  assert.throws(() => decode(T, { a: 1, b: 2 }));
  // Does not get to number
  assert.equal(decodeNumber.called, false);
});

test("decode successfully", () => {
  assert.equal(decode(T, { a: "a", b: 1 }), { a: "a", b: 1 });
});

test.run();
