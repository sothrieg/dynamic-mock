import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

export function validateJsonWithSchema(data: any, schema: any): ValidationResult {
  try {
    // Create AJV instance with strict mode for better validation
    const ajv = new Ajv({ 
      allErrors: true,
      strict: false, // Allow unknown keywords for better compatibility
      validateFormats: true, // Enable format validation
      formats: {
        // Add custom formats if needed
        'phone': /^\+?[1-9]\d{1,14}$/, // Simple international phone format
        'slug': /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // URL slug format
      }
    });
    
    // Add format validators (email, uri, date, etc.)
    addFormats(ajv);
    
    // Compile the schema
    const validate = ajv.compile(schema);
    
    // Validate the data
    const valid = validate(data);

    if (valid) {
      return {
        isValid: true,
        errors: [],
        data
      };
    } else {
      const errors = validate.errors?.map((error: ErrorObject) => {
        const path = error.instancePath || error.schemaPath || '';
        const field = path ? `Field "${path.replace(/^\//, '').replace(/\//g, '.')}"` : 'Root';
        
        // Provide more descriptive error messages for format validation
        if (error.keyword === 'format') {
          const format = error.params?.format;
          switch (format) {
            case 'email':
              return `${field}: Must be a valid email address (e.g., user@example.com)`;
            case 'uri':
              return `${field}: Must be a valid URI (e.g., https://example.com)`;
            case 'date':
              return `${field}: Must be a valid date in YYYY-MM-DD format`;
            case 'date-time':
              return `${field}: Must be a valid date-time in ISO 8601 format`;
            case 'time':
              return `${field}: Must be a valid time in HH:MM:SS format`;
            case 'ipv4':
              return `${field}: Must be a valid IPv4 address`;
            case 'ipv6':
              return `${field}: Must be a valid IPv6 address`;
            case 'hostname':
              return `${field}: Must be a valid hostname`;
            case 'phone':
              return `${field}: Must be a valid phone number`;
            case 'slug':
              return `${field}: Must be a valid URL slug (lowercase letters, numbers, and hyphens only)`;
            default:
              return `${field}: Must match format "${format}"`;
          }
        }
        
        // Provide better error messages for other validation types
        switch (error.keyword) {
          case 'required':
            return `Missing required field: "${error.params?.missingProperty}"`;
          case 'type':
            return `${field}: Expected ${error.params?.type}, got ${typeof error.data}`;
          case 'minimum':
            return `${field}: Must be at least ${error.params?.limit}`;
          case 'maximum':
            return `${field}: Must be at most ${error.params?.limit}`;
          case 'minLength':
            return `${field}: Must be at least ${error.params?.limit} characters long`;
          case 'maxLength':
            return `${field}: Must be at most ${error.params?.limit} characters long`;
          case 'pattern':
            return `${field}: Must match the required pattern`;
          case 'enum':
            return `${field}: Must be one of: ${error.params?.allowedValues?.join(', ')}`;
          case 'additionalProperties':
            return `${field}: Additional property "${error.params?.additionalProperty}" is not allowed`;
          default:
            return `${field}: ${error.message}`;
        }
      }) || ['Unknown validation error'];

      return {
        isValid: false,
        errors,
        data
      };
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Validation failed'],
      data
    };
  }
}

export function extractResourcesFromData(data: Record<string, any>): string[] {
  return Object.keys(data).filter(key => Array.isArray(data[key]));
}

// Helper function to create a sample schema with format validation examples
export function createSampleSchemaWithFormats() {
  return {
    type: "object",
    properties: {
      users: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string", minLength: 1 },
            email: { type: "string", format: "email" },
            website: { type: "string", format: "uri" },
            birthDate: { type: "string", format: "date" },
            createdAt: { type: "string", format: "date-time" },
            phone: { type: "string", format: "phone" },
            isActive: { type: "boolean" },
            role: { 
              type: "string", 
              enum: ["admin", "user", "moderator"] 
            }
          },
          required: ["id", "name", "email"],
          additionalProperties: false
        }
      },
      products: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string", minLength: 1, maxLength: 100 },
            price: { type: "number", minimum: 0 },
            description: { type: "string" },
            category: { type: "string" },
            inStock: { type: "boolean" },
            tags: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["id", "name", "price"],
          additionalProperties: false
        }
      }
    },
    required: ["users", "products"],
    additionalProperties: false
  };
}