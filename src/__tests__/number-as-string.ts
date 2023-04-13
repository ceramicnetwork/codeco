import * as t from "../struct.js";
import { isLeft, type Either } from "../either.js";
import { Codec, type Errors } from "../struct.js";

class NumberAsString extends t.Codec<number, string> {
  constructor() {
    super("NumberFromString");
  }

  is = t.number.is.bind(t.number);
  encode = String;

  decode(input: unknown, context: t.Context): Either<Errors, number> {
    const stringE = t.string.decode(input, context);
    if (isLeft(stringE)) return stringE;
    const result = +stringE.right;
    if (stringE.right && Number.isFinite(result)) {
      return context.success(result);
    } else {
      return context.failure();
    }
  }
}

export const numberAsString: Codec<number, string> = new NumberAsString();
