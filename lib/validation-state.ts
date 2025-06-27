interface ValidationState {
  isValid: boolean;
  errors: string[];
  resources: string[];
  hasResult: boolean;
  timestamp: number;
}

class ValidationStateManager {
  private readonly STORAGE_KEY = 'json-schema-api-validation-state';
  private readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  saveValidationState(state: Omit<ValidationState, 'timestamp'>): void {
    try {
      const stateWithTimestamp: ValidationState = {
        ...state,
        timestamp: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error('Error saving validation state:', error);
    }
  }

  loadValidationState(): ValidationState | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const state: ValidationState = JSON.parse(stored);
      
      // Check if state is too old
      if (Date.now() - state.timestamp > this.MAX_AGE) {
        this.clearValidationState();
        return null;
      }

      return state;
    } catch (error) {
      console.error('Error loading validation state:', error);
      return null;
    }
  }

  clearValidationState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing validation state:', error);
    }
  }

  hasValidState(): boolean {
    const state = this.loadValidationState();
    return state !== null && state.isValid && state.hasResult;
  }
}

export const validationStateManager = new ValidationStateManager();
export type { ValidationState };