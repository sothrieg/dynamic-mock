import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// In-memory data store for uploaded JSON data
interface DataStore {
  data: Record<string, any>;
  schema: Record<string, any>;
  isValid: boolean;
  errors: string[];
  resources: string[];
  timestamp: number;
}

class DataStoreManager {
  private store: DataStore = {
    data: {},
    schema: {},
    isValid: false,
    errors: [],
    resources: [],
    timestamp: 0
  };

  private dataDir = join(process.cwd(), '.data');
  private dataFile = join(this.dataDir, 'store.json');

  constructor() {
    this.ensureDataDir();
    this.loadFromFile();
  }

  private ensureDataDir() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadFromFile() {
    try {
      if (existsSync(this.dataFile)) {
        const fileContent = readFileSync(this.dataFile, 'utf-8');
        const storedData = JSON.parse(fileContent);
        
        // Check if data is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        if (Date.now() - storedData.timestamp < maxAge) {
          this.store = storedData;
        }
      }
    } catch (error) {
      console.error('Error loading data from file:', error);
      // If there's an error, we'll just use the default empty store
    }
  }

  private saveToFile() {
    try {
      this.store.timestamp = Date.now();
      writeFileSync(this.dataFile, JSON.stringify(this.store, null, 2));
    } catch (error) {
      console.error('Error saving data to file:', error);
    }
  }

  setData(data: Record<string, any>, schema: Record<string, any>, isValid: boolean, errors: string[] = []) {
    this.store = {
      data,
      schema,
      isValid,
      errors,
      resources: this.extractResources(data),
      timestamp: Date.now()
    };
    
    // Save to file for persistence
    this.saveToFile();
  }

  getData() {
    // Always try to load fresh data from file
    this.loadFromFile();
    return this.store;
  }

  getResource(resourceName: string) {
    this.loadFromFile();
    return this.store.data[resourceName] || null;
  }

  getResourceItem(resourceName: string, id: string) {
    const resource = this.getResource(resourceName);
    if (!Array.isArray(resource)) return null;
    
    return resource.find(item => 
      item.id === id || 
      item.id === parseInt(id) || 
      item._id === id ||
      item.uuid === id
    ) || null;
  }

  private extractResources(data: Record<string, any>): string[] {
    return Object.keys(data).filter(key => Array.isArray(data[key]));
  }

  clear() {
    this.store = {
      data: {},
      schema: {},
      isValid: false,
      errors: [],
      resources: [],
      timestamp: 0
    };
    
    // Remove the file
    try {
      if (existsSync(this.dataFile)) {
        const fs = require('fs');
        fs.unlinkSync(this.dataFile);
      }
    } catch (error) {
      console.error('Error clearing data file:', error);
    }
  }

  // Method to check if we have valid data
  hasValidData(): boolean {
    this.loadFromFile();
    return this.store.isValid && Object.keys(this.store.data).length > 0;
  }
}

export const dataStore = new DataStoreManager();
export type { DataStore };