import { NextRequest } from 'next/server';
import { analytics } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      const initialStats = analytics.getRealtimeStats();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialStats)}\n\n`)
      );

      // Subscribe to realtime updates
      const unsubscribe = analytics.subscribeToRealtimeStats((stats) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(stats)}\n\n`)
          );
        } catch (error) {
          console.error('Error sending SSE data:', error);
        }
      });

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup heartbeat on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}