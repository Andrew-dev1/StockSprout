import { getChildSession } from "@/lib/child-auth";
import { prisma } from "@/lib/db";
import { StockDetail } from "./stock-detail";

interface ChildData {
  balance: number;
  holding: {
    shares: number;
    costBasis: number;
  } | null;
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const upperTicker = ticker.toUpperCase();

  // Check if a child is logged in
  const child = await getChildSession();
  let childData: ChildData | null = null;

  if (child) {
    // Get the stock to find its ID
    const stock = await prisma.stock.findUnique({
      where: { ticker: upperTicker },
    });

    // Get the child's holding for this stock if the stock exists
    let holding = null;
    if (stock) {
      const holdingRecord = await prisma.holding.findUnique({
        where: {
          userId_stockId: {
            userId: child.id,
            stockId: stock.id,
          },
        },
      });

      if (holdingRecord) {
        holding = {
          shares: Number(holdingRecord.shares),
          costBasis: Number(holdingRecord.costBasis),
        };
      }
    }

    childData = {
      balance: Number(child.balance),
      holding,
    };
  }

  return <StockDetail ticker={upperTicker} childData={childData} />;
}
