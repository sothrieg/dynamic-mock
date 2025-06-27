import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

export interface ApiRequest {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  resource?: string;
  itemId?: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  requestSize?: number;
  responseSize?: number;
  error?: string;
}

export interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  topEndpoints: Array<{ path: string; count: number; avgResponseTime: number }>;
  httpMethods: Record<string, number>;
  statusCodes: Record<string, number>;
  errorTypes: Record<string, number>;
  hourlyStats: Array<{ hour: string; requests: number; errors: number; avgResponseTime: number }>;
  dailyStats: Array<{ date: string; requests: number; errors: number; avgResponseTime: number }>;
}

export interface RealtimeStats {
  activeConnections: number;
  requestsLastMinute: number;
  errorsLastMinute: number;
  averageResponseTimeLastMinute: number;
  currentLoad: number;
}

class AnalyticsManager {
  private dataDir = join(process.cwd(), '.data');
  private requestsFile = join(this.dataDir, 'api-requests.json');
  private metricsFile = join(this.dataDir, 'api-metrics.json');
  private requests: ApiRequest[] = [];
  private realtimeListeners: Set<(stats: RealtimeStats) => void> = new Set();
  private metricsCache: ApiMetrics | null = null;
  private lastMetricsUpdate = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly MAX_REQUESTS = 10000; // Keep last 10k requests

  constructor() {
    this.ensureDataDir();
    this.loadRequests();
    this.startRealtimeUpdates();
  }

  private ensureDataDir() {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadRequests() {
    try {
      if (existsSync(this.requestsFile)) {
        const data = readFileSync(this.requestsFile, 'utf-8');
        this.requests = JSON.parse(data);
        
        // Keep only recent requests (last 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.requests = this.requests.filter(req => req.timestamp > sevenDaysAgo);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      this.requests = [];
    }
  }

  private saveRequests() {
    try {
      // Keep only the most recent requests
      if (this.requests.length > this.MAX_REQUESTS) {
        this.requests = this.requests.slice(-this.MAX_REQUESTS);
      }
      writeFileSync(this.requestsFile, JSON.stringify(this.requests, null, 2));
    } catch (error) {
      console.error('Error saving requests:', error);
    }
  }

  private startRealtimeUpdates() {
    // Update realtime stats every 5 seconds
    setInterval(() => {
      const stats = this.getRealtimeStats();
      this.realtimeListeners.forEach(listener => {
        try {
          listener(stats);
        } catch (error) {
          console.error('Error in realtime listener:', error);
        }
      });
    }, 5000);
  }

  logRequest(request: Omit<ApiRequest, 'id' | 'timestamp'>) {
    const apiRequest: ApiRequest = {
      ...request,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.requests.push(apiRequest);
    this.saveRequests();
    
    // Invalidate metrics cache
    this.metricsCache = null;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getMetrics(): ApiMetrics {
    const now = Date.now();
    
    // Return cached metrics if still valid
    if (this.metricsCache && (now - this.lastMetricsUpdate) < this.CACHE_DURATION) {
      return this.metricsCache;
    }

    const metrics = this.calculateMetrics();
    this.metricsCache = metrics;
    this.lastMetricsUpdate = now;
    
    return metrics;
  }

  private calculateMetrics(): ApiMetrics {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    // Filter requests for different time periods
    const recentRequests = this.requests.filter(req => req.timestamp > oneWeekAgo);
    const hourlyRequests = this.requests.filter(req => req.timestamp > oneHourAgo);

    const totalRequests = recentRequests.length;
    const successfulRequests = recentRequests.filter(req => req.statusCode >= 200 && req.statusCode < 400).length;
    const errorRequests = totalRequests - successfulRequests;

    const averageResponseTime = totalRequests > 0 
      ? recentRequests.reduce((sum, req) => sum + req.responseTime, 0) / totalRequests 
      : 0;

    const requestsPerMinute = hourlyRequests.length / 60;
    const requestsPerHour = hourlyRequests.length;

    // Top endpoints
    const endpointStats = new Map<string, { count: number; totalResponseTime: number }>();
    recentRequests.forEach(req => {
      const key = `${req.method} ${req.path}`;
      const existing = endpointStats.get(key) || { count: 0, totalResponseTime: 0 };
      endpointStats.set(key, {
        count: existing.count + 1,
        totalResponseTime: existing.totalResponseTime + req.responseTime
      });
    });

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([path, stats]) => ({
        path,
        count: stats.count,
        avgResponseTime: stats.totalResponseTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // HTTP methods distribution
    const httpMethods: Record<string, number> = {};
    recentRequests.forEach(req => {
      httpMethods[req.method] = (httpMethods[req.method] || 0) + 1;
    });

    // Status codes distribution
    const statusCodes: Record<string, number> = {};
    recentRequests.forEach(req => {
      const statusGroup = `${Math.floor(req.statusCode / 100)}xx`;
      statusCodes[statusGroup] = (statusCodes[statusGroup] || 0) + 1;
    });

    // Error types
    const errorTypes: Record<string, number> = {};
    recentRequests.filter(req => req.error).forEach(req => {
      const errorType = req.error!.split(':')[0] || 'Unknown';
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });

    // Hourly stats (last 24 hours)
    const hourlyStats = this.generateHourlyStats(recentRequests.filter(req => req.timestamp > oneDayAgo));

    // Daily stats (last 7 days)
    const dailyStats = this.generateDailyStats(recentRequests);

    return {
      totalRequests,
      successfulRequests,
      errorRequests,
      averageResponseTime,
      requestsPerMinute,
      requestsPerHour,
      topEndpoints,
      httpMethods,
      statusCodes,
      errorTypes,
      hourlyStats,
      dailyStats
    };
  }

  private generateHourlyStats(requests: ApiRequest[]) {
    const hourlyMap = new Map<string, { requests: number; errors: number; totalResponseTime: number }>();
    
    // Initialize last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(Date.now() - (i * 60 * 60 * 1000));
      const hourKey = hour.toISOString().slice(0, 13) + ':00';
      hourlyMap.set(hourKey, { requests: 0, errors: 0, totalResponseTime: 0 });
    }

    requests.forEach(req => {
      const hour = new Date(req.timestamp).toISOString().slice(0, 13) + ':00';
      const existing = hourlyMap.get(hour);
      if (existing) {
        existing.requests++;
        existing.totalResponseTime += req.responseTime;
        if (req.statusCode >= 400) {
          existing.errors++;
        }
      }
    });

    return Array.from(hourlyMap.entries()).map(([hour, stats]) => ({
      hour,
      requests: stats.requests,
      errors: stats.errors,
      avgResponseTime: stats.requests > 0 ? stats.totalResponseTime / stats.requests : 0
    }));
  }

  private generateDailyStats(requests: ApiRequest[]) {
    const dailyMap = new Map<string, { requests: number; errors: number; totalResponseTime: number }>();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toISOString().slice(0, 10);
      dailyMap.set(dateKey, { requests: 0, errors: 0, totalResponseTime: 0 });
    }

    requests.forEach(req => {
      const date = new Date(req.timestamp).toISOString().slice(0, 10);
      const existing = dailyMap.get(date);
      if (existing) {
        existing.requests++;
        existing.totalResponseTime += req.responseTime;
        if (req.statusCode >= 400) {
          existing.errors++;
        }
      }
    });

    return Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      requests: stats.requests,
      errors: stats.errors,
      avgResponseTime: stats.requests > 0 ? stats.totalResponseTime / stats.requests : 0
    }));
  }

  getRealtimeStats(): RealtimeStats {
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    
    const lastMinuteRequests = this.requests.filter(req => req.timestamp > oneMinuteAgo);
    const requestsLastMinute = lastMinuteRequests.length;
    const errorsLastMinute = lastMinuteRequests.filter(req => req.statusCode >= 400).length;
    
    const averageResponseTimeLastMinute = requestsLastMinute > 0
      ? lastMinuteRequests.reduce((sum, req) => sum + req.responseTime, 0) / requestsLastMinute
      : 0;

    // Calculate current load (requests per second in last minute)
    const currentLoad = requestsLastMinute / 60;

    return {
      activeConnections: this.realtimeListeners.size,
      requestsLastMinute,
      errorsLastMinute,
      averageResponseTimeLastMinute,
      currentLoad
    };
  }

  getRecentRequests(limit: number = 100): ApiRequest[] {
    return this.requests
      .slice(-limit)
      .reverse(); // Most recent first
  }

  subscribeToRealtimeStats(callback: (stats: RealtimeStats) => void) {
    this.realtimeListeners.add(callback);
    
    // Send initial stats
    callback(this.getRealtimeStats());
    
    return () => {
      this.realtimeListeners.delete(callback);
    };
  }

  clearOldData(daysToKeep: number = 7) {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    this.requests = this.requests.filter(req => req.timestamp > cutoffTime);
    this.saveRequests();
    this.metricsCache = null;
  }

  clearAllData() {
    // Clear all in-memory data
    this.requests = [];
    this.metricsCache = null;
    this.lastMetricsUpdate = 0;
    
    // Remove analytics files
    try {
      if (existsSync(this.requestsFile)) {
        unlinkSync(this.requestsFile);
      }
      if (existsSync(this.metricsFile)) {
        unlinkSync(this.metricsFile);
      }
      console.log('✅ Analytics data files cleared successfully');
    } catch (error) {
      console.error('Error clearing analytics files:', error);
    }
  }
}

export const analytics = new AnalyticsManager();