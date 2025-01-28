import { Console, Data, Effect, Either, Schema } from "effect";
import { NotEnoughInformation, safeFetch } from "../json.ts";
import { left } from "effect/Either";
import { length } from "effect/MutableQueue";
import { right } from "effect/Either";
import { string } from "effect/FastCheck";

const BINANCE_API_URL = "https://api.binance.com/api/v3/ticker/price";

const TicketResponse = Schema.Array(
  Schema.Struct({
    symbol: Schema.String,
    price: Schema.String,
  })
);

const BinanceErrorResponse = Schema.Struct({
  code: Schema.Number,
  msg: Schema.String,
});

class BinanceApiError extends Data.TaggedError("BinanceApiError")<{
  message: string;
  code: number;
}> {}

const formatUrl = (quoteCurrency: string, baseCurrencies: string[]) => {
  const pairs = baseCurrencies.map((b) => `"${b}${quoteCurrency}"`);
  return `${BINANCE_API_URL}?symbols=[${pairs.join(",")}]`;
};

const parseResponse = (
  baseCurrencies: string[],
  body: typeof TicketResponse.Type
) => {
  let prices: Record<string, number> = {};
  let missingCurrencies: string[] = [];
  loop1: for (const ticket of body) {
    for (const base of baseCurrencies) {
      if (ticket.symbol.startsWith(base)) {
        prices[base] = Number(ticket.price);
        continue loop1;
      }
      missingCurrencies = missingCurrencies.concat(base);
    }
  }
  if (Object.keys(prices).length < baseCurrencies.length) {
    return new NotEnoughInformation({ currencies: missingCurrencies });
  }
  return prices;
};

export const getPrice = (quoteCurrency: string, baseCurrencies: string[]) =>
  Effect.gen(function* () {
    const url = formatUrl(quoteCurrency, baseCurrencies);
    const { resp, body } = yield* safeFetch(url);
    if (!resp.ok) {
      const errorBody = yield* Schema.decodeUnknown(BinanceErrorResponse)(body);
      return yield* new BinanceApiError({
        code: errorBody.code,
        message: errorBody.msg,
      });
    }
    yield* Console.log(body);
    const jsonBody = yield* Schema.decodeUnknown(TicketResponse)(body);
    const parsedResponse = parseResponse(baseCurrencies, jsonBody);
    if (parsedResponse instanceof Error) {
      return yield* parsedResponse;
    }
    return parsedResponse;
  });
