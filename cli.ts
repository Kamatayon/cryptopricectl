import { Command, Args, HelpDoc } from "npm:@effect/cli";
import process from "node:process";
import { NodeContext, NodeRuntime } from "npm:@effect/platform-node";
import { Console, Effect } from "npm:effect";
import { priceProgram } from "./priceProgram.ts";

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
const command = Command.make("test", { currencies }, ({ currencies }) =>
  Effect.gen(function* () {
    const output = yield* priceProgram("USDT", [...currencies]);
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
