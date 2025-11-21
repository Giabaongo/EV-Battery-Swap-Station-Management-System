// Utility helpers for battery value parsing/formatting
// parseBatteryNumber: accepts number|string (e.g. 100, "100", "99.1", "0.95", "95%")
// and returns an integer percentage (0-100) or null when not parseable.
export const parseBatteryNumber = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === "number")
    return Number.isFinite(v)
      ? v > 0 && v <= 1
        ? Math.round(v * 100)
        : Math.round(v)
      : null;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^0-9.-]/g, "").trim();
    if (!cleaned) return null;
    const n = parseFloat(cleaned);
    if (!Number.isFinite(n)) return null;
    return n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
  }
  return null;
};

// Small helper if later needed to coerce to 0-100 safe integer
export const clampPercentage = (n) => {
  if (n === null || n === undefined || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
};
