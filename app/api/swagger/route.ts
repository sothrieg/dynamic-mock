import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { withAnalytics } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

async function handleGET(request: NextRequest) {
  try {
    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    // Get the correct base URL for different environments
    let baseUrl: string;
    
    if (process.env.NODE_ENV === 'production') {
      // In production, use the request origin
      baseUrl = request.nextUrl.origin;
    } else {
      // In development, check if we're in Docker
      const host = request.headers.get('host') || 'localhost:3000';
      
      // If host contains 0.0.0.0, replace with localhost for browser compatibility
      if (host.includes('0.0.0.0')) {
        baseUrl = `http://localhost:${host.split(':')[1] || '3000'}`;
      } else {
        baseUrl = `http://${host}`;
      }
    }

    // Generate Swagger specification
    const swaggerSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Generated REST API',
        description: 'Full CRUD REST API endpoints generated from uploaded JSON data and schema with comprehensive validation',
        version: '2.0.0',
        contact: {
          name: 'Thomas Rieger',
          email: 't.rieger@quickline.ch'
        }
      },
      servers: [
        {
          url: baseUrl,
          description: 'API Server',
        },
      ],
      paths: {} as any,
      components: {
        schemas: {} as any,
      },
    };

    // Get endpoint configuration to filter available endpoints
    const endpointConfig = dataStore.getEndpointConfig();

    // Generate paths and schemas for each resource
    store.resources.forEach((resource) => {
      const resourceData = store.data[resource];
      if (!Array.isArray(resourceData) || resourceData.length === 0) return;

      // Check if any endpoints are enabled for this resource
      const resourceConfig = endpointConfig?.find(config => config.resource === resource);
      const hasEnabledEndpoints = resourceConfig 
        ? Object.values(resourceConfig.endpoints).some(Boolean)
        : true; // If no config, show all endpoints (backward compatibility)

      if (!hasEnabledEndpoints) return;

      // Generate schema from first item in the array
      const sampleItem = resourceData[0];
      const schemaName = resource.charAt(0).toUpperCase() + resource.slice(1).slice(0, -1); // Singular form
      const inputSchemaName = `${schemaName}Input`;
      
      // Create full schema definition
      const fullSchema = generateSchemaFromObject(sampleItem);
      swaggerSpec.components.schemas[schemaName] = fullSchema;

      // Create input schema (without auto-generated fields)
      const inputSchema = { ...fullSchema };
      if (inputSchema.properties) {
        delete inputSchema.properties.id;
        delete inputSchema.properties._id;
        delete inputSchema.properties.uuid;
        delete inputSchema.properties.createdAt;
        delete inputSchema.properties.updatedAt;
        
        // Remove auto-generated fields from required array
        if (inputSchema.required) {
          inputSchema.required = inputSchema.required.filter((field: string) => 
            !['id', '_id', 'uuid', 'createdAt', 'updatedAt'].includes(field)
          );
        }
      }
      swaggerSpec.components.schemas[inputSchemaName] = inputSchema;

      // Helper function to check if endpoint is enabled
      const isEndpointEnabled = (method: string): boolean => {
        if (!resourceConfig) return true; // Show all if no config
        const methodMap: Record<string, keyof typeof resourceConfig.endpoints> = {
          'GET_collection': 'GET_collection',
          'POST_collection': 'POST_collection',
          'GET_item': 'GET_item',
          'PUT_item': 'PUT_item',
          'PATCH_item': 'PATCH_item',
          'DELETE_item': 'DELETE_item'
        };
        const endpointKey = methodMap[method];
        return endpointKey ? resourceConfig.endpoints[endpointKey] : false;
      };

      // Collection endpoints
      const collectionPath = `/api/${resource}`;
      swaggerSpec.paths[collectionPath] = {};

      // GET collection
      if (isEndpointEnabled('GET_collection')) {
        swaggerSpec.paths[collectionPath].get = {
          summary: `Get all ${resource}`,
          description: `Retrieve all items from the ${resource} collection`,
          tags: [resource],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: `#/components/schemas/${schemaName}`,
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - No valid data available',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        };
      }

      // POST collection
      if (isEndpointEnabled('POST_collection')) {
        swaggerSpec.paths[collectionPath].post = {
          summary: `Create a new ${resource.slice(0, -1)}`,
          description: `Add a new item to the ${resource} collection`,
          tags: [resource],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${inputSchemaName}`,
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Item created successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${schemaName}`,
                  },
                },
              },
            },
            '400': {
              description: 'Bad request - Validation failed',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                      details: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    },
                  },
                },
              },
            },
          },
        };
      }

      // Individual item endpoints
      const itemPath = `/api/${resource}/{id}`;
      const hasItemEndpoints = isEndpointEnabled('GET_item') || 
                              isEndpointEnabled('PUT_item') || 
                              isEndpointEnabled('PATCH_item') || 
                              isEndpointEnabled('DELETE_item');

      if (hasItemEndpoints) {
        swaggerSpec.paths[itemPath] = {};

        // GET item
        if (isEndpointEnabled('GET_item')) {
          swaggerSpec.paths[itemPath].get = {
            summary: `Get ${resource.slice(0, -1)} by ID`,
            description: `Retrieve a specific item from the ${resource} collection by ID`,
            tags: [resource],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: `ID of the ${resource.slice(0, -1)} to retrieve`,
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'Successful response',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/${schemaName}`,
                    },
                  },
                },
              },
              '404': {
                description: 'Item not found',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          };
        }

        // PUT item
        if (isEndpointEnabled('PUT_item')) {
          swaggerSpec.paths[itemPath].put = {
            summary: `Update ${resource.slice(0, -1)} by ID`,
            description: `Replace an entire item in the ${resource} collection`,
            tags: [resource],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: `ID of the ${resource.slice(0, -1)} to update`,
                schema: {
                  type: 'string',
                },
              },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${inputSchemaName}`,
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Item updated successfully',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/${schemaName}`,
                    },
                  },
                },
              },
              '400': {
                description: 'Bad request - Validation failed',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string' },
                        details: {
                          type: 'array',
                          items: { type: 'string' }
                        }
                      },
                    },
                  },
                },
              },
              '404': {
                description: 'Item not found',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          };
        }

        // PATCH item
        if (isEndpointEnabled('PATCH_item')) {
          swaggerSpec.paths[itemPath].patch = {
            summary: `Partially update ${resource.slice(0, -1)} by ID`,
            description: `Update specific fields of an item in the ${resource} collection`,
            tags: [resource],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: `ID of the ${resource.slice(0, -1)} to update`,
                schema: {
                  type: 'string',
                },
              },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    description: 'Partial update object - only include fields you want to update',
                    additionalProperties: true,
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Item updated successfully',
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/${schemaName}`,
                    },
                  },
                },
              },
              '400': {
                description: 'Bad request - Validation failed',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string' },
                        details: {
                          type: 'array',
                          items: { type: 'string' }
                        }
                      },
                    },
                  },
                },
              },
              '404': {
                description: 'Item not found',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          };
        }

        // DELETE item
        if (isEndpointEnabled('DELETE_item')) {
          swaggerSpec.paths[itemPath].delete = {
            summary: `Delete ${resource.slice(0, -1)} by ID`,
            description: `Remove an item from the ${resource} collection`,
            tags: [resource],
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                description: `ID of the ${resource.slice(0, -1)} to delete`,
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'Item deleted successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: { type: 'string' },
                        deletedItem: {
                          $ref: `#/components/schemas/${schemaName}`,
                        },
                      },
                    },
                  },
                },
              },
              '404': {
                description: 'Item not found',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          };
        }
      }
    });

    const response = NextResponse.json(swaggerSpec);
    
    // Add comprehensive CORS headers for Swagger UI compatibility
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'false');
    response.headers.set('Access-Control-Max-Age', '86400');
    response.headers.set('Vary', 'Origin');
    
    return response;
  } catch (error) {
    console.error('Swagger generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}

async function handleOPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
      'Access-Control-Allow-Credentials': 'false',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function generateSchemaFromObject(obj: any): any {
  if (obj === null) return { type: 'null' };
  
  const type = Array.isArray(obj) ? 'array' : typeof obj;
  
  switch (type) {
    case 'string':
      return { type: 'string', example: obj };
    case 'number':
      return { type: 'number', example: obj };
    case 'boolean':
      return { type: 'boolean', example: obj };
    case 'array':
      return {
        type: 'array',
        items: obj.length > 0 ? generateSchemaFromObject(obj[0]) : { type: 'string' },
      };
    case 'object':
      const properties: any = {};
      const required: string[] = [];
      
      Object.keys(obj).forEach((key) => {
        properties[key] = generateSchemaFromObject(obj[key]);
        if (obj[key] !== null && obj[key] !== undefined) {
          required.push(key);
        }
      });
      
      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    default:
      return { type: 'string' };
  }
}

export const GET = withAnalytics(handleGET);
export const OPTIONS = withAnalytics(handleOPTIONS);