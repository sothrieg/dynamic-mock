"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  Settings,
  Zap
} from 'lucide-react';

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

interface EndpointSelectionProps {
  resources: string[];
  onGenerate: (selectedEndpoints: EndpointConfig[]) => void;
  isGenerating?: boolean;
  currentConfig?: EndpointConfig[] | null;
}

export function EndpointSelection({ resources, onGenerate, isGenerating = false, currentConfig = null }: EndpointSelectionProps) {
  const [endpointConfigs, setEndpointConfigs] = useState<EndpointConfig[]>(() => {
    // If we have current config, use it; otherwise default to all enabled
    if (currentConfig && currentConfig.length > 0) {
      return currentConfig;
    }
    
    return resources.map(resource => ({
      resource,
      endpoints: {
        'GET_collection': true,
        'POST_collection': true,
        'GET_item': true,
        'PUT_item': true,
        'PATCH_item': true,
        'DELETE_item': true,
      }
    }));
  });

  // Update configs when currentConfig changes
  useEffect(() => {
    if (currentConfig && currentConfig.length > 0) {
      setEndpointConfigs(currentConfig);
    }
  }, [currentConfig]);

  const getMethodInfo = (method: string) => {
    switch (method) {
      case 'GET_collection':
        return {
          label: 'GET Collection',
          description: 'Retrieve all items',
          icon: <ExternalLink className="h-3 w-3" />,
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'POST_collection':
        return {
          label: 'POST Collection',
          description: 'Create new item',
          icon: <Plus className="h-3 w-3" />,
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'GET_item':
        return {
          label: 'GET Item',
          description: 'Get specific item',
          icon: <ExternalLink className="h-3 w-3" />,
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'PUT_item':
        return {
          label: 'PUT Item',
          description: 'Replace entire item',
          icon: <Edit className="h-3 w-3" />,
          color: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      case 'PATCH_item':
        return {
          label: 'PATCH Item',
          description: 'Partial update',
          icon: <Edit className="h-3 w-3" />,
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'DELETE_item':
        return {
          label: 'DELETE Item',
          description: 'Delete item',
          icon: <Trash2 className="h-3 w-3" />,
          color: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          label: method,
          description: '',
          icon: <Globe className="h-3 w-3" />,
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const updateEndpoint = (resourceIndex: number, endpoint: keyof EndpointConfig['endpoints'], checked: boolean) => {
    setEndpointConfigs(prev => prev.map((config, index) => 
      index === resourceIndex 
        ? { ...config, endpoints: { ...config.endpoints, [endpoint]: checked } }
        : config
    ));
  };

  const selectAllForResource = (resourceIndex: number, selectAll: boolean) => {
    setEndpointConfigs(prev => prev.map((config, index) => 
      index === resourceIndex 
        ? { 
            ...config, 
            endpoints: Object.keys(config.endpoints).reduce((acc, key) => ({
              ...acc,
              [key]: selectAll
            }), {} as EndpointConfig['endpoints'])
          }
        : config
    ));
  };

  const selectAllGlobally = (selectAll: boolean) => {
    setEndpointConfigs(prev => prev.map(config => ({
      ...config,
      endpoints: Object.keys(config.endpoints).reduce((acc, key) => ({
        ...acc,
        [key]: selectAll
      }), {} as EndpointConfig['endpoints'])
    })));
  };

  const getSelectedCount = () => {
    return endpointConfigs.reduce((total, config) => 
      total + Object.values(config.endpoints).filter(Boolean).length, 0
    );
  };

  const getTotalCount = () => {
    return endpointConfigs.length * 6; // 6 endpoints per resource
  };

  const hasSelections = () => {
    return endpointConfigs.some(config => 
      Object.values(config.endpoints).some(Boolean)
    );
  };

  const getEndpointPath = (resource: string, method: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    switch (method) {
      case 'GET_collection':
      case 'POST_collection':
        return `${baseUrl}/api/${resource}`;
      case 'GET_item':
      case 'PUT_item':
      case 'PATCH_item':
      case 'DELETE_item':
        return `${baseUrl}/api/${resource}/{id}`;
      default:
        return `${baseUrl}/api/${resource}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {currentConfig ? 'Reconfigure API Endpoints' : 'Select API Endpoints to Generate'}
        </CardTitle>
        <CardDescription>
          {currentConfig 
            ? 'Modify which REST endpoints are active for each resource. Changes will update your existing API configuration.'
            : 'Choose which REST endpoints you want to create for each resource. You can customize your API to include only the operations you need.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Controls */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="space-y-1">
            <div className="font-medium text-blue-900">
              {getSelectedCount()} of {getTotalCount()} endpoints selected
            </div>
            <div className="text-sm text-blue-700">
              Across {resources.length} resource{resources.length !== 1 ? 's' : ''}
              {currentConfig && (
                <span className="block text-blue-600 font-medium">
                  🔄 Reconfiguring existing API
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectAllGlobally(true)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectAllGlobally(false)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Deselect All
            </Button>
          </div>
        </div>

        {/* Resource-specific Controls */}
        <div className="space-y-6">
          {endpointConfigs.map((config, resourceIndex) => {
            const selectedInResource = Object.values(config.endpoints).filter(Boolean).length;
            const totalInResource = Object.keys(config.endpoints).length;
            
            return (
              <div key={config.resource} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-mono text-sm">
                      {config.resource}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {selectedInResource}/{totalInResource} endpoints selected
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => selectAllForResource(resourceIndex, true)}
                      disabled={selectedInResource === totalInResource}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => selectAllForResource(resourceIndex, false)}
                      disabled={selectedInResource === 0}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4">
                  {/* Collection Endpoints */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Collection Operations</h4>
                    {(['GET_collection', 'POST_collection'] as const).map((endpoint) => {
                      const methodInfo = getMethodInfo(endpoint);
                      return (
                        <div key={endpoint} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Checkbox
                            id={`${config.resource}-${endpoint}`}
                            checked={config.endpoints[endpoint]}
                            onCheckedChange={(checked) => 
                              updateEndpoint(resourceIndex, endpoint, checked as boolean)
                            }
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <Badge className={methodInfo.color}>
                              {methodInfo.icon}
                              <span className="ml-1">{methodInfo.label.split(' ')[0]}</span>
                            </Badge>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{methodInfo.description}</div>
                              <code className="text-xs text-gray-500 font-mono">
                                {getEndpointPath(config.resource, endpoint)}
                              </code>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Item Endpoints */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Item Operations</h4>
                    {(['GET_item', 'PUT_item', 'PATCH_item', 'DELETE_item'] as const).map((endpoint) => {
                      const methodInfo = getMethodInfo(endpoint);
                      return (
                        <div key={endpoint} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Checkbox
                            id={`${config.resource}-${endpoint}`}
                            checked={config.endpoints[endpoint]}
                            onCheckedChange={(checked) => 
                              updateEndpoint(resourceIndex, endpoint, checked as boolean)
                            }
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <Badge className={methodInfo.color}>
                              {methodInfo.icon}
                              <span className="ml-1">{methodInfo.label.split(' ')[0]}</span>
                            </Badge>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{methodInfo.description}</div>
                              <code className="text-xs text-gray-500 font-mono">
                                {getEndpointPath(config.resource, endpoint)}
                              </code>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {resourceIndex < endpointConfigs.length - 1 && (
                  <Separator className="my-6" />
                )}
              </div>
            );
          })}
        </div>

        {/* Validation Alert */}
        {!hasSelections() && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Please select at least one endpoint to generate your API.
            </AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => onGenerate(endpointConfigs)}
            disabled={!hasSelections() || isGenerating}
            size="lg"
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                {currentConfig ? 'Updating Configuration...' : 'Generating Selected Endpoints...'}
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                {currentConfig 
                  ? `Update ${getSelectedCount()} Selected Endpoint${getSelectedCount() !== 1 ? 's' : ''}`
                  : `Generate ${getSelectedCount()} Selected Endpoint${getSelectedCount() !== 1 ? 's' : ''}`
                }
              </>
            )}
          </Button>
        </div>

        {/* Info Alert */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>{currentConfig ? 'Endpoint Reconfiguration' : 'Endpoint Selection'} Benefits:</strong></p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <strong>Customized API</strong> - {currentConfig ? 'Modify' : 'Generate'} only the endpoints you need</li>
                <li>• <strong>Cleaner Documentation</strong> - Swagger docs show only selected endpoints</li>
                <li>• <strong>Better Security</strong> - Reduce attack surface by limiting available operations</li>
                <li>• <strong>Focused Development</strong> - Work with a streamlined API that matches your use case</li>
                <li>• <strong>Performance</strong> - Fewer endpoints mean faster API discovery and testing</li>
              </ul>
              <p className="text-sm mt-2">
                {currentConfig 
                  ? 'Changes will take effect immediately and update your existing API configuration.'
                  : 'You can always come back and generate additional endpoints later by re-uploading your files.'
                }
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}