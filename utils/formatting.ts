import type { PriceDictionary } from "../types.ts";

export const formatPairs = (pairs: [string, number][]) =>
  pairs.map(([symbol, price]) => `${symbol}:${price}`).join(" ");

export const formatObject = (obj: PriceDictionary) =>
  Object.entries(obj)
    .map(([key, val]) => `${key}: ${val}$`)
    .join(" ");
