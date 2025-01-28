import { Effect, Console } from "effect";
import { pipe } from "effect";

import { getPrice } from "./sources/binance.ts";
import { formatObject } from "./formatting.ts";

const getBinancePrice = getPrice("USDT", ["BTC", "LTC"]).pipe((a) => a);
const program = pipe(
  getBinancePrice,
  Effect.map((a) => formatObject(a)),
  Effect.andThen((a) => Console.log(a))
);
Effect.runPromise(program);
