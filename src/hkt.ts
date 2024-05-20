/**
 * See https://dev.to/effect-ts/encoding-of-hkts-in-typescript-5c3
 */

/**
 * Represents abstract `Type<_A>` as just `Type<~>`.
 */
export interface HKT {
  readonly _A: unknown;
  readonly type: unknown;
}

/**
 * Higher kinded type `F` applied to `A`: `F<A>`.
 */
export type Kind<F extends HKT, A> = F extends HKT
  ? (F & {
      readonly _A: A;
    })["type"]
  : never;

/**
 * Map values of Dictionary.
 */
type MapIn<P, F extends HKT> = { [K in keyof P]: Kind<F, P[K]> };

export type MapOf<Tuple extends readonly unknown[], F extends HKT, Result extends List = []> = Tuple extends readonly [
  unknown,
  ...unknown[],
]
  ? MapOf<Tail<Tuple>, F, Append<Result, Kind<F, Head<Tuple>>>>
  : Result;

export type MapOver<P, F extends HKT> = P extends readonly unknown[] ? MapOf<P, F> : MapIn<P, F>;

export type List<A = any> = ReadonlyArray<A>;
export type Length<L extends List> = L["length"];
export type Tail<L extends List> = L extends readonly [] ? L : L extends readonly [any?, ...infer LTail] ? LTail : L;
export type Head<L extends List> = Length<L> extends 0 ? never : L[0];
export type Append<L extends List, A extends any> = [...L, A];

export type Intersection<Tuple extends readonly unknown[], Result = {}> = Tuple extends readonly [unknown, ...unknown[]]
  ? Intersection<Tail<Tuple>, Head<Tuple> & Result>
  : Result;
