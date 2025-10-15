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
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { apiService, ContractFileWithMetadata } from '../services/api';
import webSocketService from '../services/websocket';

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
  
  // Chart data states
  const [contractStatusData, setContractStatusData] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [renewalPipelineData, setRenewalPipelineData] = useState<Array<{period: string, contracts: number, value: number, displayValue: string}>>([]);
  const [spendByScopeData, setSpendByScopeData] = useState<Array<{name: string, value: number, color: string, displayValue: string, contracts: number}>>([]);
  const [renewalTimelineData, setRenewalTimelineData] = useState<Array<{month: string, contracts: number, value: number, displayValue: string}>>([]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Muted, professional color palette for charts
  const chartColors = [
    '#64748b', // slate gray
    '#94a3b8', // light slate
    '#60a5fa', // blue
    '#a3a3a3', // gray
    '#6ee7b7', // soft green
    '#facc15', // muted yellow
    '#f87171', // muted red
    '#cbd5e1', // lightest slate
  ];

  // Load contract data on component mount
  useEffect(() => {
    loadContractData();
    
    // Set up WebSocket event listeners
    const handleMetadataExtracted = (message: any) => {
      console.log('Metadata extracted for file:', message.file_id);
      // Refresh contract data to show updated metadata
      loadContractData();
    };

    const handleFileProcessingUpdate = (message: any) => {
      console.log('File processing update:', message);
      if (message.status === 'metadata_completed') {
        // Refresh contract data when metadata processing is complete
        loadContractData();
      }
    };

    // Add event listeners
    webSocketService.onMetadataExtracted(handleMetadataExtracted);
    webSocketService.onFileProcessingUpdate(handleFileProcessingUpdate);

    // Cleanup on unmount
    return () => {
      webSocketService.off('metadata_extracted', handleMetadataExtracted);
      webSocketService.off('file_processing_update', handleFileProcessingUpdate);
    };
  }, []);

  // Calculate chart data from contract files
  const calculateChartData = (files: ContractFileWithMetadata[]) => {
    // Contract Status Overview Chart Data
    const statusCounts = { Active: 0, Expired: 0, Draft: 0 };
    const currentDate = new Date();
    
    files.forEach(file => {
      const metadata = file.file_metadata;
      if (metadata?.contract_status) {
        const status = metadata.contract_status;
        if (status === 'Active') statusCounts.Active++;
        else if (status === 'Expired') statusCounts.Expired++;
        else if (status === 'Draft') statusCounts.Draft++;
      } else {
        // Fallback logic if contract_status is not available
        if (metadata?.end_date) {
          const endDate = new Date(metadata.end_date);
          if (endDate < currentDate) statusCounts.Expired++;
          else statusCounts.Active++;
        } else {
          statusCounts.Draft++;
        }
      }
    });

    // Use professional muted colors for status chart
    const contractStatusChartData = [
      { name: 'Active', value: statusCounts.Active, color: chartColors[2] },
      { name: 'Expired', value: statusCounts.Expired, color: chartColors[6] },
      { name: 'Draft', value: statusCounts.Draft, color: chartColors[0] }
    ].filter(item => item.value > 0); // Only show categories with data

    setContractStatusData(contractStatusChartData);

    // Renewal Pipeline Chart Data
    const thirtyDaysFromNow = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const ninetyDaysFromNow = new Date(currentDate.getTime() + (90 * 24 * 60 * 60 * 1000));

    const pipeline = {
      lessThan30: { contracts: 0, value: 0 },
      between30And90: { contracts: 0, value: 0 },
      moreThan90: { contracts: 0, value: 0 }
    };

    files.forEach(file => {
      const metadata = file.file_metadata;
      if (metadata?.end_date) {
        const endDate = new Date(metadata.end_date);
        
        // Only consider future dates (contracts that haven't expired yet)
        if (endDate > currentDate) {
          // Parse contract value
          let contractValue = 0;
          if (metadata.contract_value_usd && metadata.contract_value_usd !== 'N/A') {
            let cleanValue = metadata.contract_value_usd
              .replace(/[$,€£¥₹]/g, '')
              .replace(/[^0-9.-]/g, '');
            
            const multiplier = cleanValue.includes('K') ? 1000 : 
                             cleanValue.includes('M') ? 1000000 : 
                             cleanValue.includes('B') ? 1000000000 : 1;
            
            cleanValue = cleanValue.replace(/[KMB]/gi, '');
            const value = parseFloat(cleanValue) * multiplier;
            
            if (!isNaN(value) && value > 0) {
              contractValue = value;
            }
          }

          if (endDate <= thirtyDaysFromNow) {
            pipeline.lessThan30.contracts++;
            pipeline.lessThan30.value += contractValue;
          } else if (endDate <= ninetyDaysFromNow) {
            pipeline.between30And90.contracts++;
            pipeline.between30And90.value += contractValue;
          } else {
            pipeline.moreThan90.contracts++;
            pipeline.moreThan90.value += contractValue;
          }
        }
      }
    });

    const formatValue = (value: number) => {
      if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
      return `$${value.toFixed(0)}`;
    };

    const renewalPipelineChartData = [
      { 
        period: '<30 days', 
        contracts: pipeline.lessThan30.contracts, 
        value: pipeline.lessThan30.value,
        displayValue: formatValue(pipeline.lessThan30.value)
      },
      { 
        period: '30-90 days', 
        contracts: pipeline.between30And90.contracts, 
        value: pipeline.between30And90.value,
        displayValue: formatValue(pipeline.between30And90.value)
      },
      { 
        period: '>90 days', 
        contracts: pipeline.moreThan90.contracts, 
        value: pipeline.moreThan90.value,
        displayValue: formatValue(pipeline.moreThan90.value)
      }
    ];

    setRenewalPipelineData(renewalPipelineChartData);

    // Spend by Scope/Category Chart Data
    const scopeCounts = new Map<string, { contracts: number, value: number }>();
    
    files.forEach(file => {
      const metadata = file.file_metadata;
      const scope = metadata?.scope_of_services || 'Other';
      
      // Parse contract value
      let contractValue = 0;
      if (metadata?.contract_value_usd && metadata.contract_value_usd !== 'N/A') {
        let cleanValue = metadata.contract_value_usd
          .replace(/[$,€£¥₹]/g, '')
          .replace(/[^0-9.-]/g, '');
        
        const multiplier = cleanValue.includes('K') ? 1000 : 
                         cleanValue.includes('M') ? 1000000 : 
                         cleanValue.includes('B') ? 1000000000 : 1;
        
        cleanValue = cleanValue.replace(/[KMB]/gi, '');
        const value = parseFloat(cleanValue) * multiplier;
        
        if (!isNaN(value) && value > 0) {
          contractValue = value;
        }
      }

      if (!scopeCounts.has(scope)) {
        scopeCounts.set(scope, { contracts: 0, value: 0 });
      }
      
      const current = scopeCounts.get(scope)!;
      scopeCounts.set(scope, {
        contracts: current.contracts + 1,
        value: current.value + contractValue
      });
    });

    // Use professional muted colors for scope chart
    const spendByScopeChartData = Array.from(scopeCounts.entries())
      .map(([scope, data], i) => ({
        name: scope,
        value: data.value,
        contracts: data.contracts,
        color: chartColors[i % chartColors.length],
        displayValue: formatValue(data.value)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    setSpendByScopeData(spendByScopeChartData);

    // Upcoming Renewals Timeline Chart Data
    const monthCounts = new Map<string, { contracts: number, value: number }>();
    const today = new Date();
    const oneYearFromNow = new Date(today.getTime() + (365 * 24 * 60 * 60 * 1000));

    files.forEach(file => {
      const metadata = file.file_metadata;
      if (metadata?.end_date) {
        const endDate = new Date(metadata.end_date);
        
        // Only consider contracts expiring in the next year
        if (endDate > today && endDate <= oneYearFromNow) {
          const monthKey = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          
          // Parse contract value
          let contractValue = 0;
          if (metadata.contract_value_usd && metadata.contract_value_usd !== 'N/A') {
            let cleanValue = metadata.contract_value_usd
              .replace(/[$,€£¥₹]/g, '')
              .replace(/[^0-9.-]/g, '');
            
            const multiplier = cleanValue.includes('K') ? 1000 : 
                             cleanValue.includes('M') ? 1000000 : 
                             cleanValue.includes('B') ? 1000000000 : 1;
            
            cleanValue = cleanValue.replace(/[KMB]/gi, '');
            const value = parseFloat(cleanValue) * multiplier;
            
            if (!isNaN(value) && value > 0) {
              contractValue = value;
            }
          }

          if (!monthCounts.has(monthKey)) {
            monthCounts.set(monthKey, { contracts: 0, value: 0 });
          }
          
          const current = monthCounts.get(monthKey)!;
          monthCounts.set(monthKey, {
            contracts: current.contracts + 1,
            value: current.value + contractValue
          });
        }
      }
    });

    // Generate timeline for next 12 months
    const timelineData = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const data = monthCounts.get(monthKey) || { contracts: 0, value: 0 };
      
      timelineData.push({
        month: monthKey,
        contracts: data.contracts,
        value: data.value,
        displayValue: formatValue(data.value)
      });
    }

    setRenewalTimelineData(timelineData);
  };

  const loadContractData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all contracts (increase limit to get all available)
      const response = await apiService.getContractFiles(100, 0);
      
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
        
        // Calculate total value from Contract Value column (contract_value_usd field)
        let totalValueNum = 0;
        completedFiles.forEach(file => {
          const metadata = file.file_metadata;
          if (metadata?.contract_value_usd && metadata.contract_value_usd !== 'N/A') {
            // Remove currency symbols, commas, and non-numeric characters except decimal point and negative sign
            let cleanValue = metadata.contract_value_usd
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
        
        // Calculate chart data
        calculateChartData(completedFiles);
      }
    } catch (err) {
      setError('Failed to load contract data');
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle file download
  const handleDownload = async (fileId: string) => {
    try {
      const response = await apiService.getFileViewUrl(fileId);
      if (response.data?.view_url) {
        // Open view URL in new tab
        window.open(response.data.view_url, '_blank');
      } else {
        console.error('No view URL received');
        alert('Failed to get view URL');
      }
    } catch (error) {
      console.error('Error getting view URL:', error);
      alert('Failed to view file');
    }
  };

  // Handle file view
  const handleView = async (fileId: string) => {
    try {
      const response = await apiService.getFileViewUrl(fileId);
      if (response.data?.view_url) {
        // Open view URL in new tab
        window.open(response.data.view_url, '_blank');
      } else {
        console.error('No view URL received');
        alert('Failed to get view URL');
      }
    } catch (error) {
      console.error('Error getting view URL:', error);
      alert('Failed to view file');
    }
  };

  // Export contract data to CSV
  const exportToCSV = () => {
    try {
      // Use filtered contracts for export
      const dataToExport = filteredContracts;
      
      if (dataToExport.length === 0) {
        alert('No data to export');
        return;
      }

      // Helper function to format date strings
      const formatDate = (dateString: string) => {
        if (!dateString || dateString === 'N/A') return 'N/A';
        
        try {
          // Try to parse the date and format it consistently
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return dateString; // Return original if invalid
          return date.toLocaleDateString(); // Format as MM/DD/YYYY or based on locale
        } catch {
          return dateString; // Return original if parsing fails
        }
      };

      // Define CSV headers
      const headers = [
        'Contract Name',
        'Type',
        'Vendor',
        'Contract Value',
        'Currency',
        'Status',
        'Start Date',
        'End Date',
        'Duration',
        'Scope of Services',
        'Upload Date',
        'Confidence Score'
      ];

      // Convert data to CSV rows
      const csvRows = [
        headers.join(','), // Header row
        ...dataToExport.map(contract => [
          `"${contract.name.replace(/"/g, '""')}"`, // Escape quotes in contract name
          `"${contract.type}"`,
          `"${contract.vendor.replace(/"/g, '""')}"`, // Escape quotes in vendor name
          `"${contract.contractValue}"`,
          `"${contract.currency}"`,
          `"${contract.status}"`,
          `"${formatDate(contract.startDate)}"`, // Format start date
          `"${formatDate(contract.endDate)}"`, // Format end date
          `"${contract.duration}"`,
          `"${contract.scope.replace(/"/g, '""')}"`, // Escape quotes in scope
          `"${contract.uploadDate}"`, // Upload date is already formatted
          contract.confidenceScore ? `"${(contract.confidenceScore * 100).toFixed(1)}%"` : '"N/A"'
        ].join(','))
      ];

      // Create CSV content
      const csvContent = csvRows.join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `contracts_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
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
      contractValue: metadata?.contract_value_usd || 'N/A', // Main contract value field
      contractValueLocal: metadata?.contract_value_local || 'N/A', // Separate local value
      currency: metadata?.currency || 'N/A', // Separate currency
      status: metadata?.contract_status || 'N/A',
      fileId: file.id,
      cloudinaryUrl: file.cloudinary_url,
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
      usdValue: metadata?.contract_value_usd || 'N/A',
      tag: metadata?.contract_type || 'Contract'
    };
  });

  // Filter contracts based on status and search
  const filteredContracts = contractData.filter(contract => {
    const matchesSearch = contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If no status filters are selected, show all contracts
    if (statusFilters.length === 0) return matchesSearch;
    
    // Check if contract status matches any of the selected filters
    return matchesSearch && statusFilters.some(filter => {
      if (filter === 'Active') return contract.status === 'Active';
      if (filter === 'Expiring Soon') return contract.status === 'Expiring' || contract.status === 'Expired';
      if (filter === 'Expired') return contract.status === 'Expired';
      if (filter === 'Draft') return contract.status === 'Draft';
      return false;
    });
  });

  // Calculate dynamic metrics based on filtered contracts
  const filteredMetrics = React.useMemo(() => {
    // Calculate total value from filtered contracts
    let totalValueNum = 0;
    filteredContracts.forEach(contract => {
      if (contract.contractValue && contract.contractValue !== 'N/A') {
        // Remove currency symbols, commas, and non-numeric characters except decimal point and negative sign
        let cleanValue = contract.contractValue
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
    const formattedValue = totalValueNum > 0 ? 
      totalValueNum >= 1000000000 ? `$${(totalValueNum / 1000000000).toFixed(1)}B` :
      totalValueNum >= 1000000 ? `$${(totalValueNum / 1000000).toFixed(1)}M` :
      totalValueNum >= 1000 ? `$${(totalValueNum / 1000).toFixed(1)}K` :
      `$${totalValueNum.toFixed(0)}` : '$0';
    
    return {
      totalValue: formattedValue,
      contractCount: filteredContracts.length,
      vendorCount: new Set(filteredContracts.map(c => c.vendor)).size
    };
  }, [filteredContracts]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContracts = filteredContracts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilters, searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen">
      
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
          {(['Active','Expiring Soon','Expired','Draft'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilters(prev => 
                  prev.includes(tab) 
                    ? prev.filter(f => f !== tab)  // Remove if already selected
                    : [...prev, tab]              // Add if not selected
                );
              }}
              className={`${statusFilters.includes(tab) ? 'bg-blue-600/90 text-white' : 'bg-blue-100 text-blue-800'} px-6 py-2.5 rounded-xl shadow-sm hover:opacity-95 transition`}
            >
              {tab}
            </button>
          ))}
          {statusFilters.length > 0 && (
            <button
              onClick={() => setStatusFilters([])}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear all filters
            </button>
          )}
        </div>

       
        {/* Key Metrics */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-700" />
              </div>
              <div className="text-sm font-medium text-green-900">Total Contract Value</div>
            </div>
            <div className="text-3xl font-bold text-green-900">{loading ? '...' : filteredMetrics.totalValue}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-700" />
              </div>
              <div className="text-sm font-medium text-blue-900">Number of Contracts</div>
            </div>
            <div className="text-3xl font-bold text-blue-900">{loading ? '...' : filteredMetrics.contractCount}</div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-rose-700" />
              </div>
              <div className="text-sm font-medium text-rose-900">Number of Vendors</div>
            </div>
            <div className="text-3xl font-bold text-rose-900">{loading ? '...' : filteredMetrics.vendorCount}</div>
          </div>
        </div>
        


        {/* Contracts Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Contract Details</h3>
                <p className="text-sm text-gray-500">
                  Complete contract information with metadata 
                  {filteredContracts.length !== contractData.length && (
                    <span className="text-blue-600 font-medium">
                      • {filteredContracts.length} of {contractData.length} contracts shown
                    </span>
                  )}
                </p>
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
                <button 
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    loading || filteredContracts.length === 0 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  onClick={exportToCSV}
                  disabled={loading || filteredContracts.length === 0}
                  title={filteredContracts.length === 0 ? 'No data to export' : 'Export filtered contracts to CSV'}
                >
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
                {statusFilters.length > 0 || searchTerm && (
                  <button
                    onClick={() => {
                      setStatusFilters([]);
                      setSearchTerm('');
                    }}
                    className="mt-3 text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentContracts.map((contract, index) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      {/* <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <button 
                            onClick={() => navigate(`/app/contracts/${contract.fileId}`)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left" 
                            title={`View details for ${contract.name}`}
                          >
                            {contract.name.length > 30 ? `${contract.name.substring(0, 30)}...` : contract.name}
                          </button>
                          <div className="text-sm text-gray-500">
                            {contract.hasMetadata ? `ID: ${contract.fileId.substring(0, 8)}` : 'Processing...'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.vendor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.startDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contract.endDate}</td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" title={contract.scope}>
                        {contract.scope.length > 20 ? `${contract.scope.substring(0, 20)}...` : contract.scope}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="text-blue-600 hover:text-blue-900"
                            title={`View PDF${contract.confidenceScore ? ` (Confidence: ${(contract.confidenceScore * 100).toFixed(1)}%)` : ''}`}
                            onClick={() => handleView(contract.fileId)}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {/* <button 
                            className="text-gray-600 hover:text-gray-900"
                            title="Download PDF"
                            onClick={() => handleDownload(contract.fileId)}
                          >
                            <Download className="w-4 h-4" />
                          </button> */}
                          {!contract.hasMetadata && (
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs text-orange-500" title="Processing metadata...">
                                Processing
                              </span>
                            </div>
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
                Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(endIndex, filteredContracts.length)}</span> of{' '}
                <span className="font-medium">{filteredContracts.length}</span> contracts
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNumber = i + 1;
                    if (totalPages <= 5) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`px-3 py-1 text-sm rounded ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else {
                      // Handle pagination with ellipsis for many pages
                      let pageToShow = pageNumber;
                      if (currentPage > 3) {
                        pageToShow = currentPage - 2 + i;
                      }
                      if (pageToShow > totalPages) return null;
                      
                      return (
                        <button
                          key={pageToShow}
                          onClick={() => handlePageChange(pageToShow)}
                          className={`px-3 py-1 text-sm rounded ${
                            currentPage === pageToShow
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {pageToShow}
                        </button>
                      );
                    }
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="text-gray-500">...</span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Charts */}
        <div className="my-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contract Status Overview Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Contract Status Overview</h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-gray-400">Loading chart data...</div>
              </div>
            ) : contractStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={contractStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {contractStatusData.map((entry, index) => (
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
              {contractStatusData.map((entry, index) => (
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
            ) : renewalPipelineData.some(item => item.contracts > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={renewalPipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
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
              {renewalPipelineData.map((item, index) => (
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
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spend by Scope/Category Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Spend by Scope / Category</h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-gray-400">Loading chart data...</div>
              </div>
            ) : spendByScopeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={spendByScopeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {spendByScopeData.map((entry, index) => (
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
              {spendByScopeData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-xs text-gray-600 truncate">{entry.name}</span>
                  <span className="text-xs text-gray-400 ml-auto">({entry.contracts})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Renewals Timeline Chart */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 col-span-2">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Upcoming Renewals Timeline</h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="text-gray-400">Loading chart data...</div>
              </div>
            ) : renewalTimelineData.some(item => item.contracts > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={renewalTimelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRenewals" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#colorRenewals)"
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


        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>© 2025 ReLexWise. Transforming contracts with AI-powered intelligence.</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
