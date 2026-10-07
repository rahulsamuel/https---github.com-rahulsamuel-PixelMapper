'use client';

import type { LedProduct, Processor } from '@/services/supabase';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const CACHE_TTL = 5 * 60 * 1000;
const productCache = new Map<string, CacheEntry<LedProduct[]>>();
const processorCache = new Map<string, CacheEntry<Processor[]>>();

export function getCachedProducts(key = 'default'): LedProduct[] | null {
  const entry = productCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    productCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedProducts(key: string, data: LedProduct[]): void {
  productCache.set(key, { data, timestamp: Date.now() });
}

export function getCachedProcessors(key = 'default'): Processor[] | null {
  const entry = processorCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    processorCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedProcessors(key: string, data: Processor[]): void {
  processorCache.set(key, { data, timestamp: Date.now() });
}
