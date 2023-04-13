import * as t from "../struct.js";
import { isLeft } from "../either.js";

export class HyphenatedStringCodec extends t.Codec<string> {
  constructor() {
    super("HyphenatedString");
  }

  decode(input: unknown, context: t.Context): t.Validation<string> {
    const decodedE = t.string.decode(input, context);
    if (isLeft(decodedE)) return decodedE;
    const decoded = decodedE.right;
    if (decoded.length === 2) {
      return context.success(decoded[0] + "-" + decoded[1]);
    } else {
      return context.failure();
    }
  }

  encode(value: string): string {
    return value[0] + value[2];
  }

  is(input: unknown): input is string {
    return t.string.is(input) && input.length === 3 && input[1] === "-";
  }
}

export const hyphenatedString = new HyphenatedStringCodec();
