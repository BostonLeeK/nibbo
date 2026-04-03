export type SupportedCurrency = "UAH" | "USD" | "EUR";

export type ExchangeRates = Record<SupportedCurrency, number>;

const fallbackRates: ExchangeRates = {
  UAH: 1,
  USD: 40,
  EUR: 43,
};

type NbuRateItem = {
  cc?: string;
  rate?: number;
};

export async function getNbuExchangeRates(): Promise<ExchangeRates> {
  try {
    const response = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json", {
      next: { revalidate: 60 * 60 * 6 },
    });
    if (!response.ok) return fallbackRates;
    const data = (await response.json()) as NbuRateItem[];
    if (!Array.isArray(data)) return fallbackRates;

    const usdRate = data.find((item) => item.cc === "USD")?.rate;
    const eurRate = data.find((item) => item.cc === "EUR")?.rate;

    if (
      typeof usdRate !== "number" ||
      Number.isNaN(usdRate) ||
      usdRate <= 0 ||
      typeof eurRate !== "number" ||
      Number.isNaN(eurRate) ||
      eurRate <= 0
    ) {
      return fallbackRates;
    }

    return {
      UAH: 1,
      USD: usdRate,
      EUR: eurRate,
    };
  } catch {
    return fallbackRates;
  }
}

