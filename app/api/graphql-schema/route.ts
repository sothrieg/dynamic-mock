import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { graphqlSchemaGenerator } from '@/lib/graphql-schema-generator';
import { withAnalytics } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

async function handleGET() {
  try {
    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    const generatedSchema = graphqlSchemaGenerator.generateSchema();
    
    if (!generatedSchema) {
      return NextResponse.json(
        { error: 'Failed to generate GraphQL schema from your data.' },
        { status: 500 }
      );
    }

    // Return comprehensive schema information
    return NextResponse.json({
      schema: generatedSchema.schema,
      types: generatedSchema.types,
      queries: generatedSchema.queries,
      mutations: generatedSchema.mutations,
      endpoint: '/api/graphql',
      playground: '/api/graphql',
      introspection: true,
      resources: store.resources,
      info: {
        title: 'Generated GraphQL API',
        description: 'GraphQL API generated from uploaded JSON data and schema',
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('GraphQL schema generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate GraphQL schema' },
      { status: 500 }
    );
  }
}

export const GET = withAnalytics(handleGET);