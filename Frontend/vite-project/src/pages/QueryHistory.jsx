import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  History, 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle
} from 'lucide-react';

const QueryHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/api/v1/query_logs');
        // Sort chronologically descending (newest first)
        const sortedLogs = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setLogs(sortedLogs);
      } catch (err) {
        console.error('Failed to load query logs:', err);
        setError('Could not retrieve query execution logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Filter logs locally based on search input
  const filteredLogs = logs.filter(log => 
    log.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="h-5.5 w-5.5 text-sky-400" />
            Query Audit Log
          </h2>
          <p className="text-slate-400 text-xs mt-1">Review historical execution metrics, response statuses, and database query durations.</p>
        </div>
        
        {/* Search filter input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search query content or status..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 px-3 py-2 pl-9 rounded-xl text-slate-200 text-xs outline-none"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Table grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 space-y-4">
            <div className="h-10 bg-slate-950/50 animate-pulse rounded-lg w-full"></div>
            <div className="h-10 bg-slate-950/50 animate-pulse rounded-lg w-full"></div>
            <div className="h-10 bg-slate-950/50 animate-pulse rounded-lg w-full"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <History className="h-12 w-12 mx-auto text-slate-700 mb-4" />
            <p className="font-heading text-base font-semibold">No query logs found</p>
            <p className="text-sm mt-1">Queries are automatically recorded upon calling ARGO search or chat filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="px-6 py-4">Query Input</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Execution Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {filteredLogs.map((log) => {
                  const isSuccess = log.status.toLowerCase() === 'success';
                  return (
                    <tr key={log.id} className="hover:bg-slate-850/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs max-w-md truncate text-slate-200" title={log.query}>
                        {log.query}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
                          {(log.execution_time * 1000).toFixed(0)} ms
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xxs font-semibold uppercase tracking-wider ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {isSuccess ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default QueryHistory;
