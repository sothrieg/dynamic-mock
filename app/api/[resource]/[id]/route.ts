import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { validateJsonWithSchema } from '@/lib/validation';
import { withAnalytics } from '@/lib/middleware';

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
  { params }: { params: { resource: string; id: string } }
) {
  try {
    const { resource, id } = params;
    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    // Check if this endpoint is enabled
    if (!dataStore.isEndpointEnabled(resource, 'GET_item')) {
      return NextResponse.json(
        { error: `GET item endpoint for '${resource}' is not enabled` },
        { status: 404 }
      );
    }

    const item = dataStore.getResourceItem(resource, id);

    if (!item) {
      return NextResponse.json(
        { error: `Item with id '${id}' not found in resource '${resource}'` },
        { status: 404 }
      );
    }

    return NextResponse.json(item);

  } catch (error) {
    console.error('GET API error:', error);
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

async function handlePUT(
  request: NextRequest,
  { params }: { params: { resource: string; id: string } }
) {
  try {
    const { resource, id } = params;
    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    // Check if this endpoint is enabled
    if (!dataStore.isEndpointEnabled(resource, 'PUT_item')) {
      return NextResponse.json(
        { error: `PUT item endpoint for '${resource}' is not enabled` },
        { status: 404 }
      );
    }

    const resourceData = store.data[resource];
    if (!Array.isArray(resourceData)) {
      return NextResponse.json(
        { error: `Resource '${resource}' not found or is not a collection` },
        { status: 404 }
      );
    }

    // Find existing item
    const itemIndex = resourceData.findIndex(item => 
      item.id === id || 
      item.id === parseInt(id) || 
      item._id === id ||
      item.uuid === id
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: `Item with id '${id}' not found in resource '${resource}'` },
        { status: 404 }
      );
    }

    // Parse request body
    let updatedItem;
    try {
      updatedItem = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const existingItem = resourceData[itemIndex];

    // Preserve original ID and createdAt
    updatedItem.id = existingItem.id || existingItem._id || existingItem.uuid;
    if (existingItem._id) updatedItem._id = existingItem._id;
    if (existingItem.uuid) updatedItem.uuid = existingItem.uuid;
    if (existingItem.createdAt) updatedItem.createdAt = existingItem.createdAt;
    
    // Get the resource schema for validation
    const resourceSchema = store.schema.properties?.[resource];
    let itemSchema = resourceSchema?.items;
    const timestampStrategy = getTimestampStrategy(itemSchema);

    // Add updatedAt timestamp only if allowed by schema
    if (timestampStrategy.canAddUpdatedAt) {
      updatedItem.updatedAt = new Date().toISOString();
    }

    // Create validation schema with timestamps if needed
    const validationSchema = createValidationSchemaWithTimestamps(
      itemSchema,
      false, // Don't add createdAt for PUT (should be preserved)
      timestampStrategy.canAddUpdatedAt && !timestampStrategy.schemaHasUpdatedAt
    );

    // Validate against schema
    if (validationSchema) {
      const validation = validateJsonWithSchema(updatedItem, validationSchema);
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

    // Update the item
    const updatedData = { ...store.data };
    updatedData[resource] = [...resourceData];
    updatedData[resource][itemIndex] = updatedItem;

    // Update store
    dataStore.setData(updatedData, store.schema, store.isValid, store.errors);

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error('PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePATCH(
  request: NextRequest,
  { params }: { params: { resource: string; id: string } }
) {
  try {
    const { resource, id } = params;
    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    // Check if this endpoint is enabled
    if (!dataStore.isEndpointEnabled(resource, 'PATCH_item')) {
      return NextResponse.json(
        { error: `PATCH item endpoint for '${resource}' is not enabled` },
        { status: 404 }
      );
    }

    const resourceData = store.data[resource];
    if (!Array.isArray(resourceData)) {
      return NextResponse.json(
        { error: `Resource '${resource}' not found or is not a collection` },
        { status: 404 }
      );
    }

    // Find existing item
    const itemIndex = resourceData.findIndex(item => 
      item.id === id || 
      item.id === parseInt(id) || 
      item._id === id ||
      item.uuid === id
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: `Item with id '${id}' not found in resource '${resource}'` },
        { status: 404 }
      );
    }

    // Parse request body
    let partialUpdate;
    try {
      partialUpdate = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const existingItem = resourceData[itemIndex];

    // Get the resource schema for validation
    const resourceSchema = store.schema.properties?.[resource];
    let itemSchema = resourceSchema?.items;
    const timestampStrategy = getTimestampStrategy(itemSchema);

    // Merge with existing item (partial update)
    const updatedItem = {
      ...existingItem,
      ...partialUpdate,
      // Preserve critical fields
      id: existingItem.id || existingItem._id || existingItem.uuid,
      createdAt: existingItem.createdAt
    };

    // Preserve original ID fields
    if (existingItem._id) updatedItem._id = existingItem._id;
    if (existingItem.uuid) updatedItem.uuid = existingItem.uuid;

    // Add updatedAt timestamp only if allowed by schema
    if (timestampStrategy.canAddUpdatedAt) {
      updatedItem.updatedAt = new Date().toISOString();
    }

    // Create validation schema with timestamps if needed
    const validationSchema = createValidationSchemaWithTimestamps(
      itemSchema,
      false, // Don't add createdAt for PATCH (should be preserved)
      timestampStrategy.canAddUpdatedAt && !timestampStrategy.schemaHasUpdatedAt
    );

    // Validate against schema
    if (validationSchema) {
      const validation = validateJsonWithSchema(updatedItem, validationSchema);
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

    // Update the item
    const updatedData = { ...store.data };
    updatedData[resource] = [...resourceData];
    updatedData[resource][itemIndex] = updatedItem;

    // Update store
    dataStore.setData(updatedData, store.schema, store.isValid, store.errors);

    return NextResponse.json(updatedItem);

  } catch (error) {
    console.error('PATCH API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleDELETE(
  request: NextRequest,
  { params }: { params: { resource: string; id: string } }
) {
  try {
    const { resource, id } = params;
    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    // Check if this endpoint is enabled
    if (!dataStore.isEndpointEnabled(resource, 'DELETE_item')) {
      return NextResponse.json(
        { error: `DELETE item endpoint for '${resource}' is not enabled` },
        { status: 404 }
      );
    }

    const resourceData = store.data[resource];
    if (!Array.isArray(resourceData)) {
      return NextResponse.json(
        { error: `Resource '${resource}' not found or is not a collection` },
        { status: 404 }
      );
    }

    // Find existing item
    const itemIndex = resourceData.findIndex(item => 
      item.id === id || 
      item.id === parseInt(id) || 
      item._id === id ||
      item.uuid === id
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: `Item with id '${id}' not found in resource '${resource}'` },
        { status: 404 }
      );
    }

    const deletedItem = resourceData[itemIndex];

    // Remove the item
    const updatedData = { ...store.data };
    updatedData[resource] = resourceData.filter((_, index) => index !== itemIndex);

    // Update store
    dataStore.setData(updatedData, store.schema, store.isValid, store.errors);

    return NextResponse.json({ 
      message: `Item with id '${id}' deleted successfully`,
      deletedItem 
    });

  } catch (error) {
    console.error('DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const OPTIONS = withAnalytics(handleOPTIONS);
export const GET = withAnalytics(handleGET);
export const PUT = withAnalytics(handlePUT);
export const PATCH = withAnalytics(handlePATCH);
export const DELETE = withAnalytics(handleDELETE);