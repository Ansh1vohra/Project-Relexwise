import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  FileText,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Shield,
  Upload,
  Eye,
  Download,
  Filter,
  Search,
  Bell,
  Settings,
  Plus,
  ArrowRight,
  Target,
  Briefcase,
  Globe,
  ArrowDown
} from 'lucide-react';

const Dashboard = () => {
  const [activeContracts] = useState(247);
  const [totalValue] = useState('$12.4M');
  const [expiringContracts] = useState(23);
  const [riskScore] = useState(7.2);

  // Sample contract data
  const contractData = [
    { id: 1, name: "TeleCo Master Service Agreement", vendor: "TeleCo Ltd", value: "$2.4M", status: "Active", expiry: "2025-06-30", risk: "Low", type: "MSA" },
    { id: 2, name: "CloudTech Infrastructure Contract", vendor: "CloudTech Inc", value: "$1.8M", status: "Active", expiry: "2025-12-15", risk: "Medium", type: "Service" },
    { id: 3, name: "DataFlow Analytics License", vendor: "DataFlow Corp", value: "$850K", status: "Expiring", expiry: "2025-10-01", risk: "High", type: "License" },
    { id: 4, name: "SecureNet Cybersecurity Services", vendor: "SecureNet Ltd", value: "$1.2M", status: "Active", expiry: "2026-03-20", risk: "Low", type: "Service" },
    { id: 5, name: "OfficeSpace Lease Agreement", vendor: "PropertyCorp", value: "$3.1M", status: "Active", expiry: "2025-08-31", risk: "Medium", type: "Lease" },
    { id: 6, name: "Marketing Services Contract", vendor: "AdTech Solutions", value: "$950K", status: "Active", expiry: "2025-11-15", risk: "Low", type: "Service" },
    { id: 7, name: "IT Support Agreement", vendor: "TechSupport Pro", value: "$1.4M", status: "Active", expiry: "2026-01-10", risk: "Medium", type: "Support" },
    { id: 8, name: "Legal Advisory Retainer", vendor: "LawFirm Associates", value: "$680K", status: "Expiring", expiry: "2025-09-30", risk: "High", type: "Legal" }
  ];

  // Recent activity data
  const recentActivity = [
    { id: 1, user: "John Smith", action: "uploaded", item: "Service Agreement", date: "2 hours ago", category: "Contract" },
    { id: 2, user: "Sarah Wilson", action: "reviewed", item: "NDA Document", date: "4 hours ago", category: "Legal" },
    { id: 3, user: "Mike Chen", action: "approved", item: "Vendor Contract", date: "6 hours ago", category: "Procurement" },
    { id: 4, user: "Lisa Brown", action: "flagged", item: "High Risk Contract", date: "8 hours ago", category: "Risk" },
    { id: 5, user: "David Lee", action: "renewed", item: "Software License", date: "1 day ago", category: "License" },
    { id: 6, user: "Emma Davis", action: "exported", item: "Monthly Report", date: "1 day ago", category: "Report" }
  ];

  // Calendar opener component
  const CalendarOpener = () => {
    const handleOpen = () => {
      const anchor = document.createElement('input');
      anchor.type = 'date';
      anchor.style.position = 'fixed';
      anchor.style.opacity = '0';
      document.body.appendChild(anchor);
      anchor.showPicker?.();
      setTimeout(() => anchor.remove(), 500);
    };

    return (
      <button 
        onClick={handleOpen}
        className="mt-4 w-full px-3 py-2 rounded-lg border text-sm bg-white hover:bg-gray-50"
      >
        Open Calendar
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">ReLexWise</h1>
              </div>
              <div className="text-sm text-gray-500">Contract Intelligence Dashboard</div>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <Settings className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
              <p className="text-gray-600">It's the best time to manage your contracts with AI-powered insights</p>
            </div>
            <div className="flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload Contracts</span>
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Contract</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{activeContracts}</h3>
            <p className="text-gray-600 text-sm">Active Contracts</p>
            <div className="mt-2 text-xs text-green-600">+12% from last month</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalValue}</h3>
            <p className="text-gray-600 text-sm">Total Contract Value</p>
            <div className="mt-2 text-xs text-green-600">+8% portfolio growth</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{expiringContracts}</h3>
            <p className="text-gray-600 text-sm">Expiring Soon</p>
            <div className="mt-2 text-xs text-orange-600">Next 90 days</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-sm font-medium text-red-600">High Risk</div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{riskScore}/10</h3>
            <p className="text-gray-600 text-sm">Average Risk Score</p>
            <div className="mt-2 text-xs text-red-600">4 contracts need review</div>
          </div>
        </div>

        {/* Main Content Grid - Active Contracts moved to left side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Active Contracts Table - Moved here */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Active Contracts</h3>
                  <p className="text-sm text-gray-600 mt-1">Use bulk actions to renew, export, or tag contracts faster</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search contracts..." 
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Filter className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parties</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contractData.slice(0, 6).map((contract, index) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contract.name}</div>
                          <div className="text-sm text-gray-500">{contract.type}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.vendor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.value}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          contract.status === 'Active' ? 'bg-green-100 text-green-800' :
                          contract.status === 'Expiring' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.expiry}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          contract.risk === 'Low' ? 'bg-green-100 text-green-800' :
                          contract.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {contract.risk}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">6</span> of{' '}
                  <span className="font-medium">247</span> contracts
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100">
                    Previous
                  </button>
                  <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
                  <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100">
                    2
                  </button>
                  <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity - Keep on right side */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <button className="text-xs text-blue-600 hover:text-blue-700">View all</button>
            </div>
            
            <div className="space-y-3">
              {recentActivity.slice(0, 6).map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-semibold">
                      {activity.user.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="truncate">
                      <div className="text-sm text-gray-900 truncate">
                        <span className="font-medium">{activity.user}</span> {activity.action.toLowerCase()} <span className="font-medium">{activity.item}</span>
                      </div>
                      <div className="text-xs text-gray-500">{activity.date} • {activity.category}</div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{Math.floor(2 + idx)}m ago</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Key Dates - Single row */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Key Dates</h3>
              <span className="text-xs text-gray-500">Next 30 days</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {contractData.filter(d => d.status === 'Expiring' || d.status === 'Active').slice(0, 4).map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm truncate max-w-[120px]">{d.name.split(' ')[0]} {d.name.split(' ')[1]}</div>
                      <div className="text-xs text-gray-500">{d.type}</div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{d.expiry ? new Date(d.expiry).toLocaleDateString() : 'Soon'}</span>
                </div>
              ))}
            </div>
            
            <CalendarOpener />
          </div>
        </div>

        {/* See ReLexWise in Action - Flowchart Style */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">See ReLexWise in Action</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the power of AI-driven contract intelligence with automated extraction, 
              risk assessment, and compliance monitoring
            </p>
          </div>

          {/* Flowchart Layout */}
          <div className="relative max-w-5xl mx-auto">
            {/* Top Row */}
            <div className="flex justify-center items-start mb-12">
              <div className="flex items-center space-x-8">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                  <div className="w-80 h-40 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">01</div>
                        <Upload className="w-5 h-5 text-orange-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-base mb-2">Smart Extraction</h4>
                      <p className="text-sm text-gray-600">OCR and NLP automatically extract vendor details, dates, values, and key terms from uploaded contracts</p>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-orange-500 rounded-full mt-2"></div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                  <div className="w-80 h-40 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border-2 border-teal-200 p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">03</div>
                        <Globe className="w-5 h-5 text-teal-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-base mb-2">ESG Compliance</h4>
                      <p className="text-sm text-gray-600">Detect sustainability and compliance clauses mapped to CSRD, SEC, and GRI frameworks</p>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-teal-500 rounded-full mt-2"></div>
                </div>

                {/* Step 5 */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                  <div className="w-80 h-40 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">05</div>
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-base mb-2">API Integration</h4>
                      <p className="text-sm text-gray-600">Seamless integration with existing procurement, ERP, and CLM systems via API-first architecture</p>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                </div>
              </div>
            </div>

            {/* Lines removed as requested */}

            {/* Bottom Row */}
            <div className="flex justify-center items-start">
              <div className="flex items-center space-x-32">
                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mb-2"></div>
                  <div className="relative">
                    <div className="w-80 h-40 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200 p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">02</div>
                        <Shield className="w-6 h-6 text-red-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-base mb-2">Risk Assessment</h4>
                      <p className="text-sm text-gray-600">Compare contracts to legal playbooks and industry benchmarks to highlight risky deviations</p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mb-2"></div>
                  <div className="relative">
                    <div className="w-80 h-40 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 p-6 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">04</div>
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-base mb-2">Invoice Validation</h4>
                      <p className="text-sm text-gray-600">Match invoices to contract pricing and automatically detect billing discrepancies</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom line removed */}
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-center mt-12">
            <h3 className="text-2xl font-bold text-white mb-3">Start Your AI-Powered Contract Journey</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join leading enterprises who trust ReLexWise to transform their contract management with measurable ROI
            </p>
            <div className="flex justify-center space-x-4">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Start Free Trial</span>
              </button>
              <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Book 30-Day Pilot</span>
              </button>
            </div>
            <div className="mt-4 text-sm text-blue-100">
              Process 100 contracts → Deliver 3 ROI findings → Refundable upon conversion
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>© 2025 ReLexWise. Transforming contracts with AI-powered intelligence.</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
