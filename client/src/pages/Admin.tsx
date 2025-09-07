import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl } from '../config/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Shield, 
  Users, 
  Activity, 
  Database, 
  Power, 
  Brain,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,

} from 'lucide-react';
import { setFrontendLogStatus } from '../utils/frontendLogger';

interface SystemStatus {
  system: {
    uptime: number;
    memory: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
    };
    version: string;
    platform: string;
  };
  database: {
    status: string;
    lastQuery: string;
  };
  users: {
    total: number;
    active: number;
    guests: number;
    verified: number;
  };
  habits: {
    total: number;
    active: number;
    completions: number;
  };
  logs: {
    enabled: boolean;
    level: string;
  };
  mlSystem: 'online' | 'offline';
}

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  level: number | null;
  xp: number | null;
  role: string | null;
  isGuest: boolean;
  createdAt: Date | null;
  lastActive: Date | null;
}

const Admin: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [adminToken, setAdminToken] = useState<string>('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logsEnabled, setLogsEnabled] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_user';

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      // Auto-authenticate admin users
      setIsAdminAuthenticated(true);
      fetchSystemStatus();
      fetchUsers();
    }
  }, [isAuthenticated, isAdmin]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: 'super-admin',
          password: adminToken
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('admin_token', data.data.token);
        setIsAdminAuthenticated(true);
        fetchSystemStatus();
        fetchUsers();
      } else {
        setError(data.error?.message || 'Login failed');
      }
    } catch (error) {
      setError('Failed to connect to admin service');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const response = await fetch(buildApiUrl('admin/status'), {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSystemStatus(data.data);
        setLogsEnabled(data.data.logs?.enabled ?? true);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      setError('Failed to fetch system status');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const response = await fetch(buildApiUrl('admin/users'), {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const toggleLogs = async () => {
    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const response = await fetch(buildApiUrl('admin/logs/toggle'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled: !logsEnabled,
          level: 'info'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update backend logs
        setLogsEnabled(!logsEnabled);
        
        // Update frontend logs
        setFrontendLogStatus(!logsEnabled, 'info');
        
        // Test log to verify frontend logging control
        console.log(`🧪 Admin Panel: Testing frontend log control - ${!logsEnabled ? 'ENABLED' : 'DISABLED'}`);
      }
    } catch (error) {
      console.error('Failed to toggle logs:', error);
      setError('Failed to toggle logs');
    }
  };

  const emergencyShutdown = async () => {
    if (!confirm('Are you sure you want to initiate emergency shutdown? This will stop the server.')) {
      return;
    }

    try {
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const response = await fetch(buildApiUrl('admin/emergency/shutdown'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: 'Admin initiated shutdown'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Shutdown initiated successfully');
      }
    } catch (error) {
      console.error('Failed to initiate shutdown:', error);
      setError('Failed to initiate shutdown');
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const handleSystemBackup = async (format: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`admin/backup/system?format=${format}`), {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habitloop-system-backup-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('System backup created successfully');
      } else {
        throw new Error('Failed to create system backup');
      }
    } catch (error) {
      console.error('Failed to create system backup:', error);
      setError('Failed to create system backup');
    } finally {
      setLoading(false);
    }
  };

  const handleUserBackup = async (userId: string, format: string) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`admin/backup/user/${userId}?format=${format}`), {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habitloop-user-${userId}-backup-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('User backup created successfully');
      } else {
        throw new Error('Failed to create user backup');
      }
    } catch (error) {
      console.error('Failed to create user backup:', error);
      setError('Failed to create user backup');
    } finally {
      setLoading(false);
    }
  };

  // Show access denied for non-admin users
  if (isAuthenticated && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You do not have admin privileges to access this panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show admin login form for non-authenticated users
  if (!isAuthenticated && !isAdminAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Login
            </CardTitle>
            <CardDescription>
              Enter admin credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label htmlFor="adminToken" className="text-sm font-medium">Admin Password</label>
                <Input
                  id="adminToken"
                  type="password"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  placeholder="Enter admin password"
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login as Admin'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchSystemStatus}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="destructive" onClick={emergencyShutdown}>
            <Power className="h-4 w-4 mr-2" />
            Emergency Shutdown
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="ml">ML System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {systemStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus.users?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {systemStatus.users?.active || 0} active today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemStatus.system?.uptime ? formatUptime(systemStatus.system.uptime) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {systemStatus.system?.platform || 'Unknown'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemStatus.system?.memory?.heapUsed ? formatMemory(systemStatus.system.memory.heapUsed) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {systemStatus.system?.memory?.heapTotal ? formatMemory(systemStatus.system.memory.heapTotal) : 'N/A'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Logs Status</CardTitle>
                  {logsEnabled ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-red-600" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {logsEnabled ? 'Enabled' : 'Disabled'}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleLogs}
                    className="mt-2"
                  >
                    {logsEnabled ? 'Disable' : 'Enable'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-2">Loading system status...</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage all users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">User</th>
                      <th className="text-left p-2">Level</th>
                      <th className="text-left p-2">XP</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Last Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">{user.level || 0}</td>
                        <td className="p-2">{user.xp || 0}</td>
                        <td className="p-2">
                          <Badge variant={user.isGuest ? "secondary" : "default"}>
                            {user.isGuest ? 'Guest' : 'Verified'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {user.lastActive ? 
                            new Date(user.lastActive).toLocaleDateString() : 
                            'Never'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Backup
                </CardTitle>
                <CardDescription>
                  Create a complete backup of all system data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Backup Format</label>
                  <select 
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    defaultValue="csv"
                  >
                    <option value="csv">CSV (Recommended)</option>
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="json">JSON (Raw Data)</option>
                  </select>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => handleSystemBackup('csv')}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Create System Backup
                </Button>
                <p className="text-xs text-gray-600">
                  This will backup all users, habits, completions, and streaks data.
                </p>
              </CardContent>
            </Card>

            {/* User-Specific Backup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Backup
                </CardTitle>
                <CardDescription>
                  Create a backup for a specific user
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select User</label>
                  <select 
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">Choose a user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Backup Format</label>
                  <select 
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    defaultValue="csv"
                  >
                    <option value="csv">CSV (Recommended)</option>
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="json">JSON (Raw Data)</option>
                  </select>
                </div>
                <Button 
                  className="w-full"
                  disabled={!selectedUserId}
                  onClick={() => handleUserBackup(selectedUserId, 'csv')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Create User Backup
                </Button>
                <p className="text-xs text-gray-600">
                  Select a user above to create their personal data backup.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Backup History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Backups</CardTitle>
              <CardDescription>
                Track your recent backup activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>Backup history will be displayed here.</p>
                <p className="mt-2">
                  💡 System backups include all data. User backups include only that user's data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              {systemStatus ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Node.js Version</h3>
                    <p className="text-sm text-muted-foreground">
                      {systemStatus.system?.version || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Database Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {systemStatus.database?.status || 'Unknown'} - Last query: {systemStatus.database?.lastQuery || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Memory Details</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>RSS: {systemStatus.system?.memory?.rss ? formatMemory(systemStatus.system.memory.rss) : 'N/A'}</div>
                      <div>Heap Used: {systemStatus.system?.memory?.heapUsed ? formatMemory(systemStatus.system.memory.heapUsed) : 'N/A'}</div>
                      <div>Heap Total: {systemStatus.system?.memory?.heapTotal ? formatMemory(systemStatus.system.memory.heapTotal) : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Loading system information...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ml" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                ML System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Model Version</h3>
                    <p className="text-sm text-muted-foreground">1.0.0</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Accuracy</h3>
                    <p className="text-sm text-muted-foreground">85%</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">System Status</h3>
                    <Badge variant={systemStatus?.mlSystem === 'online' ? 'default' : 'secondary'}>
                      {systemStatus?.mlSystem || 'Unknown'}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold">Last Training</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retrain Models
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
