import { isLeft, left, right, type Left, type Maybe } from "./either.js";

export type Combinator<T, P extends string | Uint8Array> = { (t: Tape<P>): Maybe<T>; name?: string };

type TapeSubstrate = string | Uint8Array;

export interface Tape<P extends TapeSubstrate> {
  readonly input: P;
  position: number;
  readonly isEOF: boolean;
}

export class StringTape implements Tape<string> {
  position: number = 0;

  constructor(readonly input: string) {}

  get isEOF() {
    return this.position >= this.input.length;
  }
}

/**
 * Reset position to `prev` and `fail`
 */
export function failure<P extends TapeSubstrate>(error: Error, prev: number, tape: Tape<P>): Maybe<never> {
  tape.position = prev;
  return fail(error);
}

/**
 * Just return Left<Error>
 */
export function fail(error: Error): Maybe<never> {
  return left(error);
}

// --- Combinators below ---

export function literal<P extends string>(value: string): Combinator<string, P> {
  return function (tape: Tape<P>) {
    const probe = tape.input.slice(tape.position, tape.position + value.length);
    if (probe === value) {
      tape.position += value.length;
      return right(value);
    } else {
      return fail(new Error(`Can not match literal "${value}"`));
    }
  };
}

export function foldMap<A, B, P extends TapeSubstrate>(
  combinator: Combinator<A, P>,
  fn: (a: A) => Maybe<B>
): Combinator<B, P> {
  return function map(tape) {
    const prev = tape.position;
    const parsed = combinator(tape);
    if (isLeft(parsed)) {
      tape.position = prev;
      return parsed;
    }
    const mapped = fn(parsed.right);
    if (isLeft(mapped)) return failure(mapped.left, prev, tape);
    return mapped;
  };
}

export function map<A, B, P extends TapeSubstrate>(combinator: Combinator<A, P>, fn: (a: A) => B): Combinator<B, P> {
  return function (tape) {
    const prev = tape.position;
    const parsed = combinator(tape);
    if (isLeft(parsed)) {
      tape.position = prev;
      return parsed;
    }
    return right(fn(parsed.right));
  };
}

export function match<P extends string>(pattern: RegExp | string): Combinator<string, P> {
  return function (tape: Tape<P>) {
    const probe = tape.input.slice(tape.position).match(pattern);
    if (!probe) return fail(new Error(`Can not match ${pattern}`));
    tape.position += probe[0].length;
    return right(probe[0]);
  };
}

export function joinSeq<P extends TapeSubstrate>(...combinators: Array<Combinator<string, P>>): Combinator<string, P> {
  return join(seqA(combinators));
}

export function join<P extends TapeSubstrate>(
  input: Combinator<Array<string>, P>,
  separator = ""
): Combinator<string, P> {
  return function (tape: Tape<P>) {
    const prev = tape.position;
    const results = input(tape);
    if (isLeft(results)) {
      tape.position = prev;
      return results;
    }
    return right(results.right.join(separator));
  };
}

export function seq<A, B, C, D, E, F, G, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>,
  d: Combinator<D, P>,
  e: Combinator<E, P>,
  f: Combinator<F, P>,
  g: Combinator<G, P>
): Combinator<[A, B, C, D, E, F, G], P>;
export function seq<A, B, C, D, E, F, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>,
  d: Combinator<D, P>,
  e: Combinator<E, P>,
  f: Combinator<F, P>
): Combinator<[A, B, C, D, E, F], P>;
export function seq<A, B, C, D, E, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>,
  d: Combinator<D, P>,
  e: Combinator<E, P>
): Combinator<[A, B, C, D, E], P>;
export function seq<A, B, C, D, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>,
  d: Combinator<D, P>
): Combinator<[A, B, C, D], P>;
export function seq<A, B, C, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>
): Combinator<[A, B, C], P>;
export function seq<A, B, P extends TapeSubstrate>(a: Combinator<A, P>, b: Combinator<B, P>): Combinator<[A, B], P>;
export function seq<P extends TapeSubstrate>(...combinators: Array<Combinator<any, P>>): Combinator<any, P> {
  return seqA(combinators);
}

export function seqA<T, P extends TapeSubstrate>(combinators: Array<Combinator<T, P>>): Combinator<Array<T>, P> {
  return function (tape: Tape<P>): Maybe<Array<T>> {
    const prev = tape.position;
    const results = [];
    for (const combinator of combinators) {
      const r = combinator(tape);
      if (isLeft(r)) {
        return failure(r.left, prev, tape);
      }
      results.push(r.right);
    }
    return right(results);
  };
}

// If the production method fails, don't fail, just return otherwise.
export function option<T, P extends TapeSubstrate>(combinator: Combinator<T, P>, otherwise: T): Combinator<T, P> {
  return function option(tape: Tape<P>) {
    const result = combinator(tape);
    if (isLeft(result)) {
      return right(otherwise);
    } else {
      return result;
    }
  };
}

export function choice<A, B, C, D, G, F, H, I, J, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>,
  d: Combinator<D, P>,
  g: Combinator<G, P>,
  f: Combinator<F, P>,
  h: Combinator<H, P>,
  i: Combinator<I, P>,
  j: Combinator<J, P>
): Combinator<A | B | C | D | G | F | H | I | J, P>;
export function choice<A, B, C, D, G, F, H, I, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>,
  d: Combinator<D, P>,
  g: Combinator<G, P>,
  f: Combinator<F, P>,
  h: Combinator<H, P>,
  i: Combinator<I, P>
): Combinator<A | B | C | D | G | F | H | I, P>;
export function choice<A, B, C, D, G, F, H, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>,
  d: Combinator<D, P>,
  g: Combinator<G, P>,
  f: Combinator<F, P>,
  h: Combinator<H, P>
): Combinator<A | B | C | D | G | F | H, P>;
export function choice<A, B, C, D, G, F, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>,
  d: Combinator<D, P>,
  g: Combinator<G, P>,
  f: Combinator<F, P>
): Combinator<A | B | C | D | G | F, P>;
export function choice<A, B, C, D, G, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>,
  d: Combinator<D, P>,
  g: Combinator<G, P>
): Combinator<A | B | C | D | G, P>;
export function choice<A, B, C, D, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>,
  d: Combinator<D, P>
): Combinator<A | B | C | D, P>;
export function choice<A, B, C, P extends TapeSubstrate>(
  a: Combinator<A, P>,
  b: Combinator<B, P>,
  c: Combinator<C, P>
): Combinator<A | B | C, P>;
export function choice<A, B, P extends TapeSubstrate>(a: Combinator<A, P>, b: Combinator<B, P>): Combinator<A | B, P>;
export function choice<A, P extends TapeSubstrate>(a: Combinator<A, P>): Combinator<A, P>;
export function choice<P extends TapeSubstrate>(...combinators: Array<Combinator<any, P>>) {
  return function choice(tape: Tape<P>) {
    for (const combinator of combinators) {
      const prev = tape.position;
      const result = combinator(tape);
      if (isLeft(result)) {
        tape.position = prev;
      } else {
        return result;
      }
    }
    return fail(new Error(`Can not find any of ${combinators.map((m) => m.name).join(", ")}`));
  };
}

// Return the array of values produced by method with sep between each
// value: "A", "A sep A", "A sep A sep A"
export function sepBy<T, TSep, P extends TapeSubstrate>(
  element: Combinator<T, P>,
  separator: Combinator<TSep, P>,
  min: number = 1,
  max = Infinity
): Combinator<Array<T>, P> {
  return function (tape) {
    const prev = tape.position;
    const results: Array<T> = [];
    const first = element(tape);
    if (isLeft(first)) return failure(first.left, prev, tape);
    results.push(first.right);

    let returnPosition = tape.position;
    const handleLeft = (miss: Left<Error>) => {
      if (results.length < min) {
        return failure(miss.left, returnPosition, tape);
      } else {
        tape.position = returnPosition;
        return right(results);
      }
    };
    while (!tape.isEOF && results.length < max) {
      returnPosition = tape.position;
      const sepE = separator(tape);
      if (isLeft(sepE)) return handleLeft(sepE);
      const seqE = element(tape);
      if (isLeft(seqE)) return handleLeft(seqE);
      results.push(seqE.right);
    }

    if (results.length < min) {
      return failure(new Error(`Got ${results}/${min} instances of ${element.name}`), prev, tape);
    }

    return right(results);
  };
}

export function many<T, P extends TapeSubstrate>(
  element: Combinator<T, P>,
  min: number = 1,
  max = Infinity
): Combinator<Array<T>, P> {
  return function many(tape: Tape<P>) {
    const prev = tape.position;
    const result: Array<T> = [];

    while (!tape.isEOF && result.length < max) {
      const entry = element(tape);
      if (isLeft(entry)) {
        if (result.length < min) {
          return failure(entry.left, prev, tape);
        } else {
          return right(result);
        }
      } else {
        result.push(entry.right);
      }
    }
    return right(result);
  };
}

/**
 * Consume all the input.
 */
export function parseAll<T, P extends TapeSubstrate>(combinator: Combinator<T, P>): Combinator<T, P> {
  return function parseAll(tape) {
    const prev = tape.position;
    const result = combinator(tape);
    if (isLeft(result)) return result;
    // Check if input is consumed
    if (!tape.isEOF) {
      return failure(new Error(`Consumed only ${tape.position} of ${tape.input.length} input length`), prev, tape);
    }
    return result;
  };
}
