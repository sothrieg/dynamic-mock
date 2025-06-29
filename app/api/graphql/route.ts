import { NextRequest } from 'next/server';
import { getYogaInstance } from '@/lib/graphql-yoga-instance';

// Get the memoized Yoga instance
const yoga = getYogaInstance();

export async function GET(request: NextRequest) {
  try {
    // Convert NextRequest to standard Request for Yoga
    const url = new URL(request.url);
    const standardRequest = new Request(url.toString(), {
      method: 'GET',
      headers: request.headers,
    });

    const response = await yoga.fetch(standardRequest, {});
    return response;
  } catch (error) {
    console.error('GraphQL GET error:', error);
    
    // Return a proper GraphQL error response
    return new Response(
      JSON.stringify({
        errors: [
          {
            message: error instanceof Error ? error.message : 'GraphQL request failed',
            extensions: {
              code: 'INTERNAL_ERROR'
            }
          }
        ]
      }),
      {
        status: 200, // GraphQL errors should return 200 with errors in body
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Convert NextRequest to standard Request for Yoga
    const body = await request.text();
    const url = new URL(request.url);
    
    const standardRequest = new Request(url.toString(), {
      method: 'POST',
      headers: request.headers,
      body: body,
    });

    const response = await yoga.fetch(standardRequest, {});
    return response;
  } catch (error) {
    console.error('GraphQL POST error:', error);
    
    // Return a proper GraphQL error response
    return new Response(
      JSON.stringify({
        errors: [
          {
            message: error instanceof Error ? error.message : 'GraphQL request failed',
            extensions: {
              code: 'INTERNAL_ERROR'
            }
          }
        ]
      }),
      {
        status: 200, // GraphQL errors should return 200 with errors in body
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}