import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { withAnalytics } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

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

async function handlePOST(request: NextRequest) {
  try {
    const { selectedEndpoints }: { selectedEndpoints: EndpointConfig[] } = await request.json();

    if (!selectedEndpoints || !Array.isArray(selectedEndpoints)) {
      return NextResponse.json(
        { error: 'Invalid endpoint configuration' },
        { status: 400 }
      );
    }

    const store = dataStore.getData();

    if (!store.isValid) {
      return NextResponse.json(
        { error: 'No valid data available. Please upload and validate JSON first.' },
        { status: 400 }
      );
    }

    // Validate that all requested resources exist in the data
    const availableResources = store.resources;
    const requestedResources = selectedEndpoints.map(config => config.resource);
    const invalidResources = requestedResources.filter(resource => !availableResources.includes(resource));

    if (invalidResources.length > 0) {
      return NextResponse.json(
        { error: `Invalid resources: ${invalidResources.join(', ')}` },
        { status: 400 }
      );
    }

    // Store the endpoint configuration for use by the dynamic API routes
    dataStore.setEndpointConfig(selectedEndpoints);

    // Count total selected endpoints
    const totalEndpoints = selectedEndpoints.reduce((total, config) => 
      total + Object.values(config.endpoints).filter(Boolean).length, 0
    );

    // Generate summary of what was created
    const summary = selectedEndpoints.map(config => {
      const selectedMethods = Object.entries(config.endpoints)
        .filter(([_, enabled]) => enabled)
        .map(([method, _]) => method);
      
      return {
        resource: config.resource,
        endpoints: selectedMethods.length,
        methods: selectedMethods
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${totalEndpoints} API endpoints`,
      summary,
      totalEndpoints,
      resources: requestedResources
    });

  } catch (error) {
    console.error('Endpoint generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate endpoints' },
      { status: 500 }
    );
  }
}

export const POST = withAnalytics(handlePOST);