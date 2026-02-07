/**
 * Backfill Stock Prices (Synthetic)
 *
 * Run with: npx tsx scripts/backfill-prices.ts
 *
 * Creates synthetic historical prices based on current price with realistic variation.
 * Finnhub free tier doesn't include historical candles.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting synthetic stock price backfill...\n");

  // Get all active stocks with their latest price
  const stocks = await prisma.stock.findMany({
    where: { isActive: true },
    include: {
      prices: {
        orderBy: { date: "desc" },
        take: 1,
      },
    },
  });

  console.log(`Found ${stocks.length} stocks to backfill\n`);

  // Generate dates for last 60 trading days
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let daysBack = 0;
  while (dates.length < 60) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysBack);
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push(new Date(date));
    }
    daysBack++;
  }

  // Reverse so oldest is first
  dates.reverse();

  console.log(`Generating prices for ${dates.length} trading days\n`);

  for (const stock of stocks) {
    const currentPrice = stock.prices.length > 0
      ? Number(stock.prices[0].price)
      : 100; // Default if no price

    console.log(`${stock.ticker}: Current price $${currentPrice.toFixed(2)}`);

    let created = 0;
    let skipped = 0;

    // Generate prices with random walk from past to present
    // Start lower and trend toward current price
    let price = currentPrice * (0.85 + Math.random() * 0.1); // Start 85-95% of current

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];

      // Check if exists
      const existing = await prisma.stockPrice.findUnique({
        where: {
          stockId_date: {
            stockId: stock.id,
            date: date,
          },
        },
      });

      if (existing) {
        skipped++;
        // Use existing price for next iteration
        price = Number(existing.price);
        continue;
      }

      // Daily change: random walk with slight upward bias toward current price
      const progress = i / dates.length;
      const targetPrice = currentPrice;
      const drift = (targetPrice - price) * 0.02; // Pull toward target
      const volatility = price * 0.02; // 2% daily volatility
      const change = drift + (Math.random() - 0.5) * volatility;

      price = Math.max(1, price + change); // Ensure positive

      await prisma.stockPrice.create({
        data: {
          stockId: stock.id,
          price: Math.round(price * 100) / 100,
          date: date,
        },
      });
      created++;
    }

    console.log(`  Created ${created}, skipped ${skipped} existing\n`);
  }

  console.log("Backfill complete!");
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
