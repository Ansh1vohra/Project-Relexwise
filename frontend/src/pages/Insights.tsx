import { useState, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { useDashboardData } from '../hooks/useDashboardData'

const colors = {
  primary: '#1d4ed8',
  success: '#10B981', 
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#7C3AED',
  teal: '#06B6D4'
}

export default function Insights() {
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'predictions'>('overview')
  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'year'>('90d')

  // Get dashboard data from the custom hook
  const {
    contractFiles,
    loading,
    error,
    contractStatusData,
    renewalPipelineData,
    spendByScopeData,
    renewalTimelineData,
    activeContracts,
    totalValue,
    expiringContracts,
  } = useDashboardData();

  // Chart colors for consistency with Dashboard
  const chartColors = [
    '#64748b', '#94a3b8', '#60a5fa', '#a3a3a3', '#6ee7b7', '#facc15', '#f87171', '#cbd5e1',
  ];

  // Fake data for chart demonstration (when real data is empty)
  const fakeContractStatusData = [
    { name: 'Active', value: 45, color: chartColors[2] },
    { name: 'Expired', value: 12, color: chartColors[6] },
    { name: 'Draft', value: 8, color: chartColors[0] }
  ];

  const fakeRenewalPipelineData = [
    { period: '<30 days', contracts: 8, value: 320000, displayValue: '$320K' },
    { period: '30-90 days', contracts: 15, value: 850000, displayValue: '$850K' },
    { period: '>90 days', contracts: 22, value: 1200000, displayValue: '$1.2M' }
  ];

  const fakeSpendByScopeData = [
    { name: 'IT Services', value: 1200000, color: chartColors[0], displayValue: '$1.2M', contracts: 15 },
    { name: 'Consulting', value: 850000, color: chartColors[1], displayValue: '$850K', contracts: 12 },
    { name: 'Software Licenses', value: 620000, color: chartColors[2], displayValue: '$620K', contracts: 8 },
    { name: 'Support & Maintenance', value: 450000, color: chartColors[3], displayValue: '$450K', contracts: 10 },
    { name: 'Other', value: 280000, color: chartColors[4], displayValue: '$280K', contracts: 5 }
  ];

  const fakeRenewalTimelineData = [
    { month: 'Oct 2025', contracts: 3, value: 180000, displayValue: '$180K' },
    { month: 'Nov 2025', contracts: 5, value: 320000, displayValue: '$320K' },
    { month: 'Dec 2025', contracts: 8, value: 450000, displayValue: '$450K' },
    { month: 'Jan 2026', contracts: 4, value: 280000, displayValue: '$280K' },
    { month: 'Feb 2026', contracts: 6, value: 380000, displayValue: '$380K' },
    { month: 'Mar 2026', contracts: 7, value: 420000, displayValue: '$420K' },
    { month: 'Apr 2026', contracts: 2, value: 150000, displayValue: '$150K' },
    { month: 'May 2026', contracts: 3, value: 220000, displayValue: '$220K' },
    { month: 'Jun 2026', contracts: 5, value: 350000, displayValue: '$350K' },
    { month: 'Jul 2026', contracts: 4, value: 280000, displayValue: '$280K' },
    { month: 'Aug 2026', contracts: 6, value: 380000, displayValue: '$380K' },
    { month: 'Sep 2026', contracts: 3, value: 200000, displayValue: '$200K' }
  ];

  // Use fake data if real data is empty, otherwise use real data
  const displayContractStatusData = contractStatusData.length > 0 ? contractStatusData : fakeContractStatusData;
  const displayRenewalPipelineData = renewalPipelineData.some(item => item.contracts > 0) ? renewalPipelineData : fakeRenewalPipelineData;
  const displaySpendByScopeData = spendByScopeData.length > 0 ? spendByScopeData : fakeSpendByScopeData;
  const displayRenewalTimelineData = renewalTimelineData.some(item => item.contracts > 0) ? renewalTimelineData : fakeRenewalTimelineData;

  // Smart Data Processing - Use real data from dashboard or fallback to demo data
  const contractMetrics = useMemo(() => ({
    totalValue: totalValue !== '$0' ? totalValue : '$3.4M', // Use demo data if no real data
    avgContractValue: contractFiles.length > 0 ? 
      `$${Math.round(parseFloat(totalValue.replace(/[$,KMB]/g, '')) * (totalValue.includes('K') ? 1000 : totalValue.includes('M') ? 1000000 : totalValue.includes('B') ? 1000000000 : 1) / contractFiles.length / 1000)}K` : 
      '$185K', // Demo average
    processingRate: '98.5%',
    complianceScore: 94,
    riskContracts: 3,
    renewalsNext90Days: expiringContracts > 0 ? expiringContracts : 12, // Use demo data if no expiring contracts
    savingsIdentified: '$180K',
    automationLevel: 85
  }), [totalValue, contractFiles.length, expiringContracts])

  // Keep existing mock data for other insights (commented but preserved)
  /*
  const contractMetrics = useMemo(() => ({
    totalValue: '$2.4M',
    avgContractValue: '$180K',
    processingRate: '98.5%',
    complianceScore: 94,
    riskContracts: 3,
    renewalsNext90Days: 12,
    savingsIdentified: '$180K',
    automationLevel: 85
  }), [])
  */

  /* Original insights mock data (preserved for AI features, Risk Matrix, etc.) */
  const valueAnalytics = [
    { month: 'Jul', value: 1.8, forecast: null },
    { month: 'Aug', value: 2.1, forecast: null },
    { month: 'Sep', value: 2.4, forecast: null },
    { month: 'Oct', value: null, forecast: 2.6 },
    { month: 'Nov', value: null, forecast: 2.8 },
    { month: 'Dec', value: null, forecast: 3.0 }
  ]

  // Unique Risk Visualization - Heat Map Style
  const riskMatrix = [
    { category: 'Compliance', contracts: 28, riskScore: 15, impact: 'low' },
    { category: 'Financial', contracts: 18, riskScore: 35, impact: 'medium' },
    { category: 'Operational', contracts: 12, riskScore: 75, impact: 'high' },
    { category: 'Legal', contracts: 8, riskScore: 25, impact: 'low' },
    { category: 'Strategic', contracts: 6, riskScore: 60, impact: 'medium' }
  ]

  const vendorPerformance = [
    { vendor: 'Acme Corp', score: 92, contracts: 8, value: '$420K', trend: 'up' },
    { vendor: 'TechFlow Inc', score: 78, contracts: 5, value: '$280K', trend: 'stable' },
    { vendor: 'Global Systems', score: 85, contracts: 12, value: '$650K', trend: 'up' },
    { vendor: 'DataVault Ltd', score: 71, contracts: 3, value: '$180K', trend: 'down' }
  ]

  /* Use real renewal pipeline data instead of mock data */
  const renewalPipeline = renewalPipelineData.length > 0 ? 
    renewalPipelineData.map((item, index) => ({
      month: item.period.replace('<', 'Next ').replace('>', 'Beyond '),
      contracts: item.contracts,
      value: item.displayValue,
      probability: 85 - (index * 5) // Simulated probability for display
    })) : [
      { month: 'Oct', contracts: 4, value: '$320K', probability: 85 },
      { month: 'Nov', contracts: 6, value: '$480K', probability: 78 },
      { month: 'Dec', contracts: 8, value: '$640K', probability: 92 },
      { month: 'Jan', contracts: 5, value: '$380K', probability: 68 },
      { month: 'Feb', contracts: 3, value: '$220K', probability: 89 }
    ]

  const aiInsights = [
    {
      type: 'prediction',
      title: 'High Renewal Probability',
      description: '12 contracts show 85%+ renewal likelihood in next 60 days',
      impact: 'Revenue: $420K',
      confidence: 92,
      action: 'Schedule renewal meetings'
    },
    {
      type: 'optimization',
      title: 'Clause Standardization Opportunity',
      description: '5 contracts deviate from standard payment terms by >15%',
      impact: 'Savings: $45K',
      confidence: 87,
      action: 'Renegotiate terms'
    },
    {
      type: 'compliance',
      title: 'ESG Compliance Gap',
      description: '3 vendor contracts missing sustainability clauses',
      impact: 'Risk: Medium',
      confidence: 95,
      action: 'Update agreements'
    },
    {
      type: 'anomaly',
      title: 'Invoice Processing Alert',
      description: 'Vendor XYZ exceeded contract ceiling by $15K last month',
      impact: 'Overpay: $15K',
      confidence: 100,
      action: 'Investigate billing'
    }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Fixed Content Area - Prevents shifting */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-none mx-0">
            
            {/* Enhanced Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Intelligence Center</h1>
                  <p className="text-gray-600">AI-powered insights, predictions, and strategic recommendations</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                    {(['30d', '90d', 'year'] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setDateRange(range)}
                        className={`px-3 py-2 text-sm rounded-md transition-colors ${
                          dateRange === range 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {range === 'year' ? '1Y' : range.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Generate Report
                  </button>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                {[
                  { id: 'overview', label: 'Portfolio Overview', icon: '📊' },
                  { id: 'intelligence', label: 'AI Intelligence', icon: '🧠' },
                  { id: 'predictions', label: 'Predictions', icon: '🔮' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Executive Metrics Cards */}
            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-lg">💼</span>
                  </div>
                  <span className="text-green-600 text-sm font-medium">+18%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{contractMetrics.totalValue}</h3>
                <p className="text-gray-600 text-sm">Portfolio Value</p>
                <p className="text-xs text-gray-500 mt-1">Avg: {contractMetrics.avgContractValue}</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg">⚡</span>
                  </div>
                  <span className="text-green-600 text-sm font-medium">Live</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{contractMetrics.processingRate}</h3>
                <p className="text-gray-600 text-sm">AI Processing Rate</p>
                <p className="text-xs text-gray-500 mt-1">124 contracts today</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-lg">🎯</span>
                  </div>
                  <span className="text-green-600 text-sm font-medium">+5%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{contractMetrics.complianceScore}%</h3>
                <p className="text-gray-600 text-sm">Compliance Score</p>
                <p className="text-xs text-gray-500 mt-1">2 violations detected</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="text-amber-600 text-lg">🔄</span>
                  </div>
                  <span className="text-blue-600 text-sm font-medium">{contractMetrics.renewalsNext90Days}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Next 90 Days</h3>
                <p className="text-gray-600 text-sm">Renewal Pipeline</p>
                <p className="text-xs text-gray-500 mt-1">High probability: 8</p>
              </div>
            </div> */}

            {/* Main Content Based on Active Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                
                {/* Dashboard Charts Section - Real Data from Dashboard */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Contract Portfolio Analytics</h3>
                    {(contractStatusData.length === 0 || !renewalPipelineData.some(item => item.contracts > 0)) && (
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                        Demo Data - Upload contracts to see real analytics
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Contract Status Overview Chart */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-base font-semibold text-gray-800 mb-4">Contract Status Overview</h3>
                      {loading ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-gray-400">Loading chart data...</div>
                        </div>
                      ) : displayContractStatusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={displayContractStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {displayContractStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              wrapperStyle={{ fontSize: 13 }}
                              contentStyle={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-gray-400">No data available</div>
                        </div>
                      )}
                      <div className="flex justify-center space-x-6 mt-4">
                        {displayContractStatusData.map((entry, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-xs text-gray-600">{entry.name} ({entry.value})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Renewal Pipeline Chart */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-base font-semibold text-gray-800 mb-4">Renewal Pipeline</h3>
                      {loading ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-gray-400">Loading chart data...</div>
                        </div>
                      ) : displayRenewalPipelineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={displayRenewalPipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" height={40} />
                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip wrapperStyle={{ fontSize: 13 }} contentStyle={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6 }} />
                            <Bar dataKey="contracts" fill={chartColors[2]} barSize={28} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-gray-400">No renewal data available</div>
                        </div>
                      )}
                      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        {displayRenewalPipelineData.map((item, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                            <div className="text-xs font-medium text-gray-600">{item.period}</div>
                            <div className="text-base font-bold text-gray-700">{item.contracts}</div>
                            <div className="text-xs text-gray-400">{item.displayValue}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Additional Dashboard Charts - Row 2 */}
                  <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Spend by Scope/Category Chart */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-base font-semibold text-gray-800 mb-4">Spend by Scope / Category</h3>
                      {loading ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-gray-400">Loading chart data...</div>
                        </div>
                      ) : displaySpendByScopeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={displaySpendByScopeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {displaySpendByScopeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              wrapperStyle={{ fontSize: 13 }}
                              contentStyle={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-gray-400">No scope data available</div>
                        </div>
                      )}
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {displaySpendByScopeData.map((entry, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-xs text-gray-600 truncate">{entry.name}</span>
                            <span className="text-xs text-gray-400 ml-auto">({entry.contracts})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upcoming Renewals Timeline Chart */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-base font-semibold text-gray-800 mb-4">Upcoming Renewals Timeline</h3>
                      {loading ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-gray-400">Loading chart data...</div>
                        </div>
                      ) : displayRenewalTimelineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={displayRenewalTimelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRenewalsInsights" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#64748b" stopOpacity={0.18}/>
                                <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <Tooltip
                              wrapperStyle={{ fontSize: 13 }}
                              contentStyle={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6 }}
                            />
                            <Area
                              type="monotone"
                              dataKey="contracts"
                              stroke="#64748b"
                              fillOpacity={1}
                              fill="url(#colorRenewalsInsights)"
                              dot={{ r: 2, fill: '#64748b' }}
                              activeDot={{ r: 4, fill: '#334155', stroke: '#64748b', strokeWidth: 1 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-gray-400">No renewal data available</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Original insights content (commented but preserved) */}
                {/*
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Portfolio Value Trends - Enhanced Graph Size with Same Container */}
                {/*
<div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-lg font-semibold text-gray-900">Portfolio Value Trends</h3>
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">Actual</span>
      <div className="w-4 h-0.5 bg-blue-600"></div>
      <span className="text-sm text-gray-500">Forecast</span>
      <div className="w-4 h-0.5 bg-blue-300 border-dashed"></div>
    </div>
  </div>
  
  {/* ... original complex SVG chart ... */}
                {/*
  </div>
  */}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                  {/* Simplified Portfolio Value Trends */}
                  {/* <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Portfolio Value Trends</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Actual</span>
                        <div className="w-4 h-0.5 bg-blue-600"></div>
                        <span className="text-sm text-gray-500">Forecast</span>
                        <div className="w-4 h-0.5 bg-blue-300 border-dashed"></div>
                      </div>
                    </div>
                    
                    <div className="h-80 bg-gradient-to-b from-gray-50 to-white rounded-lg p-4">
                      <div className="text-center text-gray-500">
                        Portfolio analytics visualization based on real contract data shown above
                      </div>
                    </div>
                  </div> */}

                  {/* Risk Heat Map - Unique Alternative */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Heat Map</h3>
                    <div className="space-y-3">
                      {riskMatrix.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-medium text-gray-900">{item.category}</div>
                            <span className="text-xs text-gray-500">{item.contracts} contracts</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  item.riskScore < 30 ? 'bg-green-500' :
                                  item.riskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${item.riskScore}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-600">{item.riskScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Low Risk</span>
                        <span>Medium Risk</span>
                        <span>High Risk</span>
                      </div>
                      <div className="flex mt-1">
                        <div className="flex-1 h-1 bg-green-500 rounded-l"></div>
                        <div className="flex-1 h-1 bg-yellow-500"></div>
                        <div className="flex-1 h-1 bg-red-500 rounded-r"></div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Vendor Performance Dashboard */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Vendor Performance Dashboard</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {vendorPerformance.map((vendor, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 text-sm">{vendor.vendor}</h4>
                          <span className={`w-2 h-2 rounded-full ${
                            vendor.trend === 'up' ? 'bg-green-500' :
                            vendor.trend === 'down' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Score</span>
                            <span className="font-medium">{vendor.score}/100</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Contracts</span>
                            <span className="font-medium">{vendor.contracts}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Value</span>
                            <span className="font-medium text-green-600">{vendor.value}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

            {/* Horizontal Timeline-style Pipeline (clean, non-overlapping) */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-gray-900">Contract Renewal Pipeline</h3>
                <p className="text-sm text-gray-600">Infographic-style horizontal flow across upcoming months</p>
              </div>
              <div className="relative">
                {/* central line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gray-200"></div>
                {/* stages */}
                <div className="grid grid-cols-5 gap-4">
                  {renewalPipeline.map((s, idx) => (
                    <div key={idx} className="relative">
                      <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500"></div>
                      <div className="rounded-xl border bg-white p-4 shadow-sm text-center md:mt-8">
                        <div className="text-xs font-semibold text-blue-600 mb-1">{s.month}</div>
                        <div className="text-2xl font-bold text-gray-900">{s.contracts}</div>
                        <div className="text-xs text-gray-500">contracts</div>
                        <div className="text-sm font-medium text-indigo-600 mt-1">{s.value}</div>
                        <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${s.probability}%` }}></div>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">{s.probability}% probability</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* small stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-gray-900 font-medium">Average Success Rate</div>
                  <div className="text-2xl text-blue-700 font-bold mt-1">87%</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="text-sm text-gray-900 font-medium">Total Pipeline Value</div>
                  <div className="text-2xl text-purple-700 font-bold mt-1">$2.04M</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-gray-900 font-medium">Avg Time to Renewal</div>
                  <div className="text-2xl text-green-700 font-bold mt-1">42 days</div>
                </div>
              </div>
            </div>

              </div>
            )}

            {activeTab === 'intelligence' && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">AI-Powered Insights & Recommendations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aiInsights.map((insight, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                              insight.type === 'prediction' ? 'bg-blue-100 text-blue-600' :
                              insight.type === 'optimization' ? 'bg-green-100 text-green-600' :
                              insight.type === 'compliance' ? 'bg-purple-100 text-purple-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {insight.type === 'prediction' ? '🔮' : 
                               insight.type === 'optimization' ? '⚡' :
                               insight.type === 'compliance' ? '✅' : '⚠️'}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm">{insight.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                insight.confidence >= 90 ? 'bg-green-100 text-green-700' :
                                insight.confidence >= 80 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {insight.confidence}% confidence
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{insight.impact}</span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            {insight.action} →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'predictions' && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Predictive Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Revenue Forecast</h4>
                    <p className="text-2xl font-bold text-blue-900">$3.2M</p>
                    <p className="text-sm text-blue-700">Expected by Q1 2026</p>
                    <p className="text-xs text-blue-600 mt-2">Based on renewal patterns + new acquisitions</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                    <h4 className="font-semibold text-green-900 mb-2">Renewal Success Rate</h4>
                    <p className="text-2xl font-bold text-green-900">91%</p>
                    <p className="text-sm text-green-700">Predicted next quarter</p>
                    <p className="text-xs text-green-600 mt-2">Above industry average of 85%</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                    <h4 className="font-semibold text-purple-900 mb-2">Cost Optimization</h4>
                    <p className="text-2xl font-bold text-purple-900">$240K</p>
                    <p className="text-sm text-purple-700">Potential savings identified</p>
                    <p className="text-xs text-purple-600 mt-2">Through clause standardization</p>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  )
}

