import { createYoga } from 'graphql-yoga';
import { buildSchema } from 'graphql';
import { NextRequest } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { graphqlSchemaGenerator } from '@/lib/graphql-schema-generator';
import { graphqlResolverGenerator } from '@/lib/graphql-resolvers';
import { withAnalytics } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

function createGraphQLHandler() {
  const store = dataStore.getData();
  
  if (!store.isValid) {
    // Return a simple schema with an error message when no data is available
    const schema = buildSchema(`
      type Query {
        error: String
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
        error: String
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

  const schema = buildSchema(generatedSchema.schema);
  const resolvers = graphqlResolverGenerator.generateResolvers();

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

async function handleRequest(request: NextRequest) {
  const yoga = createGraphQLHandler();
  return yoga.handle(request, {});
}

export const GET = withAnalytics(handleRequest);
export const POST = withAnalytics(handleRequest);
export const OPTIONS = withAnalytics(handleRequest);