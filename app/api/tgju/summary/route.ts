import { NextResponse } from 'next/server';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.tgju.org/',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
};

interface SymbolSummary {
  /** Close price as the raw tgju string (commas included), e.g. "1,799,200". */
  p: string;
  /** Signed change percentage (negative when price dropped). */
  dp: number | null;
  /** Jalali date string from tgju, e.g. "1405/02/28". */
  t: string | null;
}

/**
 * tgju serves the day-row table with HTML in two columns. Class `low` = price
 * down (negative %), `high` = price up (positive %). Extract sign + magnitude.
 */
function parseChangePct(html: string | undefined): number | null {
  if (!html) return null;
  const match = html.match(/class="(low|high)"[^>]*>([\d.,]+)\s*%/);
  if (!match) return null;
  const sign = match[1] === 'low' ? -1 : 1;
  const num = Number(match[2].replace(/,/g, ''));
  return Number.isFinite(num) ? sign * num : null;
}

async function fetchSummary(slug: string): Promise<SymbolSummary | null> {
  try {
    const res = await fetch(
      `https://api.tgju.org/v1/market/indicator/summary-table-data/${slug}`,
      { headers: BROWSER_HEADERS, cache: 'no-store' },
    );
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('json')) return null;
    const json = await res.json();
    const data = json?.data;
    if (!Array.isArray(data) || data.length === 0) return null;
    const latest = data[0];
    if (!Array.isArray(latest) || latest.length < 7) return null;
    // Row columns: [open, low, high, close, change_val_html, change_pct_html, date_greg, date_jalali]
    return {
      p: String(latest[3] ?? ''),
      dp: parseChangePct(String(latest[5] ?? '')),
      // latest[6] is Gregorian, latest[7] is Jalali — frontend wants Jalali
      // for consistency with tsetmc rows' Jalali display.
      t: String(latest[7] ?? latest[6] ?? '') || null,
    };
  } catch {
    return null;
  }
}

/**
 * GET /api/tgju/summary
 *
 * Returns the dashboard market table's 6 rows:
 *   { current: { price_dollar_rl, price_eur, crypto-bitcoin, geram18, sekee, oil_brent } }
 *
 * Upstream is `api.tgju.org/v1/market/indicator/summary-table-data/{slug}`
 * (per-symbol daily history). Dates are returned in Jalali so the dashboard
 * market table can render them consistently.
 *
 * Note: tgju has no working `sekee_emami` slug — `sekee` (Bahar Azadi coin) is
 * the closest match and is what the dashboard displays as سکه امامی.
 *
 * BTC + oil prices are in USD (no ÷10 → تومان conversion in frontend).
 */
export async function GET() {
  try {
    const [usd, eur, btc, gold, coin, oil] = await Promise.all([
      fetchSummary('price_dollar_rl'),
      fetchSummary('price_eur'),
      fetchSummary('crypto-bitcoin'),
      fetchSummary('geram18'),
      fetchSummary('sekee'),
      fetchSummary('oil_brent'),
    ]);
    const current: Record<string, SymbolSummary> = {};
    if (usd) current.price_dollar_rl = usd;
    if (eur) current.price_eur = eur;
    if (btc) current['crypto-bitcoin'] = btc;
    if (gold) current.geram18 = gold;
    if (coin) current.sekee = coin;
    if (oil) current.oil_brent = oil;
    return NextResponse.json({ current });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'failed' },
      { status: 502 },
    );
  }
}
