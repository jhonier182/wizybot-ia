export interface SearchProductsArgs {
  query: string;
}

export interface ConvertCurrenciesArgs {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
}

export type SearchProductsResultItem = {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  discount: number;
  price: string;
  variants: string;
  createDate: string;
};

export type ConvertCurrenciesResult = {
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  convertedAmount: number;
};

export type ToolResult = SearchProductsResultItem[] | ConvertCurrenciesResult;

