import React, { useState, useEffect } from 'react';
import {
  Database,
  UserCheck,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { api } from '../services/api.js';

interface NavbarProps {
  onRefreshAll: () => void;
  activeRole: 'Operator' | 'Manager';
  onToggleRole: (role: 'Operator' | 'Manager') => void;
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onRefreshAll,
  activeRole,
  onToggleRole,
}) => {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    api.getHealth()
      .then((res) => {
        if (res.database) setDbStatus(res.database);
      })
      .catch((err) => console.warn('Health check error:', err));
  }, []);


  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
          <Layers className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm sm:text-base tracking-wider text-slate-900">STOCKPILOT</span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              v1.0 • MONGODB
            </span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-500 font-medium -mt-0.5">
            Smarter Inventory. Faster Fulfillment.
          </p>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Database Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="h-3 w-3 text-slate-500" />
          <span className="font-mono text-[11px] font-medium">
            MongoDB {dbStatus?.isEmbedded ? '(Embedded)' : '(Connected)'}
          </span>
        </div>

        {/* Role Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
          >
            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">{activeRole === 'Operator' ? 'Floor Picker' : 'Ops Manager'}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-lg z-50">
              <button
                type="button"
                onClick={() => {
                  onToggleRole('Operator');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeRole === 'Operator' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Warehouse Floor Picker
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleRole('Manager');
                  setShowRoleMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeRole === 'Manager' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Inventory Ops Manager
              </button>
            </div>
          )}
        </div>


      </div>
    </header>
  );
};
