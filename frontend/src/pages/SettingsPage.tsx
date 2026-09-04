import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';

interface SettingsPageProps {
  onRefreshAll: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshAll }) => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    setLoading(true);
    try {
      setHealth(await api.getHealth());
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHealth();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">System Settings</h1>
        <p className="mt-1 text-xs text-slate-500">Connection status and application configuration.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Backend & Database</h2>
              <p className="text-xs text-slate-500">Current API health status</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadHealth()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {health?.database ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-[11px] font-semibold text-slate-500">API</span>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Operational
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-[11px] font-semibold text-slate-500">Database</span>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {health.database.connected ? 'Connected' : 'Unavailable'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <span className="text-[11px] font-semibold text-slate-500">Database Name</span>
              <p className="mt-1 truncate text-sm font-bold text-slate-900">{health.database.dbName}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="mr-1 inline h-4 w-4" />
            Backend is unavailable. Check the API URL and backend deployment.
          </div>
        )}

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Configure the frontend API endpoint with <code className="font-mono text-slate-900">VITE_API_URL</code>.
          The backend uses <code className="font-mono text-slate-900">MONGODB_URI</code> and
          <code className="font-mono text-slate-900">FRONTEND_URL</code> for production deployment.
        </div>
      </div>
    </div>
  );
};
