import { useState, useEffect } from 'react';
import { apiService, ContractFileWithMetadata } from '../services/api';
import webSocketService from '../services/websocket';

export function useDashboardData() {
  const [contractFiles, setContractFiles] = useState<ContractFileWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractStatusData, setContractStatusData] = useState<Array<{name: string, value: number, color: string}>>([]);
  const [renewalPipelineData, setRenewalPipelineData] = useState<Array<{period: string, contracts: number, value: number, displayValue: string}>>([]);
  const [spendByScopeData, setSpendByScopeData] = useState<Array<{name: string, value: number, color: string, displayValue: string, contracts: number}>>([]);
  const [renewalTimelineData, setRenewalTimelineData] = useState<Array<{month: string, contracts: number, value: number, displayValue: string}>>([]);
  const [activeContracts, setActiveContracts] = useState(0);
  const [totalValue, setTotalValue] = useState('$0');
  const [expiringContracts, setExpiringContracts] = useState(0);

  const chartColors = [
    '#64748b', '#94a3b8', '#60a5fa', '#a3a3a3', '#6ee7b7', '#facc15', '#f87171', '#cbd5e1',
  ];

  useEffect(() => {
    loadContractData();
    const handleMetadataExtracted = (message: any) => loadContractData();
    const handleFileProcessingUpdate = (message: any) => {
      if (message.status === 'metadata_completed') loadContractData();
    };
    webSocketService.onMetadataExtracted(handleMetadataExtracted);
    webSocketService.onFileProcessingUpdate(handleFileProcessingUpdate);
    return () => {
      webSocketService.off('metadata_extracted', handleMetadataExtracted);
      webSocketService.off('file_processing_update', handleFileProcessingUpdate);
    };
  }, []);

  const calculateChartData = (files: ContractFileWithMetadata[]) => {
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
        if (metadata?.end_date) {
          const endDate = new Date(metadata.end_date);
          if (endDate < currentDate) statusCounts.Expired++;
          else statusCounts.Active++;
        } else {
          statusCounts.Draft++;
        }
      }
    });
    setContractStatusData([
      { name: 'Active', value: statusCounts.Active, color: chartColors[2] },
      { name: 'Expired', value: statusCounts.Expired, color: chartColors[6] },
      { name: 'Draft', value: statusCounts.Draft, color: chartColors[0] },
    ].filter(item => item.value > 0));

    const thirtyDaysFromNow = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const ninetyDaysFromNow = new Date(currentDate.getTime() + (90 * 24 * 60 * 60 * 1000));
    const pipeline = { lessThan30: { contracts: 0, value: 0 }, between30And90: { contracts: 0, value: 0 }, moreThan90: { contracts: 0, value: 0 } };
    files.forEach(file => {
      const metadata = file.file_metadata;
      if (metadata?.end_date) {
        const endDate = new Date(metadata.end_date);
        if (endDate > currentDate) {
          let contractValue = 0;
          if (metadata.contract_value_usd && metadata.contract_value_usd !== 'N/A') {
            let cleanValue = metadata.contract_value_usd.replace(/[$,€£¥₹]/g, '').replace(/[^0-9.-]/g, '');
            const multiplier = cleanValue.includes('K') ? 1000 : cleanValue.includes('M') ? 1000000 : cleanValue.includes('B') ? 1000000000 : 1;
            cleanValue = cleanValue.replace(/[KMB]/gi, '');
            const value = parseFloat(cleanValue) * multiplier;
            if (!isNaN(value) && value > 0) contractValue = value;
          }
          if (endDate <= thirtyDaysFromNow) pipeline.lessThan30.contracts++, pipeline.lessThan30.value += contractValue;
          else if (endDate <= ninetyDaysFromNow) pipeline.between30And90.contracts++, pipeline.between30And90.value += contractValue;
          else pipeline.moreThan90.contracts++, pipeline.moreThan90.value += contractValue;
        }
      }
    });
    const formatValue = (value: number) => {
      if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
      return `$${value.toFixed(0)}`;
    };
    setRenewalPipelineData([
      { period: '<30 days', contracts: pipeline.lessThan30.contracts, value: pipeline.lessThan30.value, displayValue: formatValue(pipeline.lessThan30.value) },
      { period: '30-90 days', contracts: pipeline.between30And90.contracts, value: pipeline.between30And90.value, displayValue: formatValue(pipeline.between30And90.value) },
      { period: '>90 days', contracts: pipeline.moreThan90.contracts, value: pipeline.moreThan90.value, displayValue: formatValue(pipeline.moreThan90.value) },
    ]);

    const scopeCounts = new Map<string, { contracts: number, value: number }>();
    files.forEach(file => {
      const metadata = file.file_metadata;
      const scope = metadata?.scope_of_services || 'Other';
      let contractValue = 0;
      if (metadata?.contract_value_usd && metadata.contract_value_usd !== 'N/A') {
        let cleanValue = metadata.contract_value_usd.replace(/[$,€£¥₹]/g, '').replace(/[^0-9.-]/g, '');
        const multiplier = cleanValue.includes('K') ? 1000 : cleanValue.includes('M') ? 1000000 : cleanValue.includes('B') ? 1000000000 : 1;
        cleanValue = cleanValue.replace(/[KMB]/gi, '');
        const value = parseFloat(cleanValue) * multiplier;
        if (!isNaN(value) && value > 0) contractValue = value;
      }
      if (!scopeCounts.has(scope)) scopeCounts.set(scope, { contracts: 0, value: 0 });
      const current = scopeCounts.get(scope)!;
      scopeCounts.set(scope, { contracts: current.contracts + 1, value: current.value + contractValue });
    });
    setSpendByScopeData(Array.from(scopeCounts.entries()).map(([scope, data], i) => ({ name: scope, value: data.value, contracts: data.contracts, color: chartColors[i % chartColors.length], displayValue: formatValue(data.value) })).filter(item => item.value > 0).sort((a, b) => b.value - a.value));

    const monthCounts = new Map<string, { contracts: number, value: number }>();
    const today = new Date();
    const oneYearFromNow = new Date(today.getTime() + (365 * 24 * 60 * 60 * 1000));
    files.forEach(file => {
      const metadata = file.file_metadata;
      if (metadata?.end_date) {
        const endDate = new Date(metadata.end_date);
        if (endDate > today && endDate <= oneYearFromNow) {
          const monthKey = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          let contractValue = 0;
          if (metadata.contract_value_usd && metadata.contract_value_usd !== 'N/A') {
            let cleanValue = metadata.contract_value_usd.replace(/[$,€£¥₹]/g, '').replace(/[^0-9.-]/g, '');
            const multiplier = cleanValue.includes('K') ? 1000 : cleanValue.includes('M') ? 1000000 : cleanValue.includes('B') ? 1000000000 : 1;
            cleanValue = cleanValue.replace(/[KMB]/gi, '');
            const value = parseFloat(cleanValue) * multiplier;
            if (!isNaN(value) && value > 0) contractValue = value;
          }
          if (!monthCounts.has(monthKey)) monthCounts.set(monthKey, { contracts: 0, value: 0 });
          const current = monthCounts.get(monthKey)!;
          monthCounts.set(monthKey, { contracts: current.contracts + 1, value: current.value + contractValue });
        }
      }
    });
    const timelineData = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const data = monthCounts.get(monthKey) || { contracts: 0, value: 0 };
      timelineData.push({ month: monthKey, contracts: data.contracts, value: data.value, displayValue: formatValue(data.value) });
    }
    setRenewalTimelineData(timelineData);
  };

  const loadContractData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getContractFiles(100, 0);
      if (response.error) {
        setError(response.error);
        return;
      }
      if (response.data) {
        setContractFiles(response.data);
        const completedFiles = response.data.filter(file => file.metadata_processing_status === 'completed');
        setActiveContracts(completedFiles.length);
        let totalValueNum = 0;
        completedFiles.forEach(file => {
          const metadata = file.file_metadata;
          if (metadata?.contract_value_usd && metadata.contract_value_usd !== 'N/A') {
            let cleanValue = metadata.contract_value_usd.replace(/[$,€£¥₹]/g, '').replace(/[^0-9.-]/g, '');
            const multiplier = cleanValue.includes('K') ? 1000 : cleanValue.includes('M') ? 1000000 : cleanValue.includes('B') ? 1000000000 : 1;
            cleanValue = cleanValue.replace(/[KMB]/gi, '');
            const value = parseFloat(cleanValue) * multiplier;
            if (!isNaN(value) && value > 0) totalValueNum += value;
          }
        });
        setTotalValue(totalValueNum > 0 ? totalValueNum >= 1000000000 ? `$${(totalValueNum / 1000000000).toFixed(1)}B` : totalValueNum >= 1000000 ? `$${(totalValueNum / 1000000).toFixed(1)}M` : totalValueNum >= 1000 ? `$${(totalValueNum / 1000).toFixed(1)}K` : `$${totalValueNum.toFixed(0)}` : '$0');
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
        calculateChartData(completedFiles);
      }
    } catch (err) {
      setError('Failed to load contract data');
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
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
    reload: loadContractData,
  };
}
