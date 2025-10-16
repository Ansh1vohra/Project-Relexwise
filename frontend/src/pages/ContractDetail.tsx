import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  MessageCircle, 
  Send, 
  Loader2, 
  AlertTriangle,
  Clock,
  User,
  Bot
} from 'lucide-react';
import { apiService, ContractFileWithMetadata } from '../services/api';

interface SearchResult {
  status: string;
  file_id: string;
  query: string;
  response: any;
  sources: any[];
  search_time_ms?: number;
}

export default function ContractDetailPage() {
  const { id: fileId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State for contract data
  const [contract, setContract] = useState<ContractFileWithMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for search/chat
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Load contract data on mount
  useEffect(() => {
    if (fileId) {
      loadContractData();
    }
  }, [fileId]);

  const loadContractData = async () => {
    if (!fileId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getContractFileWithMetadata(fileId);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        setContract(response.data);
      }
    } catch (err) {
      setError('Failed to load contract data');
      console.error('Error loading contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim() || !fileId) return;
    
    try {
      setIsSearching(true);
      setSearchError(null);
      
      const response = await apiService.searchInContract(fileId, query.trim());
      
      if (response.error) {
        setSearchError(response.error);
        return;
      }
      
      if (response.data) {
        setSearchResults(prev => [response.data, ...prev]);
        setQuery('');
      }
    } catch (err) {
      setSearchError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-700">Loading contract details...</span>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contract Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested contract could not be found.'}</p>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/app/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{contract.filename.replace('.pdf', '')}</h1>
              <p className="text-gray-600">Contract Analysis & Search</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contract Metadata */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h2>
              
              {contract.file_metadata ? (
                <div className="space-y-4">
                  {contract.file_metadata.vendor_name && contract.file_metadata.vendor_name !== 'N/A' && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Vendor</label>
                      <p className="text-gray-900">{contract.file_metadata.vendor_name}</p>
                    </div>
                  )}
                  
                  {contract.file_metadata.contract_type && contract.file_metadata.contract_type !== 'N/A' && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <p className="text-gray-900">{contract.file_metadata.contract_type}</p>
                    </div>
                  )}
                  
                  {contract.file_metadata.contract_status && contract.file_metadata.contract_status !== 'N/A' && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contract.file_metadata.contract_status === 'Active' ? 'bg-green-100 text-green-800' :
                        contract.file_metadata.contract_status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                        contract.file_metadata.contract_status === 'Expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {contract.file_metadata.contract_status}
                      </span>
                    </div>
                  )}
                  
                  {contract.file_metadata.contract_value && contract.file_metadata.contract_value !== 'N/A' && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contract Value</label>
                      <p className="text-gray-900 font-medium">{contract.file_metadata.contract_value}</p>
                    </div>
                  )}
                  
                  {contract.file_metadata.start_date && contract.file_metadata.start_date !== 'N/A' && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Date</label>
                      <p className="text-gray-900">{contract.file_metadata.start_date}</p>
                    </div>
                  )}
                  
                  {contract.file_metadata.end_date && contract.file_metadata.end_date !== 'N/A' && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Date</label>
                      <p className="text-gray-900">{contract.file_metadata.end_date}</p>
                    </div>
                  )}
                  
                  {contract.file_metadata.scope_of_services && contract.file_metadata.scope_of_services !== 'N/A' && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Scope</label>
                      <p className="text-gray-900">{contract.file_metadata.scope_of_services}</p>
                    </div>
                  )}
                  
                  {/* Commercial Terms Section */}
                  {(contract.file_metadata.auto_renewal || 
                    contract.file_metadata.payment_terms || 
                    contract.file_metadata.liability_cap || 
                    contract.file_metadata.termination_for_convenience || 
                    contract.file_metadata.price_escalation) && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-md font-semibold text-gray-900 mb-3">Commercial Terms</h3>
                      <div className="space-y-3">
                        {contract.file_metadata.auto_renewal && contract.file_metadata.auto_renewal !== 'N/A' && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Auto Renewal</label>
                            <p className="text-gray-900">{contract.file_metadata.auto_renewal}</p>
                          </div>
                        )}
                        
                        {contract.file_metadata.payment_terms && contract.file_metadata.payment_terms !== 'N/A' && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                            <p className="text-gray-900">{contract.file_metadata.payment_terms}</p>
                          </div>
                        )}
                        
                        {contract.file_metadata.liability_cap && contract.file_metadata.liability_cap !== 'N/A' && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Liability Cap</label>
                            <p className="text-gray-900">{contract.file_metadata.liability_cap}</p>
                          </div>
                        )}
                        
                        {contract.file_metadata.termination_for_convenience && contract.file_metadata.termination_for_convenience !== 'N/A' && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Termination for Convenience</label>
                            <p className="text-gray-900">{contract.file_metadata.termination_for_convenience}</p>
                          </div>
                        )}
                        
                        {contract.file_metadata.price_escalation && contract.file_metadata.price_escalation !== 'N/A' && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Price Escalation</label>
                            <p className="text-gray-900">{contract.file_metadata.price_escalation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Risk Scores Section */}
                  {(contract.file_metadata.total_risk_score !== null && contract.file_metadata.total_risk_score !== undefined) && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-md font-semibold text-gray-900 mb-3">Risk Assessment</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Overall Risk Score</label>
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-900 font-medium">{contract.file_metadata.total_risk_score?.toFixed(1)}</p>
                            {contract.file_metadata.risk_band && (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                contract.file_metadata.risk_band === 'Low' ? 'bg-green-100 text-green-800' :
                                contract.file_metadata.risk_band === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                contract.file_metadata.risk_band === 'High' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {contract.file_metadata.risk_band} Risk
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Individual Risk Scores */}
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          {contract.file_metadata.auto_renewal_risk_score !== null && contract.file_metadata.auto_renewal_risk_score !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Auto Renewal Risk:</span>
                              <span className="font-medium">{contract.file_metadata.auto_renewal_risk_score}/10</span>
                            </div>
                          )}
                          {contract.file_metadata.payment_terms_risk_score !== null && contract.file_metadata.payment_terms_risk_score !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Payment Terms Risk:</span>
                              <span className="font-medium">{contract.file_metadata.payment_terms_risk_score}/10</span>
                            </div>
                          )}
                          {contract.file_metadata.liability_cap_risk_score !== null && contract.file_metadata.liability_cap_risk_score !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Liability Cap Risk:</span>
                              <span className="font-medium">{contract.file_metadata.liability_cap_risk_score}/10</span>
                            </div>
                          )}
                          {contract.file_metadata.termination_risk_score !== null && contract.file_metadata.termination_risk_score !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Termination Risk:</span>
                              <span className="font-medium">{contract.file_metadata.termination_risk_score}/10</span>
                            </div>
                          )}
                          {contract.file_metadata.price_escalation_risk_score !== null && contract.file_metadata.price_escalation_risk_score !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Price Escalation Risk:</span>
                              <span className="font-medium">{contract.file_metadata.price_escalation_risk_score}/10</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Metadata extraction in progress...</p>
                </div>
              )}
            </div>
          </div>

          {/* Search Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[600px]">
              {/* Search Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Ask about this contract</h2>
                    <p className="text-sm text-gray-500">Use AI to search and analyze the contract content</p>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {searchError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-red-700">{searchError}</span>
                    </div>
                  </div>
                )}

                {searchResults.length === 0 && !searchError && (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to search</h3>
                    <p className="text-gray-500 mb-6">Ask any question about this contract and get AI-powered answers</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "What is the contract value?",
                        "When does this contract expire?",
                        "Who is the vendor?",
                        "What are the key terms?"
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setQuery(suggestion)}
                          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.map((result, index) => (
                  <div key={index} className="space-y-3">
                    {/* User Query */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 bg-blue-50 rounded-lg p-3">
                        <p className="text-gray-900">{result.query}</p>
                      </div>
                    </div>
                    
                    {/* AI Response */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="text-gray-900 whitespace-pre-wrap">
                          {typeof result.response === 'string' 
                            ? result.response 
                            : result.response?.raw_response || result.response?.content || JSON.stringify(result.response, null, 2)
                          }
                        </div>
                        {/* {result.search_time_ms && (
                          <div className="mt-2 text-xs text-gray-500">
                            Search completed in {result.search_time_ms.toFixed(0)}ms
                          </div>
                        )} */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search Input */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask anything about this contract..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSearching}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={!query.trim() || isSearching}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isSearching ? 'Searching...' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
