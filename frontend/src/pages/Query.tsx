import { useState } from 'react'
import { mockQueryResponse } from '../mockData'

export default function Query() {
  const [q, setQ] = useState('What is the termination notice period?')
  const [answer, setAnswer] = useState('')
  const [chunks, setChunks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ask = async () => {
    if (!q.trim()) return
    
    setLoading(true); 
    setError(''); 
    setAnswer('');
    setChunks([]);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Use mock response
      setAnswer(mockQueryResponse.answer)
      setChunks(mockQueryResponse.retrieved_chunks)
      
    } catch (err: any) { 
      setError('Query failed. Please try again.') 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Contract Q&A</h1>
        <p className="text-gray-600 mt-2">Ask questions about your contracts and get AI-powered answers</p>
      </div>

      {/* Query Interface */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              Your Question
            </label>
            <textarea
              id="question"
              rows={3}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ask a question about your contracts..."
              className="query-input"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={ask}
              disabled={loading || !q.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Ask Question
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Answer */}
      {answer && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              AI Answer
            </h2>
            <div className="flex items-center text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Confident response
            </div>
          </div>
          
          <div className="p-6 pt-0">
            <div className="answer-card">
              <p className="text-gray-800 leading-relaxed">{answer}</p>
            </div>
          </div>
        </div>
      )}

      {/* Supporting Evidence */}
      {chunks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Supporting Evidence
            </h2>
            <span className="text-sm text-gray-500">{chunks.length} relevant excerpts found</span>
          </div>
          
          <div className="p-6 pt-0 space-y-4">
            {chunks.map((c: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Page {c.metadata?.page ?? '-'}
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      {Math.round((c.relevance || 0) * 100)}% relevant
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                      {Math.round((c.confidence || 0) * 100)}% confidence
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed italic">
                  "{c.text_chunk}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Questions */}
      {!answer && !loading && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "What is the termination notice period?",
              "What are the payment terms?",
              "What is the renewal process?",
              "What are the key obligations?",
              "Are there any penalties or late fees?",
              "What is the liability coverage?"
            ].map((sampleQ, idx) => (
              <button
                key={idx}
                onClick={() => setQ(sampleQ)}
                className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
              >
                {sampleQ}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
