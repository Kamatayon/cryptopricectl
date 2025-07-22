import { Data, Effect, Schema, Either } from "effect";
import { safeFetch } from "../utils/json.ts";
import type { PriceDictionary } from "../types.ts";
import { NotEnoughInformation } from "../utils/json.ts";

const krakenAssetMap = {
  XETC: "ETC",
  XETH: "ETH",
  XLTC: "LTC",
  XMLN: "MLN",
  XREP: "REP",
  XXDG: "XDG",
  XXLM: "XLM",
  XXMR: "XMR",
  XXRP: "XRP",
  XZEC: "ZEC",
  ZAUD: "AUD",
  ZCAD: "CAD",
  ZEUR: "EUR",
  ZGBP: "GBP",
  ZJPY: "JPY",
  ZUSD: "USD",
  XBT: "BTC",
  XDG: "DOGE",
};

const TicketSuccess = Schema.Map({
  key: Schema.String,
  value: Schema.Struct({
    a: Schema.Array(Schema.String),
    b: Schema.Array(Schema.String),
    c: Schema.Array(Schema.String),
    v: Schema.Array(Schema.String),
    p: Schema.Array(Schema.String),
    t: Schema.Array(Schema.Number),
    l: Schema.Array(Schema.String),
    h: Schema.Array(Schema.String),
    o: Schema.String,
  }),
});

const TicketResponse = Schema.Struct({
  error: Schema.Array(Schema.String),
  result: Schema.Option(TicketSuccess),
}).pipe(
  Schema.filter(
    (a) =>
      a.error.length > 0 ||
      a.result._tag !== "None" ||
      "Missing both result and error."
  )
);

const matchPair = (pair: string) => {
  const mappedSymbol = Object.entries(krakenAssetMap).find(
    ([kraken, _iso]) => pair.startsWith(kraken) || pair.startsWith(`X${kraken}`)
  );
  console.log("pair", pair, "mappedSymbol", mappedSymbol);
  if (mappedSymbol) {
    return mappedSymbol[1];
  }
  return pair.substring(0, 3);
};

const parseResponse = (
  baseCurrencies: string[],
  body: typeof TicketSuccess.Type
) => {
  const result: PriceDictionary = {};
  for (const [pair, obj] of body.entries()) {
    const baseCurrency = matchPair(pair);
    if (baseCurrencies.includes(baseCurrency)) {
      result[baseCurrency] = Number(obj.c[0]);
    }
  }
  if (Object.keys(result).length < baseCurrencies.length) {
    const missingCurrencies = baseCurrencies.reduce((acc, base) => {
      if (!result[base]) {
        return [...acc, base];
      }
      return acc;
    }, [] as string[]);
    return Either.left(
      new NotEnoughInformation({ currencies: missingCurrencies })
    );
  }
  return Either.right(result);
};

const formatKrakenUrl = (quoteCurrency: string, baseCurrencies: string[]) => {
  const pairs = baseCurrencies.map((base) => `${base}${quoteCurrency}`);
  // Join pairs with comma as required by Kraken API
  return `https://api.kraken.com/0/public/Ticker?pair=${pairs.join(",")}`;
};

class KrakenApiError extends Data.TaggedError("KrakenApiError")<{
  errors: readonly string[];
}> {}

export const getPrice = (quoteCurrency: string, baseCurrencies: string[]) =>
  Effect.gen(function* () {
    const url = formatKrakenUrl(quoteCurrency, baseCurrencies);
    const resp = yield* safeFetch(url);
    const jsonBody = yield* Schema.decodeUnknown(TicketResponse)(resp.body);
    if (jsonBody.error.length) {
      return yield* new KrakenApiError({ errors: jsonBody.error });
    }
    if (jsonBody.result._tag == "None") {
      return yield* Effect.die(
        "Impossible condition. The error is empty AND we don't the result"
      );
    }
    const parsedResponse = parseResponse(baseCurrencies, jsonBody.result.value);
    if (Either.isLeft(parsedResponse)) {
      return yield* parsedResponse.left;
    }
    return parsedResponse.right;
  });

export const _private = {
  parseResponse,
};
