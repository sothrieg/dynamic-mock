"use client";

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileJson, AlertCircle, CheckCircle, Info, Download, RotateCcw, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { createSampleSchemaWithFormats, createSampleJsonData } from '@/lib/validation';
import { fileStore } from '@/lib/file-store';

interface FileUploadProps {
  onValidation: (result: { isValid: boolean; errors: string[]; resources: string[] }) => void;
}

export function FileUpload({ onValidation }: FileUploadProps) {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [schemaFile, setSchemaFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState<'json' | 'schema' | null>(null);
  const [hasPersistedData, setHasPersistedData] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load persisted files on component mount
  useEffect(() => {
    const loadPersistedFiles = async () => {
      const stored = await fileStore.loadFiles();
      if (stored.jsonFile || stored.schemaFile) {
        setJsonFile(stored.jsonFile);
        setSchemaFile(stored.schemaFile);
        setHasPersistedData(true);
        
        // If we have a validation result, trigger the callback
        if (stored.validationResult) {
          onValidation(stored.validationResult);
        }
      }
    };

    loadPersistedFiles();
  }, [onValidation]);

  // Save files whenever they change
  useEffect(() => {
    if (jsonFile || schemaFile) {
      fileStore.saveFiles(jsonFile, schemaFile);
    }
  }, [jsonFile, schemaFile]);

  const handleDrag = useCallback((e: React.DragEvent, type: 'json' | 'schema') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(type);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'json' | 'schema') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        if (type === 'json') {
          setJsonFile(file);
        } else {
          setSchemaFile(file);
        }
        setHasPersistedData(false);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'json' | 'schema') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'json') {
        setJsonFile(file);
      } else {
        setSchemaFile(file);
      }
      setHasPersistedData(false);
    }
  };

  const handleValidation = async () => {
    if (!jsonFile || !schemaFile) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('jsonFile', jsonFile);
      formData.append('schemaFile', schemaFile);

      const response = await fetch('/api/validate', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      // Save validation result to persistence
      await fileStore.saveFiles(jsonFile, schemaFile, result);
      
      onValidation(result);
      setHasPersistedData(false);
    } catch (error) {
      const errorResult = {
        isValid: false,
        errors: ['Failed to validate files'],
        resources: []
      };
      onValidation(errorResult);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    
    try {
      // Clear files from state
      setJsonFile(null);
      setSchemaFile(null);
      setHasPersistedData(false);
      
      // Clear from persistence
      fileStore.clearFiles();
      
      // Clear validation result
      onValidation({
        isValid: false,
        errors: [],
        resources: []
      });

      // Clear generated API data and analytics in parallel
      const clearPromises = [
        // Clear API data
        fetch('/api/validate', {
          method: 'DELETE'
        }).catch(err => console.error('Error clearing API data:', err)),
        
        // Clear analytics data with query parameter
        fetch('/api/analytics?clearAll=true', {
          method: 'DELETE'
        }).catch(err => console.error('Error clearing analytics:', err))
      ];

      const results = await Promise.allSettled(clearPromises);
      
      // Log results for debugging
      results.forEach((result, index) => {
        const operation = index === 0 ? 'API data' : 'Analytics data';
        if (result.status === 'fulfilled') {
          console.log(`✅ ${operation} cleared successfully`);
        } else {
          console.error(`❌ Failed to clear ${operation}:`, result.reason);
        }
      });
      
      console.log('✅ Reset completed: Files, API endpoints, and analytics');
      
    } catch (error) {
      console.error('Error during reset:', error);
      // Still show success to user since the main UI reset worked
    } finally {
      setIsResetting(false);
    }
  };

  const downloadFile = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSampleSchema = () => {
    const sampleSchema = createSampleSchemaWithFormats();
    downloadFile(sampleSchema, 'sample-schema-with-formats.json');
  };

  const downloadSampleData = () => {
    const sampleData = createSampleJsonData();
    downloadFile(sampleData, 'sample-data.json');
  };

  const FileDropZone = ({ type, file, title, description }: {
    type: 'json' | 'schema';
    file: File | null;
    title: string;
    description: string;
  }) => (
    <Card 
      className={cn(
        "relative transition-all duration-200 hover:shadow-lg",
        dragActive === type && "border-blue-500 bg-blue-50",
        file && "border-green-500 bg-green-50"
      )}
      onDragEnter={(e) => handleDrag(e, type)}
      onDragLeave={(e) => handleDrag(e, type)}
      onDragOver={(e) => handleDrag(e, type)}
      onDrop={(e) => handleDrop(e, type)}
    >
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <FileJson className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 transition-colors">
          {file ? (
            <div className="space-y-2">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
              <p className="text-sm font-medium text-green-700">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              {hasPersistedData && (
                <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                  <RotateCcw className="h-3 w-3" />
                  Restored from previous session
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">Drop your {type} file here</p>
              <p className="text-xs text-gray-400">or click to browse</p>
            </div>
          )}
        </div>
        <input
          type="file"
          accept=".json,application/json"
          onChange={(e) => handleFileSelect(e, type)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          JSON Schema API Generator
        </h1>
        <p className="text-gray-600">
          Upload your JSON data and schema to generate REST API endpoints with format validation
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <p className="font-medium">Enhanced Format Validation Support:</p>
            <p className="text-sm">
              Your JSON Schema can now include format validation for email, URI, date, date-time, 
              phone numbers, and more. The validator will provide detailed error messages for format violations.
              {hasPersistedData && (
                <span className="block mt-2 text-blue-600 font-medium">
                  📁 Files from your previous session have been restored automatically.
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadSampleSchema}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Download Sample Schema
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadSampleData}
                className="flex items-center gap-2"
              >
                <Download className="h-3 w-3" />
                Download Sample JSON Data
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <FileDropZone
          type="json"
          file={jsonFile}
          title="JSON Data"
          description="Upload your JSON data file"
        />
        <FileDropZone
          type="schema"
          file={schemaFile}
          title="JSON Schema"
          description="Upload your JSON schema file with format validation"
        />
      </div>

      {jsonFile && schemaFile && (
        <div className="text-center">
          <Button 
            onClick={handleValidation} 
            disabled={isLoading}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isLoading ? 'Validating...' : 'Validate & Generate APIs'}
          </Button>
        </div>
      )}

      {/* Reset Button - Show when files are present */}
      {(jsonFile || schemaFile) && (
        <div className="flex justify-center">
          <Button 
            onClick={handleReset}
            disabled={isResetting}
            variant="outline"
            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            {isResetting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                Resetting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Reset All Files, Endpoints and Analytics
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}