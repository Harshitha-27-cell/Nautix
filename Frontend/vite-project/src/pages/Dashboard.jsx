import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Activity, 
  Globe, 
  Calendar, 
  MapPin, 
  Anchor, 
  AlertCircle,
  History,
  Bookmark,
  TrendingUp,
  Trash2,
  ChevronRight,
  Compass
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [floats, setFloats] = useState([]);
  const [recentQueries, setRecentQueries] = useState([]);
  const [savedQueries, setSavedQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [floatsRes, logsRes] = await Promise.all([
          api.get('/argo/floats'),
          api.get('/api/v1/query_logs')
        ]);
        
        setFloats(floatsRes.data);
        
        // Take the 5 most recent query logs
        const sortedLogs = logsRes.data
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setRecentQueries(sortedLogs);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError(err.response?.data?.detail || 'Could not load ARGO dashboard metadata.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Load saved queries from localStorage
    const saved = localStorage.getItem('saved_queries');
    if (saved) {
      setSavedQueries(JSON.parse(saved));
    }
  }, []);

  const totalFloats = floats.length;
  const uniqueRegions = new Set(floats.map(f => f.region)).size;
  const latestDeployment = floats.length > 0 
    ? [...floats].sort((a, b) => new Date(b.deployment_date) - new Date(a.deployment_date))[0]
    : null;

  // Calculate Region Distribution Stats
  const regionStats = floats.reduce((acc, fl) => {
    acc[fl.region] = (acc[fl.region] || 0) + 1;
    return acc;
  }, {});

  const handleRemoveSavedQuery = (e, id) => {
    e.stopPropagation();
    const updated = savedQueries.filter(q => q.id !== id);
    setSavedQueries(updated);
    localStorage.setItem('saved_queries', JSON.stringify(updated));
  };

  const handleRunSavedQuery = (query) => {
    if (query.type === 'chat') {
      navigate('/chat', { state: { autoQuery: query.value } });
    } else if (query.type === 'map') {
      navigate(`/map?wmo=${query.params?.wmo || ''}&region=${query.params?.region || ''}`);
    } else if (query.type === 'vis') {
      navigate(`/visualizations?wmo=${query.params?.wmo || ''}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-slate-100 mb-2">ARGO Mission Control</h2>
          <p className="text-slate-400 text-sm">Monitor ocean floats telemetry, generate Plotly profiles, and retrieve semantic answers.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/chat"
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-sm transition-all duration-200 shadow-md shadow-sky-500/10 cursor-pointer"
          >
            Ask AI Assistant
          </Link>
          <Link
            to="/map"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-sm transition-all duration-200 cursor-pointer"
          >
            View Map
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-950 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Anchor className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Floats</p>
            <p className="font-heading text-2xl font-bold text-slate-200 mt-1">
              {loading ? <span className="inline-block w-8 h-6 bg-slate-800 animate-pulse rounded"></span> : totalFloats}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-teal-950 border border-teal-500/20 text-teal-400 flex items-center justify-center">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Regions Cover</p>
            <p className="font-heading text-2xl font-bold text-slate-200 mt-1">
              {loading ? <span className="inline-block w-8 h-6 bg-slate-800 animate-pulse rounded"></span> : uniqueRegions}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-950 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Telemetry Link</p>
            <p className="font-heading text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
              ONLINE
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-950 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Deployment</p>
            <p className="font-heading text-sm font-bold text-slate-200 mt-1 truncate max-w-[150px]">
              {loading ? (
                <span className="inline-block w-20 h-4 bg-slate-800 animate-pulse rounded"></span>
              ) : latestDeployment ? (
                new Date(latestDeployment.deployment_date).toLocaleDateString()
              ) : (
                'N/A'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Floats Table vs Searches/Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Floats List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-5 border-b border-slate-800">
              <h3 className="font-heading text-base font-bold text-slate-100">Telemetry Float Fleet</h3>
              <p className="text-xxs text-slate-500 mt-1">Listing all active platforms on current grid</p>
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                <div className="h-10 bg-slate-950/50 animate-pulse rounded-lg w-full"></div>
                <div className="h-10 bg-slate-950/50 animate-pulse rounded-lg w-full"></div>
                <div className="h-10 bg-slate-950/50 animate-pulse rounded-lg w-full"></div>
              </div>
            ) : floats.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Anchor className="h-10 w-10 mx-auto text-slate-800 mb-3" />
                <p className="text-xs font-semibold">No floats registered</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/50 text-xxs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                      <th className="px-6 py-3">WMO Code</th>
                      <th className="px-6 py-3">Region</th>
                      <th className="px-6 py-3">Coordinates</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-xs text-slate-350">
                    {floats.slice(0, 5).map((fl) => (
                      <tr key={fl.platform_number} className="hover:bg-slate-850/20 transition-colors">
                        <td className="px-6 py-3.5 font-mono font-semibold text-sky-400">{fl.platform_number}</td>
                        <td className="px-6 py-3.5 text-slate-200">{fl.region}</td>
                        <td className="px-6 py-3.5 text-slate-500 font-mono text-xxs truncate max-w-[120px]">
                          {fl.latitude.toFixed(2)}°N, {fl.longitude.toFixed(2)}°E
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/visualizations?wmo=${fl.platform_number}`}
                              className="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xxs font-bold transition-colors"
                            >
                              Plots
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {floats.length > 5 && (
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 text-center">
              <Link 
                to="/map" 
                className="text-xs font-semibold text-sky-400 hover:text-sky-350 inline-flex items-center gap-1"
              >
                View all active floats ({floats.length})
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Searches & Saved Queries */}
        <div className="space-y-6">
          
          {/* Saved Queries Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-heading text-sm font-bold text-slate-200 flex items-center gap-2">
              <Bookmark className="h-4.5 w-4.5 text-sky-400" />
              Saved Queries ({savedQueries.length})
            </h3>
            
            {savedQueries.length === 0 ? (
              <p className="text-xxs text-slate-500 leading-relaxed py-4 text-center">
                No saved queries. Save search parameters from Chat, Map Explorer, or Visualizations pages to access them here.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {savedQueries.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => handleRunSavedQuery(q)}
                    className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-750 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-250 truncate pr-2">{q.title}</span>
                      <span className="text-xxs text-slate-500 uppercase tracking-wide mt-0.5">{q.type} query</span>
                    </div>
                    <button
                      onClick={(e) => handleRemoveSavedQuery(e, q.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-slate-750 text-slate-500 hover:text-rose-400 transition-all duration-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Searches Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading text-sm font-bold text-slate-200 flex items-center gap-2">
                <History className="h-4.5 w-4.5 text-sky-400" />
                Recent Queries
              </h3>
              <Link to="/history" className="text-xxs text-slate-500 hover:text-sky-400 font-semibold">
                See all
              </Link>
            </div>
            
            {loading ? (
              <div className="space-y-3">
                <div className="h-8 bg-slate-950/50 animate-pulse rounded-lg"></div>
                <div className="h-8 bg-slate-950/50 animate-pulse rounded-lg"></div>
              </div>
            ) : recentQueries.length === 0 ? (
              <p className="text-xxs text-slate-500 text-center py-4">No recent queries executed.</p>
            ) : (
              <div className="space-y-2.5">
                {recentQueries.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/50 border border-slate-850/50"
                  >
                    <span className="text-xs font-mono text-slate-300 truncate max-w-[150px]" title={log.query}>
                      {log.query}
                    </span>
                    <span className="text-xxs text-slate-500">
                      {(log.execution_time * 1000).toFixed(0)}ms
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Oceanographic Statistics Row */}
      {!loading && totalFloats > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="font-heading text-base font-bold text-slate-100 flex items-center gap-2">
              <Compass className="h-5 w-5 text-sky-400" />
              Oceanic Fleet Distribution Statistics
            </h3>
            <p className="text-xxs text-slate-500 mt-1">Relative distribution percentage of autonomous profiling floats across global oceans.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(regionStats).map(([region, count]) => {
              const percentage = ((count / totalFloats) * 100).toFixed(0);
              return (
                <div key={region} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-350">{region}</span>
                    <span className="text-sky-400">{count} floats ({percentage}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-500 rounded-full transition-all duration-550"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
