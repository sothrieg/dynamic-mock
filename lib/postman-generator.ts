export interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string;
    version: string;
  };
  item: PostmanFolder[];
  variable?: PostmanVariable[];
  auth?: any;
  event?: any[];
}

export interface PostmanFolder {
  name: string;
  description?: string;
  item: PostmanRequest[];
}

export interface PostmanRequest {
  name: string;
  request: {
    method: string;
    header: PostmanHeader[];
    url: PostmanUrl;
    body?: PostmanBody;
    description?: string;
  };
  response?: any[];
}

export interface PostmanHeader {
  key: string;
  value: string;
  type: string;
}

export interface PostmanUrl {
  raw: string;
  host: string[];
  path: string[];
  variable?: PostmanVariable[];
}

export interface PostmanBody {
  mode: string;
  raw: string;
  options?: {
    raw: {
      language: string;
    };
  };
}

export interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
  description?: string;
}

interface EndpointConfig {
  resource: string;
  endpoints: {
    'GET_collection': boolean;
    'POST_collection': boolean;
    'GET_item': boolean;
    'PUT_item': boolean;
    'PATCH_item': boolean;
    'DELETE_item': boolean;
  };
}

export class PostmanCollectionGenerator {
  private baseUrl: string;
  private data: Record<string, any>;
  private schema: Record<string, any>;
  private endpointConfig: EndpointConfig[] | undefined;

  constructor(
    baseUrl: string,
    data: Record<string, any>,
    schema: Record<string, any>,
    endpointConfig?: EndpointConfig[]
  ) {
    this.baseUrl = baseUrl;
    this.data = data;
    this.schema = schema;
    this.endpointConfig = endpointConfig;
  }

  generateCollection(): PostmanCollection {
    const collection: PostmanCollection = {
      info: {
        name: "Generated REST API Collection",
        description: "Auto-generated Postman collection for JSON Schema API with comprehensive CRUD operations and validation examples",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        version: "2.0.0"
      },
      item: [],
      variable: [
        {
          key: "baseUrl",
          value: this.baseUrl,
          type: "string",
          description: "Base URL for the API"
        }
      ]
    };

    // Get available resources
    const resources = Object.keys(this.data).filter(key => Array.isArray(this.data[key]));

    // Generate folders for each resource
    resources.forEach(resource => {
      const resourceConfig = this.endpointConfig?.find(config => config.resource === resource);
      const hasEnabledEndpoints = resourceConfig 
        ? Object.values(resourceConfig.endpoints).some(Boolean)
        : true;

      if (!hasEnabledEndpoints) return;

      const folder = this.generateResourceFolder(resource, resourceConfig);
      if (folder.item.length > 0) {
        collection.item.push(folder);
      }
    });

    // Add utility folder with documentation endpoints
    collection.item.push(this.generateUtilityFolder());

    return collection;
  }

  private generateResourceFolder(resource: string, resourceConfig?: EndpointConfig): PostmanFolder {
    const folder: PostmanFolder = {
      name: `${resource.charAt(0).toUpperCase() + resource.slice(1)} API`,
      description: `CRUD operations for ${resource} resource with validation`,
      item: []
    };

    const resourceData = this.data[resource];
    const sampleItem = resourceData && resourceData.length > 0 ? resourceData[0] : {};
    const sampleId = sampleItem.id || sampleItem._id || sampleItem.uuid || "1";

    // Collection endpoints
    if (this.isEndpointEnabled(resourceConfig, 'GET_collection')) {
      folder.item.push(this.generateGetCollectionRequest(resource));
    }

    if (this.isEndpointEnabled(resourceConfig, 'POST_collection')) {
      folder.item.push(this.generatePostCollectionRequest(resource, sampleItem));
    }

    // Item endpoints
    if (this.isEndpointEnabled(resourceConfig, 'GET_item')) {
      folder.item.push(this.generateGetItemRequest(resource, sampleId));
    }

    if (this.isEndpointEnabled(resourceConfig, 'PUT_item')) {
      folder.item.push(this.generatePutItemRequest(resource, sampleId, sampleItem));
    }

    if (this.isEndpointEnabled(resourceConfig, 'PATCH_item')) {
      folder.item.push(this.generatePatchItemRequest(resource, sampleId, sampleItem));
    }

    if (this.isEndpointEnabled(resourceConfig, 'DELETE_item')) {
      folder.item.push(this.generateDeleteItemRequest(resource, sampleId));
    }

    return folder;
  }

  private generateUtilityFolder(): PostmanFolder {
    return {
      name: "📚 API Documentation & Utilities",
      description: "Utility endpoints for API documentation and analytics",
      item: [
        {
          name: "Get API Documentation (Swagger)",
          request: {
            method: "GET",
            header: [
              {
                key: "Accept",
                value: "application/json",
                type: "text"
              }
            ],
            url: {
              raw: "{{baseUrl}}/api/swagger",
              host: ["{{baseUrl}}"],
              path: ["api", "swagger"]
            },
            description: "Retrieve the complete OpenAPI 3.0 specification for the generated API"
          }
        },
        {
          name: "Get API Analytics Metrics",
          request: {
            method: "GET",
            header: [
              {
                key: "Accept",
                value: "application/json",
                type: "text"
              }
            ],
            url: {
              raw: "{{baseUrl}}/api/analytics?type=metrics",
              host: ["{{baseUrl}}"],
              path: ["api", "analytics"],
              variable: [
                {
                  key: "type",
                  value: "metrics",
                  description: "Type of analytics data to retrieve"
                }
              ]
            },
            description: "Get comprehensive API usage metrics and performance data"
          }
        },
        {
          name: "Get Recent API Requests",
          request: {
            method: "GET",
            header: [
              {
                key: "Accept",
                value: "application/json",
                type: "text"
              }
            ],
            url: {
              raw: "{{baseUrl}}/api/analytics?type=requests&limit=50",
              host: ["{{baseUrl}}"],
              path: ["api", "analytics"],
              variable: [
                {
                  key: "type",
                  value: "requests",
                  description: "Type of analytics data"
                },
                {
                  key: "limit",
                  value: "50",
                  description: "Number of recent requests to retrieve"
                }
              ]
            },
            description: "Retrieve the most recent API requests with details"
          }
        }
      ]
    };
  }

  private generateGetCollectionRequest(resource: string): PostmanRequest {
    return {
      name: `📋 Get All ${resource}`,
      request: {
        method: "GET",
        header: [
          {
            key: "Accept",
            value: "application/json",
            type: "text"
          }
        ],
        url: {
          raw: `{{baseUrl}}/api/${resource}`,
          host: ["{{baseUrl}}"],
          path: ["api", resource]
        },
        description: `Retrieve all items from the ${resource} collection. Returns an array of all ${resource} objects with their complete data.`
      }
    };
  }

  private generatePostCollectionRequest(resource: string, sampleItem: any): PostmanRequest {
    const inputSample = this.createInputSample(sampleItem);
    
    return {
      name: `➕ Create New ${resource.slice(0, -1)}`,
      request: {
        method: "POST",
        header: [
          {
            key: "Content-Type",
            value: "application/json",
            type: "text"
          },
          {
            key: "Accept",
            value: "application/json",
            type: "text"
          }
        ],
        url: {
          raw: `{{baseUrl}}/api/${resource}`,
          host: ["{{baseUrl}}"],
          path: ["api", resource]
        },
        body: {
          mode: "raw",
          raw: JSON.stringify(inputSample, null, 2),
          options: {
            raw: {
              language: "json"
            }
          }
        },
        description: `Create a new ${resource.slice(0, -1)} item. The ID will be auto-generated if not provided. Timestamps (createdAt, updatedAt) are automatically managed.`
      }
    };
  }

  private generateGetItemRequest(resource: string, sampleId: any): PostmanRequest {
    return {
      name: `🔍 Get ${resource.slice(0, -1)} by ID`,
      request: {
        method: "GET",
        header: [
          {
            key: "Accept",
            value: "application/json",
            type: "text"
          }
        ],
        url: {
          raw: `{{baseUrl}}/api/${resource}/${sampleId}`,
          host: ["{{baseUrl}}"],
          path: ["api", resource, sampleId.toString()],
          variable: [
            {
              key: "id",
              value: sampleId.toString(),
              description: `ID of the ${resource.slice(0, -1)} to retrieve`
            }
          ]
        },
        description: `Retrieve a specific ${resource.slice(0, -1)} by its ID. Supports id, _id, and uuid fields for identification.`
      }
    };
  }

  private generatePutItemRequest(resource: string, sampleId: any, sampleItem: any): PostmanRequest {
    const inputSample = this.createInputSample(sampleItem);
    
    return {
      name: `🔄 Replace ${resource.slice(0, -1)} (Full Update)`,
      request: {
        method: "PUT",
        header: [
          {
            key: "Content-Type",
            value: "application/json",
            type: "text"
          },
          {
            key: "Accept",
            value: "application/json",
            type: "text"
          }
        ],
        url: {
          raw: `{{baseUrl}}/api/${resource}/${sampleId}`,
          host: ["{{baseUrl}}"],
          path: ["api", resource, sampleId.toString()],
          variable: [
            {
              key: "id",
              value: sampleId.toString(),
              description: `ID of the ${resource.slice(0, -1)} to replace`
            }
          ]
        },
        body: {
          mode: "raw",
          raw: JSON.stringify(inputSample, null, 2),
          options: {
            raw: {
              language: "json"
            }
          }
        },
        description: `Replace an entire ${resource.slice(0, -1)} item with new data. All fields should be provided as this replaces the complete object.`
      }
    };
  }

  private generatePatchItemRequest(resource: string, sampleId: any, sampleItem: any): PostmanRequest {
    const partialSample = this.createPartialSample(sampleItem);
    
    return {
      name: `✏️ Update ${resource.slice(0, -1)} (Partial Update)`,
      request: {
        method: "PATCH",
        header: [
          {
            key: "Content-Type",
            value: "application/json",
            type: "text"
          },
          {
            key: "Accept",
            value: "application/json",
            type: "text"
          }
        ],
        url: {
          raw: `{{baseUrl}}/api/${resource}/${sampleId}`,
          host: ["{{baseUrl}}"],
          path: ["api", resource, sampleId.toString()],
          variable: [
            {
              key: "id",
              value: sampleId.toString(),
              description: `ID of the ${resource.slice(0, -1)} to update`
            }
          ]
        },
        body: {
          mode: "raw",
          raw: JSON.stringify(partialSample, null, 2),
          options: {
            raw: {
              language: "json"
            }
          }
        },
        description: `Partially update a ${resource.slice(0, -1)} item. Only include the fields you want to update. Other fields will remain unchanged.`
      }
    };
  }

  private generateDeleteItemRequest(resource: string, sampleId: any): PostmanRequest {
    return {
      name: `🗑️ Delete ${resource.slice(0, -1)}`,
      request: {
        method: "DELETE",
        header: [
          {
            key: "Accept",
            value: "application/json",
            type: "text"
          }
        ],
        url: {
          raw: `{{baseUrl}}/api/${resource}/${sampleId}`,
          host: ["{{baseUrl}}"],
          path: ["api", resource, sampleId.toString()],
          variable: [
            {
              key: "id",
              value: sampleId.toString(),
              description: `ID of the ${resource.slice(0, -1)} to delete`
            }
          ]
        },
        description: `Permanently delete a ${resource.slice(0, -1)} item. This action cannot be undone.`
      }
    };
  }

  private createInputSample(sampleItem: any): any {
    const input = { ...sampleItem };
    
    // Remove auto-generated fields
    delete input.id;
    delete input._id;
    delete input.uuid;
    delete input.createdAt;
    delete input.updatedAt;
    
    // Update sample values to make them more realistic for testing
    if (input.name && typeof input.name === 'string') {
      input.name = "New " + input.name;
    }
    if (input.email && typeof input.email === 'string') {
      input.email = "new.user@example.com";
    }
    if (input.title && typeof input.title === 'string') {
      input.title = "New " + input.title;
    }
    
    return input;
  }

  private createPartialSample(sampleItem: any): any {
    const partial: any = {};
    
    // Include only a few fields for partial update example
    const fieldsToInclude = ['name', 'title', 'description', 'status', 'isActive', 'role'];
    
    fieldsToInclude.forEach(field => {
      if (sampleItem[field] !== undefined) {
        if (typeof sampleItem[field] === 'string') {
          partial[field] = "Updated " + sampleItem[field];
        } else if (typeof sampleItem[field] === 'boolean') {
          partial[field] = !sampleItem[field];
        } else {
          partial[field] = sampleItem[field];
        }
      }
    });
    
    // If no suitable fields found, include the first non-system field
    if (Object.keys(partial).length === 0) {
      const systemFields = ['id', '_id', 'uuid', 'createdAt', 'updatedAt'];
      const firstField = Object.keys(sampleItem).find(key => !systemFields.includes(key));
      if (firstField) {
        partial[firstField] = "Updated value";
      }
    }
    
    return partial;
  }

  private isEndpointEnabled(resourceConfig: EndpointConfig | undefined, method: string): boolean {
    if (!resourceConfig) return true; // Show all if no config
    
    const methodMap: Record<string, keyof EndpointConfig['endpoints']> = {
      'GET_collection': 'GET_collection',
      'POST_collection': 'POST_collection',
      'GET_item': 'GET_item',
      'PUT_item': 'PUT_item',
      'PATCH_item': 'PATCH_item',
      'DELETE_item': 'DELETE_item'
    };
    
    const endpointKey = methodMap[method];
    return endpointKey ? resourceConfig.endpoints[endpointKey] : false;
  }
}

export function generatePostmanCollection(
  baseUrl: string,
  data: Record<string, any>,
  schema: Record<string, any>,
  endpointConfig?: EndpointConfig[]
): PostmanCollection {
  const generator = new PostmanCollectionGenerator(baseUrl, data, schema, endpointConfig);
  return generator.generateCollection();
}