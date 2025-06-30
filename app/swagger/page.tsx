"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, FileText, RefreshCw, Download, Copy, CheckCircle, ExternalLink, Code, BookOpen } from 'lucide-react';
import Link from 'next/link';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic<any>(() => import('swagger-ui-react'), { ssr: false });

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  operationId: string;
}

export default function SwaggerPage() {
  const [swaggerSpec, setSwaggerSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchSwaggerSpec = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/swagger');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch API documentation');
      }
      
      const spec = await response.json();
      setSwaggerSpec(spec);
      
      // Extract endpoints for quick reference
      const extractedEndpoints: ApiEndpoint[] = [];
      Object.entries(spec.paths || {}).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, details]: [string, any]) => {
          extractedEndpoints.push({
            method: method.toUpperCase(),
            path,
            description: details.summary || details.description || '',
            operationId: details.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`
          });
        });
      });
      setEndpoints(extractedEndpoints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwaggerSpec();
  }, []);

  const downloadSpec = () => {
    if (!swaggerSpec) return;
    
    const blob = new Blob([JSON.stringify(swaggerSpec, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-specification.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800 border-green-200';
      case 'POST': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PUT': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'PATCH': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const generateCurlCommand = (endpoint: ApiEndpoint) => {
    // Get the correct base URL for Docker environments
    let baseUrl = '';
    if (typeof window !== 'undefined') {
      const currentHost = window.location.host;
      const protocol = window.location.protocol;
      
      // If we're accessing via 0.0.0.0, replace with localhost for curl examples
      if (currentHost.includes('0.0.0.0')) {
        const port = currentHost.split(':')[1] || '3000';
        baseUrl = `http://localhost:${port}`;
      } else {
        baseUrl = `${protocol}//${currentHost}`;
      }
    }
    
    let curl = `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}"`;
    
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`;
    }
    
    return curl;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Loading interactive API documentation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                API Documentation
              </h1>
              <p className="text-gray-600">
                Interactive Swagger documentation for your generated REST API
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Documentation Not Available
                </CardTitle>
                <CardDescription>
                  Unable to generate API documentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
                
                <div className="flex gap-4">
                  <Button onClick={fetchSwaggerSpec} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Link href="/">
                    <Button>
                      <FileText className="h-4 w-4 mr-2" />
                      Upload JSON & Schema
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Interactive API Documentation
            </h1>
            <p className="text-gray-600">
              Complete REST API documentation with live testing capabilities
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Back to Upload
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </Link>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchSwaggerSpec} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={downloadSpec} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Spec
              </Button>
            </div>
          </div>

          {/* Docker Environment Notice */}
          {typeof window !== 'undefined' && window.location.host.includes('0.0.0.0') && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p className="font-medium">Docker Environment Detected</p>
                  <p className="text-sm">
                    You're running in a Docker container. The API is accessible at this URL, but for external access 
                    you may need to use <code>localhost:3000</code> instead of <code>0.0.0.0:3000</code> in your applications.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* API Overview */}
          {swaggerSpec && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  API Overview
                </CardTitle>
                <CardDescription>
                  {swaggerSpec.info?.description || 'Generated REST API endpoints'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{endpoints.length}</div>
                    <div className="text-sm text-blue-800">Total Endpoints</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.keys(swaggerSpec.components?.schemas || {}).length}
                    </div>
                    <div className="text-sm text-green-800">Data Models</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {swaggerSpec.info?.version || '1.0.0'}
                    </div>
                    <div className="text-sm text-purple-800">API Version</div>
                  </div>
                </div>

                {/* Quick Reference */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Quick Reference</h4>
                  <div className="grid gap-2">
                    {endpoints.slice(0, 6).map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono">{endpoint.path}</code>
                          <span className="text-xs text-gray-500">{endpoint.description}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(generateCurlCommand(endpoint))}
                        >
                          {copiedText === generateCurlCommand(endpoint) ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                    {endpoints.length > 6 && (
                      <div className="text-center text-sm text-gray-500">
                        ... and {endpoints.length - 6} more endpoints below
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabbed Interface */}
          <Tabs defaultValue="interactive" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="interactive">Interactive Documentation</TabsTrigger>
              <TabsTrigger value="endpoints">Endpoints Reference</TabsTrigger>
              <TabsTrigger value="examples">Code Examples</TabsTrigger>
            </TabsList>

            {/* Interactive Swagger UI */}
            <TabsContent value="interactive">
              <Card>
                <CardContent className="p-0">
                  <div className="swagger-container">
                    <SwaggerUI 
                      spec={swaggerSpec}
                      docExpansion="list"
                      defaultModelsExpandDepth={2}
                      defaultModelExpandDepth={2}
                      displayRequestDuration={true}
                      tryItOutEnabled={true}
                      supportedSubmitMethods={['get', 'post', 'put', 'patch', 'delete']}
                      requestInterceptor={(request: any) => {
                        // Ensure proper headers for CORS and fix Docker URL issues
                        request.headers = {
                          ...request.headers,
                          'Accept': 'application/json',
                          'Content-Type': request.method !== 'GET' ? 'application/json' : undefined
                        };
                        
                        // Fix URL for Docker environments - replace 0.0.0.0 with localhost
                        if (request.url && request.url.includes('0.0.0.0')) {
                          request.url = request.url.replace('0.0.0.0', 'localhost');
                        }
                        
                        console.log('API Request:', request);
                        return request;
                      }}
                      responseInterceptor={(response: any) => {
                        console.log('API Response:', response);
                        return response;
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Endpoints Reference */}
            <TabsContent value="endpoints">
              <Card>
                <CardHeader>
                  <CardTitle>All API Endpoints</CardTitle>
                  <CardDescription>
                    Complete list of available endpoints with descriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {endpoints.map((endpoint, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge className={getMethodColor(endpoint.method)}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {endpoint.path}
                            </code>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(generateCurlCommand(endpoint))}
                          >
                            {copiedText === generateCurlCommand(endpoint) ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            Copy cURL
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600">{endpoint.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Code Examples */}
            <TabsContent value="examples">
              <Card>
                <CardHeader>
                  <CardTitle>Code Examples</CardTitle>
                  <CardDescription>
                    Ready-to-use code examples for different programming languages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {endpoints.slice(0, 3).map((endpoint, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono">{endpoint.path}</code>
                        </div>
                        
                        <Tabs defaultValue="curl" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="curl">cURL</TabsTrigger>
                            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                            <TabsTrigger value="python">Python</TabsTrigger>
                            <TabsTrigger value="php">PHP</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="curl">
                            <div className="relative">
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{generateCurlCommand(endpoint)}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(generateCurlCommand(endpoint))}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="javascript">
                            <div className="relative">
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{`const response = await fetch('${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json'
  }${['POST', 'PUT', 'PATCH'].includes(endpoint.method) ? ',\n  body: JSON.stringify({})' : ''}
});
const data = await response.json();`}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(`const response = await fetch('${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json'
  }${['POST', 'PUT', 'PATCH'].includes(endpoint.method) ? ',\n  body: JSON.stringify({})' : ''}
});
const data = await response.json();`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="python">
                            <div className="relative">
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{`import requests

response = requests.${endpoint.method.toLowerCase()}('${endpoint.path}'${['POST', 'PUT', 'PATCH'].includes(endpoint.method) ? ', json={}' : ''})
data = response.json()`}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(`import requests

response = requests.${endpoint.method.toLowerCase()}('${endpoint.path}'${['POST', 'PUT', 'PATCH'].includes(endpoint.method) ? ', json={}' : ''})
data = response.json()`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="php">
                            <div className="relative">
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{`<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${endpoint.path}');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${endpoint.method}');${['POST', 'PUT', 'PATCH'].includes(endpoint.method) ? `
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);` : ''}
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
?>`}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(`<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, '${endpoint.path}');
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${endpoint.method}');${['POST', 'PUT', 'PATCH'].includes(endpoint.method) ? `
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);` : ''}
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
?>`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Enhanced Swagger UI Styles */}
      <style jsx global>{`
        .swagger-container .swagger-ui {
          font-family: inherit;
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info {
          margin: 20px 0;
        }
        
        .swagger-ui .scheme-container {
          background: transparent;
          box-shadow: none;
          padding: 0;
        }
        
        .swagger-ui .opblock.opblock-get {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }
        
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #10b981;
        }
        
        .swagger-ui .opblock.opblock-post {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
        
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #3b82f6;
        }
        
        .swagger-ui .opblock.opblock-put {
          border-color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }
        
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
          background: #f59e0b;
        }
        
        .swagger-ui .opblock.opblock-patch {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.1);
        }
        
        .swagger-ui .opblock.opblock-patch .opblock-summary-method {
          background: #8b5cf6;
        }
        
        .swagger-ui .opblock.opblock-delete {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: #ef4444;
        }
        
        .swagger-ui .btn.execute {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
        
        .swagger-ui .btn.execute:hover {
          background: #2563eb;
          border-color: #2563eb;
        }
        
        .swagger-ui .btn.try-out__btn {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }
        
        .swagger-ui .btn.try-out__btn:hover {
          background: #059669;
          border-color: #059669;
        }
        
        .swagger-ui .response-col_status {
          font-size: 14px;
        }
        
        .swagger-ui .response-col_links {
          display: none;
        }
        
        .swagger-ui .opblock-summary {
          padding: 10px 20px;
        }
        
        .swagger-ui .opblock-description-wrapper {
          padding: 15px 20px;
        }
        
        .swagger-ui .parameters-container {
          padding: 0 20px;
        }
        
        .swagger-ui .responses-wrapper {
          padding: 20px;
        }
        
        .swagger-ui .model-example {
          margin: 0;
        }
        
        .swagger-ui .model {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        
        .swagger-ui .highlight-code {
          padding: 10px;
        }
        
        .swagger-ui .copy-to-clipboard {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #374151;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .swagger-ui .copy-to-clipboard:hover {
          background: #1f2937;
        }
      `}</style>
    </div>
  );
}