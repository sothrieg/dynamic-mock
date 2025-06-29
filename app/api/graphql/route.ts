import { createYoga } from 'graphql-yoga';
import { buildSchema } from 'graphql';
import { NextRequest } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { graphqlSchemaGenerator } from '@/lib/graphql-schema-generator';
import { graphqlResolverGenerator } from '@/lib/graphql-resolvers';
import { withAnalytics } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

function createGraphQLHandler() {
  try {
    const store = dataStore.getData();
    
    if (!store.isValid) {
      // Return a simple schema with an error message when no data is available
      const schema = buildSchema(`
        type Query {
          error: String!
        }
      `);
      
      const resolvers = {
        Query: {
          error: () => 'No valid data available. Please upload and validate JSON first.'
        }
      };

      return createYoga({
        schema,
        resolvers,
        graphqlEndpoint: '/api/graphql',
        landingPage: false,
        cors: {
          origin: '*',
          methods: ['GET', 'POST', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
        }
      });
    }

    // Generate GraphQL schema and resolvers
    const generatedSchema = graphqlSchemaGenerator.generateSchema();
    
    if (!generatedSchema) {
      const schema = buildSchema(`
        type Query {
          error: String!
        }
      `);
      
      const resolvers = {
        Query: {
          error: () => 'Failed to generate GraphQL schema from your data.'
        }
      };

      return createYoga({
        schema,
        resolvers,
        graphqlEndpoint: '/api/graphql',
        landingPage: false,
        cors: {
          origin: '*',
          methods: ['GET', 'POST', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
        }
      });
    }

    console.log('Generated GraphQL Schema:', generatedSchema.schema);
    
    const schema = buildSchema(generatedSchema.schema);
    const resolvers = graphqlResolverGenerator.generateResolvers();

    console.log('Generated Resolvers:', Object.keys(resolvers));

    return createYoga({
      schema,
      resolvers,
      graphqlEndpoint: '/api/graphql',
      landingPage: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }
    });
  } catch (error) {
    console.error('Error creating GraphQL handler:', error);
    
    // Fallback error schema
    const schema = buildSchema(`
      type Query {
        error: String!
      }
    `);
    
    const resolvers = {
      Query: {
        error: () => `GraphQL setup error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    };

    return createYoga({
      schema,
      resolvers,
      graphqlEndpoint: '/api/graphql',
      landingPage: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }
    });
  }
}

async function handleRequest(request: NextRequest) {
  try {
    const yoga = createGraphQLHandler();
    return yoga.handle(request, {});
  } catch (error) {
    console.error('Error handling GraphQL request:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

export const GET = withAnalytics(handleRequest);
export const POST = withAnalytics(handleRequest);
export const OPTIONS = withAnalytics(handleRequest);