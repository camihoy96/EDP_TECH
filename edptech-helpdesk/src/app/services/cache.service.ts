import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
    
    // Auto-cleanup
    setTimeout(() => {
      if (this.cache.has(key) && this.cache.get(key)!.expiry <= Date.now()) {
        this.cache.delete(key);
      }
    }, ttl);
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  remove(key: string): void {
    this.cache.delete(key);
  }
}