const KEY = "hevonen_sheep_count";

export const SheepCountStorage = {
  loadSheepCount(defaultCount: number): number {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw == null) return defaultCount;
      const n = parseInt(raw, 10);
      return Number.isFinite(n) ? n : defaultCount;
    } catch {
      return defaultCount;
    }
  },
  saveSheepCount(count: number): void {
    try {
      localStorage.setItem(KEY, String(count));
    } catch {
      // ignore quota / privacy mode
    }
  },
  clear(): void {
    try { localStorage.removeItem(KEY); } catch {}
  },
};
