import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { withAnalytics } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

async function handleGET(request: NextRequest) {
  try {
    const config = dataStore.getEndpointConfig();
    
    if (!config) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching endpoint config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch endpoint configuration' },
      { status: 500 }
    );
  }
}

export const GET = withAnalytics(handleGET);