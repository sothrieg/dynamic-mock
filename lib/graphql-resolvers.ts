import { dataStore } from './data-store';
import { validateJsonWithSchema } from './validation';
import { analytics } from './analytics';

export function createGraphQLResolvers() {
  const store = dataStore.getData();
  
  if (!store.isValid || !store.data) {
    return {
      _empty: () => 'No valid data available',
    };
  }

  const resolvers: any = {};
  const resources = Object.keys(store.data).filter(key => Array.isArray(store.data[key]));

  resources.forEach(resource => {
    // Ensure we always have an array, even if empty
    const resourceData = Array.isArray(store.data[resource]) ? store.data[resource] : [];
    
    const singularName = resource.slice(0, -1); // Remove 's'
    const typeName = capitalizeFirst(singularName);

    // Query resolvers - ALWAYS return arrays to prevent null errors
    resolvers[resource] = () => {
      try {
        analytics.logRequest({
          method: 'GRAPHQL_QUERY',
          path: `/graphql/${resource}`,
          resource,
          statusCode: 200,
          responseTime: 0,
        });
        
        // CRITICAL: Always return an array, never null or undefined
        const currentData = dataStore.getData().data[resource];
        const result = Array.isArray(currentData) ? currentData : [];
        console.log(`GraphQL Query ${resource}:`, result.length, 'items');
        return result;
      } catch (error) {
        console.error(`Error fetching ${resource}:`, error);
        // Return empty array instead of throwing to prevent null return
        return [];
      }
    };

    resolvers[singularName] = (args: { id: string }) => {
      try {
        const currentData = dataStore.getData().data[resource];
        const safeData = Array.isArray(currentData) ? currentData : [];
        
        const item = safeData.find(item => 
          item.id === args.id || 
          item.id === parseInt(args.id) || 
          item._id === args.id ||
          item.uuid === args.id
        );

        analytics.logRequest({
          method: 'GRAPHQL_QUERY',
          path: `/graphql/${singularName}`,
          resource,
          itemId: args.id,
          statusCode: item ? 200 : 404,
          responseTime: 0,
        });

        if (!item) {
          throw new Error(`${typeName} with id '${args.id}' not found`);
        }

        console.log(`GraphQL Query ${singularName}(${args.id}):`, item);
        return item;
      } catch (error) {
        console.error(`Error fetching ${singularName}:`, error);
        throw error;
      }
    };

    // Mutation resolvers
    resolvers[`create${typeName}`] = (args: { input: any }) => {
      try {
        const currentStore = dataStore.getData();
        const currentData = Array.isArray(currentStore.data[resource]) ? currentStore.data[resource] : [];
        
        const newItem = { ...args.input };

        // Generate ID if not provided
        if (!newItem.id && !newItem._id && !newItem.uuid) {
          const maxId = currentData.reduce((max, item) => {
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
            analytics.logRequest({
              method: 'GRAPHQL_MUTATION',
              path: `/graphql/create${typeName}`,
              resource,
              statusCode: 400,
              responseTime: 0,
              error: 'Validation failed',
            });
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }
        }

        // Add to collection
        const updatedData = { ...currentStore.data };
        updatedData[resource] = [...currentData, newItem];

        // Update store
        dataStore.setData(updatedData, currentStore.schema, currentStore.isValid, currentStore.errors);

        analytics.logRequest({
          method: 'GRAPHQL_MUTATION',
          path: `/graphql/create${typeName}`,
          resource,
          statusCode: 201,
          responseTime: 0,
        });

        console.log(`GraphQL Mutation create${typeName}:`, newItem);
        return newItem;
      } catch (error) {
        console.error(`Error creating ${typeName}:`, error);
        throw error;
      }
    };

    resolvers[`update${typeName}`] = (args: { id: string; input: any }) => {
      try {
        const currentStore = dataStore.getData();
        const currentData = Array.isArray(currentStore.data[resource]) ? currentStore.data[resource] : [];
        
        const itemIndex = currentData.findIndex(item => 
          item.id === args.id || 
          item.id === parseInt(args.id) || 
          item._id === args.id ||
          item.uuid === args.id
        );

        if (itemIndex === -1) {
          analytics.logRequest({
            method: 'GRAPHQL_MUTATION',
            path: `/graphql/update${typeName}`,
            resource,
            itemId: args.id,
            statusCode: 404,
            responseTime: 0,
            error: 'Item not found',
          });
          throw new Error(`${typeName} with id '${args.id}' not found`);
        }

        const existingItem = currentData[itemIndex];
        const updatedItem = {
          ...existingItem,
          ...args.input,
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
            analytics.logRequest({
              method: 'GRAPHQL_MUTATION',
              path: `/graphql/update${typeName}`,
              resource,
              itemId: args.id,
              statusCode: 400,
              responseTime: 0,
              error: 'Validation failed',
            });
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
          }
        }

        // Update the item
        const updatedData = { ...currentStore.data };
        updatedData[resource] = [...currentData];
        updatedData[resource][itemIndex] = updatedItem;

        // Update store
        dataStore.setData(updatedData, currentStore.schema, currentStore.isValid, currentStore.errors);

        analytics.logRequest({
          method: 'GRAPHQL_MUTATION',
          path: `/graphql/update${typeName}`,
          resource,
          itemId: args.id,
          statusCode: 200,
          responseTime: 0,
        });

        console.log(`GraphQL Mutation update${typeName}(${args.id}):`, updatedItem);
        return updatedItem;
      } catch (error) {
        console.error(`Error updating ${typeName}:`, error);
        throw error;
      }
    };

    resolvers[`delete${typeName}`] = (args: { id: string }) => {
      try {
        const currentStore = dataStore.getData();
        const currentData = Array.isArray(currentStore.data[resource]) ? currentStore.data[resource] : [];
        
        const itemIndex = currentData.findIndex(item => 
          item.id === args.id || 
          item.id === parseInt(args.id) || 
          item._id === args.id ||
          item.uuid === args.id
        );

        if (itemIndex === -1) {
          analytics.logRequest({
            method: 'GRAPHQL_MUTATION',
            path: `/graphql/delete${typeName}`,
            resource,
            itemId: args.id,
            statusCode: 404,
            responseTime: 0,
            error: 'Item not found',
          });
          throw new Error(`${typeName} with id '${args.id}' not found`);
        }

        // Remove the item
        const updatedData = { ...currentStore.data };
        updatedData[resource] = currentData.filter((_, index) => index !== itemIndex);

        // Update store
        dataStore.setData(updatedData, currentStore.schema, currentStore.isValid, currentStore.errors);

        analytics.logRequest({
          method: 'GRAPHQL_MUTATION',
          path: `/graphql/delete${typeName}`,
          resource,
          itemId: args.id,
          statusCode: 200,
          responseTime: 0,
        });

        console.log(`GraphQL Mutation delete${typeName}(${args.id}): success`);
        return true;
      } catch (error) {
        console.error(`Error deleting ${typeName}:`, error);
        throw error;
      }
    };
  });

  console.log('GraphQL Resolvers created for resources:', resources);
  return resolvers;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}