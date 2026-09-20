// Direct browser fallback service for live market rates if needed

export const TROY_OZ_PER_KG = 32.15074656;
export const LBS_PER_KG = 2.20462262;

export const DEFAULT_MARKET_RATES = {
  exchangeRate: 14.30,
  silverRate: 92000.00,
  copperRate: 840.00,
  usdInrRate: 86.50,
  status: "FALLBACK",
  lastUpdated: new Date().toLocaleTimeString(),
};

/**
 * Direct client-side fetch for CNY/INR exchange rate as an extra fallback.
 */
export async function fetchLiveExchangeRateFallback() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/CNY");
    if (res.ok) {
      const data = await res.json();
      const inrRate = data?.rates?.INR;
      if (inrRate) {
        return Number(inrRate.toFixed(4));
      }
    }
  } catch (err) {
    console.warn("Client fallback exchange rate fetch failed:", err);
  }
  return DEFAULT_MARKET_RATES.exchangeRate;
}

