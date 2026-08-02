export interface ExchangeRates {
  USD: number; // 1 USD = X EGP
  EUR: number; // 1 EUR = X EGP
  SAR: number; // 1 SAR = X EGP
  AED: number; // 1 AED = X EGP
  EGP: number; // 1 EGP = 1 EGP
}

export const DEFAULT_RATES: ExchangeRates = {
  USD: 48.50,
  EUR: 52.80,
  SAR: 12.90,
  AED: 13.20,
  EGP: 1.0
};

const STORAGE_KEY = 'egyptcranes_exchange_rates';
const LAST_UPDATE_KEY = 'egyptcranes_exchange_rates_last_update';

export function getSavedExchangeRates(): ExchangeRates {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error reading exchange rates from localStorage:', e);
  }
  return { ...DEFAULT_RATES };
}

export function saveExchangeRates(rates: ExchangeRates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
    localStorage.setItem(LAST_UPDATE_KEY, new Date().toISOString());
    // Dispatch a storage event so other components on the same page can update
    window.dispatchEvent(new Event('storage_exchange_rates_updated'));
  } catch (e) {
    console.error('Error saving exchange rates to localStorage:', e);
  }
}

export function getLastExchangeRateUpdate(): string | null {
  return localStorage.getItem(LAST_UPDATE_KEY);
}

export async function fetchLiveExchangeRates(): Promise<ExchangeRates> {
  try {
    // Fetch live rates from open.er-api.com (public, reliable, no key needed)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: status ${response.status}`);
    }
    const data = await response.json();
    const egpRate = data.rates.EGP;
    if (!egpRate) {
      throw new Error('EGP rate not found in API response');
    }

    const rates: ExchangeRates = {
      USD: parseFloat(egpRate.toFixed(4)),
      EUR: parseFloat((egpRate / (data.rates.EUR || 0.92)).toFixed(4)),
      SAR: parseFloat((egpRate / (data.rates.SAR || 3.75)).toFixed(4)),
      AED: parseFloat((egpRate / (data.rates.AED || 3.67)).toFixed(4)),
      EGP: 1.0
    };

    saveExchangeRates(rates);
    return rates;
  } catch (error) {
    console.error('Error fetching live exchange rates, falling back to default/saved:', error);
    throw error;
  }
}

export function convertAmount(amount: number, from: string, to: string, rates: ExchangeRates): number {
  if (from === to) return amount;
  
  // Convert from source currency to EGP (base)
  const rateFrom = rates[from as keyof ExchangeRates] || 1;
  const amountInEGP = amount * rateFrom;
  
  // Convert from EGP to target currency
  const rateTo = rates[to as keyof ExchangeRates] || 1;
  return amountInEGP / rateTo;
}
