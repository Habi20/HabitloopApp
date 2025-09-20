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
  Settings,
  TestTube,
  Bug,
  Terminal,
  Zap,
  BarChart3,
  FileText,
  Download,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Mail,
  Bell
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
    connectionPool?: {
      totalConnections: number;
      idleConnections: number;
      activeConnections: number;
    };
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

  // Check if user is admin or super-admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_user';
  const isSuperAdmin = user?.id === 'admin-001' || user?.role === 'super_admin' || user?.userSettings?.superAdmin === true;

  useEffect(() => {
    // If admin_token exists in localStorage, treat admin as authenticated for the admin panel
    const existingAdminToken = localStorage.getItem('admin_token');
    if (existingAdminToken && !isAdminAuthenticated) {
      setIsAdminAuthenticated(true);
      fetchSystemStatus();
      fetchUsers();
    }

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

  const handleAdminLogout = () => {
    // Clear only admin panel auth, not user auth
    localStorage.removeItem('admin_token');
    setIsAdminAuthenticated(false);
    setAdminToken('');
    setError(null);
    setSystemStatus(null);
    setUsers([]);
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

  // Super-Admin Testing Functions
  const testCalendarIntegration = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/google-calendar/status'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      console.log('🧪 Calendar Integration Test:', data);
      alert(`Calendar Integration Test: ${data.connected ? '✅ Connected' : '❌ Not Connected'}`);
    } catch (error) {
      console.error('Calendar test failed:', error);
      alert('❌ Calendar Integration Test Failed');
    } finally {
      setLoading(false);
    }
  };

  const testMLSystem = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/ml/predictions'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      console.log('🧪 ML System Test:', data);
      alert(`ML System Test: ${data.success ? '✅ Online' : '❌ Offline'}`);
    } catch (error) {
      console.error('ML test failed:', error);
      alert('❌ ML System Test Failed');
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/health'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      console.log('🧪 Database Test:', data);
      alert(`Database Test: ${data.database ? '✅ Connected' : '❌ Disconnected'}`);
    } catch (error) {
      console.error('Database test failed:', error);
      alert('❌ Database Test Failed');
    } finally {
      setLoading(false);
    }
  };

  const testEmailService = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/email/test'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      const data = await response.json();
      console.log('🧪 Email Service Test:', data);
      alert(`Email Service Test: ${data.success ? '✅ Working' : '❌ Failed'}`);
    } catch (error) {
      console.error('Email test failed:', error);
      alert('❌ Email Service Test Failed');
    } finally {
      setLoading(false);
    }
  };

  const testAICoaching = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/ai/coach/test'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      const data = await response.json();
      console.log('🧪 AI Coaching Test:', data);
      alert(`AI Coaching Test: ${data.success ? '✅ Working' : '❌ Failed'}`);
    } catch (error) {
      console.error('AI Coaching test failed:', error);
      alert('❌ AI Coaching Test Failed');
    } finally {
      setLoading(false);
    }
  };

  const testNotificationSystem = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/notifications/test'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      const data = await response.json();
      console.log('🧪 Notification System Test:', data);
      alert(`Notification System Test: ${data.success ? '✅ Working' : '❌ Failed'}`);
    } catch (error) {
      console.error('Notification test failed:', error);
      alert('❌ Notification System Test Failed');
    } finally {
      setLoading(false);
    }
  };

  const debugUserSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/debug/sessions'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      console.log('🐛 User Sessions Debug:', data);
      alert(`User Sessions Debug: Found ${data.sessions?.length || 0} active sessions`);
    } catch (error) {
      console.error('Sessions debug failed:', error);
      alert('❌ Sessions Debug Failed');
    } finally {
      setLoading(false);
    }
  };

  const debugHabitSync = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/google-calendar/debug-habits'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      console.log('🐛 Habit Sync Debug:', data);
      alert(`Habit Sync Debug: ${data.habits?.length || 0} habits found`);
    } catch (error) {
      console.error('Habit sync debug failed:', error);
      alert('❌ Habit Sync Debug Failed');
    } finally {
      setLoading(false);
    }
  };

  const debugXPCalculation = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/debug/xp'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      console.log('🐛 XP Calculation Debug:', data);
      alert(`XP Calculation Debug: ${data.users?.length || 0} users analyzed`);
    } catch (error) {
      console.error('XP debug failed:', error);
      alert('❌ XP Calculation Debug Failed');
    } finally {
      setLoading(false);
    }
  };

  const debugDatabaseQueries = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/debug/queries'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      console.log('🐛 Database Queries Debug:', data);
      alert(`Database Queries Debug: ${data.queries?.length || 0} queries analyzed`);
    } catch (error) {
      console.error('Database queries debug failed:', error);
      alert('❌ Database Queries Debug Failed');
    } finally {
      setLoading(false);
    }
  };

  const exportAllData = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/export/all'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habitloop-full-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('✅ All data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      alert('❌ Export Failed');
    } finally {
      setLoading(false);
    }
  };

  const cleanupOrphanedData = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/cleanup'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('🧹 Cleanup Results:', data);
      alert(`Cleanup Complete: ${data.cleaned || 0} orphaned records removed`);
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('❌ Cleanup Failed');
    } finally {
      setLoading(false);
    }
  };

  const resetUserData = async () => {
    if (!confirm('⚠️ This will reset ALL user data. Are you sure?')) return;
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/reset-users'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('🔄 Reset Results:', data);
      alert(`Reset Complete: ${data.reset || 0} users reset`);
    } catch (error) {
      console.error('Reset failed:', error);
      alert('❌ Reset Failed');
    } finally {
      setLoading(false);
    }
  };

  const validateDataIntegrity = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/validate'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      console.log('🛡️ Validation Results:', data);
      alert(`Data Validation: ${data.valid ? '✅ All data valid' : '❌ Issues found'}`);
    } catch (error) {
      console.error('Validation failed:', error);
      alert('❌ Validation Failed');
    } finally {
      setLoading(false);
    }
  };

  const restartServices = async () => {
    if (!confirm('⚠️ This will restart all services. Continue?')) return;
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/restart'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('🔄 Restart Results:', data);
      alert('✅ Services restart initiated');
    } catch (error) {
      console.error('Restart failed:', error);
      alert('❌ Restart Failed');
    } finally {
      setLoading(false);
    }
  };

  const pauseServices = async () => {
    if (!confirm('⚠️ This will pause all services. Continue?')) return;
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/pause'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('⏸️ Pause Results:', data);
      alert('✅ Services paused');
    } catch (error) {
      console.error('Pause failed:', error);
      alert('❌ Pause Failed');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/clear-cache'), {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('🗑️ Cache Clear Results:', data);
      alert('✅ Cache cleared successfully');
    } catch (error) {
      console.error('Cache clear failed:', error);
      alert('❌ Cache Clear Failed');
    } finally {
      setLoading(false);
    }
  };

  const generateSystemReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/admin/report'), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      console.log('📊 System Report:', data);
      alert(`System Report Generated: ${data.report ? '✅ Available' : '❌ Failed'}`);
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('❌ Report Generation Failed');
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
          {(isAdminAuthenticated || isAdmin) && (
            <Button variant="secondary" onClick={handleAdminLogout}>
              Logout
            </Button>
          )}
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
          {isSuperAdmin && <TabsTrigger value="testing">🧪 Testing</TabsTrigger>}
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
                      {systemStatus.database?.connectionPool ? 'Connected' : 'Unknown'} - Last query: {systemStatus.database?.lastQuery || 'N/A'}
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
                    <Badge variant="secondary">
                      Running ML Models
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

        {isSuperAdmin && (
          <TabsContent value="testing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Technical Testing Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Technical Testing Tools
                  </CardTitle>
                  <CardDescription>
                    Advanced testing and debugging tools for super-admin users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => testCalendarIntegration()}
                    >
                      <Calendar className="h-4 w-4" />
                      Test Calendar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => testMLSystem()}
                    >
                      <Brain className="h-4 w-4" />
                      Test ML System
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => testDatabaseConnection()}
                    >
                      <Database className="h-4 w-4" />
                      Test Database
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => testEmailService()}
                    >
                      <Mail className="h-4 w-4" />
                      Test Email
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => testAICoaching()}
                    >
                      <Zap className="h-4 w-4" />
                      Test AI Coaching
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => testNotificationSystem()}
                    >
                      <Bell className="h-4 w-4" />
                      Test Notifications
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Debugging */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5" />
                    System Debugging
                  </CardTitle>
                  <CardDescription>
                    Debug and troubleshoot system issues
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => debugUserSessions()}
                    >
                      <Users className="h-4 w-4" />
                      Debug Sessions
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => debugHabitSync()}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Debug Habit Sync
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => debugXPCalculation()}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Debug XP Calc
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => debugDatabaseQueries()}
                    >
                      <Terminal className="h-4 w-4" />
                      Debug Queries
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Advanced data operations and maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => exportAllData()}
                    >
                      <Download className="h-4 w-4" />
                      Export All Data
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => cleanupOrphanedData()}
                    >
                      <Trash2 className="h-4 w-4" />
                      Cleanup Data
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => resetUserData()}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset User Data
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => validateDataIntegrity()}
                    >
                      <Shield className="h-4 w-4" />
                      Validate Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* System Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Control
                  </CardTitle>
                  <CardDescription>
                    System maintenance and control operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => restartServices()}
                    >
                      <Play className="h-4 w-4" />
                      Restart Services
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => pauseServices()}
                    >
                      <Pause className="h-4 w-4" />
                      Pause Services
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => clearCache()}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Clear Cache
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => generateSystemReport()}
                    >
                      <FileText className="h-4 w-4" />
                      System Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Testing Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Testing Results
                </CardTitle>
                <CardDescription>
                  Real-time output from testing operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                  <div className="space-y-1">
                    <div>🔧 Super-Admin Testing Console</div>
                    <div>Ready for testing operations...</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Admin;
