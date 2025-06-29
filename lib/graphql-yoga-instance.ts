import { createYoga } from 'graphql-yoga';
import { buildSchema } from 'graphql';
import { generateGraphQLSchema } from './graphql-schema-generator';
import { createGraphQLResolvers } from './graphql-resolvers';
import { dataStore } from './data-store';

interface CachedYogaInstance {
  yoga: ReturnType<typeof createYoga>;
  schemaHash: string;
}

let cachedInstance: CachedYogaInstance | null = null;

export function getYogaInstance() {
  try {
    // Generate current schema
    const schemaString = generateGraphQLSchema();
    
    // Create a simple hash of the schema
    const currentHash = Buffer.from(schemaString).toString('base64').slice(0, 32);
    
    // Return cached instance if schema hasn't changed
    if (cachedInstance && cachedInstance.schemaHash === currentHash) {
      return cachedInstance.yoga;
    }

    console.log('Creating new GraphQL Yoga instance...');
    
    // Build GraphQL schema
    let schema;
    try {
      schema = buildSchema(schemaString);
    } catch (schemaError) {
      console.error('GraphQL schema build error:', schemaError);
      throw new Error(`Invalid GraphQL schema: ${schemaError}`);
    }
    
    // Create resolvers
    const resolvers = createGraphQLResolvers();
    
    // Get sample queries for the playground
    const store = dataStore.getData();
    const sampleResource = store.resources?.[0] || 'items';
    
    // Create new Yoga instance with proper configuration
    const yoga = createYoga({
      schema,
      rootValue: resolvers,
      graphiql: {
        title: 'JSON Schema API - GraphQL Playground',
        defaultQuery: `# Welcome to your GraphQL API!
# Try these example queries:

query GetAll${sampleResource.charAt(0).toUpperCase() + sampleResource.slice(1)} {
  ${sampleResource} {
    id
    ${store.data?.[sampleResource]?.[0] ? Object.keys(store.data[sampleResource][0]).slice(0, 3).join('\n    ') : '# Add your fields here'}
  }
}

# Example mutation (uncomment and modify):
# mutation Create${sampleResource.slice(0, -1).charAt(0).toUpperCase() + sampleResource.slice(1, -1)} {
#   create${sampleResource.slice(0, -1).charAt(0).toUpperCase() + sampleResource.slice(1, -1)}(input: {
#     # Add your input fields here
#   }) {
#     id
#     # Add fields you want returned
#   }
# }`,
        enabled: true,
      },
      cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      // Disable batching to avoid complexity
      batching: false,
      // Add proper error handling
      maskedErrors: false,
      // Use standard fetch API
      fetchAPI: globalThis,
    });

    // Cache the instance
    cachedInstance = {
      yoga,
      schemaHash: currentHash,
    };

    console.log('✅ GraphQL Yoga instance created successfully');
    return yoga;
    
  } catch (error) {
    console.error('❌ Error creating GraphQL Yoga instance:', error);
    
    // Return a minimal working instance on error
    const fallbackSchema = buildSchema(`
      type Query {
        _error: String
      }
      type Mutation {
        _error: String
      }
    `);
    
    const fallbackYoga = createYoga({
      schema: fallbackSchema,
      rootValue: {
        _error: () => `GraphQL schema generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your JSON data and schema.`,
      },
      graphiql: {
        title: 'GraphQL Error - Please Check Your Data',
        defaultQuery: `# GraphQL Schema Generation Failed
# Please ensure:
# 1. You have uploaded valid JSON data
# 2. Your JSON contains array collections
# 3. Your JSON schema is valid

query {
  _error
}`,
        enabled: true,
      },
      cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      batching: false,
      maskedErrors: false,
      fetchAPI: globalThis,
    });

    return fallbackYoga;
  }
}

// Function to invalidate cache when data changes
export function invalidateYogaCache() {
  cachedInstance = null;
  console.log('🔄 GraphQL Yoga cache invalidated');
}