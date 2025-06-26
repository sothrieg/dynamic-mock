"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic<any>(() => import('swagger-ui-react'), { ssr: false });

export default function SwaggerPage() {
  const [swaggerSpec, setSwaggerSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwaggerSpec();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Loading API documentation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
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
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              API Documentation
            </h1>
            <p className="text-gray-600">
              Interactive Swagger documentation for your generated REST API
            </p>
          </div>

          <div className="flex justify-between items-center">
            <Link href="/">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Back to Upload
              </Button>
            </Link>
            <Button onClick={fetchSwaggerSpec} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Documentation
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="swagger-container">
                <SwaggerUI 
                  spec={swaggerSpec}
                  docExpansion="list"
                  defaultModelsExpandDepth={2}
                  defaultModelExpandDepth={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
        
        .swagger-ui .btn.execute {
          background: #3b82f6;
          border-color: #3b82f6;
        }
        
        .swagger-ui .btn.execute:hover {
          background: #2563eb;
          border-color: #2563eb;
        }
        
        .swagger-ui .response-col_status {
          font-size: 14px;
        }
        
        .swagger-ui .response-col_links {
          display: none;
        }
      `}</style>
    </div>
  );
}
