import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Upload,
  Activity,
  Shield,
  Bell,
  Settings,
  Plus,
  Zap
} from 'lucide-react';
import { apiService, ContractFileWithMetadata } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // API Integration State
  const [contractFiles, setContractFiles] = useState<ContractFileWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calculated metrics from real data
  const [activeContracts, setActiveContracts] = useState(0);
  const [totalValue, setTotalValue] = useState('$0');
  const [expiringContracts, setExpiringContracts] = useState(0);
  const [riskScore] = useState(7.2);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Expiring Soon' | 'Expired' | 'Draft' | 'All'>('All');

  // Load contract data on component mount
  useEffect(() => {
    loadContractData();
  }, []);

  const loadContractData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getContractFiles(50, 0);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        setContractFiles(response.data);
        
        // Calculate metrics from metadata
        const completedFiles = response.data.filter(file => 
          file.metadata_processing_status === 'completed'
        );
        
        setActiveContracts(completedFiles.length);
        
        // Calculate total value from Contract Value column (contract_value field)
        let totalValueNum = 0;
        completedFiles.forEach(file => {
          const metadata = file.file_metadata;
          if (metadata?.contract_value && metadata.contract_value !== 'N/A') {
            // Remove currency symbols, commas, and non-numeric characters except decimal point and negative sign
            let cleanValue = metadata.contract_value
              .replace(/[$,€£¥₹]/g, '') // Remove common currency symbols
              .replace(/[^0-9.-]/g, ''); // Remove any other non-numeric characters
            
            // Handle values with 'K', 'M', 'B' suffixes
            const multiplier = cleanValue.includes('K') ? 1000 : 
                             cleanValue.includes('M') ? 1000000 : 
                             cleanValue.includes('B') ? 1000000000 : 1;
            
            cleanValue = cleanValue.replace(/[KMB]/gi, '');
            const value = parseFloat(cleanValue) * multiplier;
            
            if (!isNaN(value) && value > 0) {
              totalValueNum += value;
            }
          }
        });
        
        // Format total value display
        setTotalValue(totalValueNum > 0 ? 
          totalValueNum >= 1000000000 ? `$${(totalValueNum / 1000000000).toFixed(1)}B` :
          totalValueNum >= 1000000 ? `$${(totalValueNum / 1000000).toFixed(1)}M` :
          totalValueNum >= 1000 ? `$${(totalValueNum / 1000).toFixed(1)}K` :
          `$${totalValueNum.toFixed(0)}` : '$0');
        
        // Calculate expiring contracts (next 90 days)
        const currentDate = new Date();
        const ninetyDaysFromNow = new Date(currentDate.getTime() + (90 * 24 * 60 * 60 * 1000));
        
        const expiring = completedFiles.filter(file => {
          const metadata = file.file_metadata;
          if (metadata?.end_date) {
            const endDate = new Date(metadata.end_date);
            return endDate <= ninetyDaysFromNow && endDate > currentDate;
          }
          return false;
        });
        
        setExpiringContracts(expiring.length);
      }
    } catch (err) {
      setError('Failed to load contract data');
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Transform API data to display format for the table
  const contractData = contractFiles.map((file, index) => {
    const metadata = file.file_metadata;
    
    return {
      id: index + 1,
      name: file.filename.replace('.pdf', ''),
      type: metadata?.contract_type || 'N/A',
      vendor: metadata?.vendor_name || 'N/A',
      contractValue: metadata?.contract_value || 'N/A', // Main contract value field
      contractValueLocal: metadata?.contract_value_local || 'N/A', // Separate local value
      currency: metadata?.currency || 'N/A', // Separate currency
      status: metadata?.contract_status || 'N/A',
      fileId: file.id,
      uploadDate: new Date(file.upload_timestamp).toLocaleDateString(),
      startDate: metadata?.start_date || 'N/A',
      endDate: metadata?.end_date || 'N/A',
      duration: metadata?.contract_duration || 'N/A',
      scope: metadata?.scope_of_services || 'N/A',
      confidenceScore: metadata?.confidence_score || null,
      hasMetadata: !!metadata,
      // Legacy fields for compatibility
      localValue: metadata?.contract_value_local || 'N/A',
      localCurrency: metadata?.currency || 'N/A',
      usdValue: metadata?.contract_value || 'N/A',
      tag: metadata?.contract_type || 'Contract'
    };
  });

  // Filter contracts based on status and search
  const filteredContracts = contractData.filter(contract => {
    const matchesSearch = contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Active') return matchesSearch && contract.status === 'Active';
    if (statusFilter === 'Expiring Soon') return matchesSearch && (contract.status === 'Expiring' || contract.status === 'Expired');
    if (statusFilter === 'Expired') return matchesSearch && contract.status === 'Expired';
    if (statusFilter === 'Draft') return matchesSearch && contract.status === 'Draft';
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
              <p className="text-gray-600">It's the best time to manage your contracts with AI-powered insights</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => navigate('/app/upload')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Contracts</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          {(['All', 'Active','Expiring Soon','Expired','Draft'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`${statusFilter===tab ? 'bg-blue-600/90 text-white' : 'bg-blue-100 text-blue-800'} px-6 py-2.5 rounded-xl shadow-sm hover:opacity-95 transition`}
            >
              {tab}
            </button>
          ))}
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
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{loading ? '...' : activeContracts}</h3>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{loading ? '...' : totalValue}</h3>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{loading ? '...' : expiringContracts}</h3>
            <p className="text-gray-600 text-sm">Expiring Soon</p>
            <div className="mt-2 text-xs text-orange-600">Next 90 days</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-rose-100 rounded-lg">
                <FileText className="w-6 h-6 text-rose-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{loading ? '...' : new Set(contractData.map(c=>c.vendor)).size}</h3>
            <p className="text-gray-600 text-sm">Number of Vendors</p>
            <div className="mt-2 text-xs text-blue-600">Unique vendors</div>
          </div>
        </div>

        {/* Contracts Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Contract Details</h3>
                <p className="text-sm text-gray-500">Complete contract information with metadata</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={loadContractData}
                  disabled={loading}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  title="Refresh contracts"
                >
                  <Activity className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4 text-gray-600" />
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                  Export CSV
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search contracts by name or vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading contracts...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button 
                  onClick={loadContractData}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="flex flex-col justify-center items-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No contracts found</p>
                <p className="text-sm text-gray-400 mt-2">
                  {contractData.length === 0 ? 'Upload some contracts to get started' : 'Try adjusting your search or filter criteria'}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContracts.slice(0, 10).map((contract, index) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900" title={contract.name}>
                            {contract.name.length > 30 ? `${contract.name.substring(0, 30)}...` : contract.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contract.hasMetadata ? `ID: ${contract.fileId.substring(0, 8)}` : 'Processing...'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.vendor}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.contractValue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.contractValueLocal}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.currency}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          contract.status === 'Active' ? 'bg-green-100 text-green-800' :
                          contract.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                          contract.status === 'Expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.startDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.endDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" title={contract.scope}>
                        {contract.scope.length > 20 ? `${contract.scope.substring(0, 20)}...` : contract.scope}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            title={`View details${contract.confidenceScore ? ` (Confidence: ${(contract.confidenceScore * 100).toFixed(1)}%)` : ''}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="text-gray-600 hover:text-gray-900"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {!contract.hasMetadata && (
                            <span className="text-xs text-orange-500" title="Metadata not extracted yet">
                              ⚠️
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(10, filteredContracts.length)}</span> of{' '}
                <span className="font-medium">{filteredContracts.length}</span> contracts
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100">
                  Previous
                </button>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
                <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100">
                  Next
                </button>
              </div>
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
