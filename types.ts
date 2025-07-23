export type PriceDictionary = Record<string, number>;

export const PROVIDERS = ["binance", "kraken"] as const;

export type Provider = (typeof PROVIDERS)[number];
