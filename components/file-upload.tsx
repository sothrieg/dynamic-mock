"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileJson, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { createSampleSchemaWithFormats } from '@/lib/validation';

interface FileUploadProps {
  onValidation: (result: { isValid: boolean; errors: string[]; resources: string[] }) => void;
}

export function FileUpload({ onValidation }: FileUploadProps) {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [schemaFile, setSchemaFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState<'json' | 'schema' | null>(null);

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
      onValidation(result);
    } catch (error) {
      onValidation({
        isValid: false,
        errors: ['Failed to validate files'],
        resources: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSampleSchema = () => {
    const sampleSchema = createSampleSchemaWithFormats();
    const blob = new Blob([JSON.stringify(sampleSchema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-schema-with-formats.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <div className="space-y-2">
            <p className="font-medium">Enhanced Format Validation Support:</p>
            <p className="text-sm">
              Your JSON Schema can now include format validation for email, URI, date, date-time, 
              phone numbers, and more. The validator will provide detailed error messages for format violations.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadSampleSchema}
              className="mt-2"
            >
              Download Sample Schema with Formats
            </Button>
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
    </div>
  );
}