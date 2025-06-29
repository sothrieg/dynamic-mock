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
    const resourceData = store.data[resource];
    if (!Array.isArray(resourceData)) return;

    const singularName = resource.slice(0, -1); // Remove 's'
    const typeName = capitalizeFirst(singularName);

    // Query resolvers
    resolvers[resource] = () => {
      try {
        analytics.logRequest({
          method: 'GRAPHQL_QUERY',
          path: `/graphql/${resource}`,
          resource,
          statusCode: 200,
          responseTime: 0,
        });
        
        return resourceData;
      } catch (error) {
        console.error(`Error fetching ${resource}:`, error);
        throw new Error(`Failed to fetch ${resource}`);
      }
    };

    resolvers[singularName] = (args: { id: string }) => {
      try {
        const item = resourceData.find(item => 
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

        return item;
      } catch (error) {
        console.error(`Error fetching ${singularName}:`, error);
        throw error;
      }
    };

    // Mutation resolvers
    resolvers[`create${typeName}`] = (args: { input: any }) => {
      try {
        const newItem = { ...args.input };

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
        const resourceSchema = store.schema.properties?.[resource];
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
        const updatedData = { ...store.data };
        updatedData[resource] = [...resourceData, newItem];

        // Update store
        dataStore.setData(updatedData, store.schema, store.isValid, store.errors);

        analytics.logRequest({
          method: 'GRAPHQL_MUTATION',
          path: `/graphql/create${typeName}`,
          resource,
          statusCode: 201,
          responseTime: 0,
        });

        return newItem;
      } catch (error) {
        console.error(`Error creating ${typeName}:`, error);
        throw error;
      }
    };

    resolvers[`update${typeName}`] = (args: { id: string; input: any }) => {
      try {
        const itemIndex = resourceData.findIndex(item => 
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

        const existingItem = resourceData[itemIndex];
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
        const resourceSchema = store.schema.properties?.[resource];
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
        const updatedData = { ...store.data };
        updatedData[resource] = [...resourceData];
        updatedData[resource][itemIndex] = updatedItem;

        // Update store
        dataStore.setData(updatedData, store.schema, store.isValid, store.errors);

        analytics.logRequest({
          method: 'GRAPHQL_MUTATION',
          path: `/graphql/update${typeName}`,
          resource,
          itemId: args.id,
          statusCode: 200,
          responseTime: 0,
        });

        return updatedItem;
      } catch (error) {
        console.error(`Error updating ${typeName}:`, error);
        throw error;
      }
    };

    resolvers[`delete${typeName}`] = (args: { id: string }) => {
      try {
        const itemIndex = resourceData.findIndex(item => 
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
        const updatedData = { ...store.data };
        updatedData[resource] = resourceData.filter((_, index) => index !== itemIndex);

        // Update store
        dataStore.setData(updatedData, store.schema, store.isValid, store.errors);

        analytics.logRequest({
          method: 'GRAPHQL_MUTATION',
          path: `/graphql/delete${typeName}`,
          resource,
          itemId: args.id,
          statusCode: 200,
          responseTime: 0,
        });

        return true;
      } catch (error) {
        console.error(`Error deleting ${typeName}:`, error);
        throw error;
      }
    };
  });

  return resolvers;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}