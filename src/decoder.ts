import { isLeft } from "./either.js";
import type { Validation, Decoder } from "./context.js";
import { LazyContext, ThrowContext } from "./context.js";

export function validate<TInput, TValue>(codec: Decoder<TInput, TValue>, input: TInput): Validation<TValue> {
  const context = LazyContext.root(codec, input);
  return codec.decode(input, context);
}

export function report<TValue>(validation: Validation<TValue>): Array<string> {
  if (isLeft(validation)) {
    return validation.left.map((error) => error.message);
  } else {
    return [];
  }
}

export function decode<TInput, TValue>(codec: Decoder<TInput, TValue>, input: TInput): TValue {
  const context = ThrowContext.root(codec, input);
  const decodeResult = codec.decode(input, context);
  if (isLeft(decodeResult)) throw new Error(`Something is wrong: ${decodeResult} should be Right`);
  return decodeResult.right;
}
