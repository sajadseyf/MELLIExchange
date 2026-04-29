export type CurrencyCode = string;

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  buy: number;
  sell: number;
  order: number;
  updatedAt: string;
}

export type GoldKarat = 18 | 22 | 24;

export interface GoldPrice {
  karat: GoldKarat;
  pricePerGram: number;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AdminUser;
}

export interface ApiError {
  error: string;
}
