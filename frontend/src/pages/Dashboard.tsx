import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, AlertTriangle, Clock, DollarSign, FileText, Search, Filter, Download, Eye, Upload } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeContracts] = useState(247);
  const [totalValue] = useState('$12.4M');
  const [expiringContracts] = useState(23);
  const [riskScore] = useState(7.2);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Expiring Soon' | 'Expired' | 'Draft'>('Active');

  // Sample contract data (extended fields to match table)
  const contractData = [
    { id: 1, name: "TeleCo Master Service Agreement", type: "MSA", vendor: "TeleCo Ltd", localValue: "₹18.0Cr", localCurrency: "INR", usdValue: "$2.4M", startDate: "2023-07-01", endDate: "2025-06-30", scope: "Network services and maintenance", status: "Active", tag: "Renewal-2025" },
    { id: 2, name: "CloudTech Infrastructure Contract", type: "Service", vendor: "CloudTech Inc", localValue: "€1.6M", localCurrency: "EUR", usdValue: "$1.8M", startDate: "2024-01-10", endDate: "2025-12-15", scope: "Cloud hosting and support", status: "Active", tag: "Critical" },
    { id: 3, name: "DataFlow Analytics License", type: "License", vendor: "DataFlow Corp", localValue: "$850K", localCurrency: "USD", usdValue: "$850K", startDate: "2023-10-01", endDate: "2025-10-01", scope: "Analytics software licenses", status: "Expiring", tag: "License" },
    { id: 4, name: "SecureNet Cybersecurity Services", type: "Service", vendor: "SecureNet Ltd", localValue: "$1.2M", localCurrency: "USD", usdValue: "$1.2M", startDate: "2024-04-01", endDate: "2026-03-20", scope: "Managed SOC and audits", status: "Active", tag: "Security" },
    { id: 5, name: "OfficeSpace Lease Agreement", type: "Lease", vendor: "PropertyCorp", localValue: "$3.1M", localCurrency: "USD", usdValue: "$3.1M", startDate: "2020-09-01", endDate: "2025-08-31", scope: "HQ office space lease", status: "Active", tag: "Facilities" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Sticky Content Wrapper */}
      <div className="flex-1 flex flex-col items-stretch w-full px-6 lg:pr-10 py-8"
        style={{ position: 'relative' }}>
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
          <p className="text-gray-600">It's the best time to manage your contracts with AI-powered insights</p>
        </div>

        {/* Status Tabs - soft colors */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {(['Active','Expiring Soon','Expired','Draft'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`${statusFilter===tab ? 'bg-blue-600/90 text-white' : 'bg-blue-100 text-blue-800'} px-6 py-2.5 rounded-xl shadow-sm hover:opacity-95 transition`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Vendor/Contracts Summary Row (soft theme with icons) */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-700" />
              </div>
              <div className="text-sm font-medium text-green-900">Total Contract Value</div>
            </div>
            <div className="text-3xl font-bold text-green-900">{totalValue}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              <div className="text-sm font-medium text-blue-900">Number of Contracts</div>
            </div>
            <div className="text-3xl font-bold text-blue-900">{contractData.length}</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-rose-700" />
              </div>
              <div className="text-sm font-medium text-rose-900">Number of Vendors</div>
            </div>
            <div className="text-3xl font-bold text-rose-900">{new Set(contractData.map(c=>c.vendor)).size}</div>
          </div>
        </div>

        {/* Contracts Table Section - Full Width */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active Contracts</h3>
                <p className="text-sm text-gray-500">Use bulk actions to renew, export, or tag contracts faster</p>
              </div>
              {/* Upload Contracts Button */}
              <button
                className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={() => navigate('/app/upload')}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Contracts</span>
              </button>
            </div>

            {/* Search Bar - Non-sticky, above table */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search contracts, vendors, clauses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Value (Local)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local Currency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Value (USD)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope of Work</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Tag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contractData
                  .filter(c => statusFilter === 'Active' ? c.status === 'Active'
                    : statusFilter === 'Expiring Soon' ? c.status === 'Expiring'
                    : statusFilter === 'Expired' ? c.status === 'Expired'
                    : true)
                  .map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{contract.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{contract.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{contract.vendor}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{contract.localValue}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{contract.localCurrency}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{contract.usdValue}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{contract.startDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{contract.endDate}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs" title={contract.scope}>{contract.scope}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contract.status === 'Active' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200' :
                        contract.status === 'Expiring' ? 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200' :
                        'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200'
                      }`}>
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">{contract.tag}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Sticky Footer */}
      <footer className="w-full bg-white border-t border-gray-200 py-4 px-4 text-center text-sm text-gray-500 sticky bottom-0 z-20">
        &copy; {new Date().getFullYear()} ReLexWise. All rights reserved.
      </footer>
    </div>
  );
};

export default Dashboard;
