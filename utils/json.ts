import { Data, Effect } from "effect";
import { pipe } from "effect/Function";

export class HttpError extends Data.TaggedError("HttpError")<{
  cause: unknown;
}> {}
export class JSONError extends Data.TaggedError("JSONError") {}

export class NotEnoughInformation extends Data.TaggedError(
  "NotEnoughInformation"
)<{ currencies: string[] }> {}

// const handleHTTPError = (err: unknown): HttpError => {};

export const safeFetch = (url: string) =>
  pipe(
    Effect.tryPromise({
      try: () => fetch(url),
      catch: (err) => new HttpError({ cause: err }),
    }),
    Effect.flatMap((resp) =>
      Effect.tryPromise({
        try: () => resp.json().then((body: unknown) => ({ resp, body })),
        catch: () => new JSONError(),
      })
    )
  );
