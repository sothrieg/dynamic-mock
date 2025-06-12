import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { resource: string; id: string } }
) {
  try {
    const { resource, id } = params;
    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    const item = dataStore.getResourceItem(resource, id);

    if (!item) {
      return NextResponse.json(
        { error: `Item with id '${id}' not found in resource '${resource}'` },
        { status: 404 }
      );
    }

    return NextResponse.json(item);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}