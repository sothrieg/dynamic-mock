import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { validateJsonWithSchema } from '@/lib/validation';
import { withAnalytics } from '@/lib/middleware';

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

    // Add timestamps
    const now = new Date().toISOString();
    newItem.createdAt = now;
    newItem.updatedAt = now;

    // Validate against schema
    const resourceSchema = store.schema.properties?.[resource];
    if (resourceSchema?.items) {
      const validation = validateJsonWithSchema(newItem, resourceSchema.items);
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

export const GET = withAnalytics(handleGET);
export const POST = withAnalytics(handlePOST);