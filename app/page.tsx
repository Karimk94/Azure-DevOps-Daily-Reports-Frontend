'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, CheckCircle, AlertCircle, Users, CheckSquare, Activity, Search } from 'lucide-react';

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
}

// RTA Branded Palette
// Red: #EE3124, Black: #000000, Dark Grey: #333333
const COLORS = ['#EE3124', '#333333', '#666666', '#999999', '#B91C1C'];

const getStatusColor = (state: string) => {
  switch (state) {
    case 'Closed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Active': return 'bg-red-50 text-red-700 border-red-200 font-bold'; // RTA Active Highlight
    case 'New': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-orange-50 text-orange-700 border-orange-200';
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// --- COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, colorClass }: StatCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex items-center space-x-4">
    <div className={`p-3 rounded-md ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
    </div>
  </div>
);

export default function ManagerDashboard() {
  const [filterUser, setFilterUser] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // --- STATE ---
  const [apiData, setApiData] = useState<ApiWorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch through the Next.js API proxy route
        // This runs server-side and proxies to localhost:8081
        const response = await fetch('/daily-reports/api/reports');
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
  }, []);

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

  // Filter Logic
  const filteredItems = processedData.filter(item => {
    const matchesUser = filterUser === 'All' || item.AssignedTo === filterUser;
    const matchesSearch = item.Title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesUser && matchesSearch;
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 font-sans text-slate-800 p-8 flex items-center justify-center">
        <p className="text-lg text-slate-500">Loading dashboard data...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 font-sans text-slate-800 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500 mb-2">Error loading data</p>
          <p className="text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800 p-8">
      {/* RTA Header Style */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#EE3124]">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">ITSD Task Tracker</h1>
          <p className="text-slate-500 mt-1 text-sm">Daily Team Operations Report</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <div className="text-right mr-6 hidden md:block">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Period</p>
            <p className="font-bold text-[#EE3124]">Jan 2026</p>
          </div>
          <button className="bg-[#EE3124] hover:bg-red-700 text-white px-5 py-2.5 rounded-md text-sm font-semibold shadow-sm transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Row - RTA Colors */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Tasks" value={stats.total} icon={LayoutDashboard} colorClass="bg-slate-800" />
        <StatCard title="In Progress" value={stats.active} icon={Activity} colorClass="bg-[#EE3124]" />
        <StatCard title="Completed" value={stats.closed} icon={CheckCircle} colorClass="bg-emerald-600" />
        <StatCard title="Urgent" value={stats.urgent} icon={AlertCircle} colorClass="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h2 className="text-lg font-bold flex items-center text-slate-900">
              <CheckSquare className="w-5 h-5 mr-2 text-[#EE3124]" />
              Work Items
            </h2>

            {/* Filters */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#EE3124] w-full"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="py-2 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
              >
                <option value="All">All Team</option>
                {userList.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Assigned To</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.WorkItemId} className="hover:bg-red-50/30 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-medium text-slate-600">#{item.WorkItemId}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.Title}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center">
                        {item.WorkItemType}
                        {item.Custom_Urgency && <span className="text-[#EE3124] font-bold ml-2 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {item.Custom_Urgency}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-xs font-bold mr-2">
                          {item.AssignedTo.charAt(0)}
                        </div>
                        {item.AssignedTo}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.State)}`}>
                        {item.State}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatDate(item.ChangedDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                No items found matching your filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Analytics */}
        <div className="space-y-8">

          {/* Status Breakdown */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Status Overview</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Workload Summary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold mb-4 flex items-center text-slate-900">
              <Users className="w-5 h-5 mr-2 text-[#EE3124]" />
              Team Performance
            </h2>
            <div className="space-y-4">
              {userList.map((user, idx) => {
                const userItems = processedData.filter(i => i.AssignedTo === user);
                const active = userItems.filter(i => i.State !== 'Closed').length;
                const closed = userItems.length - active;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shadow-sm mr-3">
                        {user.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{user}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{userItems.length} TOTAL</p>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <span className="text-[#EE3124] font-bold">{active} Active</span>
                      <span className="mx-1.5 text-slate-300">/</span>
                      <span className="text-emerald-600 font-bold">{closed} Done</span>
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