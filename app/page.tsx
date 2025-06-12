"use client";

import { useState } from 'react';
import { FileUpload } from '@/components/file-upload';
import { ValidationResult } from '@/components/validation-result';

interface ValidationState {
  isValid: boolean;
  errors: string[];
  resources: string[];
  hasResult: boolean;
}

export default function Home() {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: false,
    errors: [],
    resources: [],
    hasResult: false
  });

  const handleValidation = (result: { isValid: boolean; errors: string[]; resources: string[] }) => {
    setValidationState({
      ...result,
      hasResult: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          <FileUpload onValidation={handleValidation} />
          
          {validationState.hasResult && (
            <ValidationResult
              isValid={validationState.isValid}
              errors={validationState.errors}
              resources={validationState.resources}
            />
          )}
        </div>
      </div>
    </div>
  );
}