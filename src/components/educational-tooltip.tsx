"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EducationalTooltipProps {
  term: string;
  children: React.ReactNode;
}

// Kid-friendly explanations for financial terms
const explanations: Record<string, { title: string; explanation: string; example?: string }> = {
  shares: {
    title: "What are Shares?",
    explanation: "A share is a tiny piece of a company. When you buy shares, you own a small part of that company!",
    example: "If Apple has 1000 shares and you buy 1, you own 1/1000th of Apple.",
  },
  "cost-basis": {
    title: "What is Cost Basis?",
    explanation: "This is how much money you spent to buy your shares. We use this to figure out if you made or lost money.",
    example: "If you bought shares for $50, your cost basis is $50.",
  },
  gains: {
    title: "What are Gains?",
    explanation: "Gains are the extra money you made! If your shares are worth more than what you paid, that's your gain.",
    example: "Bought for $50, now worth $60 = $10 gain!",
  },
  loss: {
    title: "What is a Loss?",
    explanation: "A loss means your shares are worth less than what you paid. Don't worry - prices go up and down!",
    example: "Bought for $50, now worth $45 = $5 loss.",
  },
  portfolio: {
    title: "What is a Portfolio?",
    explanation: "Your portfolio is like a basket that holds all the stocks you own. It shows everything in one place!",
  },
  "cash-out": {
    title: "What is Cash Out?",
    explanation: "Cashing out means turning your gains (extra money you made) into real money that your parent can give you!",
    example: "If you made $15 in gains, you can cash out $15.",
  },
  balance: {
    title: "What is Balance?",
    explanation: "Your balance is the money you have available to buy stocks. You get money by completing chores!",
  },
  "fractional-shares": {
    title: "What are Fractional Shares?",
    explanation: "You don't have to buy a whole share! You can buy a piece of a share, like buying half a pizza instead of the whole thing.",
    example: "If a share costs $100, you can buy 0.5 shares for $50.",
  },
  "market-cap": {
    title: "What is Market Cap?",
    explanation: "Market cap shows how much a whole company is worth. Bigger companies have bigger market caps!",
    example: "A company with 1 million shares at $10 each = $10 million market cap.",
  },
  ticker: {
    title: "What is a Ticker?",
    explanation: "A ticker is a short nickname for a company's stock, like a username! It's usually 1-5 letters.",
    example: "Apple = AAPL, Tesla = TSLA, Google = GOOGL",
  },
  investing: {
    title: "Why Invest? (And the Risks!)",
    explanation: "Investing can help your money grow over time - like planting a seed that becomes a tree! But it's also risky. Stock prices go up AND down, and you can lose money. Never invest money you can't afford to lose.",
    example: "A $10 investment might become $15... or $5. That's why we start small and learn!",
  },
  risk: {
    title: "Investment Risk",
    explanation: "Stocks can lose value! Companies can do poorly, and your shares become worth less. This is why smart investors spread their money across different stocks and only invest what they can afford to lose.",
    example: "If a company has problems, a $50 stock might drop to $30. You'd lose $20.",
  },
};

export function EducationalTooltip({ term, children }: EducationalTooltipProps) {
  const info = explanations[term];

  if (!info) {
    return <>{children}</>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center w-4 h-4 text-xs rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            aria-label={`Learn about ${info.title}`}
          >
            ?
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" side="top">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{info.title}</h4>
            <p className="text-sm text-muted-foreground">{info.explanation}</p>
            {info.example && (
              <div className="bg-muted p-2 rounded text-xs">
                <span className="font-medium">Example: </span>
                {info.example}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </span>
  );
}
