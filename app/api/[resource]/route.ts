import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { resource: string } }
) {
  try {
    const { resource } = params;
    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    const resourceData = store.data[resource];

    if (!resourceData) {
      return NextResponse.json(
        { error: `Resource '${resource}' not found` },
        { status: 404 }
      );
    }

    if (!Array.isArray(resourceData)) {
      return NextResponse.json(
        { error: `Resource '${resource}' is not a collection` },
        { status: 400 }
      );
    }

    return NextResponse.json(resourceData);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}