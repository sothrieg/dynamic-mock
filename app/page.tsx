"use client";

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/file-upload';
import { ValidationResult } from '@/components/validation-result';
import { validationStateManager } from '@/lib/validation-state';

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

  // Load validation state on component mount
  useEffect(() => {
    const savedState = validationStateManager.loadValidationState();
    if (savedState) {
      setValidationState({
        isValid: savedState.isValid,
        errors: savedState.errors,
        resources: savedState.resources,
        hasResult: savedState.hasResult
      });
    }
  }, []);

  const handleValidation = (result: { isValid: boolean; errors: string[]; resources: string[] }) => {
    const newState = {
      ...result,
      hasResult: true
    };
    
    setValidationState(newState);
    
    // Save to localStorage for persistence across navigation
    validationStateManager.saveValidationState(newState);
  };

  const handleReset = () => {
    const resetState = {
      isValid: false,
      errors: [],
      resources: [],
      hasResult: false
    };
    
    setValidationState(resetState);
    
    // Clear from localStorage
    validationStateManager.clearValidationState();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          <FileUpload onValidation={handleValidation} onReset={handleReset} />
          
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