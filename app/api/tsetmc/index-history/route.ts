import { NextResponse } from 'next/server';

const VALID_INS = new Set<string>([
  '32097828799138957', // TEDPIX — شاخص کل
  '67130298613737946', // Equal-weight — شاخص هم‌وزن
  '43685683301327984', // Farabourse total — شاخص کل فرابورس
  '10523825191976469', // Top-30 — شاخص ۳۰ شرکت برتر
  '43754960038275285', // Industry — شاخص صنعت
  '32453344048876642', // Main Market — شاخص بازار اول
  '49579049405614711', // Free-float — شاخص آزاد شناور
]);

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'https://www.tsetmc.com/',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9,fa;q=0.8',
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ins = url.searchParams.get('ins') ?? '32097828799138957';
  if (!VALID_INS.has(ins)) {
    return NextResponse.json({ error: 'invalid ins' }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://cdn.tsetmc.com/api/Index/GetIndexB2History/${ins}`,
      { headers: BROWSER_HEADERS, next: { revalidate: 3600 } },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `tsetmc ${res.status}` },
        { status: 502 },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'failed' },
      { status: 502 },
    );
  }
}
