import { type Either, isLeft, right } from "./either.js";
import type { NonEmptyArray } from "ts-essentials";
import type { HKT, Intersection, MapOver } from "./hkt.js";
import type { Refinement, ANY, MIXED, Validation, Context, Encode, Decode, Is, Predicate, Errors } from "./context.js";
import { Codec, ValidationError, LazyContext, getFunctionName, identity } from "./context.js";

export function isNonEmpty<T>(array: Array<T>): array is NonEmptyArray<T> {
  return array.length > 0;
}

export type TypeOf<T extends ANY> = T["_A"];
export type InputOf<T extends ANY> = T["_I"];
export type OutputOf<T extends ANY> = T["_O"];

export type TypeOf$<T> = T extends ANY ? T["_A"] : never;
export type InputOf$<T> = T extends ANY ? T["_I"] : never;
export type OutputOf$<T> = T extends ANY ? T["_O"] : never;

interface $TypeOf extends HKT {
  readonly type: TypeOf$<this["_A"]>;
}

interface $OutputOf extends HKT {
  readonly type: OutputOf$<this["_A"]>;
}

interface $InputOf extends HKT {
  readonly type: InputOf$<this["_A"]>;
}

interface $PropsOf extends HKT {
  readonly type: PropsOf<this["_A"]>;
}

export type Props = { [K in string]: ANY };
type WithProps = { props: Props } | { codec: WithProps };
type PropsOf<TCodec> = TCodec extends { props: infer P extends Props }
  ? P
  : TCodec extends { codec: infer P }
    ? PropsOf<P>
    : {};

export class TrivialCodec<T> extends Codec<T> {
  constructor(
    name: string,
    readonly is: Is<T>,
  ) {
    super(name);
  }
  encode = identity;
  decode(input: unknown, context: Context): Validation<T> {
    if (this.is(input)) {
      return context.success(input);
    } else {
      return context.failure();
    }
  }
}

export const nullCodec = new TrivialCodec<null>("null", (input: unknown): input is null => input === null);

export const undefinedCodec = new TrivialCodec<undefined>(
  "undefined",
  (input: unknown): input is undefined => input === undefined,
);

export const voidCodec = new TrivialCodec<void>("void", (input: unknown): input is void => input === undefined);

export const string = new TrivialCodec<string>(
  "string",
  (input: unknown): input is string => typeof input === "string",
);

export const number = new TrivialCodec<number>(
  "number",
  (input: unknown): input is number => typeof input === "number",
);

export const boolean = new TrivialCodec<boolean>(
  "boolean",
  (input: unknown): input is boolean => typeof input === "boolean",
);

export const bigint = new TrivialCodec<bigint>(
  "bigint",
  (input: unknown): input is bigint => typeof input === "bigint",
);

export const unknown = new TrivialCodec<unknown>("unknown", (input: unknown): input is unknown => true);

export const object = new TrivialCodec<object>(
  "object",
  (input: unknown): input is object => Boolean(input) && typeof input === "object",
);

export class LiteralCodec<TValue extends string | number | boolean> extends TrivialCodec<TValue> {
  readonly keys: TValue[];
  constructor(
    private readonly value: TValue,
    name: string = JSON.stringify(value),
  ) {
    super(name, (input: unknown): input is TValue => input === value);
    this.keys = [value];
  }
}

export function literal<TValue extends string | number | boolean>(value: TValue, name?: string) {
  return new LiteralCodec(value, name);
}

export const unknownArray = new TrivialCodec<Array<unknown>>(
  "UnknownArray",
  (input: unknown): input is Array<unknown> => Array.isArray(input),
);

export const unknownRecord = new TrivialCodec<Record<string, unknown>>(
  "UnknownDictionary",
  (input: unknown): input is Record<string, unknown> => {
    const isObjectLike = Boolean(input) && typeof input === "object";
    if (!isObjectLike) return false;
    const isArrayLike = Array.isArray(input);
    if (isArrayLike) return false;
    const proto = Object.getPrototypeOf(input);
    if (!proto) return true;
    const Ctor = Object.hasOwn(proto, "constructor") && proto.constructor;
    return typeof Ctor === "function" && Ctor instanceof Ctor && Ctor.toString() == Object.toString();
  },
);

export class ArrayCodec<TCodec extends MIXED> extends Codec<Array<TypeOf<TCodec>>, Array<OutputOf<TCodec>>> {
  constructor(
    readonly item: TCodec,
    name: string,
  ) {
    super(name);
  }

  decode(input: Array<InputOf<TCodec>>, context: Context): Validation<Array<TypeOf<TCodec>>> {
    const decodedArrayE = unknownArray.decode(input, context);
    if (isLeft(decodedArrayE)) return decodedArrayE;
    const decodedArray = decodedArrayE.right;
    const errors: Array<ValidationError> = [];
    const result = new Array<TypeOf<TCodec>>(decodedArray.length);
    decodedArray.forEach((item, index) => {
      const decoded = this.item.decode(item, context.child(String(index), this.item, item));
      if (isLeft(decoded)) {
        decoded.left.forEach((e) => errors.push(e));
      } else {
        result[index] = decoded.right;
      }
    });
    if (isNonEmpty(errors)) {
      return context.failures(errors);
    } else {
      return context.success(result);
    }
  }

  encode(value: Array<TypeOf<TCodec>>): Array<OutputOf<TCodec>> {
    if (this.item.encode === identity) {
      return value;
    } else {
      return value.map((itemValue) => this.item.encode(itemValue));
    }
  }

  is(input: unknown): input is Array<TypeOf<TCodec>> {
    return unknownArray.is(input) && input.every((item) => this.item.is(item));
  }
}

export function array<TCodec extends MIXED>(
  item: TCodec,
  name: string = `${item.name}[]`,
): Codec<Array<TypeOf<TCodec>>, Array<OutputOf<TCodec>>> & { item: TCodec } {
  return new ArrayCodec(item, name);
}

export const any = new TrivialCodec<any>("any", (input): input is any => true);

export const never = new TrivialCodec<never>("never", (input): input is never => false);

export function getInterfaceTypeName(props: Props): string {
  return `{${getNameFromProps(props)}}`;
}

export function getNameFromProps(props: Props): string {
  return Object.keys(props)
    .map((k) => `${k}:${props[k].name}`)
    .join(",");
}

export class TypeCodec<P extends Props> extends Codec<MapOver<P, $TypeOf>, MapOver<P, $OutputOf>> {
  constructor(
    readonly props: P,
    name: string = getInterfaceTypeName(props),
  ) {
    super(name);
  }

  decode(input: unknown, context: Context): Either<Errors, MapOver<P, $TypeOf>> {
    const inputE = object.decode(input, context);
    if (isLeft(inputE)) return inputE;
    const inputObject = inputE.right as any;
    const output = { ...inputObject };
    const errors: Array<ValidationError> = [];
    Object.entries(this.props).forEach(([propName, propCodec]) => {
      const inputProperty = inputObject[propName];
      const result = propCodec.decode(inputProperty, context.child(propName, propCodec, inputProperty));
      if (isLeft(result)) {
        result.left.forEach((e) => errors.push(e));
      } else {
        output[propName] = result.right;
      }
    });
    return isNonEmpty(errors) ? context.failures(errors) : context.success(output as any);
  }

  encode(value: MapOver<P, $TypeOf>): MapOver<P, $OutputOf> {
    const s: Record<string, any> = { ...value };
    Object.entries(this.props).forEach(([propName, propCodec]) => {
      s[propName] = propCodec.encode(s[propName]);
    });
    return s as any;
  }

  is(input: unknown): input is MapOver<P, $TypeOf> {
    if (!object.is(input)) return false;
    const inputObject = input as any;
    return Object.entries(this.props).every(([propName, propCodec]) => {
      const inputEntry = inputObject[propName];
      if (inputEntry) {
        return propCodec.is(inputEntry);
      } else {
        return Object.hasOwn(input, propName) && propCodec.is(inputEntry);
      }
    });
  }
}

export function type<P extends Props>(props: P, name?: string) {
  return new TypeCodec(props, name);
}

function getUnionName<CS extends [MIXED, MIXED, ...Array<MIXED>]>(codecs: CS): string {
  return codecs.map((type) => type.name).join("|");
}

export class UnionCodec<TCodecs extends [MIXED, MIXED, ...Array<MIXED>]> extends Codec<
  TypeOf<TCodecs[number]>,
  OutputOf<TCodecs[number]>
> {
  constructor(
    readonly codecs: TCodecs,
    name: string = getUnionName(codecs),
  ) {
    super(name);
  }

  decode(input: unknown, context: Context): Validation<TypeOf<TCodecs[number]>> {
    const errors: Errors = [];
    for (const [index, codec] of this.codecs.entries()) {
      try {
        const result = codec.decode(input, context.child(String(index), codec, input));
        if (isLeft(result)) {
          result.left.forEach((e) => errors.push(e));
        } else {
          return context.success(result.right);
        }
      } catch (e) {
        errors.push(e as ValidationError);
      }
    }
    return context.failures(errors as NonEmptyArray<ValidationError>);
  }

  encode(value: TypeOf<TCodecs[number]>): OutputOf<TCodecs[number]> {
    for (const codec of this.codecs) {
      if (codec.is(value)) {
        return codec.encode(value);
      }
    }
    throw new Error(`no codec found to encode value in union type ${this.name}`);
  }

  is(input: unknown): input is TypeOf<TCodecs[number]> {
    return this.codecs.some((c) => c.is(input));
  }

  parse(input: unknown, context: Context = LazyContext.root(this, input)) {
    return super.parse(input, context);
  }
}

export function union<TCodecs extends [MIXED, MIXED, ...Array<MIXED>]>(codecs: TCodecs, name?: string) {
  return new UnionCodec(codecs, name);
}

export class RefinementCodec<TCodec extends ANY, B extends TypeOf<TCodec> = TypeOf<TCodec>> extends Codec<
  B,
  OutputOf<TCodec>,
  InputOf<TCodec>
> {
  constructor(
    readonly codec: TCodec,
    readonly predicate: Predicate<TypeOf<TCodec>>,
    name = `${codec.name}≍${getFunctionName(predicate)}`,
  ) {
    super(name);
  }

  decode(input: InputOf<TCodec>, context: Context): Validation<B> {
    const decodedE = this.codec.decode(input, context);
    if (isLeft(decodedE)) return decodedE;
    if (this.predicate(decodedE.right)) {
      return decodedE;
    } else {
      return context.failure();
    }
  }

  encode(value: B): OutputOf<TCodec> {
    return this.codec.encode(value);
  }

  is(input: unknown): input is B {
    return this.codec.is(input) && this.predicate(input);
  }
}

export function refinement<TCodec extends ANY, B extends TypeOf<TCodec>>(
  codec: TCodec,
  predicate: Refinement<TypeOf<TCodec>, B>,
  name?: string,
): RefinementCodec<TCodec, B>;
export function refinement<TCodec extends ANY, B extends TypeOf<TCodec>>(
  codec: TCodec,
  predicate: Predicate<TypeOf<TCodec>>,
  name?: string,
): RefinementCodec<TCodec, TypeOf<TCodec>>;
export function refinement<TCodec extends ANY, B extends TypeOf<TCodec>>(
  codec: TCodec,
  predicate: Predicate<TypeOf<TCodec>>,
  name?: string,
): RefinementCodec<TCodec, TypeOf<TCodec>> {
  return new RefinementCodec(codec, predicate, name);
}

export class DefaultsCodec<TCodec extends ANY> extends Codec<TypeOf<TCodec>, OutputOf<TCodec>, InputOf<TCodec>> {
  readonly is: Is<TypeOf<TCodec>>;
  readonly encode: Encode<TypeOf<TCodec>, OutputOf<TCodec>>;
  constructor(
    readonly codec: TCodec,
    readonly replacement: TypeOf<TCodec>,
    name: string = `(${codec.name} ❮ ${replacement})`,
  ) {
    super(name);
    this.is = this.codec.is.bind(this.codec);
    this.encode = this.codec.encode.bind(this.codec);
  }
  decode(input: InputOf<TCodec>, context: Context): Validation<TypeOf<TCodec>> {
    const decodedE = this.codec.decode(input, new LazyContext(context.trail));
    if (isLeft(decodedE)) {
      return context.success(this.replacement);
    } else {
      return decodedE;
    }
  }
}

export function defaults<TCodec extends ANY>(codec: TCodec, replacement: TypeOf<TCodec>, name?: string) {
  return new DefaultsCodec(codec, replacement, name);
}

export class ReplacementCodec<TCodec extends ANY> extends Codec<TypeOf<TCodec>, OutputOf<TCodec>, InputOf<TCodec>> {
  readonly is: Is<TypeOf<TCodec>>;
  readonly encode: Encode<TypeOf<TCodec>, OutputOf<TCodec>>;

  constructor(
    readonly codec: TCodec,
    readonly replacement: InputOf<TCodec>,
    name: string = `(${codec.name} ❮❮ ${replacement})`,
  ) {
    super(name);
    this.is = this.codec.is.bind(this.codec);
    this.encode = this.codec.encode.bind(this.codec);
  }
  decode(input: InputOf<TCodec>, context: Context): Validation<TypeOf<TCodec>> {
    const decodedE = this.codec.decode(input, new LazyContext(context.trail));
    if (isLeft(decodedE)) {
      return this.codec.decode(this.replacement, context);
    } else {
      return decodedE;
    }
  }
}

export function replacement<TCodec extends ANY>(codec: TCodec, replacement: InputOf<TCodec>, name?: string) {
  return new ReplacementCodec(codec, replacement, name);
}

export class PostprocessDecodeCodec<TCodec extends ANY> extends Codec<
  TypeOf<TCodec>,
  OutputOf<TCodec>,
  InputOf<TCodec>
> {
  readonly is: Is<TypeOf<TCodec>>;
  readonly encode: Encode<TypeOf<TCodec>, OutputOf<TCodec>>;

  constructor(
    readonly codec: TCodec,
    readonly onDecode: (input: TypeOf<TCodec>) => TypeOf<TCodec>,
    name: string = `(${codec.name} ❮❮ ??})`,
  ) {
    super(name);
    this.is = this.codec.is.bind(this.codec);
    this.encode = this.codec.encode.bind(this.codec);
  }
  decode(input: InputOf<TCodec>, context: Context): Validation<TypeOf<TCodec>> {
    const decodedE = this.codec.decode(input, new LazyContext(context.trail));
    if (isLeft(decodedE)) {
      return decodedE;
    } else {
      return right(this.onDecode(decodedE.right));
    }
  }
}

/**
 * Replace input in runtime for `codec`. For example, change `${CWD}` in the input to a current working dir.
 */
export function postprocessDecode<TCodec extends ANY>(
  codec: TCodec,
  replacementFn: PostprocessDecodeCodec<TCodec>["onDecode"],
  name?: string,
): PostprocessDecodeCodec<TCodec> {
  return new PostprocessDecodeCodec(codec, replacementFn, name);
}

export class TupleCodec<TCodecs extends [MIXED, ...Array<MIXED>]> extends Codec<
  MapOver<TCodecs, $TypeOf>,
  MapOver<TCodecs, $OutputOf>
> {
  constructor(
    readonly codecs: TCodecs,
    readonly name: string = `[${codecs.map((type) => type.name).join(",")}]`,
  ) {
    super(name);
  }

  decode(input: MapOver<TCodecs, $InputOf>, context: Context): Validation<MapOver<TCodecs, $TypeOf>> {
    const arrayE = unknownArray.decode(input, context);
    if (isLeft(arrayE)) return arrayE;
    const array = arrayE.right;
    // strip additional components
    let result: Array<any> = array.length > this.codecs.length ? array.slice(0, this.codecs.length) : array;
    const errors: Errors = [];
    for (const [index, codec] of this.codecs.entries()) {
      const decodedE = codec.decode(array[index], context.child(String(index), codec, array[index]));
      if (isLeft(decodedE)) {
        decodedE.left.forEach((e) => errors.push(e));
      } else {
        result[index] = decodedE.right;
      }
    }
    return isNonEmpty(errors) ? context.failures(errors) : context.success(result as any);
  }

  encode(value: MapOver<TCodecs, $TypeOf>): MapOver<TCodecs, $OutputOf> {
    return this.codecs.map((type, i) => type.encode(value[i])) as any;
  }

  is(input: unknown): input is MapOver<TCodecs, $TypeOf> {
    return (
      unknownArray.is(input) && input.length === this.codecs.length && this.codecs.every((type, i) => type.is(input[i]))
    );
  }
}

export function tuple<TCodecs extends NonEmptyArray<MIXED>>(codecs: TCodecs, name?: string): TupleCodec<TCodecs> {
  return new TupleCodec(codecs, name);
}

function stripKeys<T extends Record<string, unknown>>(o: T, props: Props): T {
  const keys = Object.getOwnPropertyNames(o);
  let shouldStrip = false;
  const r: any = {};
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!Object.hasOwn(props, key)) {
      shouldStrip = true;
    } else {
      r[key] = o[key];
    }
  }
  return shouldStrip ? r : o;
}

export class ExactCodec<TCodec extends ANY> extends Codec<TypeOf<TCodec>, OutputOf<TCodec>, InputOf<TCodec>> {
  readonly props: PropsOf<TCodec>;

  constructor(
    readonly codec: TCodec & WithProps,
    name: string = `Exact<${codec.name}>`,
  ) {
    super(name);
    this.props = getProps(codec);
  }

  is(input: unknown): input is InputOf<TCodec> {
    return this.codec.is(input);
  }

  decode(input: InputOf<TCodec>, context: Context): Validation<TypeOf<TCodec>> {
    const dictionaryE = object.decode(input, context);
    if (isLeft(dictionaryE)) return dictionaryE;
    const dictionaryDecoded = dictionaryE.right as any;
    return this.codec.decode(stripKeys(dictionaryDecoded, this.props), context);
  }

  encode(value: TypeOf<TCodec>): OutputOf<TCodec> {
    return this.codec.encode(stripKeys(value, this.props));
  }
}

export function exact<TCodec extends ANY & WithProps>(codec: TCodec, name?: string): ExactCodec<TCodec> {
  return new ExactCodec(codec, name);
}

function hasOwnProps<TCodec extends ANY>(codec: TCodec): codec is TCodec & { props: PropsOf<TCodec> } {
  return "props" in codec;
}

function hasOwnCodec<TCodec extends ANY>(codec: TCodec): codec is TCodec & { codec: ANY } {
  return "codec" in codec;
}

function hasOwnCodecs<TCodec extends ANY>(codec: TCodec): codec is TCodec & { codecs: Array<ANY> } {
  return "codecs" in codec;
}

function getProps<TCodec extends ANY>(codec: TCodec): PropsOf<TCodec> {
  if (hasOwnProps(codec)) return codec.props;
  if (hasOwnCodec(codec)) return getProps(codec.codec) as any;
  if (hasOwnCodecs(codec)) return Object.assign({}, ...codec.codecs.map((c) => getProps(c)));
  return {} as any;
}

export function strict<P extends Props>(props: P, name?: string): ExactCodec<TypeCodec<P>> {
  return exact(type(props), name);
}

export class ReadonlyCodec<TCodec extends ANY> extends Codec<
  Readonly<TypeOf<TCodec>>,
  OutputOf<TCodec>,
  InputOf<TCodec>
> {
  readonly codec: TCodec;
  readonly name: string;
  readonly is: TCodec["is"];
  readonly encode: TCodec["encode"];
  readonly decode: TCodec["decode"];

  constructor(codec: TCodec, name = `Readonly<${codec.name}>`) {
    super(name);
    this.codec = codec;
    this.name = name;
    this.is = this.codec.is.bind(this.codec);
    this.encode = this.codec.encode.bind(this.codec);
    this.decode = this.codec.decode.bind(this.codec);
  }
}

export function readonly<TCodec extends ANY>(codec: TCodec, name?: string) {
  return new ReadonlyCodec(codec, name);
}

export class PartialCodec<P extends Props> extends Codec<Partial<MapOver<P, $TypeOf>>, Partial<MapOver<P, $OutputOf>>> {
  constructor(
    readonly props: P,
    name: string = `Partial<${getInterfaceTypeName(props)}>`,
  ) {
    super(name);
  }

  encode(value: Partial<MapOver<P, $TypeOf>>): Partial<MapOver<P, $OutputOf>> {
    const s: Record<string, any> = { ...value };
    Object.entries(this.props).forEach(([propName, propCodec]) => {
      const inputEntry = value[propName];
      if (inputEntry) {
        s[propName] = propCodec.encode(inputEntry);
      }
    });
    return s as any;
  }

  is(input: unknown): input is Partial<MapOver<P, $TypeOf>> {
    if (!unknownRecord.is(input)) return false;
    return Object.entries(this.props).every(([propName, propCodec]) => {
      const inputEntry = input[propName];
      if (inputEntry) {
        return propCodec.is(inputEntry);
      } else {
        return true;
      }
    });
  }

  decode(input: unknown, context: Context): Validation<Partial<MapOver<P, $TypeOf>>> {
    const dictionaryE = unknownRecord.decode(input, context);
    if (isLeft(dictionaryE)) return dictionaryE;
    const dictionary = dictionaryE.right;
    const errors: Array<ValidationError> = [];
    const result: Record<string, any> = { ...dictionary };
    for (const [propName, propCodec] of Object.entries(this.props)) {
      const inputEntry = dictionary[propName];
      const decodedE = propCodec.decode(inputEntry, context.child(propName, propCodec, inputEntry));
      if (isLeft(decodedE)) {
        if (inputEntry) decodedE.left.forEach((e) => errors.push(e));
      } else {
        result[propName] = decodedE.right;
      }
    }
    return isNonEmpty(errors) ? context.failures(errors) : context.success(result as any);
  }
}

export function partial<P extends Props>(props: P, name?: string): PartialCodec<P> {
  return new PartialCodec(props, name);
}

// FIXME Replace with Object.assign
// It is shallow anyway
export function mergeAll(base: any, us: Array<any>): any {
  let equal = true;
  let primitive = true;
  const baseIsNotADictionary = !unknownRecord.is(base);
  for (const u of us) {
    if (u !== base) {
      equal = false;
    }
    if (unknownRecord.is(u)) {
      primitive = false;
    }
  }
  if (equal) {
    return base;
  } else if (primitive) {
    return us[us.length - 1];
  }
  const r: any = {};
  for (const u of us) {
    for (const k in u) {
      if (!Object.hasOwn(r, k) || baseIsNotADictionary || u[k] !== base[k]) {
        r[k] = u[k];
      }
    }
  }
  return r;
}

export class IntersectionCodec<TCodecs extends Readonly<Array<ANY>>> extends Codec<
  Intersection<MapOver<TCodecs, $TypeOf>>,
  Intersection<MapOver<TCodecs, $OutputOf>>,
  Intersection<MapOver<TCodecs, $InputOf>>
> {
  readonly props: Intersection<MapOver<TCodecs, $PropsOf>>;

  constructor(
    readonly codecs: TCodecs,
    name: string = `${codecs.map((c) => c.name).join("&")}`,
  ) {
    super(name);
    this.props = Object.assign({}, ...codecs.map((c) => getProps(c)));
  }

  encode(value: Intersection<MapOver<TCodecs, $TypeOf>>): Intersection<MapOver<TCodecs, $OutputOf>> {
    return mergeAll(
      value,
      this.codecs.map((codec) => codec.encode(value)),
    );
  }

  is(input: unknown): input is Intersection<MapOver<TCodecs, $TypeOf>> {
    return this.codecs.every((codec) => codec.is(input));
  }

  decode(input: unknown, context: Context): Validation<Intersection<MapOver<TCodecs, $TypeOf>>> {
    const us: Array<unknown> = [];
    const errors: Errors = [];
    for (const [index, codec] of this.codecs.entries()) {
      const result = codec.decode(input, context.child(String(index), codec, input));
      if (isLeft(result)) {
        result.left.forEach((e) => errors.push(e));
      } else {
        us.push(result.right);
      }
    }
    if (isNonEmpty(errors)) {
      return context.failures(errors);
    } else {
      return context.success(mergeAll(input, us));
    }
  }
}

export function intersection<TCodecs extends readonly ANY[]>(codecs: TCodecs, name?: string) {
  return new IntersectionCodec<TCodecs>(codecs, name);
}

export class KeyOfCodec<D extends Record<string, unknown>> extends TrivialCodec<keyof D> {
  readonly keys: string[];
  constructor(keys: Array<string>, name: string, is: Is<keyof D>) {
    super(name, is);
    this.keys = keys;
  }
}

export function keyof<D extends Record<string, unknown>>(
  keys: D,
  name = Object.keys(keys)
    .map((k) => JSON.stringify(k))
    .join("|"),
) {
  return new KeyOfCodec(
    Object.keys(keys),
    name,
    (input): input is keyof D => string.is(input) && Object.hasOwn(keys, input),
  );
}

/**
 * Codec for `Record<string, codec>` where `string` could be replaced by a string-like non-enumerable codec.
 * @see EnumerableRecordCodec
 */
export class NonEnumerableRecordCodec<D extends MIXED, C extends MIXED> extends Codec<
  { [K in TypeOf<D>]: TypeOf<C> },
  { [K in OutputOf<D>]: OutputOf<C> }
> {
  constructor(
    readonly domain: D,
    readonly codomain: C,
    name: string = `{[${domain.name}]:${codomain.name}}`,
  ) {
    super(name);
  }

  decode(input: unknown, context: Context): Validation<{ [K in TypeOf<D>]: TypeOf<C> }> {
    const dictionaryE = unknownRecord.decode(input, context);
    if (isLeft(dictionaryE)) return dictionaryE;
    const dictionary = dictionaryE.right;
    const result: Record<string, unknown> = {};
    const errors: Array<ValidationError> = [];
    for (const [name, prop] of Object.entries(dictionary)) {
      const domainResult = this.domain.decode(name, context.child(name, this.domain, name));
      if (isLeft(domainResult)) {
        domainResult.left.forEach((e) => errors.push(e));
      } else {
        const codomainResult = this.codomain.decode(prop, context.child(name, this.codomain, prop));
        if (isLeft(codomainResult)) {
          codomainResult.left.forEach((e) => errors.push(e));
        } else {
          result[domainResult.right] = codomainResult.right;
        }
      }
    }
    if (isNonEmpty(errors)) {
      return context.failures(errors);
    } else {
      return context.success(result) as any;
    }
  }

  encode(value: { [K in TypeOf<D>]: TypeOf<C> }): { [K in OutputOf<D>]: OutputOf<C> } {
    const result: { [key: string]: any } = {};
    for (const [name, valueItem] of Object.entries(value)) {
      result[String(this.domain.encode(name))] = this.codomain.encode(valueItem);
    }
    return result as any;
  }

  is(input: unknown): input is { [K in TypeOf<D>]: TypeOf<C> } {
    if (!unknownRecord.is(input)) return false;
    const entries = Object.entries(input);
    if (entries.length == 0) return true;
    return entries.some(([key, value]) => this.domain.is(key) && this.codomain.is(value));
  }
}

export class EnumerableRecordCodec<D extends MIXED & EnumerableRecordDomain, C extends MIXED> extends Codec<
  { [K in TypeOf<D>]: TypeOf<C> },
  { [K in OutputOf<D>]: OutputOf<C> }
> {
  readonly keys: string[];

  constructor(
    readonly domain: D,
    readonly codomain: C,
    name: string = `{[${domain.name}]:${codomain.name}}`,
  ) {
    super(name);
    this.keys = domain.keys;
  }

  decode(input: unknown, context: Context): Validation<{ [K in TypeOf<D>]: TypeOf<C> }> {
    const recordE = unknownRecord.decode(input, context);
    if (isLeft(recordE)) return recordE;
    const inputRecord = recordE.right;
    const result: Record<string, any> = {};
    const errors: Errors = [];
    for (const k of this.keys) {
      const inputElement = inputRecord[k];
      const codomainResult = this.codomain.decode(inputElement, context.child(k, this.codomain, inputElement));
      if (isLeft(codomainResult)) {
        codomainResult.left.forEach((e) => errors.push(e));
      } else {
        result[k] = codomainResult.right;
      }
    }
    if (isNonEmpty(errors)) {
      return context.failures(errors);
    } else {
      return context.success(result);
    }
  }

  encode(value: { [K in TypeOf<D>]: TypeOf<C> }): { [K in OutputOf<D>]: OutputOf<C> } {
    const s: { [key: string]: any } = {};
    for (const k of this.keys) {
      s[k] = this.codomain.encode((value as any)[k]);
    }
    return s as any;
  }

  is(input: unknown): input is { [K in TypeOf<D>]: TypeOf<C> } {
    return unknownRecord.is(input) && this.keys.every((k) => this.codomain.is(input[k]));
  }
}

export interface EnumerableRecordDomain {
  keys: string[];
}

export function record<D extends MIXED<string>, C extends MIXED>(
  domain: D,
  codomain: C,
  name?: string,
): NonEnumerableRecordCodec<D, C>;
export function record<D extends MIXED<string>, C extends MIXED>(
  domain: D & EnumerableRecordDomain,
  codomain: C,
  name?: string,
): EnumerableRecordCodec<D & EnumerableRecordDomain, C>;
export function record<D extends MIXED<string>, C extends MIXED>(
  domain: D | (D & EnumerableRecordDomain),
  codomain: C,
  name?: string,
): EnumerableRecordCodec<D & EnumerableRecordDomain, C> | NonEnumerableRecordCodec<D, C> {
  if ("keys" in domain) {
    return new EnumerableRecordCodec(domain, codomain, name);
  } else {
    return new NonEnumerableRecordCodec(domain, codomain, name);
  }
}

export class RecursiveCodec<C extends ANY, A, O = A, I = unknown> extends Codec<A, O, I> {
  constructor(
    /** a unique name for this codec */
    readonly name: string,
    /** a custom type guard */
    readonly is: Is<A>,
    /** succeeds if a value of type I can be decoded to a value of type A */
    readonly decode: Decode<I, A>,
    /** converts a value of type A to a value of type O */
    readonly encode: Encode<A, O>,
    private readonly runDefinition: () => C,
  ) {
    super(name);
  }

  get codec(): C {
    return this.runDefinition();
  }
}

export function recursive<A, O = A, I = unknown, C extends Codec<A, O, I> = Codec<A, O, I>>(
  name: string,
  definition: (self: C) => C,
): RecursiveCodec<C, A, O, I> {
  let cache: C;
  let Self: any;
  const runDefinition = (): C => {
    if (!cache) {
      cache = definition(Self);
      (cache as any).name = name;
    }
    return cache;
  };
  Self = new RecursiveCodec<C, A, O, I>(
    name,
    (input): input is A => runDefinition().is(input),
    (input, context) => runDefinition().decode(input, context),
    (value) => runDefinition().encode(value),
    runDefinition,
  );
  return Self;
}

type OptionalFlag = { optional: true };
export function optional<C extends ANY>(codec: C, name?: string): OptionalCodec<C> {
  return new OptionalCodec(codec, name);
}

export class OptionalCodec<C extends ANY> extends Codec<
  TypeOf<C> | undefined,
  OutputOf<C> | undefined,
  InputOf<C> | undefined
> {
  readonly optional: true = true;
  readonly #codec: UnionCodec<[C, typeof undefinedCodec]>;

  constructor(
    codec: C,
    readonly name: string = `${codec.name}?`,
  ) {
    super(name);
    this.#codec = union([codec, undefinedCodec]);
  }

  decode(input: InputOf<C> | undefined, context: Context): Validation<TypeOf<C> | undefined> {
    return this.#codec.decode(input, context);
  }

  encode(value: TypeOf<C> | undefined): OutputOf<C> | undefined {
    return this.#codec.encode(value);
  }

  is(input: unknown): input is TypeOf<C> | undefined {
    return this.#codec.is(input);
  }
}

export function isOptionalCodec<C extends ANY>(codec: C | OptionalCodec<C>): codec is OptionalCodec<C> {
  return "optional" in codec && codec.optional;
}

type RequiredPropsKeys<P extends Props> = { [K in keyof P]: P[K] extends OptionalFlag ? never : K }[keyof P];
type RequiredProps<P extends Props> = { [K in RequiredPropsKeys<P>]: P[K] };
type OptionalProps<P extends Props> = { [K in Exclude<keyof P, RequiredPropsKeys<P>>]?: P[K] };

export class SparseCodec<P extends Props> extends Codec<
  MapOver<RequiredProps<P>, $TypeOf> & MapOver<OptionalProps<P>, $TypeOf>,
  MapOver<RequiredProps<P>, $OutputOf> & MapOver<OptionalProps<P>, $OutputOf>
> {
  readonly #codec: TypeCodec<P>;

  constructor(
    readonly props: P,
    name: string = getInterfaceTypeName(props),
  ) {
    super(name);
    this.#codec = new TypeCodec(props);
  }

  cleanup(output: any): any {
    Object.entries(this.props).forEach(([propName, propCodec]) => {
      if (isOptionalCodec(propCodec) && !output[propName]) {
        delete output[propName];
      }
    });
    return output;
  }

  decode(input: unknown, context: Context): Either<Errors, MapOver<P, $TypeOf>> {
    const outputE = this.#codec.decode(input, context);
    if (isLeft(outputE)) return outputE;
    return context.success(this.cleanup(outputE.right));
  }

  encode(value: MapOver<RequiredProps<P>, $TypeOf> & MapOver<OptionalProps<P>, $TypeOf>): MapOver<P, $OutputOf> {
    const output = this.#codec.encode(value as any);
    return this.cleanup(output);
  }

  is(input: unknown): input is MapOver<RequiredProps<P>, $TypeOf> & MapOver<OptionalProps<P>, $TypeOf> {
    const effectiveInput = { ...(input as any) };
    Object.entries(this.props).forEach(([propName, propCodec]) => {
      if (isOptionalCodec(propCodec) && !effectiveInput[propName]) {
        effectiveInput[propName] = undefined;
      }
    });
    return this.#codec.is(effectiveInput);
  }
}

export function sparseType<P extends Props>(props: P, name?: string) {
  const optionalProps: Props = {};
  const requiredProps: Props = {};
  for (const [key, value] of Object.entries(props)) {
    if (isOptionalCodec(value)) {
      optionalProps[key] = value;
    } else {
      requiredProps[key] = value;
    }
  }
  return new SparseCodec(props, name);
}

export const sparse = sparseType;

export { nullCodec as null, undefinedCodec as undefined, voidCodec as void };
