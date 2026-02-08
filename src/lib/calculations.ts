/**
 * Business logic calculations for stock trading
 */

/**
 * Calculate shares from purchase amount
 * Rounds down to 6 decimal places (fractional shares)
 */
export function calculateShares(amount: number, pricePerShare: number): number {
  if (pricePerShare <= 0) return 0;
  return Math.floor((amount / pricePerShare) * 1000000) / 1000000;
}

/**
 * Calculate proceeds from selling shares
 */
export function calculateProceeds(shares: number, pricePerShare: number): number {
  return shares * pricePerShare;
}

/**
 * Calculate proportional cost basis to remove when selling partial shares
 */
export function calculateCostBasisToRemove(
  totalCostBasis: number,
  totalShares: number,
  sharesToSell: number
): number {
  if (totalShares <= 0) return 0;
  const costBasisPerShare = totalCostBasis / totalShares;
  return costBasisPerShare * sharesToSell;
}

/**
 * Calculate unrealized gain/loss
 */
export function calculateUnrealizedGain(
  currentValue: number,
  costBasis: number
): number {
  return currentValue - costBasis;
}

/**
 * Calculate eligible cash-out amount
 * Only gains can be cashed out, rounded down to nearest $5
 */
export function calculateEligibleCashout(
  totalGains: number,
  previousCashouts: number
): number {
  const remainingGains = Math.max(0, totalGains - previousCashouts);
  return Math.floor(remainingGains / 5) * 5;
}

/**
 * Check if holding should be deleted (dust threshold)
 */
export function shouldDeleteHolding(remainingShares: number): boolean {
  return remainingShares <= 0.000001;
}

/**
 * Format currency for display (2 decimal places)
 */
export function formatCurrency(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Format shares for display (2 decimal places for UI)
 */
export function formatSharesDisplay(shares: number): string {
  return shares.toFixed(2);
}

/**
 * Format shares for internal storage (6 decimal places)
 */
export function formatSharesInternal(shares: number): string {
  return shares.toFixed(6);
}
