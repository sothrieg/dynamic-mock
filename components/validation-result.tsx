"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Globe, Copy, ExternalLink, FileText, Plus, Edit, Trash2, BarChart3 } from 'lucide-react';
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

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'POST':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'PUT':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'DELETE':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return <ExternalLink className="h-3 w-3" />;
      case 'POST':
        return <Plus className="h-3 w-3" />;
      case 'PUT':
      case 'PATCH':
        return <Edit className="h-3 w-3" />;
      case 'DELETE':
        return <Trash2 className="h-3 w-3" />;
      default:
        return <ExternalLink className="h-3 w-3" />;
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
                Your JSON data is valid! Full CRUD API endpoints have been generated successfully with comprehensive validation and real-time monitoring.
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

      {/* Show Analytics Dashboard link immediately after successful validation */}
      {isValid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Real-time API Analytics
            </CardTitle>
            <CardDescription>
              Monitor API performance, track requests, and analyze usage patterns in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="space-y-1">
                <p className="font-medium text-gray-900">
                  Live API Monitoring Dashboard
                </p>
                <p className="text-sm text-gray-600">
                  Real-time metrics, performance analytics, request logs, and comprehensive monitoring
                </p>
              </div>
              <Link href="/analytics">
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show Swagger Documentation link immediately after successful validation */}
      {isValid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Interactive API Documentation
            </CardTitle>
            <CardDescription>
              Complete Swagger documentation with testing interface for all CRUD operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <div className="space-y-1">
                <p className="font-medium text-gray-900">
                  Full CRUD API Documentation
                </p>
                <p className="text-sm text-gray-600">
                  Test all HTTP methods (GET, POST, PUT, PATCH, DELETE) with interactive Swagger UI
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
              Generated CRUD API Endpoints
            </CardTitle>
            <CardDescription>
              Complete REST API with Create, Read, Update, and Delete operations - now with real-time monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {resources.map((resource) => (
              <div key={resource} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-sm">
                    {resource}
                  </Badge>
                  <span className="text-sm text-gray-600">resource collection</span>
                </div>
                
                <div className="space-y-3 ml-4">
                  {/* Collection endpoints */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Collection Operations</h4>
                    
                    {/* GET Collection */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getMethodColor('GET')}>
                          {getMethodIcon('GET')}
                          <span className="ml-1">GET</span>
                        </Badge>
                        <code className="text-sm font-mono">
                          {baseUrl}/api/{resource}
                        </code>
                        <span className="text-xs text-gray-500">Get all items</span>
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

                    {/* POST Collection */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getMethodColor('POST')}>
                          {getMethodIcon('POST')}
                          <span className="ml-1">POST</span>
                        </Badge>
                        <code className="text-sm font-mono">
                          {baseUrl}/api/{resource}
                        </code>
                        <span className="text-xs text-gray-500">Create new item</span>
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
                      </div>
                    </div>
                  </div>

                  {/* Individual item endpoints */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Item Operations</h4>
                    
                    {/* GET Item */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getMethodColor('GET')}>
                          {getMethodIcon('GET')}
                          <span className="ml-1">GET</span>
                        </Badge>
                        <code className="text-sm font-mono">
                          {baseUrl}/api/{resource}/[id]
                        </code>
                        <span className="text-xs text-gray-500">Get specific item</span>
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

                    {/* PUT Item */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getMethodColor('PUT')}>
                          {getMethodIcon('PUT')}
                          <span className="ml-1">PUT</span>
                        </Badge>
                        <code className="text-sm font-mono">
                          {baseUrl}/api/{resource}/[id]
                        </code>
                        <span className="text-xs text-gray-500">Replace entire item</span>
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

                    {/* PATCH Item */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getMethodColor('PATCH')}>
                          {getMethodIcon('PATCH')}
                          <span className="ml-1">PATCH</span>
                        </Badge>
                        <code className="text-sm font-mono">
                          {baseUrl}/api/{resource}/[id]
                        </code>
                        <span className="text-xs text-gray-500">Partial update</span>
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

                    {/* DELETE Item */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getMethodColor('DELETE')}>
                          {getMethodIcon('DELETE')}
                          <span className="ml-1">DELETE</span>
                        </Badge>
                        <code className="text-sm font-mono">
                          {baseUrl}/api/{resource}/[id]
                        </code>
                        <span className="text-xs text-gray-500">Delete item</span>
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
                </div>

                {resource !== resources[resources.length - 1] && (
                  <Separator className="my-6" />
                )}
              </div>
            ))}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Full CRUD Operations with Real-time Monitoring:</strong></p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• <strong>GET</strong> - Retrieve data (collections and individual items)</li>
                    <li>• <strong>POST</strong> - Create new items with automatic ID generation</li>
                    <li>• <strong>PUT</strong> - Replace entire items with validation</li>
                    <li>• <strong>PATCH</strong> - Update specific fields only</li>
                    <li>• <strong>DELETE</strong> - Remove items permanently</li>
                    <li>• <strong>Analytics</strong> - Real-time monitoring and performance tracking</li>
                  </ul>
                  <p className="text-sm mt-2">
                    All operations include comprehensive validation, automatic timestamp management, and real-time analytics tracking.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}