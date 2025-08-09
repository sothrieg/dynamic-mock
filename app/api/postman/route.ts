import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { generatePostmanCollection } from '@/lib/postman-generator';
import { withAnalytics } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

async function handleGET(request: NextRequest) {
  try {
    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    // Get the correct base URL for different environments
    let baseUrl: string;
    
    // Smart protocol and host detection for all environments
    const protocol = request.headers.get('x-forwarded-proto') || 
                    (request.nextUrl.protocol === 'https:' ? 'https' : 'http');
    const host = request.headers.get('host') || 'localhost:3000';
    
    // Handle Docker environments (0.0.0.0 -> localhost)
    if (host.includes('0.0.0.0')) {
      const port = host.split(':')[1] || '3000';
      baseUrl = `${protocol}://localhost:${port}`;
    } else {
      baseUrl = `${protocol}://${host}`;
    }
    
    console.log(`📮 Postman Collection Base URL: ${baseUrl} (Protocol: ${protocol}, Host: ${host})`);

    // Get endpoint configuration
    const endpointConfig = dataStore.getEndpointConfig();

    // Generate Postman collection
    const collection = generatePostmanCollection(
      baseUrl,
      store.data,
      store.schema,
      endpointConfig
    );

    // Set headers for file download
    const response = NextResponse.json(collection);
    response.headers.set('Content-Type', 'application/json');
    response.headers.set('Content-Disposition', 'attachment; filename="api-collection.postman_collection.json"');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return response;
  } catch (error) {
    console.error('Postman collection generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Postman collection' },
      { status: 500 }
    );
  }
}

async function handleOPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export const GET = withAnalytics(handleGET);
export const OPTIONS = withAnalytics(handleOPTIONS);