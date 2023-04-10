import { isLeft, isRight, type Either } from "../either.js";
import type { ANY, InputOf, Validation } from "../struct.js";
import * as assert from "uvu/assert";
import { report, validate } from "../decoder.js";

export function assertDecode<TCodec extends ANY>(codec: TCodec, input: InputOf<TCodec>, actual: any = input) {
  const decoded = validate(codec, input);
  assert.ok(isRight(decoded));
  assert.equal(decoded.right, actual);
}
// FIXME assertRight -> assertDecode
// FIXME assertFailure -> use codec similar to assertDecode

export function assertRight<TError, TValue>(actual: Either<TError, TValue>, expected: any) {
  assert.ok(isRight(actual));
  assert.equal(actual.right, expected);
}

export function assertLeft<TError, TValue>(actual: Either<TError, TValue>) {
  assert.ok(isLeft(actual));
}

export function assertFailure<TValue>(actual: Validation<TValue>, ...messages: Array<string>) {
  assert.ok(isLeft(actual));
  assert.equal(report(actual), messages);
}
