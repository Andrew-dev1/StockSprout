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
