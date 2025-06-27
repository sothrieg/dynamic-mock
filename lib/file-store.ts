interface FileStore {
  jsonFile: File | null;
  schemaFile: File | null;
  validationResult: {
    isValid: boolean;
    errors: string[];
    resources: string[];
  } | null;
  timestamp: number;
}

class FileStoreManager {
  private readonly STORAGE_KEY = 'json-schema-api-files';
  private readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private async base64ToFile(base64: string, filename: string, type: string): Promise<File> {
    const response = await fetch(base64);
    const blob = await response.blob();
    return new File([blob], filename, { type });
  }

  async saveFiles(
    jsonFile: File | null, 
    schemaFile: File | null, 
    validationResult: FileStore['validationResult'] = null
  ): Promise<void> {
    try {
      const store: any = {
        jsonFile: null,
        schemaFile: null,
        validationResult,
        timestamp: Date.now()
      };

      if (jsonFile) {
        store.jsonFile = {
          name: jsonFile.name,
          type: jsonFile.type,
          size: jsonFile.size,
          data: await this.fileToBase64(jsonFile)
        };
      }

      if (schemaFile) {
        store.schemaFile = {
          name: schemaFile.name,
          type: schemaFile.type,
          size: schemaFile.size,
          data: await this.fileToBase64(schemaFile)
        };
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error('Error saving files to localStorage:', error);
    }
  }

  async loadFiles(): Promise<FileStore> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.getEmptyStore();
      }

      const data = JSON.parse(stored);
      
      // Check if data is too old
      if (Date.now() - data.timestamp > this.MAX_AGE) {
        this.clearFiles();
        return this.getEmptyStore();
      }

      const store: FileStore = {
        jsonFile: null,
        schemaFile: null,
        validationResult: data.validationResult,
        timestamp: data.timestamp
      };

      if (data.jsonFile) {
        store.jsonFile = await this.base64ToFile(
          data.jsonFile.data,
          data.jsonFile.name,
          data.jsonFile.type
        );
      }

      if (data.schemaFile) {
        store.schemaFile = await this.base64ToFile(
          data.schemaFile.data,
          data.schemaFile.name,
          data.schemaFile.type
        );
      }

      return store;
    } catch (error) {
      console.error('Error loading files from localStorage:', error);
      return this.getEmptyStore();
    }
  }

  clearFiles(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing files from localStorage:', error);
    }
  }

  private getEmptyStore(): FileStore {
    return {
      jsonFile: null,
      schemaFile: null,
      validationResult: null,
      timestamp: 0
    };
  }
}

export const fileStore = new FileStoreManager();
export type { FileStore };