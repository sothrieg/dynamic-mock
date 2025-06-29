import { dataStore } from './data-store';

export function generateGraphQLSchema(): string {
  try {
    const store = dataStore.getData();
    
    if (!store.isValid || !store.data) {
      return `
        type Query {
          _empty: String
        }
        
        type Mutation {
          _empty: String
        }
      `;
    }

    const resources = Object.keys(store.data).filter(key => Array.isArray(store.data[key]));
    
    if (resources.length === 0) {
      return `
        type Query {
          _empty: String
        }
        
        type Mutation {
          _empty: String
        }
      `;
    }

    let schema = '';
    let queryFields = '';
    let mutationFields = '';

    resources.forEach(resource => {
      const items = store.data[resource];
      if (!Array.isArray(items) || items.length === 0) return;

      const sampleItem = items[0];
      const typeName = capitalizeFirst(resource.slice(0, -1)); // Remove 's' and capitalize
      const inputTypeName = `${typeName}Input`;

      // Generate object type
      const objectType = generateObjectType(typeName, sampleItem);
      schema += objectType + '\n\n';

      // Generate input type
      const inputType = generateInputType(inputTypeName, sampleItem);
      schema += inputType + '\n\n';

      // Add query fields
      queryFields += `  ${resource}: [${typeName}!]!\n`;
      queryFields += `  ${resource.slice(0, -1)}(id: ID!): ${typeName}\n`;

      // Add mutation fields
      mutationFields += `  create${typeName}(input: ${inputTypeName}!): ${typeName}!\n`;
      mutationFields += `  update${typeName}(id: ID!, input: ${inputTypeName}!): ${typeName}!\n`;
      mutationFields += `  delete${typeName}(id: ID!): Boolean!\n`;
    });

    // Build complete schema
    const completeSchema = `
      ${schema}
      type Query {
      ${queryFields || '  _empty: String'}
      }
      
      type Mutation {
      ${mutationFields || '  _empty: String'}
      }
    `;

    return completeSchema;
  } catch (error) {
    console.error('Error generating GraphQL schema:', error);
    return `
      type Query {
        _empty: String
      }
      
      type Mutation {
        _empty: String
      }
    `;
  }
}

function generateObjectType(typeName: string, sampleItem: any): string {
  const fields = Object.keys(sampleItem)
    .map(key => {
      const value = sampleItem[key];
      const graphqlType = getGraphQLType(value, false); // false = not input type
      return `  ${key}: ${graphqlType}`;
    })
    .join('\n');

  return `type ${typeName} {\n${fields}\n}`;
}

function generateInputType(typeName: string, sampleItem: any): string {
  const fields = Object.keys(sampleItem)
    .filter(key => !['id', '_id', 'uuid', 'createdAt', 'updatedAt'].includes(key)) // Exclude auto-generated fields
    .map(key => {
      const value = sampleItem[key];
      const graphqlType = getGraphQLType(value, true); // true = input type
      return `  ${key}: ${graphqlType}`;
    })
    .join('\n');

  return `input ${typeName} {\n${fields}\n}`;
}

function getGraphQLType(value: any, isInput: boolean = false): string {
  if (value === null || value === undefined) {
    return 'String';
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[String]';
    }
    const itemType = getGraphQLType(value[0], isInput);
    // Fix: Don't add extra ! inside array brackets
    return `[${itemType}]`;
  }

  switch (typeof value) {
    case 'string':
      return 'String';
    case 'number':
      return Number.isInteger(value) ? 'Int' : 'Float';
    case 'boolean':
      return 'Boolean';
    case 'object':
      if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
        return 'String'; // Dates as strings
      }
      return 'String'; // Complex objects as JSON strings
    default:
      return 'String';
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}