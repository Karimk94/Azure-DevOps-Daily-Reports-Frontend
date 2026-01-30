'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, CheckCircle, AlertCircle, Users, CheckSquare, Activity, Search, Calendar, X, Shield, LogOut } from 'lucide-react';
import ThemeToggle from './components/ThemeToggle';
import AccessDenied from './components/AccessDenied';
import LoginForm from './components/LoginForm';

// --- TYPE DEFINITIONS ---

interface RawWorkItem {
  WorkItemId: number;
  Title: string;
  WorkItemType: string;
  State: string;
  AssignedToUserSK: string | null;
  CreatedDate: string;
  ChangedDate: string;
  Custom_Urgency: string | null;
  LeadTimeDays: number | null;
}

interface ApiWorkItem {
  id: number;
  title: string;
  type: string;
  status: string;
  assigned_to: string;
  updated_at: string;
  urgency: string | null;
  days_open: number;
}

interface ProcessedWorkItem extends RawWorkItem {
  AssignedTo: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  colorClass: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface AuthState {
  isAdmin: boolean;
  userName: string;
  isLoading: boolean;
  error: string | null;
  authToken: string | null;
  needsLogin: boolean;
}

// Mixed Color Palette - Azure DevOps + RTA
const COLORS = ['#0078D4', '#EE3124', '#107C10', '#5C2D91', '#FF8C00'];

const getStatusColor = (state: string) => {
  switch (state) {
    case 'Closed': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    case 'Active': return 'bg-blue-100 text-blue-700 border-blue-200 font-bold dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'New': return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    default: return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// --- COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, colorClass, onClick, isActive }: StatCardProps) => (
  <div
    className={`bg-azure-surface p-6 rounded-lg shadow-sm border flex items-center space-x-4 cursor-pointer hover:shadow-md transition-all ${isActive ? 'ring-2 ring-[#0078D4] border-azure-primary' : 'border-azure-border'}`}
    onClick={onClick}
  >
    <div className={`p-3 rounded-md ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs text-azure-text-secondary font-semibold uppercase tracking-wide">{title}</p>
      <h3 className="text-3xl font-bold text-azure-text">{value}</h3>
    </div>
  </div>
);

// Loading Component
const LoadingSpinner = () => (
  <main className="min-h-screen bg-azure-bg flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-azure-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-azure-text-secondary">Verifying access...</p>
    </div>
  </main>
);

export default function ManagerDashboard() {
  const [filterUser, setFilterUser] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // --- AUTH STATE ---
  const [auth, setAuth] = useState<AuthState>({
    isAdmin: false,
    userName: '',
    isLoading: true,  // Start with loading to try auto-check first
    error: null,
    authToken: null,
    needsLogin: false  // Start false, will be set to true only if auto-check fails
  });

  // --- DATE PICKER STATE ---
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  };
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  // --- FILTER STATES ---
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterUrgent, setFilterUrgent] = useState<boolean>(false);

  // --- STATE ---
  const [apiData, setApiData] = useState<ApiWorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- CHECK SESSION ON LOAD ---
  useEffect(() => {
    // Only check sessionStorage for existing auth
    // No auto-check to avoid browser popup
    const savedAuth = sessionStorage.getItem('auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setAuth({
          isAdmin: parsed.is_admin,
          userName: parsed.user_name,
          isLoading: false,
          error: null,
          authToken: parsed.auth_token,
          needsLogin: false
        });
        return;
      } catch (e) {
        sessionStorage.removeItem('auth');
      }
    }

    // No saved session - show login form
    setAuth({
      isAdmin: false,
      userName: '',
      isLoading: false,
      error: null,
      authToken: null,
      needsLogin: true
    });
  }, []);

  // --- LOGIN HANDLER ---
  const handleLogin = async (username: string, password: string) => {
    setAuth(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch('/daily-reports/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Save to session storage
      sessionStorage.setItem('auth', JSON.stringify(data));

      setAuth({
        isAdmin: data.is_admin,
        userName: data.user_name,
        isLoading: false,
        error: null,
        authToken: data.auth_token,
        needsLogin: false
      });
    } catch (err: any) {
      console.error('Login failed:', err);
      setAuth({
        isAdmin: false,
        userName: '',
        isLoading: false,
        error: err.message || 'Login failed',
        authToken: null,
        needsLogin: true
      });
    }
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = () => {
    sessionStorage.removeItem('auth');
    setAuth({
      isAdmin: false,
      userName: '',
      isLoading: false,
      error: null,
      authToken: null,
      needsLogin: true
    });
  };

  // --- CLEAR ALL FILTERS ---
  const clearFilters = () => {
    setFilterUser('All');
    setFilterStatus('All');
    setFilterUrgent(false);
    setSearchTerm('');
  };

  const hasActiveFilters = filterUser !== 'All' || filterStatus !== 'All' || filterUrgent || searchTerm !== '';

  useEffect(() => {
    // Only fetch data if user is admin
    if (!auth.isAdmin || auth.isLoading) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = selectedDate
          ? `/daily-reports/api/reports?date=${selectedDate}`
          : '/daily-reports/api/reports';
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const jsonData = await response.json();
        setApiData(jsonData);
      } catch (err: any) {
        console.error("Failed to fetch reports:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, auth.isAdmin, auth.isLoading]);

  // --- MEMOIZED RELATIONAL DATA ---
  const { processedData, stats, chartData, userList } = useMemo(() => {
    if (isLoading || error) {
      return {
        processedData: [],
        stats: { total: 0, closed: 0, active: 0, urgent: 0 },
        chartData: { pieData: [] },
        userList: []
      };
    }

    // Transform API Data to Frontend Shape
    const data: ProcessedWorkItem[] = apiData.map(item => ({
      WorkItemId: item.id,
      Title: item.title,
      WorkItemType: item.type,
      State: item.status,
      AssignedToUserSK: null,
      CreatedDate: new Date().toISOString(),
      ChangedDate: item.updated_at,
      Custom_Urgency: item.urgency,
      LeadTimeDays: item.days_open,
      AssignedTo: item.assigned_to || "Unassigned"
    }));

    // Sort by Date Descending
    data.sort((a, b) => new Date(b.ChangedDate).getTime() - new Date(a.ChangedDate).getTime());

    // Stats Logic
    const total = data.length;
    const closed = data.filter(i => i.State === 'Closed' || i.State === 'Completed').length;
    const active = data.filter(i => i.State === 'New' || i.State === 'Active' || i.State === 'In Progress').length;
    const urgent = data.filter(i => i.Custom_Urgency === 'Immediate').length;

    // Charts
    const statusCounts: Record<string, number> = {};
    data.forEach(item => {
      statusCounts[item.State] = (statusCounts[item.State] || 0) + 1;
    });
    const pieData = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));

    // User List
    const uniqueUsers = Array.from(new Set(data.map(i => i.AssignedTo))).filter(u => u !== 'Unassigned').sort();

    return { processedData: data, stats: { total, closed, active, urgent }, chartData: { pieData }, userList: uniqueUsers };
  }, [apiData, isLoading, error]);

  // Filter Logic - includes user, status, search, and urgency
  const filteredItems = processedData.filter(item => {
    const matchesUser = filterUser === 'All' || item.AssignedTo === filterUser;
    const matchesStatus = filterStatus === 'All' || item.State === filterStatus;
    const matchesSearch = item.Title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUrgent = !filterUrgent || item.Custom_Urgency === 'Immediate';
    return matchesUser && matchesStatus && matchesSearch && matchesUrgent;
  });

  // --- SHOW LOGIN FORM ---
  if (auth.needsLogin) {
    return (
      <LoginForm
        onLogin={handleLogin}
        isLoading={auth.isLoading}
        error={auth.error}
      />
    );
  }

  // --- AUTH LOADING STATE ---
  if (auth.isLoading) {
    return <LoadingSpinner />;
  }

  // --- ACCESS DENIED (logged in but not admin) ---
  if (!auth.isAdmin) {
    return <AccessDenied userName={auth.userName} error="You are not a Project Administrator" />;
  }

  // --- DATA LOADING STATE ---
  if (isLoading) {
    return (
      <main className="min-h-screen bg-azure-bg font-sans p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-azure-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-azure-text-secondary">Loading dashboard data...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-azure-bg font-sans p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-rta-red mb-2">Error loading data</p>
          <p className="text-azure-text-secondary">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-azure-bg font-sans text-azure-text p-8">
      {/* Header with Logo, Title, and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-azure-surface p-6 rounded-xl shadow-sm border-l-4 border-rta-red border-azure-border">
        <div className="flex items-center space-x-4">
          {/* RTA Logo */}
          <img
            src="/daily-reports/logo.png"
            alt="RTA Logo"
            className="h-10 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold text-azure-text tracking-tight">ITSD Task Tracker</h1>
            <p className="text-azure-text-secondary mt-1 text-sm flex items-center">
              <Shield className="w-4 h-4 mr-1 text-azure-primary" />
              {auth.userName} • Project Administrator
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Date Picker */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-azure-primary" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-azure-surface border border-azure-border rounded-md text-sm font-medium text-azure-text focus:outline-none focus:ring-2 focus:ring-azure-primary focus:border-transparent cursor-pointer"
            />
          </div>
          <button className="bg-azure-primary hover:bg-[#106EBE] text-white px-5 py-2.5 rounded-md text-sm font-semibold shadow-sm transition-colors">
            Export Report
          </button>
          <button
            onClick={handleLogout}
            className="p-2.5 text-azure-text-secondary hover:text-rta-red hover:bg-azure-hover rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Row - Mixed Colors - Clickable Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Tasks"
          value={stats.total}
          icon={LayoutDashboard}
          colorClass="bg-slate-700"
          onClick={clearFilters}
          isActive={!hasActiveFilters}
        />
        <StatCard
          title="In Progress"
          value={stats.active}
          icon={Activity}
          colorClass="bg-azure-primary"
          onClick={() => { clearFilters(); setFilterStatus('Active'); }}
          isActive={filterStatus === 'Active' && !filterUrgent}
        />
        <StatCard
          title="Completed"
          value={stats.closed}
          icon={CheckCircle}
          colorClass="bg-emerald-600"
          onClick={() => { clearFilters(); setFilterStatus('Closed'); }}
          isActive={filterStatus === 'Closed' && !filterUrgent}
        />
        <StatCard
          title="Urgent"
          value={stats.urgent}
          icon={AlertCircle}
          colorClass="bg-rta-red"
          onClick={() => { clearFilters(); setFilterUrgent(true); }}
          isActive={filterUrgent}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: List */}
        <div className="lg:col-span-2 bg-azure-surface rounded-xl shadow-sm border border-azure-border flex flex-col">
          <div className="p-6 border-b border-azure-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold flex items-center text-azure-text">
              <CheckSquare className="w-5 h-5 mr-2 text-azure-primary" />
              Work Items
            </h2>

            {/* Filters */}
            <div className="flex items-center space-x-2 w-full sm:w-auto flex-wrap gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-azure-text-secondary" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  className="pl-9 pr-4 py-2 bg-azure-surface border border-azure-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-azure-primary w-full"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="py-2 pl-3 pr-8 bg-azure-surface border border-azure-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-azure-primary"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              >
                <option value="All">All Team</option>
                {userList.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <select
                className="py-2 pl-3 pr-8 bg-azure-surface border border-azure-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-azure-primary"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="New">New</option>
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center px-3 py-2 text-sm text-azure-text-secondary bg-azure-hover hover:bg-azure-surface-hover rounded-md transition-colors border border-azure-border"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-azure-hover text-azure-text-secondary font-medium border-b border-azure-border">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-azure-border">
                {filteredItems.map((item) => (
                  <tr key={item.WorkItemId} className="hover:bg-azure-hover transition-colors group">
                    <td className="px-6 py-4 font-medium text-azure-text-secondary">#{item.WorkItemId}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-azure-text">{item.Title}</div>
                      <div className="text-xs text-azure-text-secondary mt-0.5 flex items-center">
                        {item.WorkItemType}
                        {item.Custom_Urgency && <span className="text-rta-red font-bold ml-2 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {item.Custom_Urgency}</span>}
                      </div>
                    </td>
                    {/* Clickable Assignee - filters by this user */}
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center cursor-pointer hover:bg-azure-hover rounded p-1 -m-1 group/filter"
                        onClick={() => setFilterUser(item.AssignedTo)}
                        title={`Filter by ${item.AssignedTo}`}
                      >
                        <div className="w-6 h-6 rounded-full bg-azure-primary/10 text-azure-primary border border-azure-primary/20 flex items-center justify-center text-xs font-bold mr-2">
                          {item.AssignedTo.charAt(0)}
                        </div>
                        <span className="hover:underline text-azure-text">{item.AssignedTo}</span>
                      </div>
                    </td>
                    {/* Clickable Status - filters by this status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-azure-border transition-all ${getStatusColor(item.State)}`}
                        onClick={() => setFilterStatus(item.State)}
                        title={`Filter by ${item.State}`}
                      >
                        {item.State}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-azure-text-secondary">
                      {formatDate(item.ChangedDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-azure-text-secondary">
                No items found matching your filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Analytics */}
        <div className="space-y-8">

          {/* Status Breakdown - Clickable Pie Chart */}
          <div className="bg-azure-surface p-6 rounded-xl shadow-sm border border-azure-border">
            <h2 className="text-lg font-bold mb-4 text-azure-text">Status Overview</h2>
            <p className="text-xs text-azure-text-secondary mb-2">Click a segment to filter</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(data) => setFilterStatus(data.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {chartData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      backgroundColor: 'var(--azure-surface)',
                      color: 'var(--azure-text)'
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Workload Summary */}
          <div className="bg-azure-surface p-6 rounded-xl shadow-sm border border-azure-border">
            <h2 className="text-lg font-bold mb-4 flex items-center text-azure-text">
              <Users className="w-5 h-5 mr-2 text-azure-primary" />
              Team Performance
            </h2>
            <div className="space-y-4">
              {userList.map((user, idx) => {
                const userItems = processedData.filter(i => i.AssignedTo === user);
                const active = userItems.filter(i => i.State !== 'Closed').length;
                const closed = userItems.length - active;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-azure-hover hover:bg-azure-surface-hover transition-colors border border-transparent hover:border-azure-border cursor-pointer"
                    onClick={() => setFilterUser(user)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-azure-surface border border-azure-border flex items-center justify-center text-xs font-bold text-azure-text shadow-sm mr-3">
                        {user.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-azure-text">{user}</p>
                        <p className="text-[10px] text-azure-text-secondary font-medium uppercase tracking-wider">{userItems.length} TOTAL</p>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-azure-primary font-bold">{active} Active</span>
                      <span className="mx-1.5 text-azure-text-secondary">/</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{closed} Done</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}