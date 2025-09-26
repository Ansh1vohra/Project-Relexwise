import { useRef, useState } from 'react'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [expiry, setExpiry] = useState('')
  const [status, setStatus] = useState('Active')
  const [risk, setRisk] = useState('Low')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f && (f.type === 'application/pdf' || f.name.endsWith('.txt') || f.name.endsWith('.docx'))) {
      setFile(f)
    } else {
      setError('Please upload a PDF, TXT, or DOCX file')
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const onUpload = async () => {
    if (!file) return

    setError(''); setDone(''); setProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      clearInterval(progressInterval)
      setProgress(100)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      setDone('Contract uploaded successfully! Processing for analysis...')
      
      // Reset form after success
      setTimeout(() => {
        setFile(null)
        setProgress(0)
        setDone('')
        setExpiry('')
        setStatus('Active')
        setRisk('Low')
      }, 3000)
      
    } catch (err: any) {
      setError('Upload failed. Please try again.')
      setProgress(0)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Upload Contract</h1>
        <p className="text-gray-600 mt-2">Upload your contract documents for AI-powered analysis</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {/* Upload Zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-blue-50 p-4 rounded-full">
                <svg className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">
                {file ? 'File Selected' : 'Drag & drop your contract here'}
              </h3>
              <p className="text-gray-500 mt-1">
                {file ? `Selected: ${file.name}` : 'Supports PDF, TXT, and DOCX files'}
              </p>
            </div>

            {!file && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="btn-primary"
                >
                  Choose File
                </button>
              </div>
            )}

            {file && (
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center text-sm text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {file.name} ({Math.round(file.size / 1024)}KB)
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>

        {/* Contract Details Form */}
        {file && (
          <div className="mt-8 space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Contract Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  id="expiry"
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Renewal Due">Renewal Due</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div>
                <label htmlFor="risk" className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Level
                </label>
                <select
                  id="risk"
                  value={risk}
                  onChange={(e) => setRisk(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <button
              onClick={onUpload}
              disabled={progress > 0}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {progress > 0 ? 'Uploading...' : 'Upload Contract'}
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Message */}
        {done && (
          <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {done}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
