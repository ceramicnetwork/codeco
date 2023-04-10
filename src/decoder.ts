import type { NonEmptyArray } from "ts-essentials";
import { isLeft, left, right } from "./either.js";
import type { Trail, Validation, Errors, IContext, Decoder } from "./struct.js";
import { ValidationError } from "./struct.js";

export class LazyContext implements IContext {
  constructor(readonly trail: Trail) {}

  static root<TInput, TValue>(codec: Decoder<TInput, TValue>, input: TInput) {
    return new LazyContext([{ key: "", type: codec, actual: input }]);
  }

  failures<TValue>(errors: Errors): Validation<TValue> {
    return left(errors);
  }

  success<TValue>(value: TValue): Validation<TValue> {
    return right(value);
  }

  failure<TValue>(message?: string): Validation<TValue> {
    return left([new ValidationError(this.trail, message)]);
  }

  child<TCodec extends Decoder<any, any>>(key: string, codec: TCodec, input: unknown): IContext {
    const nextTrail = this.trail.concat([{ key: key, type: codec, actual: input }]);
    return new LazyContext(nextTrail);
  }
}

export class ThrowContext implements IContext {
  constructor(readonly trail: Trail) {}

  static root<TInput, TValue>(codec: Decoder<TInput, TValue>, input: TInput) {
    return new ThrowContext([{ key: "", type: codec, actual: input }]);
  }

  failures<TValue>(errors: NonEmptyArray<ValidationError>): never {
    throw errors[0];
  }

  success<TValue>(value: TValue): Validation<TValue> {
    return right(value);
  }

  failure<TValue>(message?: string): never {
    throw new ValidationError(this.trail, message);
  }

  child<TCodec extends Decoder<any, any>>(key: string, codec: TCodec, input: unknown): IContext {
    const nextTrail = this.trail.concat([{ key: key, type: codec, actual: input }]);
    return new ThrowContext(nextTrail);
  }
}

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
