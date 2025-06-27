"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  RefreshCw,
  Zap,
  Globe,
  CheckCircle,
  XCircle,
  Timer,
  Database,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { validationStateManager } from '@/lib/validation-state';

interface ApiMetrics {
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

interface RealtimeStats {
  activeConnections: number;
  requestsLastMinute: number;
  errorsLastMinute: number;
  averageResponseTimeLastMinute: number;
  currentLoad: number;
}

interface ApiRequest {
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
  error?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<ApiMetrics | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<ApiRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasValidationState, setHasValidationState] = useState(false);

  // Check if we have valid validation state
  useEffect(() => {
    const hasValid = validationStateManager.hasValidState();
    setHasValidationState(hasValid);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/analytics?type=metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const response = await fetch('/api/analytics?type=requests&limit=50');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRecentRequests(data);
    } catch (err) {
      console.error('Failed to fetch recent requests:', err);
    }
  };

  const setupRealtimeConnection = () => {
    const eventSource = new EventSource('/api/analytics/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const stats = JSON.parse(event.data);
        setRealtimeStats(stats);
      } catch (err) {
        console.error('Error parsing realtime data:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
      
      // Retry connection after 5 seconds
      setTimeout(setupRealtimeConnection, 5000);
    };

    return () => eventSource.close();
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMetrics(), fetchRecentRequests()]);
      setLoading(false);
    };

    loadData();
    const cleanup = setupRealtimeConnection();

    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600';
    if (statusCode >= 300 && statusCode < 400) return 'text-blue-600';
    if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-orange-100 text-orange-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                API Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time monitoring and performance analytics for your JSON Schema API
              </p>
            </div>
            <div className="flex gap-4">
              <Button onClick={fetchMetrics} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href={hasValidationState ? "/" : "/"}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to {hasValidationState ? "API" : "Upload"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Real-time Stats */}
          {realtimeStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Current Load</p>
                      <p className="text-lg font-bold">{realtimeStats.currentLoad.toFixed(2)} req/s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Last Minute</p>
                      <p className="text-lg font-bold">{realtimeStats.requestsLastMinute} requests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-xs text-gray-500">Errors/Min</p>
                      <p className="text-lg font-bold">{realtimeStats.errorsLastMinute}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Timer className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-xs text-gray-500">Avg Response</p>
                      <p className="text-lg font-bold">{realtimeStats.averageResponseTimeLastMinute.toFixed(0)}ms</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-xs text-gray-500">Active Connections</p>
                      <p className="text-lg font-bold">{realtimeStats.activeConnections}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Analytics */}
          {metrics && (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
                <TabsTrigger value="requests">Live Requests</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Total Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
                      <p className="text-xs text-gray-500">
                        {metrics.requestsPerHour.toFixed(1)} per hour
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Success Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.totalRequests > 0 
                          ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <p className="text-xs text-gray-500">
                        {metrics.successfulRequests} successful
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Error Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metrics.totalRequests > 0 
                          ? ((metrics.errorRequests / metrics.totalRequests) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <p className="text-xs text-gray-500">
                        {metrics.errorRequests} errors
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Avg Response Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics.averageResponseTime.toFixed(0)}ms</div>
                      <p className="text-xs text-gray-500">
                        Last 7 days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Requests Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Daily Requests</CardTitle>
                      <CardDescription>Request volume over the last 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metrics.dailyStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="requests" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            name="Requests"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="errors" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            name="Errors"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* HTTP Methods Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>HTTP Methods</CardTitle>
                      <CardDescription>Distribution of request methods</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Object.entries(metrics.httpMethods).map(([method, count]) => ({
                              name: method,
                              value: count
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Object.entries(metrics.httpMethods).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                {/* Hourly Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hourly Performance</CardTitle>
                    <CardDescription>Request volume and response times over the last 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={metrics.hourlyStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="hour" 
                          tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit' })}
                        />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleString()}
                        />
                        <Bar yAxisId="left" dataKey="requests" fill="#3b82f6" name="Requests" />
                        <Line 
                          yAxisId="right" 
                          type="monotone" 
                          dataKey="avgResponseTime" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          name="Avg Response Time (ms)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Status Codes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status Code Distribution</CardTitle>
                    <CardDescription>HTTP status code breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(metrics.statusCodes).map(([status, count]) => (
                        <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold">{count}</div>
                          <div className="text-sm text-gray-600">{status}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="endpoints" className="space-y-6">
                {/* Top Endpoints */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top API Endpoints</CardTitle>
                    <CardDescription>Most frequently accessed endpoints</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.topEndpoints.map((endpoint, index) => (
                        <div key={endpoint.path} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                            <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                              {endpoint.path}
                            </code>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div>
                              <span className="font-medium">{endpoint.count}</span>
                              <span className="text-gray-500 ml-1">requests</span>
                            </div>
                            <div>
                              <span className="font-medium">{endpoint.avgResponseTime.toFixed(0)}ms</span>
                              <span className="text-gray-500 ml-1">avg</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Error Types */}
                {Object.keys(metrics.errorTypes).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Error Types</CardTitle>
                      <CardDescription>Common error patterns</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(metrics.errorTypes).map(([error, count]) => (
                          <div key={error} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <span className="text-sm font-medium text-red-800">{error}</span>
                            <Badge variant="destructive">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="requests" className="space-y-6">
                {/* Recent Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent API Requests</CardTitle>
                    <CardDescription>Live feed of the latest API requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {recentRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                          <div className="flex items-center space-x-3">
                            <Badge className={getMethodColor(request.method)}>
                              {request.method}
                            </Badge>
                            <code className="font-mono">{request.path}</code>
                            <span className={`font-medium ${getStatusColor(request.statusCode)}`}>
                              {request.statusCode}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-gray-500">
                            <span>{request.responseTime}ms</span>
                            <span>{formatTime(request.timestamp)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}