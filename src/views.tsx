import React, { useState } from 'react';
import {
  Activity, AlertTriangle, ArrowRight, ArrowUpDown, Award,
  CheckCircle, ChevronLeft, ChevronRight, Clock, Database,
  DollarSign, Download, HelpCircle, Info, Layers, Lightbulb,
  Repeat, Search, ShoppingBag, Tag, TrendingUp, User, Users,
  UtensilsCrossed, X
} from 'lucide-react';
import {
  Bar, BarChart, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis
} from 'recharts';
import { CustomerFeatures, ClusterProfile } from './types';
import { useApp } from './context';

// ================================================================
// DashboardView
// ================================================================
export const DashboardView: React.FC = () => {
  const {
    customers,
    profiles,
    metrics,
    dataSource,
    pcaVariance,
    setActiveTab,
    setSelectedCustomer
  } = useApp();

  // Top KPI calculations
  const totalCustomers = customers.length;
  const activeCustomers30d = customers.filter(c => c.orders_last_30d > 0).length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.monetary, 0);
  const avgCustomerValue = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
  const segmentCount = profiles.length;
  const avgOrdersPerCustomer = totalCustomers > 0
    ? (customers.reduce((sum, c) => sum + c.frequency, 0) / totalCustomers).toFixed(1)
    : '0.0';

  // Data for Segment Distribution
  const segmentDistData = profiles.map(p => ({
    name: p.segment_name,
    count: p.customer_count,
    percentage: p.percentage,
    revenue: p.revenue_contribution,
    avgMonetary: p.avg_monetary,
    avgFrequency: p.avg_frequency,
    color: p.color
  }));

  // Data for PCA Scatter Plot (downsample to 400 points max for snappy rendering)
  const pcaScatterData = customers.slice(0, 450).map(c => {
    const prof = profiles.find(p => p.cluster === c.cluster);
    return {
      id: c.customer_id,
      pc1: c.pc1 || 0,
      pc2: c.pc2 || 0,
      segment: c.segment_name,
      cluster: c.cluster,
      r_score: c.r_score,
      f_score: c.f_score,
      m_score: c.m_score,
      monetary: c.monetary,
      recency: c.recency_days,
      frequency: c.frequency,
      color: prof?.color || '#3B82F6'
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Restaurant Customer Intelligence Dashboard
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Unsupervised behavioral clustering, RFM quantile stratification, and revenue contribution analysis.
          </p>
        </div>

        {/* Data Source Notice */}
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
          <Database className="w-3.5 h-3.5 text-neutral-400" />
          <span>Active Data: <strong>{dataSource === 'demo' ? 'Demo Data (5,000+ txs)' : dataSource === 'csv' ? 'Custom CSV' : 'MongoDB'}</strong></span>
        </div>
      </div>

      {/* 6 Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Customers */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Guests</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {totalCustomers.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Unique customer IDs
          </div>
        </div>

        {/* Active Customers (30d) */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Active (30d)</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {activeCustomers30d.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            {totalCustomers > 0 ? `${Math.round((activeCustomers30d / totalCustomers) * 100)}% of customer base` : '0%'}
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Spend</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Processed dining revenue
          </div>
        </div>

        {/* Average Customer Value */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Avg Customer Value</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            ₹{avgCustomerValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Lifetime spend per guest
          </div>
        </div>

        {/* Number of Segments */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Segments</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {segmentCount}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Discovered behavioral clusters
          </div>
        </div>

        {/* Average Orders per Customer */}
        <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Avg Orders/Guest</span>
            <ShoppingBag className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {avgOrdersPerCustomer}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Visit frequency mean
          </div>
        </div>
      </div>

      {/* Row 2: Customer Distribution and Revenue Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Segment Distribution (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Customer Segment Distribution
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Breakdown of guest population across automatically profiled clusters
              </p>
            </div>
            <button
              onClick={() => setActiveTab('segments')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentDistData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 'dataMax + 10']} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={115}
                />
                <Tooltip
                  formatter={(val: any) => [
                    `${val} guests (${segmentDistData.find(d => d.count === val)?.percentage ?? 0}%)`,
                    'Customer Count'
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(23, 23, 23, 0.95)',
                    borderColor: '#404040',
                    color: '#fff',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {segmentDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Segment Metric Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400">
            {profiles.slice(0, 4).map((p, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">{p.segment_name}</span>
                </div>
                <div className="text-[11px] tabular-nums font-mono text-neutral-500">
                  {p.customer_count} guests ({p.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Contribution by Segment (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Revenue Contribution by Segment
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Total dining spend generated by each guest cohort
                </p>
              </div>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentDistData}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {segmentDistData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'rgba(23, 23, 23, 0.95)',
                      borderColor: '#404040',
                      color: '#fff',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Breakdown Legend */}
          <div className="space-y-1.5 border-t border-neutral-100 dark:border-neutral-800 pt-3">
            {profiles.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate text-neutral-700 dark:text-neutral-300">{p.segment_name}</span>
                </div>
                <div className="font-mono tabular-nums text-neutral-800 dark:text-neutral-200 font-medium">
                  ₹{p.revenue_contribution.toLocaleString()} <span className="text-neutral-400 text-[10px]">({p.revenue_percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: PCA 2D Cluster Visualization & Behavioral Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PCA 2D Cluster Scatter Plot (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                PCA 2D Cluster Space (PC1 vs PC2)
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Principal Component projection preserving {Math.round((pcaVariance[0] + pcaVariance[1]) * 100)}% of behavioral variance.
              </p>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              PC1: {Math.round(pcaVariance[0] * 100)}% · PC2: {Math.round(pcaVariance[1] * 100)}%
            </div>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <XAxis
                  type="number"
                  dataKey="pc1"
                  name="PC1"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Principal Component 1 (Volume & Frequency)', position: 'insideBottom', offset: -10, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="pc2"
                  name="PC2"
                  tick={{ fontSize: 10 }}
                  label={{ value: 'PC2 (Recency / Basket)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="p-3 bg-neutral-900 border border-neutral-700 text-white rounded-md text-xs shadow-lg space-y-1">
                        <div className="font-semibold text-sm flex items-center justify-between gap-4">
                          <span>{data.id}</span>
                          <span className="font-mono text-[11px] text-blue-400">RFM {data.r_score}{data.f_score}{data.m_score}</span>
                        </div>
                        <div className="text-neutral-300 font-medium">{data.segment}</div>
                        <div className="border-t border-neutral-700 pt-1 text-[11px] space-y-0.5 text-neutral-400">
                          <div>Recency: <strong className="text-white">{data.recency} days</strong></div>
                          <div>Frequency: <strong className="text-white">{data.frequency} orders</strong></div>
                          <div>Monetary: <strong className="text-white">₹{data.monetary.toLocaleString()}</strong></div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={pcaScatterData}
                  onClick={(node: any) => {
                    if (node && node.id) {
                      const match = customers.find(c => c.customer_id === node.id);
                      if (match) {
                        setSelectedCustomer(match);
                        setActiveTab('customers');
                      }
                    }
                  }}
                >
                  {pcaScatterData.map((entry, index) => (
                    <Cell key={`scatter-cell-${index}`} fill={entry.color} fillOpacity={0.75} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 text-center">
            Click any point in the scatter plot to inspect the full individual customer profile.
          </div>
        </div>

        {/* Actionable Executive Highlights (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              Actionable Business Insights
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              High-impact operational takeaways generated directly from segment behaviors
            </p>

            <div className="space-y-3">
              {profiles.slice(0, 3).map((p, idx) => (
                <div key={idx} className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.segment_name}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-neutral-500">
                      {p.percentage}% base · ₹{p.avg_aov} AOV
                    </span>
                  </div>
                  <div className="text-neutral-600 dark:text-neutral-300 text-[11px] leading-relaxed">
                    {p.recommendations[0] || 'Maintain continuous engagement.'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-4 flex justify-between items-center text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">
              {profiles.length} distinct behavioral segments identified
            </span>
            <button
              onClick={() => setActiveTab('segments')}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Explore all segments</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================================================
// SegmentsView
// ================================================================
export const SegmentsView: React.FC = () => {
  const { profiles, customers, setSelectedCustomer, setActiveTab } = useApp();
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);

  const activeProfile = selectedClusterId !== null
    ? profiles.find(p => p.cluster === selectedClusterId) || profiles[0]
    : profiles[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Customer Segment Profiles
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Automated cluster profiling comparing segment behavioral statistics against restaurant global averages.
          </p>
        </div>

        {/* Total Segments */}
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          Showing <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">{profiles.length}</span> automatically classified cohorts
        </div>
      </div>

      {/* Segment Selector Tabs (Interactive Filter Buttons adhering to Frontend Constitution) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {profiles.map(p => {
          const isSelected = activeProfile?.cluster === p.cluster;
          return (
            <button
              key={p.cluster}
              onClick={() => setSelectedClusterId(p.cluster)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                  : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: p.color }}
              />
              <span>{p.segment_name}</span>
              <span className={`text-[10px] tabular-nums font-mono ${isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-400'}`}>
                {p.customer_count} ({p.percentage}%)
              </span>
            </button>
          );
        })}
      </div>

      {/* Detailed Segment Spotlight Card */}
      {activeProfile && (
        <div className="space-y-6">
          {/* Main Segment Header Card */}
          <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-start gap-3">
                <div
                  className="w-4 h-12 rounded-sm shrink-0 mt-0.5"
                  style={{ backgroundColor: activeProfile.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {activeProfile.segment_name}
                    </h2>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                      Cluster #{activeProfile.cluster}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    <span>{activeProfile.customer_count} Guests</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeProfile.percentage}% of Restaurant Base</span>
                    <span aria-hidden="true">·</span>
                    <span>Revenue: ₹{activeProfile.revenue_contribution.toLocaleString()} ({activeProfile.revenue_percentage}%)</span>
                  </div>
                </div>
              </div>

              {/* Quick Customer Filter Action */}
              <button
                onClick={() => {
                  setActiveTab('customers');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md transition-colors cursor-pointer self-start lg:self-center"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Explore all {activeProfile.customer_count} guests in this segment</span>
              </button>
            </div>

            {/* 6 Key Numerical Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
              {/* Avg Recency */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Avg Recency</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-base font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  {activeProfile.avg_recency} days
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Days since last order</div>
              </div>

              {/* Avg Frequency */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Avg Frequency</span>
                  <Repeat className="w-3.5 h-3.5" />
                </div>
                <div className="text-base font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  {activeProfile.avg_frequency} orders
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Lifetime visits</div>
              </div>

              {/* Avg Monetary */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Avg Monetary</span>
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div className="text-base font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  ₹{activeProfile.avg_monetary.toLocaleString()}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Total guest spend</div>
              </div>

              {/* Avg Order Value */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Average AOV</span>
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                </div>
                <div className="text-base font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  ₹{activeProfile.avg_aov.toLocaleString()}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Spend per order</div>
              </div>

              {/* Orders 30D / 90D */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Orders 30D / 90D</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-base font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  {activeProfile.avg_orders_30d} / {activeProfile.avg_orders_90d}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">Recent order cadence</div>
              </div>

              {/* Lifetime Days */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
                <div className="flex items-center justify-between text-neutral-400 mb-1">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">Avg Lifetime</span>
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="text-base font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                  {activeProfile.avg_lifetime_days} days
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">First to latest visit</div>
              </div>
            </div>

            {/* Menu & Product Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed className="w-4 h-4 text-neutral-400 shrink-0" />
                <div>
                  <div className="text-neutral-400 text-[11px]">Top Category Preference</div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">{activeProfile.favorite_category}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-neutral-400 shrink-0" />
                <div>
                  <div className="text-neutral-400 text-[11px]">Top Dish Ordered</div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{activeProfile.favorite_product}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                <div>
                  <div className="text-neutral-400 text-[11px]">Discount / Offer Response</div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                    {activeProfile.offer_response_rate !== null ? `${activeProfile.offer_response_rate}% response rate` : 'N/A (no promo logged)'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 12: Why this segment was identified & Section 13: Actionable Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reasoning */}
            <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Why this segment was identified
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
                Statistical reasoning derived by evaluating cluster means against global restaurant population baselines:
              </p>

              <div className="space-y-3">
                {activeProfile.reasoning.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-700 dark:text-neutral-300">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Recommendations */}
            <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Actionable Restaurant Recommendations
                </h3>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
                Strategic marketing and operational actions customized to this cohort's dining velocity:
              </p>

              <div className="space-y-3">
                {activeProfile.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 rounded-md bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ================================================================
// ComparisonView
// ================================================================
type ComparisonSortKey = keyof Pick<
  ClusterProfile,
  | 'segment_name'
  | 'customer_count'
  | 'percentage'
  | 'avg_recency'
  | 'avg_frequency'
  | 'avg_monetary'
  | 'avg_aov'
  | 'avg_orders_30d'
  | 'revenue_contribution'
>;

export const ComparisonView: React.FC = () => {
  const { profiles } = useApp();
  const [sortKey, setSortKey] = useState<ComparisonSortKey>('customer_count');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (key: ComparisonSortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortedProfiles = [...profiles].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    const numA = Number(valA) || 0;
    const numB = Number(valB) || 0;
    return sortAsc ? numA - numB : numB - numA;
  });

  // Chart comparison data: normalized metrics for cross-comparison
  const chartData = profiles.map(p => ({
    name: p.segment_name,
    'Avg Frequency (orders)': p.avg_frequency,
    'Avg AOV (₹/100)': Math.round(p.avg_aov / 100),
    'Avg Recency (days)': p.avg_recency,
    'Orders (30d)': p.avg_orders_30d,
    color: p.color
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Segment Comparison Matrix
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Descriptive multi-dimensional comparison across all identified restaurant guest cohorts.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
          <span>Neutral comparison without subjective &quot;best/worst&quot; ranking</span>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
          Behavioral Dimension Comparison
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          Comparative view of visit frequency, ticket size, recency gap, and 30-day velocity.
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(23, 23, 23, 0.95)',
                  borderColor: '#404040',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Avg Frequency (orders)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Avg Recency (days)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Orders (30d)" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sortable Comparison Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Cohort Statistical Matrix
          </h2>
          <span className="text-xs text-neutral-400">
            Click any column header to sort
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th
                  onClick={() => handleSort('segment_name')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Segment Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('customer_count')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Guests</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('percentage')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Base %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avg_recency')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Avg Recency</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avg_frequency')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Avg Frequency</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avg_monetary')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Avg Spend</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avg_aov')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Avg AOV</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avg_orders_30d')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Orders (30d)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('revenue_contribution')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total Revenue</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {sortedProfiles.map(p => (
                <tr
                  key={p.cluster}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span>{p.segment_name}</span>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-800 dark:text-neutral-200">
                    {p.customer_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-600 dark:text-neutral-400">
                    {p.percentage}%
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-800 dark:text-neutral-200">
                    {p.avg_recency}d
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-800 dark:text-neutral-200">
                    {p.avg_frequency}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-800 dark:text-neutral-200">
                    ₹{p.avg_monetary.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-800 dark:text-neutral-200">
                    ₹{p.avg_aov.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-800 dark:text-neutral-200">
                    {p.avg_orders_30d}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-right font-medium text-neutral-900 dark:text-neutral-100">
                    ₹{p.revenue_contribution.toLocaleString()} <span className="text-neutral-400 text-[10px]">({p.revenue_percentage}%)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ================================================================
// CustomerExplorerView
// ================================================================
type CustomerSortKey = keyof Pick<
  CustomerFeatures,
  | 'customer_id'
  | 'segment_name'
  | 'recency_days'
  | 'frequency'
  | 'monetary'
  | 'avg_order_value'
  | 'orders_last_30d'
  | 'orders_last_90d'
  | 'favorite_category'
>;

export const CustomerExplorerView: React.FC = () => {
  const {
    customers,
    profiles,
    selectedCustomer,
    setSelectedCustomer,
    searchCustomerId,
    setSearchCustomerId,
    exportCsv
  } = useApp();

  const [selectedSegmentFilter, setSelectedSegmentFilter] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<CustomerSortKey>('monetary');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    // Search query matches customer_id or favorite product
    const q = searchCustomerId.trim().toLowerCase();
    const matchesQuery = !q || c.customer_id.toLowerCase().includes(q) || c.favorite_product.toLowerCase().includes(q);
    const matchesSegment = selectedSegmentFilter === 'ALL' || c.segment_name === selectedSegmentFilter;
    return matchesQuery && matchesSegment;
  });

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    const numA = Number(valA) || 0;
    const numB = Number(valB) || 0;
    return sortAsc ? numA - numB : numB - numA;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / pageSize));
  const paginatedCustomers = sortedCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key: CustomerSortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  const handleCustomerClick = (customer: CustomerFeatures) => {
    setSelectedCustomer(customer);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Customer Explorer &amp; Search
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Search individual restaurant guests by customer ID, view behavioral traits, and inspect RFM scores.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Segmented Guests</span>
        </button>
      </div>

      {/* Selected Customer Profile Detail Modal / Card (Requirement 14) */}
      {selectedCustomer && (
        <div className="p-6 bg-white dark:bg-neutral-900 border-2 border-blue-500/40 dark:border-blue-500/30 rounded-lg shadow-sm relative space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold font-mono text-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                    {selectedCustomer.customer_id}
                  </h2>
                  <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                    {selectedCustomer.segment_name}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  RFM Quantile Score: <strong className="font-mono text-neutral-800 dark:text-neutral-200">{selectedCustomer.rfm_score}</strong> (R:{selectedCustomer.r_score}, F:{selectedCustomer.f_score}, M:{selectedCustomer.m_score}) · {selectedCustomer.rfm_segment}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              title="Close customer profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Customer Profile Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-400">Recency</div>
              <div className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
                {selectedCustomer.recency_days} days
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Latest: {selectedCustomer.latest_order_date}</div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-400">Frequency</div>
              <div className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
                {selectedCustomer.frequency} visits
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">{selectedCustomer.total_quantity} dishes ordered</div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-400">Lifetime Spend</div>
              <div className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
                ₹{selectedCustomer.monetary.toLocaleString()}
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Across relationship</div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-400">Average AOV</div>
              <div className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
                ₹{selectedCustomer.avg_order_value.toLocaleString()}
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Max ticket: ₹{selectedCustomer.max_order_value}</div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-400">Orders (30d / 90d)</div>
              <div className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
                {selectedCustomer.orders_last_30d} / {selectedCustomer.orders_last_90d}
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Spend 30d: ₹{selectedCustomer.spend_last_30d}</div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-md border border-neutral-200/80 dark:border-neutral-800">
              <div className="text-[11px] text-neutral-400">Lifespan</div>
              <div className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
                {selectedCustomer.customer_lifetime_days} days
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">First visit: {selectedCustomer.first_order_date}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-2.5 rounded bg-neutral-50 dark:bg-neutral-800/30 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-neutral-400 shrink-0" />
              <div>
                <div className="text-neutral-400 text-[10px]">Favorite Category</div>
                <div className="font-semibold text-neutral-800 dark:text-neutral-200">{selectedCustomer.favorite_category}</div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-neutral-50 dark:bg-neutral-800/30 flex items-center gap-2">
              <Tag className="w-4 h-4 text-neutral-400 shrink-0" />
              <div>
                <div className="text-neutral-400 text-[10px]">Top Favorite Dish</div>
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{selectedCustomer.favorite_product}</div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-neutral-50 dark:bg-neutral-800/30 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
              <div>
                <div className="text-neutral-400 text-[10px]">Offer Response</div>
                <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {selectedCustomer.offers_available && selectedCustomer.offer_response_rate !== undefined
                    ? `${Math.round(selectedCustomer.offer_response_rate * 100)}% (${selectedCustomer.offers_used || 0}/${selectedCustomer.offers_received || 0})`
                    : 'Standard Menu Dining (No promo)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer ID (e.g. CUST-0024) or dish name..."
            value={searchCustomerId}
            onChange={e => {
              setSearchCustomerId(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
          />
        </div>

        {/* Segment Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Filter Cohort:</span>
          <select
            value={selectedSegmentFilter}
            onChange={e => {
              setSelectedSegmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-900 dark:text-neutral-100 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Segments ({customers.length})</option>
            {profiles.map(p => (
              <option key={p.cluster} value={p.segment_name}>
                {p.segment_name} ({p.customer_count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer Data Table (Requirement 15) */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th
                  onClick={() => handleSort('customer_id')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('segment_name')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Segment</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('recency_days')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Recency</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('frequency')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Frequency</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('monetary')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Monetary</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avg_order_value')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>AOV</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('orders_last_30d')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Orders 30D</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('orders_last_90d')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Orders 90D</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('favorite_category')}
                  className="px-4 py-3 cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Favorite Category</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                    No customers found matching the search filter.
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map(c => {
                  const prof = profiles.find(p => p.cluster === c.cluster);
                  const isSelected = selectedCustomer?.customer_id === c.customer_id;
                  return (
                    <tr
                      key={c.customer_id}
                      onClick={() => handleCustomerClick(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                        {c.customer_id}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: prof?.color || '#3B82F6' }} />
                          <span>{c.segment_name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-800 dark:text-neutral-200">
                        {c.recency_days}d
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-800 dark:text-neutral-200">
                        {c.frequency}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-right font-medium text-neutral-900 dark:text-neutral-100">
                        ₹{c.monetary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-800 dark:text-neutral-200">
                        ₹{c.avg_order_value.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-800 dark:text-neutral-200">
                        {c.orders_last_30d}
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums text-right text-neutral-800 dark:text-neutral-200">
                        {c.orders_last_90d}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 truncate max-w-xs">
                        {c.favorite_category}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedCustomers.length)} of{' '}
            {sortedCustomers.length} guests
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-neutral-200 dark:border-neutral-700 rounded-md disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-neutral-200 dark:border-neutral-700 rounded-md disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ================================================================
// RfmView
// ================================================================
export const RfmView: React.FC = () => {
  const { customers, setSelectedCustomer, setActiveTab } = useApp();

  const total = customers.length;

  // 1. Recency distribution bins
  const recencyBins = [
    { label: '< 15d', count: 0 },
    { label: '15-30d', count: 0 },
    { label: '31-60d', count: 0 },
    { label: '61-90d', count: 0 },
    { label: '91-180d', count: 0 },
    { label: '> 180d', count: 0 }
  ];
  for (const c of customers) {
    const r = c.recency_days;
    if (r < 15) recencyBins[0].count++;
    else if (r <= 30) recencyBins[1].count++;
    else if (r <= 60) recencyBins[2].count++;
    else if (r <= 90) recencyBins[3].count++;
    else if (r <= 180) recencyBins[4].count++;
    else recencyBins[5].count++;
  }

  // 2. Frequency distribution bins
  const freqBins = [
    { label: '1-2 visits', count: 0 },
    { label: '3-5 visits', count: 0 },
    { label: '6-9 visits', count: 0 },
    { label: '10-15 visits', count: 0 },
    { label: '16+ visits', count: 0 }
  ];
  for (const c of customers) {
    const f = c.frequency;
    if (f <= 2) freqBins[0].count++;
    else if (f <= 5) freqBins[1].count++;
    else if (f <= 9) freqBins[2].count++;
    else if (f <= 15) freqBins[3].count++;
    else freqBins[4].count++;
  }

  // 3. Monetary distribution bins
  const monetaryBins = [
    { label: '< ₹1k', count: 0 },
    { label: '₹1k-₹3k', count: 0 },
    { label: '₹3k-₹6k', count: 0 },
    { label: '₹6k-₹12k', count: 0 },
    { label: '> ₹12k', count: 0 }
  ];
  for (const c of customers) {
    const m = c.monetary;
    if (m < 1000) monetaryBins[0].count++;
    else if (m <= 3000) monetaryBins[1].count++;
    else if (m <= 6000) monetaryBins[2].count++;
    else if (m <= 12000) monetaryBins[3].count++;
    else monetaryBins[4].count++;
  }

  // 4. RFM Segment counts
  const rfmSegmentMap = new Map<string, number>();
  for (const c of customers) {
    const seg = c.rfm_segment || 'Other';
    rfmSegmentMap.set(seg, (rfmSegmentMap.get(seg) || 0) + 1);
  }
  const rfmSegments = Array.from(rfmSegmentMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            RFM Analytics &amp; Quantile Stratification
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Quantile-based scoring (1 to 5) evaluating Recency, Frequency, and Monetary dimensions.
          </p>
        </div>

        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          Quantiles: <span className="font-mono text-neutral-800 dark:text-neutral-200">5 (Highest/Best) to 1 (Lowest)</span>
        </div>
      </div>

      {/* RFM Methodology Explainer Banner */}
      <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Recency (R)</span>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
            Days elapsed since guest&apos;s latest meal. Lower days = higher score (Score 5: visited recently).
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <Repeat className="w-3.5 h-3.5 text-emerald-500" />
            <span>Frequency (F)</span>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
            Total unique visits/orders logged. Higher visit count = higher score (Score 5: most habitual diners).
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-neutral-100">
            <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            <span>Monetary (M)</span>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
            Cumulative monetary bill value paid. Higher revenue = higher score (Score 5: top restaurant spenders).
          </p>
        </div>
      </div>

      {/* 3 Histograms: Recency, Frequency, Monetary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recency Distribution */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Recency Distribution
            </h2>
            <span className="text-[11px] text-neutral-400">Days gap</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recencyBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} guests`, 'Count']}
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', borderColor: '#404040', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Frequency Distribution */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Frequency Distribution
            </h2>
            <span className="text-[11px] text-neutral-400">Order count</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freqBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} guests`, 'Count']}
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', borderColor: '#404040', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monetary Distribution */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              Monetary Spend Distribution
            </h2>
            <span className="text-[11px] text-neutral-400">Total bill</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monetaryBins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} guests`, 'Count']}
                  contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', borderColor: '#404040', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RFM Matrix Segment Breakdown */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              RFM Matrix Classifications
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Customer classifications mapped from combined 3-digit RFM quantile score matrices
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rfmSegments.map((seg, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800 rounded-md flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  {seg.name === 'Champions' || seg.name === 'Loyal Customers' ? (
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                  ) : seg.name === 'At Risk' || seg.name === 'Cannot Lose Them' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  <span>{seg.name}</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {seg.percentage}% of guest population
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {seg.count}
                </span>
                <span className="text-[10px] text-neutral-400 block">guests</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
