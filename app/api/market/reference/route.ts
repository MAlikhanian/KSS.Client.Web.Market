import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  listMarketTypeTranslations,
  listAssetTypeTranslations,
  listSectorTranslations,
  listAssetTranslations,
} from '@/services/market-data-api';

// GET: Fetch all MarketData reference translations in one call
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const token = session.accessToken;

    const results = await Promise.allSettled([
      listMarketTypeTranslations(token),
      listAssetTypeTranslations(token),
      listSectorTranslations(token),
      listAssetTranslations(token),
    ]);

    const getValue = (r: PromiseSettledResult<unknown>) =>
      r.status === 'fulfilled' ? r.value : [];

    return NextResponse.json({
      marketTypeTranslations: getValue(results[0]),
      assetTypeTranslations: getValue(results[1]),
      sectorTranslations: getValue(results[2]),
      assetTranslations: getValue(results[3]),
    });
  } catch (error) {
    console.error('Error fetching market reference data:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}
