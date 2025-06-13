"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Globe, Copy, ExternalLink, FileText } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface ValidationResultProps {
  isValid: boolean;
  errors: string[];
  resources: string[];
}

export function ValidationResult({ isValid, errors, resources }: ValidationResultProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(text);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const testEndpoint = async (endpoint: string) => {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      console.log('API Response:', data);
      // You could show a modal or toast with the response
    } catch (err) {
      console.error('Failed to test endpoint:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isValid ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            Validation Result
          </CardTitle>
          <CardDescription>
            {isValid ? 'JSON successfully validated against schema' : 'Validation failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isValid ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your JSON data is valid! API endpoints have been generated successfully.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-1">
                  <p className="font-medium">Validation errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Show Swagger Documentation link immediately after successful validation */}
      {isValid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              API Documentation
            </CardTitle>
            <CardDescription>
              Interactive Swagger documentation for testing your API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <div className="space-y-1">
                <p className="font-medium text-gray-900">
                  Interactive API Documentation
                </p>
                <p className="text-sm text-gray-600">
                  Test your API endpoints with Swagger UI interface
                </p>
              </div>
              <Link href="/swagger">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <FileText className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {isValid && resources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Generated API Endpoints
            </CardTitle>
            <CardDescription>
              REST API endpoints based on your JSON structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resources.map((resource) => (
              <div key={resource} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {resource}
                  </Badge>
                  <span className="text-sm text-gray-600">resource</span>
                </div>
                
                <div className="space-y-2 ml-4">
                  {/* Collection endpoint */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        GET
                      </Badge>
                      <code className="text-sm font-mono">
                        {baseUrl}/api/{resource}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`${baseUrl}/api/${resource}`)}
                      >
                        {copiedEndpoint === `${baseUrl}/api/${resource}` ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testEndpoint(`/api/${resource}`)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Individual item endpoint */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        GET
                      </Badge>
                      <code className="text-sm font-mono">
                        {baseUrl}/api/{resource}/[id]
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`${baseUrl}/api/${resource}/[id]`)}
                      >
                        {copiedEndpoint === `${baseUrl}/api/${resource}/[id]` ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {resource !== resources[resources.length - 1] && (
                  <Separator className="my-4" />
                )}
              </div>
            ))}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Usage:</strong> Use the collection endpoints to get all items, 
                and the [id] endpoints to get specific items by their ID field.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}