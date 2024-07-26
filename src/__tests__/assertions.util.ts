import { assert, expect } from "vitest";
import { isLeft, isRight, type Either } from "../either.js";
import type { InputOf } from "../struct.js";
import type { ANY, Validation } from "../context.js";
import { report, validate } from "../decoder.js";

export function assertDecode<TCodec extends ANY>(codec: TCodec, input: InputOf<TCodec>, actual: any = input) {
  const decoded = validate(codec, input);
  assert(isRight(decoded));
  expect(decoded.right).toEqual(actual);
}
// FIXME assertRight -> assertDecode
// FIXME assertFailure -> use codec similar to assertDecode

export function assertRight<TError, TValue>(actual: Either<TError, TValue>, expected: any) {
  assert(isRight(actual));
  expect(actual.right).toEqual(expected);
}

export function assertLeft<TError, TValue>(actual: Either<TError, TValue>) {
  assert(isLeft(actual));
}

export function assertFailure<TValue>(actual: Validation<TValue>, ...messages: Array<string>) {
  assert(isLeft(actual));
  expect(report(actual)).toEqual(messages);
}
