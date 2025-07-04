import { NextRequest, NextResponse } from 'next/server';
import { validateJsonWithSchema } from '@/lib/validation';
import { dataStore } from '@/lib/data-store';
import { withAnalytics } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

async function handlePOST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const jsonFile = formData.get('jsonFile') as File;
    const schemaFile = formData.get('schemaFile') as File;

    if (!jsonFile || !schemaFile) {
      return NextResponse.json(
        { error: 'Both JSON and Schema files are required' },
        { status: 400 }
      );
    }

    // Read file contents
    const jsonContent = await jsonFile.text();
    const schemaContent = await schemaFile.text();

    let jsonData: Record<string, any>;
    let schemaData: Record<string, any>;

    try {
      jsonData = JSON.parse(jsonContent) as Record<string, any>;
      schemaData = JSON.parse(schemaContent) as Record<string, any>;
    } catch (error) {
      return NextResponse.json(
        { 
          isValid: false, 
          errors: ['Invalid JSON format in one of the files'],
          resources: []
        },
        { status: 400 }
      );
    }

    // Validate JSON against schema
    const validationResult = validateJsonWithSchema(jsonData, schemaData);

    // Store data in memory store
    dataStore.setData(
      jsonData, 
      schemaData, 
      validationResult.isValid, 
      validationResult.errors
    );

    const resources = Object.keys(jsonData).filter(
      (key) => Array.isArray(jsonData[key])
    );

    return NextResponse.json({
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      resources
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { 
        isValid: false, 
        errors: ['Server error during validation'],
        resources: []
      },
      { status: 500 }
    );
  }
}

async function handleDELETE(request: NextRequest) {
  try {
    // Clear the data store
    dataStore.clear();
    
    return NextResponse.json({
      message: 'All data and endpoints have been cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}

export const POST = withAnalytics(handlePOST);
export const DELETE = withAnalytics(handleDELETE);