import { NextRequest, NextResponse } from 'next/server';
import { analytics } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'metrics';
    const limit = parseInt(searchParams.get('limit') || '100');

    switch (type) {
      case 'metrics':
        const metrics = analytics.getMetrics();
        return NextResponse.json(metrics);
        
      case 'realtime':
        const realtimeStats = analytics.getRealtimeStats();
        return NextResponse.json(realtimeStats);
        
      case 'requests':
        const recentRequests = analytics.getRecentRequests(limit);
        return NextResponse.json(recentRequests);
        
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: metrics, realtime, or requests' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    analytics.clearOldData(days);
    
    return NextResponse.json({ 
      message: `Cleared data older than ${days} days` 
    });
  } catch (error) {
    console.error('Analytics cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to clear analytics data' },
      { status: 500 }
    );
  }
}