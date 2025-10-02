import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'

export default function Upload() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const inputRef = useRef<HTMLInputElement>(null)

  // Check API health on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await apiService.healthCheck()
        setApiStatus(response.error ? 'offline' : 'online')
      } catch {
        setApiStatus('offline')
      }
    }
    checkApiHealth()
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const fileList = Array.from(e.dataTransfer.files)
    const validFiles = fileList.filter(f => 
      f.type === 'application/pdf' || 
      // f.name.endsWith('.txt') || 
      f.name.endsWith('.docx')
    )
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    } else {
      setError('Please upload PDF, TXT, or DOCX files')
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

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || [])
    const validFiles = fileList.filter(f => 
      f.type === 'application/pdf' || 
      f.name.endsWith('.txt') || 
      f.name.endsWith('.docx')
    )
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onUpload = async () => {
    if (files.length === 0) return

    setError(''); setDone(''); setProgress(0); setUploading(true)
    
    try {
      // Start progress indication
      setProgress(10)
      
      // Upload files using API
      const response = await apiService.uploadFiles(files)
      
      setProgress(60)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      setProgress(90)
      
      // Check response data
      if (response.data) {
        const { uploaded_files = [], failed_uploads = [] } = response.data
        
        if (failed_uploads.length > 0) {
          const errorMessages = failed_uploads.map((fail: any) => 
            `${fail.filename}: ${fail.error}`
          ).join(', ')
          throw new Error(`Some uploads failed: ${errorMessages}`)
        }
        
        // Success
        setProgress(100)
        setDone(`${uploaded_files.length} contract${uploaded_files.length > 1 ? 's' : ''} uploaded successfully! Processing for analysis...`)
      } else {
        setProgress(100)
        setDone(`${files.length} contract${files.length > 1 ? 's' : ''} uploaded successfully! Processing for analysis...`)
      }
      
      // Reset form after success
      setTimeout(() => {
        setFiles([])
        setProgress(0)
        setDone('')
        setUploading(false)
      }, 3000)
      
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Upload failed. Please try again.')
      setProgress(0)
      setUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Contracts</h1>
        <p className="text-gray-600">Upload your contract documents for AI-powered analysis</p>
        
        {/* API Status Indicator */}
        {/* <div className="mt-4 flex items-center justify-center">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            apiStatus === 'online' ? 'bg-green-100 text-green-800' :
            apiStatus === 'offline' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'online' ? 'bg-green-500' :
              apiStatus === 'offline' ? 'bg-red-500' :
              'bg-yellow-500'
            }`}></div>
            <span>
              {apiStatus === 'online' ? 'Backend Connected' :
               apiStatus === 'offline' ? 'Backend Offline' :
               'Checking Connection...'}
            </span>
          </div>
        </div> */}
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : files.length > 0 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 bg-gray-50'
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            files.length > 0 ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            <svg className={`w-8 h-8 ${files.length > 0 ? 'text-green-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold mb-2">
            {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''} Selected` : 'Drag & drop your contracts here'}
          </h3>
          
          <p className="text-gray-500 mb-4">
            Supports PDF, TXT, and DOCX files • Multiple files allowed
          </p>

          <button
            onClick={() => inputRef.current?.click()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Choose Files
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.docx"
          onChange={onFileSelect}
          className="hidden"
        />
      </div>

      {/* Selected Files List */}
      {files.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Selected Files ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{file.name}</div>
                    <div className="text-sm text-gray-500">{Math.round(file.size / 1024)} KB</div>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={onUpload}
          disabled={uploading || progress > 0 || apiStatus !== 'online'}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading || progress > 0 ? 'Uploading...' : 
           apiStatus !== 'online' ? 'Backend Unavailable' :
           `Upload ${files.length} Contract${files.length > 1 ? 's' : ''}`}
        </button>
      )}

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {done && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-800">{done}</span>
            </div>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
            >
              View Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}
