import { Effect, Console } from "effect";
import { pipe } from "effect";
import { getPrice } from "./sources/binance.ts";
import { formatObject } from "./formatting.ts";

const priceProgramWithErrorCatching = (quote: string, bases: string[]) =>
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

function runPriceProgram(quote: string, bases: string[]) {
  const program = pipe(
    priceProgramWithErrorCatching(quote, bases),
    Effect.andThen(Console.log)
  );
  Effect.runPromise(program);
}

// Example usage
runPriceProgram("USDT", ["BTC", "LTC"]);
