/**
 * Test script to verify Polygon.io API connectivity
 * Run with: npx tsx scripts/test-polygon.ts
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/test-polygon.ts
 */

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

if (!POLYGON_API_KEY) {
  console.error("Error: POLYGON_API_KEY environment variable is not set");
  console.error("Make sure to run with: POLYGON_API_KEY=your_key npx tsx scripts/test-polygon.ts");
  process.exit(1);
}

const BASE_URL = "https://api.polygon.io";

interface TickerResult {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
}

interface PreviousCloseResult {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: Array<{
    T: string;  // ticker
    c: number;  // close price
    h: number;  // high
    l: number;  // low
    o: number;  // open
    v: number;  // volume
    vw: number; // volume weighted average price
    t: number;  // timestamp
    n: number;  // number of transactions
  }>;
  status: string;
  request_id: string;
}

async function fetchTickerDetails(ticker: string): Promise<TickerResult | null> {
  const url = `${BASE_URL}/v3/reference/tickers/${ticker}?apiKey=${POLYGON_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results) {
      return data.results as TickerResult;
    }
    console.error(`Failed to fetch ticker details: ${data.status}`);
    return null;
  } catch (error) {
    console.error("Error fetching ticker details:", error);
    return null;
  }
}

async function fetchPreviousClose(ticker: string): Promise<PreviousCloseResult | null> {
  const url = `${BASE_URL}/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json() as PreviousCloseResult;

    if (data.status === "OK") {
      return data;
    }
    console.error(`Failed to fetch previous close: ${data.status}`);
    return null;
  } catch (error) {
    console.error("Error fetching previous close:", error);
    return null;
  }
}

async function main() {
  console.log("Testing Polygon.io API connection...\n");

  const testTickers = ["AAPL", "GOOGL", "MSFT"];

  const testTickers2 = [
    // Tech Giants
    "AAPL",   // Apple
    "GOOGL",  // Alphabet (Google)
    "MSFT",   // Microsoft
    "AMZN",   // Amazon
    "META",   // Meta (Facebook/Instagram)
    "NVDA",   // Nvidia
    "TSLA",   // Tesla
    "NFLX",   // Netflix
    "ADBE",   // Adobe
    "CRM",    // Salesforce

    // Entertainment & Media
    "DIS",    // Disney
    "CMCSA",  // Comcast (NBC/Universal)
    "WBD",    // Warner Bros Discovery
    "PARA",   // Paramount
    "SPOT",   // Spotify
    "RBLX",   // Roblox

    // Gaming
    "EA",     // Electronic Arts
    "TTWO",   // Take-Two (GTA, NBA 2K)
    "ATVI",   // Activision Blizzard
    "SONY",   // Sony (PlayStation)
    "NTDOY",  // Nintendo

    // Food & Beverage
    "KO",     // Coca-Cola
    "PEP",    // PepsiCo
    "MCD",    // McDonald's
    "SBUX",   // Starbucks
    "YUM",    // Yum! Brands (Taco Bell, KFC, Pizza Hut)
    "DPZ",    // Domino's Pizza
    "CMG",    // Chipotle
    "HSY",    // Hershey
    "MDLZ",   // Mondelez (Oreo, Chips Ahoy)

    // Retail & Consumer
    "NKE",    // Nike
    "TGT",    // Target
    "WMT",    // Walmart
    "COST",   // Costco
    "HD",     // Home Depot
    "LULU",   // Lululemon
    "GPS",    // Gap

    // Automotive
    "F",      // Ford
    "GM",     // General Motors
    "TM",     // Toyota
    "RIVN",   // Rivian

    // Airlines & Travel
    "DAL",    // Delta Airlines
    "UAL",    // United Airlines
    "LUV",    // Southwest Airlines
    "ABNB",   // Airbnb

    // Finance & Payments
    "V",      // Visa
    "MA",     // Mastercard
    "PYPL",   // PayPal
    "SQ",     // Block (Square/Cash App)
  ];

  for (const ticker of testTickers) {
    console.log(`--- ${ticker} ---`);

    // Fetch ticker details
    const details = await fetchTickerDetails(ticker);
    if (details) {
      console.log(`Name: ${details.name}`);
      console.log(`Exchange: ${details.primary_exchange}`);
    }

    // Fetch previous close price
    const prevClose = await fetchPreviousClose(ticker);
    if (prevClose && prevClose.results && prevClose.results.length > 0) {
      const result = prevClose.results[0];
      console.log(`Previous Close: $${result.c.toFixed(2)}`);
      console.log(`Open: $${result.o.toFixed(2)}`);
      console.log(`High: $${result.h.toFixed(2)}`);
      console.log(`Low: $${result.l.toFixed(2)}`);
      console.log(`Volume: ${result.v.toLocaleString()}`);
    } else {
      console.log("No price data available (market may be closed)");
    }

    console.log("");
  }

  console.log("Polygon.io API test complete!");
}

main().catch(console.error);
