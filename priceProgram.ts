import { Effect } from "effect";
import { getPrice } from "./providers/binance.ts";
import { getPrice as krakenGetPrice } from "./providers/kraken.ts";
import { formatObject } from "./utils/formatting.ts";
import type { Provider } from "./types.ts";

const providerPriceGetters = {
  binance: getPrice,
  kraken: krakenGetPrice,
};

export const priceProgram = (
  quote: string,
  bases: string[],
  provider: Provider
) => {
  const getPriceFn = providerPriceGetters[provider];
  const priceEffect = getPriceFn(quote, bases);
  // using pipe TS is not smart enough to infer types and it ends up throwing errors endlessly
  const formattedPriceEffect = Effect.gen(function* () {
    const rawPriceResult = yield* priceEffect;
    return formatObject(rawPriceResult);
  }).pipe(
    Effect.catchAll((e) => {
      let msg = "";
      if (e._tag === "BinanceApiError") {
        msg = `Binance Api Error: ${e.message}`;
      }
      if (e._tag === "HttpError") {
        msg = "Error making request";
      }
      if (e._tag === "JSONError") {
        msg = "Malformed input";
      }
      if (e._tag === "NotEnoughInformation") {
        msg = "Incorrect symbols provided";
      }
      if (e._tag === "ParseError") {
        msg = "Unknown response structure";
      }
      if (e._tag === "KrakenApiError") {
        msg = `Kraken Api Error: ${e.errors.join(";")}`;
      }
      if (!msg) {
        Effect.fail(e);
      }
      return Effect.succeed(msg);
    })
  );
  return formattedPriceEffect;
};
