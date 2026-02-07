/**
 * Backfill Portfolio Snapshots
 *
 * Run with: npx tsx scripts/backfill-snapshots.ts
 *
 * This script creates synthetic historical portfolio snapshots
 * based on the current portfolio, with some variation to simulate growth.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting portfolio snapshot backfill...\n");

  // Get all children with their current holdings
  const children = await prisma.user.findMany({
    where: { role: "CHILD" },
    select: {
      id: true,
      firstName: true,
      balance: true,
      holdings: {
        include: {
          stock: {
            include: {
              prices: {
                orderBy: { date: "desc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  console.log(`Found ${children.length} children\n`);

  // Generate dates for last 30 days
  const dates: Date[] = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    // Skip weekends
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      dates.push(date);
    }
  }

  console.log(`Generating snapshots for ${dates.length} trading days\n`);

  for (const child of children) {
    console.log(`Processing ${child.firstName}...`);

    // Calculate current portfolio value
    let currentPortfolioValue = 0;
    for (const holding of child.holdings) {
      const shares = Number(holding.shares);
      const price =
        holding.stock.prices.length > 0
          ? Number(holding.stock.prices[0].price)
          : 0;
      currentPortfolioValue += shares * price;
    }

    const currentCashBalance = Number(child.balance);
    const currentTotalValue = currentPortfolioValue + currentCashBalance;

    console.log(`  Current total value: $${currentTotalValue.toFixed(2)}`);

    // Create snapshots with simulated historical values
    // Start lower and grow toward current value
    let snapshotsCreated = 0;
    let snapshotsSkipped = 0;

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];

      // Check if snapshot already exists
      const existing = await prisma.portfolioSnapshot.findUnique({
        where: {
          userId_date: {
            userId: child.id,
            date: date,
          },
        },
      });

      if (existing) {
        snapshotsSkipped++;
        continue;
      }

      // Simulate growth: start at ~80% of current value and grow
      // Add some random variation (+/- 5%)
      const progress = i / dates.length; // 0 to 1
      const baseMultiplier = 0.8 + progress * 0.2; // 0.8 to 1.0
      const randomVariation = 1 + (Math.random() - 0.5) * 0.1; // 0.95 to 1.05
      const multiplier = baseMultiplier * randomVariation;

      const portfolioValue = currentPortfolioValue * multiplier;
      // Cash balance stays relatively stable with small variations
      const cashVariation = 1 + (Math.random() - 0.5) * 0.1;
      const cashBalance = currentCashBalance * cashVariation;
      const totalValue = portfolioValue + cashBalance;

      await prisma.portfolioSnapshot.create({
        data: {
          userId: child.id,
          date: date,
          portfolioValue: Math.max(0, portfolioValue),
          cashBalance: Math.max(0, cashBalance),
          totalValue: Math.max(0, totalValue),
        },
      });

      snapshotsCreated++;
    }

    console.log(
      `  Created ${snapshotsCreated} snapshots, skipped ${snapshotsSkipped} existing\n`
    );
  }

  console.log("Backfill complete!");
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect();
    pool.end();
  });
