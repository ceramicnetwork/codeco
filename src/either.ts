export interface Left<TError> {
  readonly _tag: "Left";
  readonly left: TError;
}

export interface Right<TValue> {
  readonly _tag: "Right";
  readonly right: TValue;
}

export type Either<TError, TValue> = Left<TError> | Right<TValue>;

export function isLeft<TError>(either: Either<TError, unknown>): either is Left<TError> {
  return either._tag === "Left";
}

export function isRight<TValue>(either: Either<unknown, TValue>): either is Right<TValue> {
  return either._tag === "Right";
}

export function left<TError = never, TValue = never>(e: TError): Either<TError, TValue> {
  return { _tag: "Left", left: e };
}

export function right<TError = never, TValue = never>(a: TValue): Either<TError, TValue> {
  return { _tag: "Right", right: a };
}

export type Maybe<T> = Either<Error, T>;

export function getOrThrow<TError = never, TValue = never>(maybe: Maybe<TValue>): TValue {
  if (isLeft(maybe)) throw maybe.left;
  return maybe.right;
}
