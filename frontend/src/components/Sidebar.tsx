import React from 'react';
import {
  LayoutDashboard,
  ScanLine,
  PackageSearch,
  ClipboardCheck,
  Grid3X3,
  BarChart3,
  History,
  Settings,
  Sparkles,
  Layers,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'scan'
  | 'products'
  | 'orders'
  | 'warehouse'
  | 'analytics'
  | 'activity'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingOrdersCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingOrdersCount = 0,
  lowStockCount = 0,
}) => {
  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      id: 'scan',
      label: 'Scan & Inward',
      icon: <ScanLine className="h-4.5 w-4.5" />,
      badge: 'Live',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'products',
      label: 'Products Catalog',
      icon: <PackageSearch className="h-4.5 w-4.5" />,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'orders',
      label: 'Orders & Picking',
      icon: <ClipboardCheck className="h-4.5 w-4.5" />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'warehouse',
      label: 'Warehouse 2D Map',
      icon: <Grid3X3 className="h-4.5 w-4.5" />,
    },
    {
      id: 'analytics',
      label: 'Analytics & Insights',
      icon: <BarChart3 className="h-4.5 w-4.5" />,
    },
    {
      id: 'activity',
      label: 'Activity Audit Log',
      icon: <History className="h-4.5 w-4.5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4.5 w-4.5" />,
    },
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white hidden md:flex flex-col justify-between p-3">
      <div className="space-y-0.5">
        <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Warehouse Operations
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${
                    isActive
                      ? 'bg-slate-800 text-white border-slate-700'
                      : item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer info box */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600 space-y-1">
        <div className="flex items-center justify-between text-slate-800 font-semibold text-[11px]">
          <span>Smart Bin Allocation</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <p className="text-[10px] text-slate-500 leading-normal">
          Dynamic aisle cascading & barcode picking error prevention active.
        </p>
      </div>
    </aside>
  );
};
