"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Copy, 
  CheckCircle, 
  ExternalLink, 
  Code, 
  BookOpen,
  ArrowLeft,
  Zap,
  Database,
  Play,
  FileCode
} from 'lucide-react';
import Link from 'next/link';

interface GraphQLType {
  name: string;
  fields: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  description?: string;
}

interface GraphQLQuery {
  name: string;
  returnType: string;
  args?: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  description?: string;
}

interface GraphQLMutation {
  name: string;
  returnType: string;
  args: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  description?: string;
}

interface GraphQLSchemaData {
  schema: string;
  types: GraphQLType[];
  queries: GraphQLQuery[];
  mutations: GraphQLMutation[];
  endpoint: string;
  playground: string;
  resources: string[];
  info: {
    title: string;
    description: string;
    version: string;
  };
}

export default function GraphQLPage() {
  const [schemaData, setSchemaData] = useState<GraphQLSchemaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [testingQuery, setTestingQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);

  const fetchSchema = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/graphql-schema');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch GraphQL schema');
      }
      
      const data = await response.json();
      setSchemaData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadSchema = () => {
    if (!schemaData) return;
    
    const blob = new Blob([schemaData.schema], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.graphql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const testQuery = async (query: string) => {
    setTestingQuery(true);
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      const result = await response.json();
      setQueryResult(result);
      
      if (result.errors) {
        alert(`❌ GraphQL Error!\n${result.errors.map((e: any) => e.message).join('\n')}`);
      } else {
        alert(`✅ Query Success!\nData: ${JSON.stringify(result.data, null, 2).substring(0, 300)}${JSON.stringify(result.data, null, 2).length > 300 ? '...' : ''}`);
      }
    } catch (err) {
      console.error('Failed to test query:', err);
      alert(`❌ Network Error!\n${err instanceof Error ? err.message : 'Failed to execute query'}`);
    } finally {
      setTestingQuery(false);
    }
  };

  const generateSampleQuery = (resource: string): string => {
    return `query {
  ${resource} {
    id
    name
    createdAt
  }
}`;
  };

  const generateSampleMutation = (resource: string): string => {
    const singularName = resource.endsWith('s') ? resource.slice(0, -1) : resource;
    const typeName = singularName.charAt(0).toUpperCase() + singularName.slice(1);
    
    return `mutation {
  create${typeName}(input: {
    name: "New Item"
    # Add other fields as needed
  }) {
    id
    name
    createdAt
    updatedAt
  }
}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Loading GraphQL schema...</p>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                GraphQL API
              </h1>
              <p className="text-gray-600">
                Generated GraphQL endpoint with full CRUD operations
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  GraphQL Schema Not Available
                </CardTitle>
                <CardDescription>
                  Unable to generate GraphQL schema
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
                  <Button onClick={fetchSchema} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Link href="/">
                    <Button>
                      <Database className="h-4 w-4 mr-2" />
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              GraphQL API
            </h1>
            <p className="text-gray-600">
              Generated GraphQL endpoint with full CRUD operations and type safety
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Upload
                </Button>
              </Link>
              <Link href="/swagger">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  REST API Docs
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchSchema} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={downloadSchema} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Schema
              </Button>
            </div>
          </div>

          {/* GraphQL Overview */}
          {schemaData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  GraphQL API Overview
                </CardTitle>
                <CardDescription>
                  {schemaData.info.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{schemaData.types.filter(t => !t.name.includes('Input')).length}</div>
                    <div className="text-sm text-purple-800">Types</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{schemaData.queries.length}</div>
                    <div className="text-sm text-green-800">Queries</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{schemaData.mutations.length}</div>
                    <div className="text-sm text-blue-800">Mutations</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{schemaData.resources.length}</div>
                    <div className="text-sm text-orange-800">Resources</div>
                  </div>
                </div>

                {/* Endpoint Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">GraphQL Endpoint</h4>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                        <Zap className="h-3 w-3 mr-1" />
                        POST
                      </Badge>
                      <code className="text-sm font-mono">{typeof window !== 'undefined' ? window.location.origin : ''}{schemaData.endpoint}</code>
                      <span className="text-xs text-gray-500">GraphQL endpoint</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}${schemaData.endpoint}`)}
                      >
                        {copiedText === `${typeof window !== 'undefined' ? window.location.origin : ''}${schemaData.endpoint}` ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(schemaData.playground, '_blank')}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabbed Interface */}
          <Tabs defaultValue="playground" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="playground">GraphQL Playground</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
              <TabsTrigger value="queries">Queries & Mutations</TabsTrigger>
              <TabsTrigger value="examples">Code Examples</TabsTrigger>
            </TabsList>

            {/* GraphQL Playground */}
            <TabsContent value="playground">
              <Card>
                <CardHeader>
                  <CardTitle>Interactive GraphQL Playground</CardTitle>
                  <CardDescription>
                    Test your GraphQL queries and mutations in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <Play className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p><strong>GraphQL Playground Access:</strong></p>
                          <p className="text-sm">
                            Click the "Open Playground" button below to access the full GraphQL Playground interface where you can:
                          </p>
                          <ul className="text-sm space-y-1 ml-4">
                            <li>• Write and execute GraphQL queries and mutations</li>
                            <li>• Explore the schema with auto-completion</li>
                            <li>• View documentation for all types and fields</li>
                            <li>• Test different query variations</li>
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="flex justify-center">
                      <Button
                        onClick={() => window.open(schemaData?.playground, '_blank')}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Open GraphQL Playground
                      </Button>
                    </div>

                    {/* Quick Test Queries */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Quick Test Queries</h4>
                      <div className="grid gap-4">
                        {schemaData?.resources.slice(0, 2).map((resource) => (
                          <div key={resource} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary">{resource}</Badge>
                                <span className="text-sm text-gray-600">Sample query</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => testQuery(generateSampleQuery(resource))}
                                disabled={testingQuery}
                              >
                                {testingQuery ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                              <code>{generateSampleQuery(resource)}</code>
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schema */}
            <TabsContent value="schema">
              <Card>
                <CardHeader>
                  <CardTitle>GraphQL Schema Definition</CardTitle>
                  <CardDescription>
                    Complete schema definition with all types, queries, and mutations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                      <code>{schemaData?.schema}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(schemaData?.schema || '')}
                    >
                      {copiedText === schemaData?.schema ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Queries & Mutations */}
            <TabsContent value="queries">
              <div className="space-y-6">
                {/* Queries */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Queries</CardTitle>
                    <CardDescription>
                      Read operations for fetching data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {schemaData?.queries.map((query, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Query
                              </Badge>
                              <code className="text-sm font-mono">{query.name}</code>
                              <span className="text-xs text-gray-500">→ {query.returnType}</span>
                            </div>
                          </div>
                          {query.description && (
                            <p className="text-sm text-gray-600 mb-2">{query.description}</p>
                          )}
                          {query.args && query.args.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">Arguments:</span>
                              <ul className="ml-4 mt-1">
                                {query.args.map((arg, argIndex) => (
                                  <li key={argIndex} className="text-gray-600">
                                    <code>{arg.name}: {arg.type}</code>
                                    {arg.description && <span className="ml-2">- {arg.description}</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Mutations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Available Mutations</CardTitle>
                    <CardDescription>
                      Write operations for creating, updating, and deleting data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {schemaData?.mutations.map((mutation, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                <Zap className="h-3 w-3 mr-1" />
                                Mutation
                              </Badge>
                              <code className="text-sm font-mono">{mutation.name}</code>
                              <span className="text-xs text-gray-500">→ {mutation.returnType}</span>
                            </div>
                          </div>
                          {mutation.description && (
                            <p className="text-sm text-gray-600 mb-2">{mutation.description}</p>
                          )}
                          <div className="text-sm">
                            <span className="font-medium">Arguments:</span>
                            <ul className="ml-4 mt-1">
                              {mutation.args.map((arg, argIndex) => (
                                <li key={argIndex} className="text-gray-600">
                                  <code>{arg.name}: {arg.type}</code>
                                  {arg.description && <span className="ml-2">- {arg.description}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Code Examples */}
            <TabsContent value="examples">
              <Card>
                <CardHeader>
                  <CardTitle>GraphQL Code Examples</CardTitle>
                  <CardDescription>
                    Ready-to-use GraphQL queries and mutations for different programming languages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {schemaData?.resources.slice(0, 2).map((resource) => (
                      <div key={resource} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="secondary">{resource}</Badge>
                          <span className="text-sm text-gray-600">GraphQL operations</span>
                        </div>
                        
                        <Tabs defaultValue="query" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="query">Query</TabsTrigger>
                            <TabsTrigger value="mutation">Mutation</TabsTrigger>
                            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="query">
                            <div className="relative">
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{generateSampleQuery(resource)}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(generateSampleQuery(resource))}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="mutation">
                            <div className="relative">
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{generateSampleMutation(resource)}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(generateSampleMutation(resource))}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="javascript">
                            <div className="relative">
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{`const query = \`
${generateSampleQuery(resource)}
\`;

const response = await fetch('/api/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
});

const result = await response.json();
console.log(result.data);`}</code>
                              </pre>
                              <Button
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2"
                                onClick={() => copyToClipboard(`const query = \`
${generateSampleQuery(resource)}
\`;

const response = await fetch('/api/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
});

const result = await response.json();
console.log(result.data);`)}
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

          {/* Benefits Alert */}
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>GraphQL API Benefits:</strong></p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• <strong>Type Safety</strong> - Strongly typed schema with validation</li>
                  <li>• <strong>Single Endpoint</strong> - One URL for all operations</li>
                  <li>• <strong>Flexible Queries</strong> - Request exactly the data you need</li>
                  <li>• <strong>Real-time Introspection</strong> - Self-documenting API</li>
                  <li>• <strong>Powerful Playground</strong> - Interactive query builder and tester</li>
                  <li>• <strong>Full CRUD Operations</strong> - Complete create, read, update, delete support</li>
                </ul>
                <p className="text-sm mt-2">
                  Your GraphQL API is automatically generated from your JSON schema and includes all the same validation and features as your REST API.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}