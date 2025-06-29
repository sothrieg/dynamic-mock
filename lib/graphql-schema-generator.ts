import { dataStore } from './data-store';

export interface GraphQLField {
  name: string;
  type: string;
  description?: string;
  nullable?: boolean;
}

export interface GraphQLType {
  name: string;
  fields: GraphQLField[];
  description?: string;
}

export interface GraphQLQuery {
  name: string;
  returnType: string;
  args?: { name: string; type: string; description?: string }[];
  description?: string;
}

export interface GraphQLMutation {
  name: string;
  returnType: string;
  args: { name: string; type: string; description?: string }[];
  description?: string;
}

export interface GraphQLSchema {
  types: GraphQLType[];
  queries: GraphQLQuery[];
  mutations: GraphQLMutation[];
  schema: string;
}

class GraphQLSchemaGenerator {
  generateSchema(): GraphQLSchema | null {
    const store = dataStore.getData();
    
    if (!store.isValid || !store.resources.length) {
      return null;
    }

    const types: GraphQLType[] = [];
    const queries: GraphQLQuery[] = [];
    const mutations: GraphQLMutation[] = [];

    // Generate types for each resource
    store.resources.forEach(resource => {
      const resourceData = store.data[resource];
      if (!Array.isArray(resourceData) || resourceData.length === 0) return;

      const sampleItem = resourceData[0];
      const typeName = this.capitalizeFirst(this.singularize(resource));
      const inputTypeName = `${typeName}Input`;
      const updateInputTypeName = `${typeName}UpdateInput`;

      // Generate main type
      const fields = this.generateFieldsFromObject(sampleItem);
      types.push({
        name: typeName,
        fields,
        description: `${typeName} entity from ${resource} collection`
      });

      // Generate input type (for creating)
      const inputFields = fields.filter(field => 
        !['id', '_id', 'uuid', 'createdAt', 'updatedAt'].includes(field.name)
      ).map(field => ({ ...field, nullable: true }));
      
      types.push({
        name: inputTypeName,
        fields: inputFields,
        description: `Input type for creating ${typeName}`
      });

      // Generate update input type (all fields optional)
      types.push({
        name: updateInputTypeName,
        fields: inputFields,
        description: `Input type for updating ${typeName}`
      });

      // Generate queries
      queries.push({
        name: resource,
        returnType: `[${typeName}!]!`,
        description: `Get all ${resource}`
      });

      queries.push({
        name: this.singularize(resource),
        returnType: typeName,
        args: [{ name: 'id', type: 'ID!', description: 'The ID of the item to retrieve' }],
        description: `Get a single ${typeName} by ID`
      });

      // Generate mutations
      mutations.push({
        name: `create${typeName}`,
        returnType: `${typeName}!`,
        args: [{ name: 'input', type: `${inputTypeName}!`, description: `The ${typeName} data to create` }],
        description: `Create a new ${typeName}`
      });

      mutations.push({
        name: `update${typeName}`,
        returnType: typeName,
        args: [
          { name: 'id', type: 'ID!', description: 'The ID of the item to update' },
          { name: 'input', type: `${updateInputTypeName}!`, description: `The ${typeName} data to update` }
        ],
        description: `Update an existing ${typeName}`
      });

      mutations.push({
        name: `delete${typeName}`,
        returnType: 'Boolean!',
        args: [{ name: 'id', type: 'ID!', description: 'The ID of the item to delete' }],
        description: `Delete a ${typeName}`
      });
    });

    // Generate the complete schema string
    const schema = this.generateSchemaString(types, queries, mutations);

    return {
      types,
      queries,
      mutations,
      schema
    };
  }

  private generateFieldsFromObject(obj: any): GraphQLField[] {
    const fields: GraphQLField[] = [];

    Object.entries(obj).forEach(([key, value]) => {
      const field: GraphQLField = {
        name: key,
        type: this.getGraphQLType(value),
        nullable: value === null || value === undefined
      };

      // Add descriptions for common fields
      if (key === 'id' || key === '_id' || key === 'uuid') {
        field.description = 'Unique identifier';
      } else if (key === 'createdAt') {
        field.description = 'Creation timestamp';
      } else if (key === 'updatedAt') {
        field.description = 'Last update timestamp';
      } else if (key === 'email') {
        field.description = 'Email address';
      } else if (key === 'name') {
        field.description = 'Name';
      } else if (key === 'description') {
        field.description = 'Description';
      }

      fields.push(field);
    });

    return fields;
  }

  private getGraphQLType(value: any): string {
    if (value === null || value === undefined) {
      return 'String';
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[String!]!';
      }
      const itemType = this.getGraphQLType(value[0]);
      return `[${itemType}!]!`;
    }

    switch (typeof value) {
      case 'string':
        // Check if it's a date string
        if (this.isDateString(value)) {
          return 'String!'; // GraphQL doesn't have built-in Date, use String with ISO format
        }
        return 'String!';
      case 'number':
        return Number.isInteger(value) ? 'Int!' : 'Float!';
      case 'boolean':
        return 'Boolean!';
      case 'object':
        return 'String!'; // For complex objects, serialize as JSON string
      default:
        return 'String!';
    }
  }

  private isDateString(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime()) && (value.includes('T') || value.includes('-'));
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private singularize(word: string): string {
    // Simple singularization - can be enhanced with a proper library
    if (word.endsWith('ies')) {
      return word.slice(0, -3) + 'y';
    }
    if (word.endsWith('es')) {
      return word.slice(0, -2);
    }
    if (word.endsWith('s')) {
      return word.slice(0, -1);
    }
    return word;
  }

  private generateSchemaString(types: GraphQLType[], queries: GraphQLQuery[], mutations: GraphQLMutation[]): string {
    let schema = '';

    // Add scalar types
    schema += `scalar JSON\nscalar DateTime\n\n`;

    // Add object types (not input types)
    types.filter(type => !type.name.includes('Input')).forEach(type => {
      if (type.description) {
        schema += `"""${type.description}"""\n`;
      }
      schema += `type ${type.name} {\n`;
      type.fields.forEach(field => {
        if (field.description) {
          schema += `  """${field.description}"""\n`;
        }
        schema += `  ${field.name}: ${field.type}\n`;
      });
      schema += `}\n\n`;
    });

    // Add input types
    types.filter(type => type.name.includes('Input')).forEach(type => {
      if (type.description) {
        schema += `"""${type.description}"""\n`;
      }
      schema += `input ${type.name} {\n`;
      type.fields.forEach(field => {
        if (field.description) {
          schema += `  """${field.description}"""\n`;
        }
        // Make input fields optional by removing the ! from the type
        const fieldType = field.type.replace('!', '');
        schema += `  ${field.name}: ${fieldType}\n`;
      });
      schema += `}\n\n`;
    });

    // Add Query type
    if (queries.length > 0) {
      schema += `type Query {\n`;
      queries.forEach(query => {
        if (query.description) {
          schema += `  """${query.description}"""\n`;
        }
        const args = query.args ? query.args.map(arg => `${arg.name}: ${arg.type}`).join(', ') : '';
        schema += `  ${query.name}${args ? `(${args})` : ''}: ${query.returnType}\n`;
      });
      schema += `}\n\n`;
    }

    // Add Mutation type
    if (mutations.length > 0) {
      schema += `type Mutation {\n`;
      mutations.forEach(mutation => {
        if (mutation.description) {
          schema += `  """${mutation.description}"""\n`;
        }
        const args = mutation.args.map(arg => `${arg.name}: ${arg.type}`).join(', ');
        schema += `  ${mutation.name}(${args}): ${mutation.returnType}\n`;
      });
      schema += `}\n\n`;
    }

    return schema;
  }
}

export const graphqlSchemaGenerator = new GraphQLSchemaGenerator();