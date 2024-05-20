import { test } from "uvu";
import * as assert from "uvu/assert";
import * as t from "../struct.js";
import type { IsExact } from "conditional-type-checks";
import { assertDecode, assertFailure } from "./assertions.util.js";
import { validate } from "../decoder.js";

function assertT<T extends true>() {
  return true;
}

test("name", () => {
  const T = t.sparse({ name: t.string, age: t.optional(t.number) });
  assert.equal(T.name, "{name:string,age:number?}");
  const T2 = t.sparse({ name: t.string, age: t.optional(t.number) }, "T");
  assert.equal(T2.name, "T");
});

test("handle mixed mixed props", () => {
  const Person = t.sparse({ name: t.string, age: t.optional(t.number) });
  assertT<IsExact<t.TypeOf<typeof Person>, { name: string; age?: number }>>();
  assert.equal(Person.props, { name: t.string, age: t.optional(t.number) });
  assertDecode(Person, { name: "Alice" });
  assertDecode(Person, { name: "Alice", age: 20 });

  assertFailure(validate(Person, {}), "Invalid value undefined supplied to /({name:string,age:number?})/name(string)");
  assertFailure(
    validate(Person, { name: "Alice", age: "twenty" }),
    'Invalid value "twenty" supplied to /({name:string,age:number?})/age(number?)/0(number)',
    'Invalid value "twenty" supplied to /({name:string,age:number?})/age(number?)/1(undefined)',
  );

  assert.equal(Person.encode({ name: "Alice" }), { name: "Alice" });
  assert.equal(Person.encode({ name: "Alice", age: 20 }), { name: "Alice", age: 20 });
});

test.run();
