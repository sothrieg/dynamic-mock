import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
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

    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';

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

    // Generate paths and schemas for each resource
    store.resources.forEach((resource) => {
      const resourceData = store.data[resource];
      if (!Array.isArray(resourceData) || resourceData.length === 0) return;

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

      // Collection endpoints
      swaggerSpec.paths[`/api/${resource}`] = {
        get: {
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
        },
        post: {
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
        },
      };

      // Individual item endpoints
      swaggerSpec.paths[`/api/${resource}/{id}`] = {
        get: {
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
        },
        put: {
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
        },
        patch: {
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
        },
        delete: {
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
        },
      };
    });

    return NextResponse.json(swaggerSpec);
  } catch (error) {
    console.error('Swagger generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
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