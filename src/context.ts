import { isLeft, type Either, left, right } from "./either.js";
import type { NonEmptyArray } from "ts-essentials";

export type ANY = Codec<any, any, any>;
export type MIXED<T = any> = Codec<T, any, unknown>;

export type Refinement<A, B extends A> = (a: A) => a is B;
export type Predicate<A> = (a: A) => boolean;

export type Errors = Array<ValidationError>;
export type Validation<A> = Either<Errors, A>;

export type Trail = ReadonlyArray<TrailEntry>;

export type Is<A> = Refinement<unknown, A>;
export type Encode<A, O> = (a: A) => O;
export type Decode<I, A> = (input: I, context: Context) => Validation<A>;

export interface Decoder<I, A> {
  readonly name: string;
  decode: Decode<I, A>;
}

export interface TrailEntry {
  readonly key: string;
  readonly type: Decoder<any, any>;
  readonly actual: unknown;
}

export function getFunctionName(f: Function): string {
  return (f as any).displayName || (f as any).name || `<function${f.length}>`;
}

export function stringify(v: any): string {
  if (typeof v === "function") {
    return getFunctionName(v);
  }
  if (typeof v === "number" && !isFinite(v)) {
    if (isNaN(v)) {
      return "NaN";
    }
    return v > 0 ? "Infinity" : "-Infinity";
  }
  return JSON.stringify(v);
}

export function getContextPath(trail: Trail): string {
  return `/` + trail.map(({ key, type }) => `${key}(${type.name})`).join("/");
}

export class ValidationError extends Error {
  constructor(
    readonly trail: Trail,
    message: string = `Invalid value ${stringify(trail[trail.length - 1].actual)} supplied to ${getContextPath(trail)}`,
  ) {
    super(message);
  }

  get value() {
    return this.trail[this.trail.length - 1].actual;
  }
}

export interface Context {
  trail: Trail;
  success<TValue>(value: TValue): Validation<TValue>;
  failures<TValue>(errors: Errors): Validation<TValue>;
  failure<TValue>(message?: string): Validation<TValue>;
  child<TCodec extends ANY>(key: string, codec: TCodec, input: unknown): Context;
}
export type IContext = Context;

export function identity<T>(value: T) {
  return value;
}

export abstract class Codec<A, O = A, I = unknown> implements Decoder<I, A> {
  readonly _A!: A;
  readonly _I!: I;
  readonly _O!: O;
  readonly name: string;

  protected constructor(name: string) {
    this.name = name;
  }

  abstract is(input: unknown): input is A;
  abstract encode(value: A): O;
  abstract decode(input: I, context: Context): Validation<A>;

  pipe<B, IB, A extends IB, OB extends A>(
    this: Type<A, O, I>,
    ab: Type<B, OB, IB>,
    name = `${this.name}→${ab.name}`,
  ): Type<B, O, I> {
    return new Type<B, O, I>(
      name,
      ab.is,
      (i, c) => {
        const e = this.decode(i, c);
        if (isLeft(e)) {
          return e;
        }
        return ab.decode(e.right, c);
      },
      this.encode === identity && ab.encode === identity ? (identity as any) : (b) => this.encode(ab.encode(b)),
    );
  }

  parse(input: I, context: Context = ThrowContext.root(this, input)): A {
    const decodeResult = this.decode(input, context);
    if (isLeft(decodeResult)) throw new Error(`Something is wrong: ${decodeResult} should be Right`);
    return decodeResult.right;
  }
}

/**
 * Slight compatibility layer with io-ts codecs
 */
export class Type<A, O = A, I = unknown> extends Codec<A, O, I> {
  constructor(
    /** a unique name for this codec */
    readonly name: string,
    /** a custom type guard */
    readonly is: Is<A>,
    /** succeeds if a value of type I can be decoded to a value of type A */
    readonly decode: Decode<I, A>,
    /** converts a value of type A to a value of type O */
    readonly encode: Encode<A, O>,
  ) {
    super(name);
  }
}

export class LazyContext implements Context {
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

  child<TCodec extends Decoder<any, any>>(key: string, codec: TCodec, input: unknown): Context {
    const nextTrail = this.trail.concat([{ key: key, type: codec, actual: input }]);
    return new LazyContext(nextTrail);
  }
}

export class ThrowContext implements Context {
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

  child<TCodec extends Decoder<any, any>>(key: string, codec: TCodec, input: unknown): Context {
    const nextTrail = this.trail.concat([{ key: key, type: codec, actual: input }]);
    return new ThrowContext(nextTrail);
  }
}
