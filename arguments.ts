import { Command, Args, HelpDoc } from "@effect/cli";
import process from "node:process";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect } from "effect";
import { priceProgramWithErrorCatching } from "./main.ts";

const regex = /^\s*([\w-]+(\s*,\s*[\w-]+)*)?\s*$/;

const currencies = Args.text({ name: "currencies" })
  .pipe(
    Args.mapEffect((a) => {
      if (!regex.test(a)) {
        return Effect.fail(HelpDoc.h1("What the fuck"));
        // return Effect.fail(new Error("Wrong"));
        // return Effect.fail(ValidationError.invalidValue())
      }
      return Effect.succeed(a.split(","));
    })
  )
  .pipe(Args.withDefault(["BTC"]));
const command = Command.make("test", { currencies }, ({ currencies }) =>
  Effect.gen(function* () {
    const output = yield* priceProgramWithErrorCatching("USDT", [
      ...currencies,
    ]);
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
