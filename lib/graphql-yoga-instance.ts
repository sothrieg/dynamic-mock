import { createYoga } from 'graphql-yoga';
import { buildSchema } from 'graphql';
import { generateGraphQLSchema } from './graphql-schema-generator';
import { createGraphQLResolvers } from './graphql-resolvers';
import { dataStore } from './data-store';
import crypto from 'crypto';

interface CachedYogaInstance {
  yoga: ReturnType<typeof createYoga>;
  schemaHash: string;
}

let cachedInstance: CachedYogaInstance | null = null;

export function getYogaInstance() {
  try {
    // Generate current schema
    const schemaString = generateGraphQLSchema();
    const currentHash = crypto.createHash('md5').update(schemaString).digest('hex');
    
    // Return cached instance if schema hasn't changed
    if (cachedInstance && cachedInstance.schemaHash === currentHash) {
      return cachedInstance.yoga;
    }

    console.log('Creating new GraphQL Yoga instance...');
    
    // Build GraphQL schema
    const schema = buildSchema(schemaString);
    
    // Create resolvers
    const resolvers = createGraphQLResolvers();
    
    // Create new Yoga instance
    const yoga = createYoga({
      schema,
      rootValue: resolvers,
      graphiql: {
        title: 'JSON Schema API - GraphQL Playground',
        defaultQuery: `# Welcome to your GraphQL API!
# Try these example queries:

query GetAllUsers {
  users {
    id
    name
    email
    createdAt
  }
}

# mutation CreateUser {
#   createUser(input: {
#     name: "John Doe"
#     email: "john@example.com"
#   }) {
#     id
#     name
#     email
#     createdAt
#   }
# }`,
      },
      cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      fetchAPI: {
        Request: globalThis.Request,
        Response: globalThis.Response,
        Headers: globalThis.Headers,
      },
    });

    // Cache the instance
    cachedInstance = {
      yoga,
      schemaHash: currentHash,
    };

    console.log('GraphQL Yoga instance created successfully');
    return yoga;
    
  } catch (error) {
    console.error('Error creating GraphQL Yoga instance:', error);
    
    // Return a minimal working instance on error
    const fallbackSchema = buildSchema(`
      type Query {
        _error: String
      }
      type Mutation {
        _error: String
      }
    `);
    
    return createYoga({
      schema: fallbackSchema,
      rootValue: {
        _error: () => 'GraphQL schema generation failed. Please check your JSON data and schema.',
      },
      cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      fetchAPI: {
        Request: globalThis.Request,
        Response: globalThis.Response,
        Headers: globalThis.Headers,
      },
    });
  }
}

// Function to invalidate cache when data changes
export function invalidateYogaCache() {
  cachedInstance = null;
  console.log('GraphQL Yoga cache invalidated');
}