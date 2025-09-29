import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { mockContractDetail, mockContracts } from '../mockData'
import type { Contract, ContractDetail, QueryChunk } from '../mockData'

export default function ContractDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [evidence, setEvidence] = useState<QueryChunk[]>([])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))

        // Find contract from mock data
        const contract = mockContracts.find(
          (c: Contract) => c.doc_id === parseInt(id || '0')
        )
        if (contract) {
          setData({
            ...mockContractDetail,
            document: {
              ...mockContractDetail.document,
              ...contract,
            },
          })
        } else {
          throw new Error('Contract not found')
        }
      } catch (err: any) {
        setError('Failed to load contract details')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  const handleShowEvidence = () => {
    setEvidence([
      {
        text_chunk:
          'Payment terms require settlement within 30 days of invoice date to avoid penalties.',
        metadata: { page: 3 },
        relevance: 0.95,
        confidence: 0.92,
      },
      {
        text_chunk:
          'Service level agreements guarantee 99.9% uptime with credit provisions for outages.',
        metadata: { page: 7 },
        relevance: 0.88,
        confidence: 0.85,
      },
    ])
    setEvidenceOpen(true)
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
        <span className="ml-2 text-gray-600">Loading contract details...</span>
      </div>
    )

  if (error)
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    )

  if (!data) return null

  const doc = data.document

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/app/dashboard"
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Contract Details
            </h1>
            <p className="text-gray-600 mt-1">{doc.filename}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download
          </button>
          <Link to="/app/query" className="btn-primary">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-7.93-7M3 4l4 4m0 0l4-4M7 8v12"
              />
            </svg>
            Ask Questions
          </Link>
        </div>
      </div>

      {/* Contract Info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Upload Date
          </h3>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {new Date(doc.uploaded_on).toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Status
          </h3>
          <div className="mt-2">
            <span
              className={`status-${
                doc.status?.toLowerCase().replace(' ', '-') || 'active'
              }`}
            >
              {doc.status || 'Active'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Risk Level
          </h3>
          <div className="mt-2">
            <span className={`risk-${doc.risk_score?.toLowerCase() || 'low'}`}>
              {doc.risk_score || 'Low'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Expiry Date
          </h3>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {doc.expiry_date
              ? new Date(doc.expiry_date).toLocaleDateString()
              : 'No expiry'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Key Clauses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Key Clauses</h2>
            <button onClick={handleShowEvidence} className="btn-secondary text-sm">
              View Evidence
            </button>
          </div>

          <div className="p-6 pt-0 space-y-4">
            {data.clauses.map((c, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{c.title}</h3>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {(c.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">AI Insights</h2>
            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              AI-powered analysis
            </div>
          </div>

          <div className="p-6 pt-0 space-y-4">
            {data.insights.map((i, idx) => (
              <div
                key={idx}
                className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg"
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900">{i.risk}</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      {i.recommendation}
                    </p>
                  </div>
                  <div className="ml-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Modal */}
      {evidenceOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Evidence & Sources
              </h3>
              <button
                onClick={() => setEvidenceOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {evidence.map((e, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Page: {e.metadata?.page ?? '-'}</span>
                    <div className="flex space-x-2">
                      <span>Relevance: {Math.round((e.relevance || 0) * 100)}%</span>
                      <span>
                        Confidence: {Math.round((e.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {e.text_chunk}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
