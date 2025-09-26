import { useState, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, BarChart, Bar } from 'recharts'

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

  // Smart Data Processing
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

  const renewalPipeline = [
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            </div>

            {/* Main Content Based on Active Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Portfolio Value Trends - Enhanced Graph Size with Same Container */}
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
  
  {/* Keep original container height but optimize internal space */}
  <div className="h-96 relative bg-gradient-to-b from-gray-50 to-white rounded-lg">
    
    {/* Enhanced SVG with better internal scaling */}
    <svg className="w-full h-full" viewBox="0 0 900 400">
      <defs>
        <linearGradient id="barGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="barGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="barGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#0891b2', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="barGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#2563eb', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="barGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1d4ed8', stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: '#1e40af', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Enhanced Grid Lines - Larger spacing */}
      <g stroke="#f3f4f6" strokeWidth="1" opacity="0.5">
        {/* Horizontal grid lines */}
        <line x1="80" y1="70" x2="720" y2="70" />
        <line x1="80" y1="120" x2="720" y2="120" />
        <line x1="80" y1="170" x2="720" y2="170" />
        <line x1="80" y1="220" x2="720" y2="220" />
        <line x1="80" y1="270" x2="720" y2="270" />
        <line x1="80" y1="320" x2="720" y2="320" />
        
        {/* Vertical grid lines with better spacing */}
        <line x1="140" y1="70" x2="140" y2="320" />
        <line x1="240" y1="70" x2="240" y2="320" />
        <line x1="340" y1="70" x2="340" y2="320" />
        <line x1="440" y1="70" x2="440" y2="320" />
        <line x1="540" y1="70" x2="540" y2="320" />
        <line x1="640" y1="70" x2="640" y2="320" />
      </g>

      {/* X and Y Axes */}
      <g stroke="#6b7280" strokeWidth="2">
        <line x1="80" y1="320" x2="720" y2="320" /> {/* X-axis */}
        <line x1="80" y1="70" x2="80" y2="320" />   {/* Y-axis */}
      </g>

      {/* Y-axis Labels */}
      <g className="text-sm fill-gray-600" textAnchor="end">
        <text x="75" y="75">$3.0M</text>
        <text x="75" y="125">$2.5M</text>
        <text x="75" y="175">$2.0M</text>
        <text x="75" y="225">$1.5M</text>
        <text x="75" y="275">$1.0M</text>
        <text x="75" y="325">$0.5M</text>
      </g>

      {/* Larger 3D Bars with More Spacing */}
      
      {/* Smaller 3D Bars with Proper Spacing */}
      {/* Medium-sized 3D Bars with Good Spacing */}

{/* Jul - Bar 1 */}
<g>
  <path d="M 125 320 L 125 270 L 155 260 L 155 310 Z" fill="url(#barGradient1)">
    <animate attributeName="d" 
             values="M 125 320 L 125 320 L 155 310 L 155 310 Z;M 125 320 L 125 270 L 155 260 L 155 310 Z"
             dur="1.5s" begin="0s" />
  </path>
  <path d="M 125 270 L 155 260 L 180 270 L 155 280 Z" fill="#f87171" opacity="0.8"/>
  <path d="M 155 260 L 155 310 L 180 300 L 180 270 Z" fill="#dc2626" opacity="0.6"/>
</g>

{/* Aug - Bar 2 */}
<g>
  <path d="M 215 320 L 215 220 L 245 210 L 245 280 Z" fill="url(#barGradient2)">
    <animate attributeName="d" 
             values="M 215 320 L 215 320 L 245 310 L 245 310 Z;M 215 320 L 215 220 L 245 210 L 245 280 Z"
             dur="1.5s" begin="0.3s" />
  </path>
  <path d="M 215 220 L 245 210 L 270 220 L 245 230 Z" fill="#fbbf24" opacity="0.8"/>
  <path d="M 245 210 L 245 280 L 270 270 L 270 220 Z" fill="#d97706" opacity="0.6"/>
</g>

{/* Sep - Bar 3 */}
<g>
  <path d="M 305 320 L 305 180 L 335 170 L 335 240 Z" fill="url(#barGradient3)">
    <animate attributeName="d" 
             values="M 305 320 L 305 320 L 335 310 L 335 310 Z;M 305 320 L 305 180 L 335 170 L 335 240 Z"
             dur="1.5s" begin="0.6s" />
  </path>
  <path d="M 305 180 L 335 170 L 360 180 L 335 190 Z" fill="#67e8f9" opacity="0.8"/>
  <path d="M 335 170 L 335 240 L 360 230 L 360 180 Z" fill="#0891b2" opacity="0.6"/>
</g>

{/* Oct - Bar 4 (Forecast) */}
<g opacity="0.8">
  <path d="M 395 320 L 395 150 L 425 140 L 425 210 Z" fill="url(#barGradient4)" strokeDasharray="6 3" stroke="#3b82f6" strokeWidth="2">
    <animate attributeName="d" 
             values="M 395 320 L 395 320 L 425 310 L 425 310 Z;M 395 320 L 395 150 L 425 140 L 425 210 Z"
             dur="1.5s" begin="0.9s" />
  </path>
  <path d="M 395 150 L 425 140 L 450 150 L 425 160 Z" fill="#93c5fd" opacity="0.8" strokeDasharray="6 3" stroke="#3b82f6" strokeWidth="1"/>
  <path d="M 425 140 L 425 210 L 450 200 L 450 150 Z" fill="#2563eb" opacity="0.6" strokeDasharray="6 3" stroke="#2563eb" strokeWidth="1"/>
</g>

{/* Nov - Bar 5 (Forecast) */}
<g opacity="0.8">
  <path d="M 485 320 L 485 100 L 515 90 L 515 160 Z" fill="url(#barGradient5)" strokeDasharray="6 3" stroke="#1d4ed8" strokeWidth="2">
    <animate attributeName="d" 
             values="M 485 320 L 485 320 L 515 310 L 515 310 Z;M 485 320 L 485 100 L 515 90 L 515 160 Z"
             dur="1.5s" begin="1.2s" />
  </path>
  <path d="M 485 100 L 515 90 L 540 100 L 515 110 Z" fill="#a5b4fc" opacity="0.8" strokeDasharray="6 3" stroke="#1d4ed8" strokeWidth="1"/>
  <path d="M 515 90 L 515 160 L 540 150 L 540 100 Z" fill="#1e40af" opacity="0.6" strokeDasharray="6 3" stroke="#1e40af" strokeWidth="1"/>
</g>





      {/* X-axis Labels - Better positioned */}
      <g className="text-sm font-medium fill-gray-600" textAnchor="middle">
        <text x="160" y="345">Jul</text>
        <text x="260" y="345">Aug</text>
        <text x="360" y="345">Sep</text>
        <text x="460" y="345">Oct</text>
        <text x="560" y="345">Nov</text>
      </g>

    </svg>

    {/* Right-Side Legend - Same position, better spacing */}
    <div className="absolute top-16 right-4 space-y-4 text-xs">
      <div className="flex items-center space-x-3">
        <div className="w-4 h-0.5 bg-red-500"></div>
        <span className="text-gray-600">Contract Acquisition</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-4 h-0.5 bg-orange-500"></div>
        <span className="text-gray-600">Portfolio Growth</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-4 h-0.5 bg-cyan-500"></div>
        <span className="text-gray-600">Market Expansion</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-4 h-0.5 bg-blue-500"></div>
        <span className="text-gray-600">Revenue Projection</span>
      </div>
      <div className="flex items-center space-x-3">
        <div className="w-4 h-0.5 bg-blue-800"></div>
        <span className="text-gray-600">Target Achievement</span>
      </div>
    </div>

  </div>
</div>



                  
                

                  


                  


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

