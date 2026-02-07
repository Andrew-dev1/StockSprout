import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockSearch } from "@/components/stock-search";
import Link from "next/link";

export default async function StocksPage() {
  // Get tracked stocks with their latest prices
  const stocks = await prisma.stock.findMany({
    where: { isActive: true },
    include: {
      prices: {
        orderBy: { date: "desc" },
        take: 1,
      },
    },
    orderBy: { ticker: "asc" },
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Stocks</h1>
        <p className="text-muted-foreground mb-4">
          Search for stocks by ticker symbol or company name
        </p>
        <StockSearch />
      </div>

      {stocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tracked Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {stocks.map((stock) => (
                <Link
                  key={stock.id}
                  href={`/stocks/${stock.ticker}`}
                  className="block"
                >
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        {stock.logoUrl ? (
                          <img
                            src={stock.logoUrl}
                            alt={stock.name}
                            className="w-10 h-10 rounded object-contain bg-white"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500">
                            {stock.ticker.slice(0, 2)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">{stock.ticker}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {stock.name}
                          </p>
                        </div>
                        {stock.prices[0] && (
                          <p className="font-medium">
                            ${Number(stock.prices[0].price).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stocks.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No stocks are being tracked yet. Use the search above to explore stocks,
              or visit the admin page to seed initial stocks.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
