import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ScanPage } from './pages/ScanPage.js';
import { ProductsPage } from './pages/ProductsPage.js';
import { OrdersPage } from './pages/OrdersPage.js';
import { WarehousePage } from './pages/WarehousePage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { ActivityPage } from './pages/ActivityPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { PickOrderModal } from './components/PickOrderModal.js';
import { api } from './services/api.js';
import { IOrder } from './types.js';
import {
  LayoutDashboard,
  ScanLine,
  PackageSearch,
  ClipboardCheck,
  Grid3X3,
} from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeRole, setActiveRole] = useState<'Operator' | 'Manager'>('Operator');
  const [activePickOrder, setActivePickOrder] = useState<IOrder | null>(null);

  // Badge counters
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  const fetchBadgeCounts = async () => {
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        api.getAnalytics(),
        api.getOrders(),
      ]);
      if (analyticsRes.success) {
        setLowStockCount(analyticsRes.summary.lowStockCount);
      }
      if (ordersRes.success) {
        const pending = ordersRes.orders.filter(
          (o) => o.status === 'Pending' || o.status === 'Picking'
        ).length;
        setPendingOrdersCount(pending);
      }
    } catch (err) {
      console.warn('Failed loading badge counts:', err);
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
  }, [currentTab]);


  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onRefreshAll={fetchBadgeCounts}
        activeRole={activeRole}
        onToggleRole={setActiveRole}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          pendingOrdersCount={pendingOrdersCount}
          lowStockCount={lowStockCount}
        />

        {/* Dynamic Main Content Canvas */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 pb-20 md:pb-6">
          <div className="mx-auto max-w-7xl">
            {currentTab === 'dashboard' && (
              <DashboardPage
                onNavigate={setCurrentTab}
                onOpenPickOrder={(orderId) => {
                  api.getOrder(orderId).then((res) => {
                    if (res.success && res.order) setActivePickOrder(res.order);
                  });
                }}
              />
            )}

            {currentTab === 'scan' && <ScanPage />}

            {currentTab === 'products' && (
              <ProductsPage
                onNavigateToScan={() => setCurrentTab('scan')}
                onNavigateToWarehouse={() => setCurrentTab('warehouse')}
              />
            )}

            {currentTab === 'orders' && <OrdersPage />}

            {currentTab === 'warehouse' && (
              <WarehousePage onNavigateToScan={() => setCurrentTab('scan')} />
            )}

            {currentTab === 'analytics' && <AnalyticsPage />}

            {currentTab === 'activity' && <ActivityPage />}

            {currentTab === 'settings' && <SettingsPage onRefreshAll={fetchBadgeCounts} />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-13 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md md:hidden shadow-xs">
        {[
          { id: 'dashboard' as NavTab, label: 'Home', icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: 'scan' as NavTab, label: 'Scan', icon: <ScanLine className="h-5 w-5" /> },
          { id: 'products' as NavTab, label: 'Products', icon: <PackageSearch className="h-5 w-5" /> },
          { id: 'orders' as NavTab, label: 'Orders', icon: <ClipboardCheck className="h-5 w-5" /> },
          { id: 'warehouse' as NavTab, label: 'Floor', icon: <Grid3X3 className="h-5 w-5" /> },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              currentTab === item.id ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        ))}
      </nav>


      {/* Pick Order Modal (accessible application-wide) */}
      {activePickOrder && (
        <PickOrderModal
          order={activePickOrder}
          isOpen={!!activePickOrder}
          onClose={() => setActivePickOrder(null)}
          onOrderUpdated={fetchBadgeCounts}
        />
      )}
    </div>
  );
}

export default App;
