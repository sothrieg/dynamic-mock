import { dataStore } from './data-store';
import { validateJsonWithSchema } from './validation';

export interface GraphQLContext {
  dataStore: typeof dataStore;
}

export interface GraphQLResolverArgs {
  id?: string;
  input?: any;
}

class GraphQLResolverGenerator {
  generateResolvers() {
    const store = dataStore.getData();
    
    if (!store.isValid || !store.resources.length) {
      return {
        Query: {
          error: () => 'No valid data available. Please upload and validate JSON first.'
        }
      };
    }

    const resolvers: any = {
      Query: {},
      Mutation: {}
    };

    // Generate resolvers for each resource
    store.resources.forEach(resource => {
      const resourceData = store.data[resource];
      if (!Array.isArray(resourceData)) return;

      const singularName = this.singularize(resource);
      const typeName = this.capitalizeFirst(singularName);

      // Query resolvers
      resolvers.Query[resource] = () => {
        try {
          const currentStore = dataStore.getData();
          return currentStore.data[resource] || [];
        } catch (error) {
          console.error(`Error in ${resource} query:`, error);
          throw new Error(`Failed to fetch ${resource}`);
        }
      };

      resolvers.Query[singularName] = (_: any, { id }: { id: string }) => {
        try {
          const item = dataStore.getResourceItem(resource, id);
          return item;
        } catch (error) {
          console.error(`Error in ${singularName} query:`, error);
          throw new Error(`Failed to fetch ${singularName} with id ${id}`);
        }
      };

      // Mutation resolvers
      resolvers.Mutation[`create${typeName}`] = async (_: any, { input }: { input: any }) => {
        try {
          const currentStore = dataStore.getData();
          const resourceData = currentStore.data[resource];
          
          if (!Array.isArray(resourceData)) {
            throw new Error(`Resource '${resource}' not found or is not a collection`);
          }

          // Create a copy of input to avoid mutations
          const newItem = { ...input };

          // Generate ID if not provided
          if (!newItem.id && !newItem._id && !newItem.uuid) {
            const maxId = resourceData.reduce((max, item) => {
              const itemId = item.id || item._id || 0;
              return typeof itemId === 'number' ? Math.max(max, itemId) : max;
            }, 0);
            newItem.id = maxId + 1;
          }

          // Add timestamps
          const now = new Date().toISOString();
          newItem.createdAt = now;
          newItem.updatedAt = now;

          // Validate against schema
          const resourceSchema = currentStore.schema.properties?.[resource];
          if (resourceSchema?.items) {
            const validation = validateJsonWithSchema(newItem, resourceSchema.items);
            if (!validation.isValid) {
              throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
          }

          // Add to collection
          const updatedData = { ...currentStore.data };
          updatedData[resource] = [...resourceData, newItem];

          // Update store
          dataStore.setData(updatedData, currentStore.schema, currentStore.isValid, currentStore.errors);

          return newItem;
        } catch (error) {
          console.error(`Error in create${typeName} mutation:`, error);
          throw error instanceof Error ? error : new Error(`Failed to create ${typeName}`);
        }
      };

      resolvers.Mutation[`update${typeName}`] = async (_: any, { id, input }: { id: string; input: any }) => {
        try {
          const currentStore = dataStore.getData();
          const resourceData = currentStore.data[resource];
          
          if (!Array.isArray(resourceData)) {
            throw new Error(`Resource '${resource}' not found or is not a collection`);
          }

          // Find existing item
          const itemIndex = resourceData.findIndex(item => 
            item.id === id || 
            item.id === parseInt(id) || 
            item._id === id ||
            item.uuid === id
          );

          if (itemIndex === -1) {
            throw new Error(`Item with id '${id}' not found in resource '${resource}'`);
          }

          const existingItem = resourceData[itemIndex];

          // Merge with existing item (partial update)
          const updatedItem = {
            ...existingItem,
            ...input,
            // Preserve critical fields
            id: existingItem.id || existingItem._id || existingItem.uuid,
            createdAt: existingItem.createdAt,
            updatedAt: new Date().toISOString()
          };

          // Preserve original ID fields
          if (existingItem._id) updatedItem._id = existingItem._id;
          if (existingItem.uuid) updatedItem.uuid = existingItem.uuid;

          // Validate against schema
          const resourceSchema = currentStore.schema.properties?.[resource];
          if (resourceSchema?.items) {
            const validation = validateJsonWithSchema(updatedItem, resourceSchema.items);
            if (!validation.isValid) {
              throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
          }

          // Update the item
          const updatedData = { ...currentStore.data };
          updatedData[resource] = [...resourceData];
          updatedData[resource][itemIndex] = updatedItem;

          // Update store
          dataStore.setData(updatedData, currentStore.schema, currentStore.isValid, currentStore.errors);

          return updatedItem;
        } catch (error) {
          console.error(`Error in update${typeName} mutation:`, error);
          throw error instanceof Error ? error : new Error(`Failed to update ${typeName}`);
        }
      };

      resolvers.Mutation[`delete${typeName}`] = async (_: any, { id }: { id: string }) => {
        try {
          const currentStore = dataStore.getData();
          const resourceData = currentStore.data[resource];
          
          if (!Array.isArray(resourceData)) {
            throw new Error(`Resource '${resource}' not found or is not a collection`);
          }

          // Find existing item
          const itemIndex = resourceData.findIndex(item => 
            item.id === id || 
            item.id === parseInt(id) || 
            item._id === id ||
            item.uuid === id
          );

          if (itemIndex === -1) {
            throw new Error(`Item with id '${id}' not found in resource '${resource}'`);
          }

          // Remove the item
          const updatedData = { ...currentStore.data };
          updatedData[resource] = resourceData.filter((_, index) => index !== itemIndex);

          // Update store
          dataStore.setData(updatedData, currentStore.schema, currentStore.isValid, currentStore.errors);

          return true;
        } catch (error) {
          console.error(`Error in delete${typeName} mutation:`, error);
          throw error instanceof Error ? error : new Error(`Failed to delete ${typeName}`);
        }
      };
    });

    return resolvers;
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
}

export const graphqlResolverGenerator = new GraphQLResolverGenerator();