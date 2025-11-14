// utils/currency.ts
const getCurrencySymbol = (code: string): string => {
  const symbols: Record<string, string> = {
    LAK: "₭",
    THB: "฿",
    CNY: "¥",
    USD: "$",
  };
  return symbols[code] || code;
};

export function formatCurrency(
  value: number,
  currencyCode?: string,
  rate: number = 1
) {
  const formatted = (value / rate).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${formatted}${
    currencyCode ? " " + getCurrencySymbol(currencyCode) : " ₭"
  }`;
}
