import React from 'react';
import { AppProvider, useApp } from './context';
import {
  DashboardView,
  SegmentsView,
  ComparisonView,
  CustomerExplorerView,
  RfmView
} from './views';
import { ActiveTab } from './types';
import {
  RefreshCw,
  AlertTriangle,
  Database,
  LayoutDashboard,
  Users,
  GitCompare,
  Search,
  Activity
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    dataSource,
    profiles
  } = useApp();

  return (
    <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a href="#dashboard" className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
          <span>Restaurant Customer Intelligence &amp; Segmentation</span>
        </a>
      </div>

      {/* Zone 2: Clean unboxed metadata indicators with typographic separators */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-neutral-400" />
          <span>Source: {dataSource === 'demo' ? 'Demo Data' : dataSource === 'csv' ? 'CSV Upload' : 'MongoDB Cluster'}</span>
        </span>
        <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
        <span>Customer Segmentation &amp; RFM Insights</span>
        <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
        <span>{profiles.length} Active Customer Segments</span>
      </div>
    </header>
  );
};

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Executive KPIs, cluster scatter & overview'
  },
  {
    id: 'segments',
    label: 'Customer Segments',
    icon: Users,
    description: 'Automated profiles, data reasoning & actions'
  },
  {
    id: 'comparison',
    label: 'Segment Comparison',
    icon: GitCompare,
    description: 'Descriptive cross-segment matrix & metrics'
  },
  {
    id: 'customers',
    label: 'Customer Explorer',
    icon: Search,
    description: 'Customer ID search, individual cards & table'
  },
  {
    id: 'rfm',
    label: 'RFM Analytics',
    icon: Activity,
    description: 'Recency, Frequency & Monetary quantile matrix'
  }
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, profiles, customers, transactions } = useApp();

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none transition-colors">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Navigation list */}
        <div>
          <div className="px-3 pb-2 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            Customer Analytics
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.id === 'segments' && profiles.length > 0 && (
                    <span className="text-[10px] tabular-nums font-mono text-neutral-400 dark:text-neutral-500">
                      {profiles.length}
                    </span>
                  )}
                  {item.id === 'customers' && customers.length > 0 && (
                    <span className="text-[10px] tabular-nums font-mono text-neutral-400 dark:text-neutral-500">
                      {customers.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Customer Intelligence Summary Box */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800 text-xs space-y-2">
          <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
            Segmentation Summary
          </div>
          <div className="text-neutral-500 dark:text-neutral-400 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span>Analyzed Guests</span>
              <span className="font-mono tabular-nums text-neutral-800 dark:text-neutral-200 font-medium">
                {customers.length.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Active Segments</span>
              <span className="font-mono tabular-nums text-neutral-800 dark:text-neutral-200 font-medium">
                {profiles.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Transactions</span>
              <span className="font-mono tabular-nums text-neutral-800 dark:text-neutral-200 font-medium">
                {transactions.length.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-400 dark:text-neutral-500">
        <div>Restaurant Customer AI</div>
        <div className="mt-0.5">Behavioral Segmentation</div>
      </div>
    </aside>
  );
};

const MainContent: React.FC = () => {
  const { activeTab, isLoading, loadingMessage, error } = useApp();

  return (
    <div className="flex-1 min-w-0 bg-neutral-50 dark:bg-neutral-950 p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      {/* Global Pipeline Loading Overlay */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="font-medium">{loadingMessage || 'Updating customer segmentation...'}</span>
          </div>
          <span className="text-[11px] text-blue-500 font-mono">Real-time Analysis</span>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2.5 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* View routing */}
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'segments' && <SegmentsView />}
      {activeTab === 'comparison' && <ComparisonView />}
      {activeTab === 'customers' && <CustomerExplorerView />}
      {activeTab === 'rfm' && <RfmView />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 min-w-0 overflow-y-auto">
            <MainContent />
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
