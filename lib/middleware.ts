import { NextRequest, NextResponse } from 'next/server';
import { analytics } from './analytics';

export function createAnalyticsMiddleware() {
  return async (request: NextRequest, response: NextResponse) => {
    const startTime = Date.now();
    
    // Extract request information
    const method = request.method;
    const path = request.nextUrl.pathname;
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Extract resource and item ID from API paths
    let resource: string | undefined;
    let itemId: string | undefined;
    
    const apiMatch = path.match(/^\/api\/([^\/]+)(?:\/([^\/]+))?/);
    if (apiMatch) {
      resource = apiMatch[1];
      itemId = apiMatch[2];
    }

    // Get request size
    const requestSize = request.headers.get('content-length') 
      ? parseInt(request.headers.get('content-length')!) 
      : undefined;

    // Wait for the response to complete
    const responseTime = Date.now() - startTime;
    
    // Log the request
    analytics.logRequest({
      method,
      path,
      resource,
      itemId,
      statusCode: response.status,
      responseTime,
      userAgent,
      ip,
      requestSize,
      responseSize: response.headers.get('content-length') 
        ? parseInt(response.headers.get('content-length')!) 
        : undefined,
      error: response.status >= 400 ? `HTTP ${response.status}` : undefined
    });

    return response;
  };
}

export function withAnalytics<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    
    // Extract request information BEFORE awaiting handler
    const request = args[0] as NextRequest;
    const method = request.method;
    const path = request.nextUrl.pathname;
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Extract resource and item ID from API paths
    let resource: string | undefined;
    let itemId: string | undefined;
    
    const apiMatch = path.match(/^\/api\/([^\/]+)(?:\/([^\/]+))?/);
    if (apiMatch) {
      resource = apiMatch[1];
      itemId = apiMatch[2];
    }

    // Get request size
    const requestSize = request.headers.get('content-length') 
      ? parseInt(request.headers.get('content-length')!) 
      : undefined;

    let response: NextResponse;
    let error: string | undefined;

    try {
      response = await handler(...args);
      
      // Add CORS headers to all API responses to fix Swagger UI issues
      if (path.startsWith('/api/')) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      // Add CORS headers even to error responses
      if (path.startsWith('/api/')) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }
    }

    const responseTime = Date.now() - startTime;

    // Log the request - prioritize caught exceptions over HTTP status errors
    analytics.logRequest({
      method,
      path,
      resource,
      itemId,
      statusCode: response.status,
      responseTime,
      userAgent,
      ip,
      requestSize,
      error: error || (response.status >= 400 ? `HTTP ${response.status}` : undefined)
    });

    return response;
  };
}