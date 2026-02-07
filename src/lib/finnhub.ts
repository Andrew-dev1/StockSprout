/**
 * Finnhub API client for fetching stock prices
 * Free tier: 60 requests/minute
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = "https://finnhub.io/api/v1";

export interface StockQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

export function getFinnhubApiKey(): string {
  if (!FINNHUB_API_KEY) {
    throw new Error("FINNHUB_API_KEY environment variable is not set");
  }
  return FINNHUB_API_KEY;
}

/**
 * Fetch stock quote (current and previous close prices)
 */
export async function fetchStockQuote(ticker: string): Promise<StockQuote | null> {
  const apiKey = getFinnhubApiKey();
  const url = `${BASE_URL}/quote?symbol=${ticker}&token=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as StockQuote;

    // Finnhub returns { c: 0, d: null, ... } for invalid tickers
    if (data.c === 0 && data.pc === 0) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching stock quote:", error);
    return null;
  }
}

/**
 * Fetch company profile (name, logo, etc.)
 */
export async function fetchCompanyProfile(ticker: string): Promise<CompanyProfile | null> {
  const apiKey = getFinnhubApiKey();
  const url = `${BASE_URL}/stock/profile2?symbol=${ticker}&token=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as CompanyProfile;

    // Empty response means ticker not found
    if (!data.name) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return null;
  }
}

/**
 * Get today's date in YYYY-MM-DD format (for price records)
 * Uses the quote timestamp if available, otherwise current date
 */
export function getTradeDate(timestamp?: number): Date {
  if (timestamp && timestamp > 0) {
    // Finnhub timestamp is in seconds
    const date = new Date(timestamp * 1000);
    // Return date only (no time component)
    return new Date(date.toISOString().split('T')[0] + 'T00:00:00Z');
  }

  // Fallback to today
  const today = new Date();
  return new Date(today.toISOString().split('T')[0] + 'T00:00:00Z');
}

export interface SymbolSearchResult {
  count: number;
  result: Array<{
    description: string;  // Company name
    displaySymbol: string;
    symbol: string;
    type: string;
  }>;
}

export interface StockCandles {
  c: number[];  // Close prices
  h: number[];  // High prices
  l: number[];  // Low prices
  o: number[];  // Open prices
  s: string;    // Status: "ok" or "no_data"
  t: number[];  // Timestamps (Unix seconds)
  v: number[];  // Volume
}

export interface MarketStatus {
  exchange: string;
  holiday: string | null;
  isOpen: boolean;
  session: string;
  timezone: string;
  t: number;
}

/**
 * Search for stock symbols by query (company name or ticker)
 */
export async function searchSymbols(query: string): Promise<SymbolSearchResult | null> {
  const apiKey = getFinnhubApiKey();
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as SymbolSearchResult;
    return data;
  } catch (error) {
    console.error("Error searching symbols:", error);
    return null;
  }
}

/**
 * Fetch historical candle data for a stock
 * @param ticker Stock symbol
 * @param days Number of days of history (default 30)
 */
export async function fetchStockCandles(
  ticker: string,
  days: number = 30
): Promise<StockCandles | null> {
  const apiKey = getFinnhubApiKey();

  // Calculate date range
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 24 * 60 * 60;

  const url = `${BASE_URL}/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${now}&token=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as StockCandles;

    if (data.s !== "ok") {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching stock candles:", error);
    return null;
  }
}

/**
 * Get US market status (open/closed)
 */
export async function fetchMarketStatus(): Promise<MarketStatus | null> {
  const apiKey = getFinnhubApiKey();
  const url = `${BASE_URL}/stock/market-status?exchange=US&token=${apiKey}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status}`);
      return null;
    }

    const data = await response.json() as MarketStatus;
    return data;
  } catch (error) {
    console.error("Error fetching market status:", error);
    return null;
  }
}
