import { Command, Args, HelpDoc, Options } from "@effect/cli";
import process from "node:process";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect } from "effect";
import { priceProgram } from "./priceProgram.ts";
import { PROVIDERS } from "./types.ts";

const regex = /^\s*([\w-]+(\s*,\s*[\w-]+)*)?\s*$/;

const currencies = Args.text({ name: "currencies" })
  .pipe(
    Args.mapEffect((a) => {
      if (!regex.test(a)) {
        return Effect.fail(
          HelpDoc.h1(
            "Wrong argument. Please provide the symbols separated by commas."
          )
        );
      }
      return Effect.succeed(a.split(","));
    })
  )
  .pipe(Args.withDefault(["BTC"]));

const provider = Options.choice("provider", PROVIDERS).pipe(
  Options.withAlias("p"),
  Options.withDefault("binance")
);

const command = Command.make(
  "test",
  { currencies, provider },
  ({ currencies, provider }) =>
    Effect.gen(function* () {
      yield* Console.log("Provider", provider, "Currencies", currencies);
      const output = yield* priceProgram("USDT", [...currencies], provider);
      return yield* Console.log(output);
    })
);

const program = Command.run(command, {
  name: "crypto-price",
  version: "0.0.1",
});

program(process.argv).pipe(
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
);
