import { Request, Response, NextFunction } from "express";

/**
 * Маҳдудкунандаи содда дар хотира — барои route-ҳои кушодаи /auth.
 *
 * Ба ягон вобастагии нав ниёз надорад. Азбаски ҳисоб дар хотираи як раванд аст,
 * ҳангоми чанд instance ё restart ҳисоб аз нав сар мешавад — ин барои
 * суст кардани brute-force кофист, вале кафолати сахт нест.
 */

interface Bucket {
  count: number;
  reset_at: number;
}

const buckets = new Map<string, Bucket>();

// Тоза кардани bucket-ҳои кӯҳна, то хотира бемаҳдуд калон нашавад
const SWEEP_EVERY_MS = 5 * 60 * 1000;
let last_sweep = Date.now();

function sweep(now: number) {
  if (now - last_sweep < SWEEP_EVERY_MS) return;
  last_sweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.reset_at <= now) buckets.delete(key);
  }
}

interface RateLimitOptions {
  /** Чанд дархост дар як тиреза иҷозат аст */
  max: number;
  /** Дарозии тиреза бо миллисония */
  window_ms: number;
  /** Калиди иловагӣ аз дархост (масалан рақами телефон), ғайр аз IP */
  key_by?: (req: Request) => string | undefined;
  message?: string;
}

export function rateLimit({ max, window_ms, key_by, message }: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    sweep(now);

    // req.ip ба "trust proxy" такя мекунад (дар app.ts гузошта шудааст) —
    // вагарна дар Render ҳамаи корбарон як IP-и proxy-ро мегирифтанд.
    const extra = key_by?.(req) ?? "";
    const key = `${req.method} ${req.baseUrl}${req.path}|${req.ip ?? "unknown"}|${extra}`;

    const bucket = buckets.get(key);
    if (!bucket || bucket.reset_at <= now) {
      buckets.set(key, { count: 1, reset_at: now + window_ms });
      return next();
    }

    bucket.count++;
    if (bucket.count > max) {
      const retry_after = Math.ceil((bucket.reset_at - now) / 1000);
      res.setHeader("Retry-After", String(retry_after));
      return res.status(429).json({
        message: message ?? "Дархостҳо аз ҳад зиёданд. Каме сонитар кӯшиш кунед.",
        retry_after_seconds: retry_after,
      });
    }

    next();
  };
}

/** Пас аз воридшавии бомуваффақият ҳисобро тоза мекунад, то корбари ҳақиқӣ маҳдуд намонад. */
export function clearRateLimit(req: Request, key_by?: (req: Request) => string | undefined) {
  const extra = key_by?.(req) ?? "";
  buckets.delete(`${req.method} ${req.baseUrl}${req.path}|${req.ip ?? "unknown"}|${extra}`);
}
