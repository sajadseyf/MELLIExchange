export type CurrencyCode = string;

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  flag: string;
  buy: number;
  sell: number;
  order: number;
  contactUs: boolean;
  hidden: boolean;
  updatedAt: string;
}

export type GoldKarat = 14 | 18 | 22 | 24;

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

export interface PostTranslation {
  title?: string;
  excerpt?: string;
  content?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage: string;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  translations?: { fa?: PostTranslation; zh?: PostTranslation };
  translating?: boolean;
}

export interface FaqItem {
  id: string;
  question: { fa: string; en: string; zh?: string };
  answer: { fa: string; en: string; zh?: string };
  order: number;
  active: boolean;
  updatedAt: string;
}

export type ProductCategory = 'ring' | 'necklace' | 'bracelet' | 'earring' | 'pendant' | 'other';
export type ProductKarat = 14 | 18 | 21 | 22 | 24;

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  karat: ProductKarat;
  weightGrams: number;
  price: number;
  images: string[];
  inStock: boolean;
  order: number;
  updatedAt: string;
}
