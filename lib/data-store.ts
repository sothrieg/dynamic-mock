// In-memory data store for uploaded JSON data
interface DataStore {
  data: Record<string, any>;
  schema: Record<string, any>;
  isValid: boolean;
  errors: string[];
  resources: string[];
}

class DataStoreManager {
  private store: DataStore = {
    data: {},
    schema: {},
    isValid: false,
    errors: [],
    resources: []
  };

  setData(data: Record<string, any>, schema: Record<string, any>, isValid: boolean, errors: string[] = []) {
    this.store = {
      data,
      schema,
      isValid,
      errors,
      resources: this.extractResources(data)
    };
  }

  getData() {
    return this.store;
  }

  getResource(resourceName: string) {
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
      resources: []
    };
  }
}

export const dataStore = new DataStoreManager();
export type { DataStore };