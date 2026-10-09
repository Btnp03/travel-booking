'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  BarChart3,
  Globe,
  Monitor,
  Search,
  Hotel,
  Users,
  Database,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Smartphone,
  Eye,
} from 'lucide-react';

interface SummaryData {
  totalPageViews: number;
  totalSessions: number;
  totalVisitors: number;
  totalHotelViews: number;
  totalSearchEvents: number;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  latestPageViews: any[];
  latestHotelViews: any[];
  latestSearchEvents: any[];
  latestSessions: any[];
}

interface ApiStatus {
  status: string;
  cassandra: {
    connected: boolean;
    type: string;
  };
  postgres: {
    connected: boolean;
    stats: {
      users: string;
      hotels: string;
      bookings: string;
      revenue: string;
    } | null;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_ANALYTICS_API_URL || 'http://localhost:3002/api';

export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'telemetry' | 'devices' | 'hotels' | 'searches' | 'database'>('telemetry');
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, statusRes] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/summary`).then((res) => res.json()),
        fetch(`${API_BASE_URL}/analytics/status`).then((res) => res.json()),
      ]);

      if (summaryRes.summary) {
        setSummary(summaryRes.summary);
      }
      setStatus(statusRes);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    setSeedNotice(null);
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/seed-demo`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setSeedNotice(data.message);
        await fetchData();
      } else {
        setSeedNotice(data.message || 'Failed to seed demo data.');
      }
    } catch (err: any) {
      setSeedNotice(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Top Header Navigation */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-sky-500/20 to-purple-500/20 border border-sky-500/30 rounded-xl text-sky-400">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text">
              Analytics Booking Dashboard
            </h1>
          </div>
          <p className="text-slate-400 text-sm pl-11">
            Real-Time Web Telemetry, Cassandra Astra DB & PostgreSQL Database Monitor
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Cassandra DB Connection Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              status?.cassandra?.connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>
              Astra DB:{' '}
              {status?.cassandra?.connected ? 'CONNECTED' : 'STANDBY'}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Seed Demo Telemetry Data Button */}
          <button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 ${seeding ? 'animate-bounce' : ''}`} />
            <span>{seeding ? 'Inserting...' : 'Seed Real Data'}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* Seed Notice Banner */}
        {seedNotice && (
          <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 text-sky-300 text-sm flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
              <span>{seedNotice}</span>
            </div>
            <button
              onClick={() => setSeedNotice(null)}
              className="text-xs text-sky-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Key Metrics / KPI Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Page Views */}
          <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Total Page Views
              </span>
              <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
                <Globe className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white mb-1">
                {summary?.totalPageViews || 0}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tracked via Astra DB</span>
              </div>
            </div>
          </div>

          {/* Card 2: Unique Visitors & Sessions */}
          <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Visitors & Sessions
              </span>
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white mb-1">
                {summary?.totalVisitors || 0}{' '}
                <span className="text-sm font-normal text-slate-400">
                  ({summary?.totalSessions || 0} sessions)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-purple-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Unique Visitor IDs</span>
              </div>
            </div>
          </div>

          {/* Card 3: Hotel Views & Searches */}
          <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Hotel Interactions
              </span>
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <Hotel className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white mb-1">
                {summary?.totalHotelViews || 0}{' '}
                <span className="text-sm font-normal text-slate-400">
                  ({summary?.totalSearchEvents || 0} searches)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Eye className="w-3.5 h-3.5" />
                <span>Search & View Events</span>
              </div>
            </div>
          </div>

          {/* Card 4: PostgreSQL Revenue / Booking Stats */}
          <div className="glass-card glass-card-hover p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                PostgreSQL Bookings
              </span>
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-white mb-1">
                {status?.postgres?.stats?.bookings || 0}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <span>
                  Total Revenue: ฿
                  {Number(status?.postgres?.stats?.revenue || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-sky-500/15 border border-sky-500/30 text-sky-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live Telemetry Stream ({summary?.latestPageViews?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'devices'
                ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Device & Browser Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('hotels')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'hotels'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Hotel className="w-4 h-4" />
            <span>Hotel View Rankings</span>
          </button>

          <button
            onClick={() => setActiveTab('searches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'searches'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database Monitor</span>
          </button>
        </div>

        {/* Tab 1: Live Telemetry Stream */}
        {activeTab === 'telemetry' && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-sky-400" />
                  Real-Time Page Views & Telemetry Feed
                </h3>
                <p className="text-xs text-slate-400">
                  Data streamed directly from DataStax Astra DB collection{' '}
                  <code className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">
                    page_views
                  </code>
                </p>
              </div>
              <span className="text-xs text-slate-400">
                Auto-refreshed: {lastUpdated}
              </span>
            </div>

            {summary?.latestPageViews && summary.latestPageViews.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Page Path</th>
                      <th className="px-4 py-3">Visitor ID</th>
                      <th className="px-4 py-3">Device / Browser</th>
                      <th className="px-4 py-3">Referrer</th>
                      <th className="px-4 py-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {summary.latestPageViews.map((item: any, index: number) => (
                      <tr
                        key={item._id || item.eventId || index}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-sky-400 font-semibold">
                          {item.pagePath || '/'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-300">
                          {item.visitorId || 'anon'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                            {item.deviceType || 'Desktop'} • {item.browser || 'Chrome'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 truncate max-w-[150px]">
                          {item.referrer || 'Direct'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 font-mono text-right">
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <p>No telemetry events recorded yet.</p>
                <button
                  onClick={handleSeedDemo}
                  className="px-4 py-2 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-semibold hover:bg-sky-500/30 cursor-pointer"
                >
                  Generate 5 Real-Time Telemetry Events Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Devices & Browsers */}
        {activeTab === 'devices' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Devices Card */}
            <div className="glass-card p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-400" />
                Device Category Breakdown
              </h3>
              <div className="space-y-4">
                {summary?.deviceBreakdown && Object.keys(summary.deviceBreakdown).length > 0 ? (
                  Object.entries(summary.deviceBreakdown).map(([device, count]) => (
                    <div key={device} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300">{device}</span>
                        <span className="text-purple-400 font-mono">{count} views</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (count / (summary?.totalPageViews || 1)) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No device data collected yet.</p>
                )}
              </div>
            </div>

            {/* Browsers Card */}
            <div className="glass-card p-6">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-sky-400" />
                Browser Distribution
              </h3>
              <div className="space-y-4">
                {summary?.browserBreakdown && Object.keys(summary.browserBreakdown).length > 0 ? (
                  Object.entries(summary.browserBreakdown).map(([browser, count]) => (
                    <div key={browser} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-300">{browser}</span>
                        <span className="text-sky-400 font-mono">{count} views</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-sky-500 to-blue-500 h-2.5 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (count / (summary?.totalPageViews || 1)) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No browser data collected yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Hotel View Rankings */}
        {activeTab === 'hotels' && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Hotel className="w-5 h-5 text-emerald-400" />
              Most Viewed Hotels Telemetry
            </h3>

            {summary?.latestHotelViews && summary.latestHotelViews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.latestHotelViews.map((item: any, idx: number) => (
                  <div
                    key={item._id || idx}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-emerald-400 font-mono font-semibold">
                        Hotel View #{idx + 1}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                      {item.hotelId || 'Hotel Details'}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Visitor: {item.visitorId || 'anon'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No hotel views recorded yet.</p>
            )}
          </div>
        )}

        {/* Tab 4: Search Analytics */}
        {activeTab === 'searches' && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-400" />
              User Search Destination Trends
            </h3>

            {summary?.latestSearchEvents && summary.latestSearchEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Search Location</th>
                      <th className="px-4 py-3">Check-In / Out Dates</th>
                      <th className="px-4 py-3">Visitor ID</th>
                      <th className="px-4 py-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {summary.latestSearchEvents.map((item: any, idx: number) => (
                      <tr key={item._id || idx} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-semibold text-amber-400">
                          {item.searchLocation || 'All Locations'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-300">
                          {item.checkInDate || 'N/A'} → {item.checkOutDate || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-400">
                          {item.visitorId || 'anon'}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-right text-slate-400">
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No search events recorded yet.</p>
            )}
          </div>
        )}

        {/* Tab 5: Database Monitor */}
        {activeTab === 'database' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cassandra Astra DB Monitor */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-sky-400" />
                  DataStax Astra DB (Cassandra Cloud)
                </h3>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    status?.cassandra?.connected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {status?.cassandra?.connected ? 'CONNECTED' : 'STANDBY'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Connection Mode:</span>
                  <span className="font-mono text-sky-300">{status?.cassandra?.type}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Keyspace:</span>
                  <span className="font-mono text-sky-300">travel_analytics</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Collections Verified:</span>
                  <span className="font-mono text-slate-200">
                    page_views, visitors, sessions, hotel_views, search_events
                  </span>
                </div>
              </div>
            </div>

            {/* PostgreSQL Monitor */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  PostgreSQL Relational DB
                </h3>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    status?.postgres?.connected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {status?.postgres?.connected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Total Users:</span>
                  <span className="font-mono text-purple-300">
                    {status?.postgres?.stats?.users || 0}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Total Hotels:</span>
                  <span className="font-mono text-purple-300">
                    {status?.postgres?.stats?.hotels || 0}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Total Bookings:</span>
                  <span className="font-mono text-purple-300">
                    {status?.postgres?.stats?.bookings || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
