export default function Reports() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        
        {/* Header with Action Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
              <p className="text-gray-600">Generate executive reports and track contract performance metrics</p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Create New Report
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Schedule Report
              </button>
            </div>
          </div>
        </div>

        {/* Executive Report Templates */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Executive Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Executive Summary</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium">
                  Generate
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-4">High-level portfolio overview for leadership</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">CSV</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">PDF</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Filter by vendor</span>
              </div>
              <p className="text-xs text-gray-500">Last generated: Yesterday, 3:47 PM</p>
            </div>

            {/* Financial Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Financial Analysis</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium">
                  Generate
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-4">Contract values, costs, and ROI analysis</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Auto-calculated savings</span>
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Trend analysis</span>
              </div>
              <p className="text-xs text-gray-500">Features: Forecasting & ROI metrics</p>
            </div>

            {/* Compliance Report */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Compliance Dashboard</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium">
                  Generate
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-4">Regulatory adherence and risk assessment</p>
              <div className="flex items-center mb-4">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                <span className="text-amber-700 text-xs">2 compliance issues detected</span>
              </div>
              <p className="text-xs text-gray-500">CSRD, GRI framework compliance</p>
            </div>

          </div>
        </div>

        {/* Operational Reports */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Operational Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Vendor Performance */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Vendor Performance</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium">
                  Generate
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-4">Supplier relationship and performance metrics</p>
              <p className="text-xs text-gray-500">Benchmarking & relationship insights</p>
            </div>

            {/* Renewal Pipeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Renewal Pipeline</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium">
                  Generate
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-4">Upcoming renewals and action items</p>
              <p className="text-xs text-gray-500">30/60/90 day alerts & calendar integration</p>
            </div>

            {/* Risk Assessment */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium">
                  Generate
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-4">Contract risk analysis and mitigation strategies</p>
              <p className="text-xs text-gray-500">Deviation heatmaps vs templates</p>
            </div>

          </div>
        </div>

        {/* Advanced Intelligence Reports */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Intelligence Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Contract-to-Pay Validation */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Contract-to-Pay Validation</h3>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Enterprise</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">Invoice reconciliation against contract terms (ARC/RRC, floors/ceilings)</p>
              <p className="text-xs text-gray-500">Historical spend audit → Live validation</p>
            </div>

            {/* Clause Deviation Analysis */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Clause Deviation Analysis</h3>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">AI-Powered</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">Compare contracts to playbooks and industry benchmarks</p>
              <p className="text-xs text-gray-500">Highlight risky deviations with recommendations</p>
            </div>

            {/* ESG Compliance Intelligence */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">ESG Compliance Intelligence</h3>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Regulatory</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">Sustainability, labor, and diversity clause detection</p>
              <p className="text-xs text-gray-500">Map to CSRD, SEC, GRI reporting frameworks</p>
            </div>

            {/* SLA Performance Tracker */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">SLA Performance Tracker</h3>
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">Live Data</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">Extract SLA clauses and track actual performance</p>
              <p className="text-xs text-gray-500">ServiceNow/Jira integration for IT/telecom</p>
            </div>

          </div>
        </div>

        {/* Recent Reports & Scheduled Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Recent Reports */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Quarterly Summary Q2</p>
                  <p className="text-xs text-gray-500">Executive • Generated 2 days ago</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                  <button className="text-gray-400 hover:text-gray-600 text-sm">Share</button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Weekly Compliance Report</p>
                  <p className="text-xs text-gray-500">Compliance • Generated today</p>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                  <button className="text-gray-400 hover:text-gray-600 text-sm">Share</button>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled Reports */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scheduled Reports</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Weekly Compliance Report</p>
                  <p className="text-xs text-gray-500">Every Monday 9:00 AM</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900 text-sm">Monthly Executive Summary</p>
                  <p className="text-xs text-gray-500">1st of month 8:00 AM</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
              </div>
            </div>

            <button className="w-full mt-4 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm transition-colors">
              Add Custom Report
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
