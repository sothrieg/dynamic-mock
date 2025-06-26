import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { validateJsonWithSchema } from '@/lib/validation';

export async function GET(
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

export async function PUT(
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
    
    // Update timestamp
    updatedItem.updatedAt = new Date().toISOString();

    // Validate against schema
    const resourceSchema = store.schema.properties?.[resource];
    if (resourceSchema?.items) {
      const validation = validateJsonWithSchema(updatedItem, resourceSchema.items);
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

export async function PATCH(
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

    // Merge with existing item (partial update)
    const updatedItem = {
      ...existingItem,
      ...partialUpdate,
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

export async function DELETE(
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