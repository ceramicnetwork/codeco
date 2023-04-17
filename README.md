# Codeco

> Lightweight TypeScript-first encoding and decoding of complex objects.

## Idea

A value of type `Codec<A, O, I>` (called "codec") is the runtime representation of the static type `A`.

A codec can:

- decode inputs of type `I`,
- encode values to type `O`,
- be used as a [type predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates).

```typescript
export abstract class Codec<A, O = A, I = unknown> {
  protected constructor(readonly name: string) {}

  abstract is(input: unknown): input is A;
  abstract encode(value: A): O;
  abstract decode(input: I): Either<Error, A>;
}
```

The `Either` type represents a value of one of two possible types (a disjoint union):

- `Left` meaning _success_,
- `Right` meaning _failure_.

```typescript
type Either<TError, TValue> =
  | {
      readonly _tag: "Left";
      readonly left: TError;
    }
  | {
      readonly _tag: "Right";
      readonly right: TValue;
    };
```

You could check a result of validation using `isValid` or `isError` helpers:

```typescript
import { string, refinement, validate, isError } from "codeco";

const longString = refinement(string, (s) => s.length >= 100);
const validation = validate(longString, "short input");
if (isError(validation)) {
  console.log("Validation errorr", validation.left);
}
const valid = validation.right; // Here goes proper long string
```

## Implemented types

| Description           | TypeScript                  | codec                                                                      |
| --------------------- | --------------------------- | -------------------------------------------------------------------------- |
| null                  | `null`                      | `cs.null` or `cs.nullCodec`                                                |
| undefined             | `undefined`                 | `cs.undefined`                                                             |
| void                  | `void`                      | `cs.void`                                                                  |
| string                | `string`                    | `cs.string`                                                                |
| number                | `number`                    | `cs.number`                                                                |
| boolean               | `boolean`                   | `cs.boolean`                                                               |
| BigInt                | `bigint`                    | `cs.bigint`                                                                |
| unknown               | `unknown`                   | `cs.unknown`                                                               |
| literal               | `'s'`                       | `cs.literal('s')`                                                          |
| array of unknown      | `Array<unknown>`            | `cs.unknownArray`                                                          |
| dictionary of unknown | `Record<string, unknown>`   | `cs.unknownDictionary`                                                     |
| array of type         | `Array<A>`                  | `cs.array(A)`                                                              |
| any                   | `any`                       | `cs.any`                                                                   |
| never                 | `never`                     | `cs.never`                                                                 |
| dictionary            | `Record<string, A>`         | `cs.dictionary(A)`                                                         |
| record of type        | `Record<K, A>`              | `cs.record(K, A)`                                                          |
| partial               | `Partial<{ name: string }>` | `cs.partial({ name: cs.string })`                                          |
| readonly              | `Readonly<A>`               | `cs.readonly(A)`                                                           |
| type alias            | `type T = { name: A }`      | `cs.type({ name: A })`                                                     |
| tuple                 | `[A, B]`                    | `cs.tuple([ A, B ])`                                                       |
| union                 | `A \| B`                    | `cs.union([ A, B ])`                                                       |
| intersection          | `A & B`                     | `cs.intersection([ A, B ])`                                                |
| keyof                 | `keyof M`                   | `cs.keyof(M)` (**only supports string keys**)                              |
| recursive types       |                             | `cs.recursive(name, definition)`                                           |
| exact types           | ✘                           | `cs.exact(type)` (no unknown extra properties)                             |
| strict                | ✘                           | `cs.strict({ name: A })` (an alias of `cs.exact(cs.type({ name: A })))`    |
| sparse                | ✘                           | `cs.sparse({ name: A })` similar to `cs.intersect(cs.type(), cs.partial()` |
| replacement           | ✘                           | `cs.replacement(A, altInput)`                                              |
| optional              | `A \| undefined`            | `cs.optional(A)`                                                           |

## Linear parsing

In addition to structural encoding/decoding, we provide linear _parsing_ functions in form of Parser Combinators
available from 'codeco/linear':

```typescript
import * as P from "codeco/linear";
import { getOrThrow } from "codeco";

const line = P.seq(P.literal("My name is "), P.match(/\w+/));
const name = P.map(line, (parsed) => parsed[1]); // `map` combinator
const input = new P.StringTape("My name is Marvin"); // Prepare input for consumption
const decodedName = getOrThrow(P.parseAll(input)); // Would throw if input does not conform to expected format
```

Provided combinators:

- `literal("string-value")` - literal value
- `map(combinator, mapFn)` - map return value of `combinator` to something else,
- `mapFold(combinator, mapFn)` - map return value of `combinator` to something else as `Either`, so optionally indicating failure,
- `match(regexp)` - like `literal`, but matches a RegExp,
- `seq(combinatorA, combinatorB, ...)` - match combinators and return array of their results,
- `join(combinators)` - match combinators and their results as a single string,
- `joinSeq(combinators)` - shortcut for `join(seq(combinatros))`,
- `option(combinator, value)` - try matching `combinator`, return `value` if the combinator does not match,
- `choice(combinatorA, combinatorB, ...)` - match any of the passed combinators,
- `sepBy(combinator, separator, min = 1, max = Infinity)` - match sequence of 1 or more `combinator`s separated by `separator`, like `A`, `A + A`, `A + A + A`, etc.
- `many(combinator, min = 1, max = Infinity)` - array of combinators of length `[min, max)`,
- `parseAll(combinator)` - make sure all the input is consumed.
