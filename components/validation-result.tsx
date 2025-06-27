"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Globe, Copy, ExternalLink, FileText, Plus, Edit, Trash2, BarChart3, Settings, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { EndpointSelection } from '@/components/endpoint-selection';

interface ValidationResultProps {
  isValid: boolean;
  errors: string[];
  resources: string[];
}

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

export function ValidationResult({ isValid, errors, resources }: ValidationResultProps) {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [showEndpointSelection, setShowEndpointSelection] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEndpoints, setGeneratedEndpoints] = useState<EndpointConfig[] | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Load existing endpoint configuration on mount
  useEffect(() => {
    const loadExistingConfig = async () => {
      try {
        const response = await fetch('/api/endpoint-config');
        if (response.ok) {
          const config = await response.json();
          if (config && config.length > 0) {
            setGeneratedEndpoints(config);
          }
        }
      } catch (error) {
        console.error('Failed to load existing endpoint config:', error);
      }
    };

    if (isValid && resources.length > 0) {
      loadExistingConfig();
    }
  }, [isValid, resources]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(text);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const testEndpoint = async (endpoint: string, method: string = 'GET') => {
    setTestingEndpoint(endpoint);
    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      const result = {
        status: response.status,
        statusText: response.statusText,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setTestResults(prev => ({
        ...prev,
        [endpoint]: result
      }));
      
      console.log('API Test Result:', result);
      
      // Show a simple alert with the result
      if (response.ok) {
        alert(`✅ Success!\nStatus: ${response.status}\nData: ${JSON.stringify(data, null, 2).substring(0, 200)}${JSON.stringify(data, null, 2).length > 200 ? '...' : ''}`);
      } else {
        alert(`❌ Error!\nStatus: ${response.status}\nMessage: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      const errorResult = {
        status: 0,
        statusText: 'Network Error',
        data: { error: err instanceof Error ? err.message : 'Unknown error' },
        timestamp: new Date().toLocaleTimeString()
      };
      
      setTestResults(prev => ({
        ...prev,
        [endpoint]: errorResult
      }));
      
      console.error('Failed to test endpoint:', err);
      alert(`❌ Network Error!\n${err instanceof Error ? err.message : 'Failed to connect to the API'}`);
    } finally {
      setTestingEndpoint(null);
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

  const openInNewTab = (endpoint: string) => {
    window.open(endpoint, '_blank');
  };

  const handleGenerateEndpoints = async (selectedEndpoints: EndpointConfig[]) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-endpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedEndpoints }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setGeneratedEndpoints(selectedEndpoints);
        setShowEndpointSelection(false);
        alert(`✅ Success!\n${result.message}\n\nGenerated ${result.totalEndpoints} endpoints across ${result.resources.length} resources.`);
      } else {
        alert(`❌ Error!\n${result.error}`);
      }
    } catch (error) {
      console.error('Failed to generate endpoints:', error);
      alert(`❌ Network Error!\nFailed to generate endpoints.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const isEndpointEnabled = (resource: string, method: string): boolean => {
    if (!generatedEndpoints) return true; // Show all if no selection made yet
    
    const resourceConfig = generatedEndpoints.find(config => config.resource === resource);
    if (!resourceConfig) return false;
    
    const methodMap: Record<string, keyof EndpointConfig['endpoints']> = {
      'GET_collection': 'GET_collection',
      'POST_collection': 'POST_collection',
      'GET_item': 'GET_item',
      'PUT_item': 'PUT_item',
      'PATCH_item': 'PATCH_item',
      'DELETE_item': 'DELETE_item'
    };
    
    const endpointKey = methodMap[method];
    return endpointKey ? resourceConfig.endpoints[endpointKey] : false;
  };

  const getEndpointStatusSummary = () => {
    if (!generatedEndpoints) {
      return {
        totalPossible: resources.length * 6,
        totalEnabled: resources.length * 6,
        enabledByResource: resources.reduce((acc, resource) => ({ ...acc, [resource]: 6 }), {} as Record<string, number>)
      };
    }

    const totalPossible = resources.length * 6;
    const totalEnabled = generatedEndpoints.reduce((total, config) => 
      total + Object.values(config.endpoints).filter(Boolean).length, 0
    );
    
    const enabledByResource = generatedEndpoints.reduce((acc, config) => ({
      ...acc,
      [config.resource]: Object.values(config.endpoints).filter(Boolean).length
    }), {} as Record<string, number>);

    return { totalPossible, totalEnabled, enabledByResource };
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
                Your JSON data is valid! You can now choose which REST API endpoints to generate with comprehensive validation and real-time monitoring.
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

      {/* Endpoint Selection */}
      {isValid && resources.length > 0 && !generatedEndpoints && (
        <div className="space-y-4">
          {!showEndpointSelection ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Customize Your API
                </CardTitle>
                <CardDescription>
                  Choose which REST endpoints to generate for your resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      Select Specific Endpoints
                    </p>
                    <p className="text-sm text-gray-600">
                      Customize which CRUD operations to enable for each resource ({resources.length} resources found)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowEndpointSelection(true)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Choose Endpoints
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EndpointSelection
              resources={resources}
              onGenerate={handleGenerateEndpoints}
              isGenerating={isGenerating}
              currentConfig={null}
            />
          )}
        </div>
      )}

      {/* API Overview with Endpoint Status */}
      {isValid && resources.length > 0 && generatedEndpoints && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              API Overview & Endpoint Status
            </CardTitle>
            <CardDescription>
              Overview of your customized API with enabled/disabled endpoint indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {getEndpointStatusSummary().totalEnabled}
                </div>
                <div className="text-sm text-green-800">Enabled Endpoints</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">
                  {getEndpointStatusSummary().totalPossible - getEndpointStatusSummary().totalEnabled}
                </div>
                <div className="text-sm text-gray-800">Disabled Endpoints</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {resources.length}
                </div>
                <div className="text-sm text-blue-800">Resources</div>
              </div>
            </div>

            {/* Endpoint Status Matrix */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Endpoint Status by Resource</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-700">Resource</th>
                      <th className="text-center p-3 font-medium text-gray-700">GET Collection</th>
                      <th className="text-center p-3 font-medium text-gray-700">POST Collection</th>
                      <th className="text-center p-3 font-medium text-gray-700">GET Item</th>
                      <th className="text-center p-3 font-medium text-gray-700">PUT Item</th>
                      <th className="text-center p-3 font-medium text-gray-700">PATCH Item</th>
                      <th className="text-center p-3 font-medium text-gray-700">DELETE Item</th>
                      <th className="text-center p-3 font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((resource) => {
                      const resourceConfig = generatedEndpoints.find(config => config.resource === resource);
                      const endpoints = resourceConfig?.endpoints || {
                        'GET_collection': false,
                        'POST_collection': false,
                        'GET_item': false,
                        'PUT_item': false,
                        'PATCH_item': false,
                        'DELETE_item': false,
                      };
                      
                      const enabledCount = Object.values(endpoints).filter(Boolean).length;
                      
                      return (
                        <tr key={resource} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <Badge variant="secondary" className="font-mono text-sm">
                              {resource}
                            </Badge>
                          </td>
                          <td className="text-center p-3">
                            {endpoints.GET_collection ? (
                              <div className="flex items-center justify-center">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="sr-only">Enabled</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <X className="h-4 w-4 text-red-400" />
                                <span className="sr-only">Disabled</span>
                              </div>
                            )}
                          </td>
                          <td className="text-center p-3">
                            {endpoints.POST_collection ? (
                              <div className="flex items-center justify-center">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="sr-only">Enabled</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <X className="h-4 w-4 text-red-400" />
                                <span className="sr-only">Disabled</span>
                              </div>
                            )}
                          </td>
                          <td className="text-center p-3">
                            {endpoints.GET_item ? (
                              <div className="flex items-center justify-center">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="sr-only">Enabled</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <X className="h-4 w-4 text-red-400" />
                                <span className="sr-only">Disabled</span>
                              </div>
                            )}
                          </td>
                          <td className="text-center p-3">
                            {endpoints.PUT_item ? (
                              <div className="flex items-center justify-center">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="sr-only">Enabled</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <X className="h-4 w-4 text-red-400" />
                                <span className="sr-only">Disabled</span>
                              </div>
                            )}
                          </td>
                          <td className="text-center p-3">
                            {endpoints.PATCH_item ? (
                              <div className="flex items-center justify-center">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="sr-only">Enabled</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <X className="h-4 w-4 text-red-400" />
                                <span className="sr-only">Disabled</span>
                              </div>
                            )}
                          </td>
                          <td className="text-center p-3">
                            {endpoints.DELETE_item ? (
                              <div className="flex items-center justify-center">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="sr-only">Enabled</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <X className="h-4 w-4 text-red-400" />
                                <span className="sr-only">Disabled</span>
                              </div>
                            )}
                          </td>
                          <td className="text-center p-3">
                            <Badge 
                              variant={enabledCount > 0 ? "default" : "secondary"}
                              className={enabledCount > 0 ? "bg-green-100 text-green-800" : ""}
                            >
                              {enabledCount}/6
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-700">Endpoint Enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-red-400" />
                <span className="text-sm text-gray-700">Endpoint Disabled</span>
              </div>
              <div className="text-sm text-gray-600">
                Only enabled endpoints will be accessible via the API and shown in documentation
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Endpoints Display */}
      {isValid && resources.length > 0 && generatedEndpoints && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Generated CRUD API Endpoints
            </CardTitle>
            <CardDescription>
              Your customized REST API with selected operations - now with real-time monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {resources.map((resource) => {
              const resourceConfig = generatedEndpoints.find(config => config.resource === resource);
              if (!resourceConfig) return null;

              const enabledEndpoints = Object.entries(resourceConfig.endpoints)
                .filter(([_, enabled]) => enabled)
                .map(([method, _]) => method);

              if (enabledEndpoints.length === 0) return null;

              return (
                <div key={resource} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-sm">
                      {resource}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {enabledEndpoints.length} endpoint{enabledEndpoints.length !== 1 ? 's' : ''} enabled
                    </span>
                  </div>
                  
                  <div className="space-y-3 ml-4">
                    {/* Collection endpoints */}
                    {(isEndpointEnabled(resource, 'GET_collection') || isEndpointEnabled(resource, 'POST_collection')) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Collection Operations</h4>
                        
                        {/* GET Collection */}
                        {isEndpointEnabled(resource, 'GET_collection') && (
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
                                onClick={() => testEndpoint(`/api/${resource}`, 'GET')}
                                disabled={testingEndpoint === `/api/${resource}`}
                              >
                                {testingEndpoint === `/api/${resource}` ? (
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                                ) : (
                                  <ExternalLink className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openInNewTab(`/api/${resource}`)}
                                title="Open in new tab"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* POST Collection */}
                        {isEndpointEnabled(resource, 'POST_collection') && (
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
                        )}
                      </div>
                    )}

                    {/* Individual item endpoints */}
                    {(isEndpointEnabled(resource, 'GET_item') || isEndpointEnabled(resource, 'PUT_item') || 
                      isEndpointEnabled(resource, 'PATCH_item') || isEndpointEnabled(resource, 'DELETE_item')) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Item Operations</h4>
                        
                        {/* GET Item */}
                        {isEndpointEnabled(resource, 'GET_item') && (
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
                        )}

                        {/* PUT Item */}
                        {isEndpointEnabled(resource, 'PUT_item') && (
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
                        )}

                        {/* PATCH Item */}
                        {isEndpointEnabled(resource, 'PATCH_item') && (
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
                        )}

                        {/* DELETE Item */}
                        {isEndpointEnabled(resource, 'DELETE_item') && (
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
                        )}
                      </div>
                    )}
                  </div>

                  {/* Show test results if available */}
                  {testResults[`/api/${resource}`] && (
                    <div className="ml-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm">
                        <div className="font-medium text-blue-800">Last Test Result:</div>
                        <div className="text-blue-700">
                          Status: {testResults[`/api/${resource}`].status} {testResults[`/api/${resource}`].statusText}
                        </div>
                        <div className="text-blue-600 text-xs">
                          Tested at: {testResults[`/api/${resource}`].timestamp}
                        </div>
                      </div>
                    </div>
                  )}

                  {resource !== resources[resources.length - 1] && (
                    <Separator className="my-6" />
                  )}
                </div>
              );
            })}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Customized CRUD Operations with Real-time Monitoring:</strong></p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• <strong>Selected Endpoints Only</strong> - Only the endpoints you chose are available</li>
                    <li>• <strong>Full Validation</strong> - All operations include comprehensive validation</li>
                    <li>• <strong>Automatic Management</strong> - ID generation and timestamp handling</li>
                    <li>• <strong>Real-time Analytics</strong> - Monitor all API calls and performance</li>
                    <li>• <strong>Interactive Documentation</strong> - Swagger UI shows only enabled endpoints</li>
                  </ul>
                  <p className="text-sm mt-2">
                    All operations include comprehensive validation, automatic timestamp management, and real-time analytics tracking.
                    <br />
                    <strong>💡 Tip:</strong> Click the test button (🔗) next to GET endpoints to see live data, or use the "Open in new tab" button to view the JSON response directly.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Option to reconfigure */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => {
                  setShowEndpointSelection(true);
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Reconfigure Endpoints
              </Button>
            </div>

            {/* Show endpoint selection when reconfiguring */}
            {showEndpointSelection && (
              <div className="mt-6">
                <EndpointSelection
                  resources={resources}
                  onGenerate={handleGenerateEndpoints}
                  isGenerating={isGenerating}
                  currentConfig={generatedEndpoints}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}