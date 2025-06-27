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
  endpointConfig?: EndpointConfig[];
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

class DataStoreManager {
  private store: DataStore = {
    data: {},
    schema: {},
    isValid: false,
    errors: [],
    resources: [],
    timestamp: 0,
    endpointConfig: undefined
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
      timestamp: Date.now(),
      endpointConfig: undefined // Reset endpoint config when new data is set
    };
    
    // Save to file for persistence
    this.saveToFile();
  }

  setEndpointConfig(config: EndpointConfig[]) {
    this.store.endpointConfig = config;
    this.saveToFile();
  }

  getEndpointConfig(): EndpointConfig[] | undefined {
    this.loadFromFile();
    return this.store.endpointConfig;
  }

  isEndpointEnabled(resource: string, method: string): boolean {
    const config = this.getEndpointConfig();
    if (!config) {
      // If no config is set, all endpoints are enabled (backward compatibility)
      return true;
    }

    const resourceConfig = config.find(c => c.resource === resource);
    if (!resourceConfig) {
      return false;
    }

    // Map HTTP methods to our endpoint keys
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
      timestamp: 0,
      endpointConfig: undefined
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
export type { DataStore, EndpointConfig };