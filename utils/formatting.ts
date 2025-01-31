export const formatPairs = (pairs: [string, number][]) =>
  pairs.map(([symbol, price]) => `${symbol}:${price}`).join(" ");

export const formatObject = (obj: Record<string, number>) =>
  Object.entries(obj)
    .map(([key, val]) => `${key}: ${val}$`)
    .join(" ");
