import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { validateJsonWithSchema } from '@/lib/validation';
import { withAuthAndAnalytics } from '@/lib/middleware';

// Handle OPTIONS requests for CORS
async function handleOPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

async function handleGET(
  request: NextRequest,
  { params }: { params: { resource: string } }
) {
  try {
    const { resource } = params;
    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    // Check if this endpoint is enabled
    if (!dataStore.isEndpointEnabled(resource, 'GET_collection')) {
      return NextResponse.json(
        { error: `GET collection endpoint for '${resource}' is not enabled` },
        { status: 404 }
      );
    }

    const resourceData = store.data[resource];

    if (!resourceData) {
      return NextResponse.json(
        { error: `Resource '${resource}' not found` },
        { status: 404 }
      );
    }

    if (!Array.isArray(resourceData)) {
      return NextResponse.json(
        { error: `Resource '${resource}' is not a collection` },
        { status: 400 }
      );
    }

    return NextResponse.json(resourceData);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to create validation schema with timestamps
function createValidationSchemaWithTimestamps(
  originalSchema: any,
  includeCreatedAt: boolean = false,
  includeUpdatedAt: boolean = false
): any {
  if (!originalSchema) return originalSchema;

  const schema = { ...originalSchema };
  
  if (schema.properties && (includeCreatedAt || includeUpdatedAt)) {
    schema.properties = { ...schema.properties };
    
    if (includeCreatedAt && !schema.properties.createdAt) {
      schema.properties.createdAt = { type: 'string', format: 'date-time' };
    }
    
    if (includeUpdatedAt && !schema.properties.updatedAt) {
      schema.properties.updatedAt = { type: 'string', format: 'date-time' };
    }
  }
  
  return schema;
}

// Helper function to determine timestamp handling strategy
function getTimestampStrategy(itemSchema: any) {
  const allowsAdditionalProperties = itemSchema?.additionalProperties !== false;
  const schemaHasCreatedAt = itemSchema?.properties?.createdAt !== undefined;
  const schemaHasUpdatedAt = itemSchema?.properties?.updatedAt !== undefined;
  
  return {
    allowsAdditionalProperties,
    schemaHasCreatedAt,
    schemaHasUpdatedAt,
    canAddCreatedAt: allowsAdditionalProperties || schemaHasCreatedAt,
    canAddUpdatedAt: allowsAdditionalProperties || schemaHasUpdatedAt
  };
}

async function handlePOST(
  request: NextRequest,
  { params }: { params: { resource: string } }
) {
  try {
    const { resource } = params;
    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    // Check if this endpoint is enabled
    if (!dataStore.isEndpointEnabled(resource, 'POST_collection')) {
      return NextResponse.json(
        { error: `POST collection endpoint for '${resource}' is not enabled` },
        { status: 404 }
      );
    }

    const resourceData = store.data[resource];

    if (!resourceData) {
      return NextResponse.json(
        { error: `Resource '${resource}' not found` },
        { status: 404 }
      );
    }

    if (!Array.isArray(resourceData)) {
      return NextResponse.json(
        { error: `Resource '${resource}' is not a collection` },
        { status: 400 }
      );
    }

    // Parse request body
    let newItem;
    try {
      newItem = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Generate ID if not provided
    if (!newItem.id && !newItem._id && !newItem.uuid) {
      const maxId = resourceData.reduce((max, item) => {
        const itemId = item.id || item._id || 0;
        return typeof itemId === 'number' ? Math.max(max, itemId) : max;
      }, 0);
      newItem.id = maxId + 1;
    }

    // Get the resource schema for validation
    const resourceSchema = store.schema.properties?.[resource];
    let itemSchema = resourceSchema?.items;
    const timestampStrategy = getTimestampStrategy(itemSchema);

    // Add timestamps only if allowed by schema
    const now = new Date().toISOString();
    
    if (timestampStrategy.canAddCreatedAt) {
      newItem.createdAt = now;
    }
    
    if (timestampStrategy.canAddUpdatedAt) {
      newItem.updatedAt = now;
    }

    // Create validation schema with timestamps if needed
    const validationSchema = createValidationSchemaWithTimestamps(
      itemSchema,
      timestampStrategy.canAddCreatedAt && !timestampStrategy.schemaHasCreatedAt,
      timestampStrategy.canAddUpdatedAt && !timestampStrategy.schemaHasUpdatedAt
    );

    // Validate against schema
    if (validationSchema) {
      const validation = validateJsonWithSchema(newItem, validationSchema);
      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validation.errors 
          },
          { status: 400 }
        );
      }
    }

    // Add to collection
    const updatedData = { ...store.data };
    updatedData[resource] = [...resourceData, newItem];

    // Update store
    dataStore.setData(updatedData, store.schema, store.isValid, store.errors);

    return NextResponse.json(newItem, { status: 201 });

  } catch (error) {
    console.error('POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const OPTIONS = withAuthAndAnalytics(handleOPTIONS);
export const GET = withAuthAndAnalytics(handleGET);
export const POST = withAuthAndAnalytics(handlePOST);