import { Effect } from "npm:effect";
import { getPrice } from "./providers/binance.ts";
import { formatObject } from "./utils/formatting.ts";

export const priceProgram = (quote: string, bases: string[]) =>
  getPrice(quote, bases)
    .pipe(Effect.map(formatObject))
    .pipe(
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
        if (!msg) {
          Effect.fail(e);
        }
        return Effect.succeed(msg);
      })
    );
