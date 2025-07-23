import { _private } from "./kraken.ts";
import { Effect, Schema } from "effect";

Deno.test("parsing Kraken API response", async () => {
  const response = {
    SOLUSD: {
      a: ["201.07000", "22", "22.000"],
      b: ["201.06000", "265", "265.000"],
      c: ["201.06000", "65.00000000"],
      v: ["361839.35478292", "392188.93802317"],
      p: ["199.85659", "199.55123"],
      t: [32502, 34799],
      l: ["194.02000", "193.82000"],
      h: ["205.00000", "205.00000"],
      o: "195.82000",
    },
    XXBTZUSD: {
      a: ["119869.00000", "1", "1.000"],
      b: ["119868.90000", "6", "6.000"],
      c: ["119868.90000", "0.00042500"],
      v: ["1175.37330310", "1234.55514219"],
      p: ["118549.40591", "118488.80056"],
      t: [33171, 37088],
      l: ["116260.00000", "116260.00000"],
      h: ["120200.00000", "120200.00000"],
      o: "117461.00000",
    },
  };
  // Simulate the Map structure expected by parseResponse
  const baseCurrencies = ["SOL", "BTC"];
  const result = await Effect.runPromise(
    _private.parseResponse(baseCurrencies, response)
  );
  if (result.SOL !== 201.06)
    throw new Error(`Expected SOL=201.06, got ${result.SOL}`);
  if (result.BTC !== 119868.9)
    throw new Error(`Expected XBT=119868.9, got ${result.BTC}`);
});

Deno.test("Schema correctly handling the correct kraken response", () => {
  const resp = {
    error: [],
    result: {
      XBTUSDT: {
        a: ["119833.70000", "1", "1.000"],
        b: ["119833.60000", "1", "1.000"],
        c: ["119888.50000", "0.00019275"],
        v: ["1.57395709", "69.04530356"],
        p: ["119841.16807", "118658.74359"],
        t: [81, 4069],
        l: ["119692.00000", "116240.40000"],
        h: ["119999.90000", "120261.30000"],
        o: "119955.80000",
      },
    },
  };
  const effect = Schema.decodeUnknown(_private.TicketResponse)(resp);
  Effect.runSync(effect);
});
