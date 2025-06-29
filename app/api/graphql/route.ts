import { getYogaInstance } from '@/lib/graphql-yoga-instance';

// Get the memoized Yoga instance
const yoga = getYogaInstance();

export async function GET(request: Request) {
  try {
    return await yoga(request);
  } catch (error) {
    console.error('GraphQL GET error:', error);
    return new Response(
      JSON.stringify({ error: 'GraphQL request failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    return await yoga(request);
  } catch (error) {
    console.error('GraphQL POST error:', error);
    return new Response(
      JSON.stringify({ error: 'GraphQL request failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}