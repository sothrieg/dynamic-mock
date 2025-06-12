import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
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
        description: 'REST API endpoints generated from uploaded JSON data and schema',
        version: '1.0.0',
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
      
      // Create schema definition
      swaggerSpec.components.schemas[schemaName] = generateSchemaFromObject(sampleItem);

      // Collection endpoint
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
      };

      // Individual item endpoint
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