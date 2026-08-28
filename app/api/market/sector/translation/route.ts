import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  listSectorTranslations,
  addSectorTranslation,
  updateSectorTranslation,
  removeSectorTranslation,
} from '@/services/market-data-api';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }
    const data = await listSectorTranslations(session.accessToken);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }
    const body = await request.json();
    const result = await addSectorTranslation(session.accessToken, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }
    const body = await request.json();
    await updateSectorTranslation(session.accessToken, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }
    const body = await request.json();
    await removeSectorTranslation(session.accessToken, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Something went wrong.' },
      { status: 500 },
    );
  }
}
