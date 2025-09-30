// API service for contract data
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ContractFile {
  id: string;
  filename: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  file_size: number;
  upload_timestamp: string;
  vector_processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata_processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  vector_processing_error?: string;
  metadata_processing_error?: string;
  processing_attempts: number;
}

export interface FileMetadata {
  id: string;
  file_id: string;
  start_date?: string;
  end_date?: string;
  vendor_name?: string;
  contract_duration?: string;
  contract_value_local?: string;
  currency?: string;
  contract_value_usd?: string;
  contract_status?: string;
  contract_type?: string;
  scope_of_services?: string;
  contract_value?: string;
  extraction_timestamp: string;
  raw_text_length?: number;
  confidence_score?: number;
}

export interface ContractFileWithMetadata extends ContractFile {
  file_metadata?: FileMetadata;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Get all contract files
  async getContractFiles(limit: number = 50, offset: number = 0): Promise<ApiResponse<ContractFileWithMetadata[]>> {
    return this.makeRequest<ContractFileWithMetadata[]>(`/api/v1/files?limit=${limit}&offset=${offset}`);
  }

  // Get a specific contract file with metadata
  async getContractFileWithMetadata(fileId: string): Promise<ApiResponse<ContractFileWithMetadata>> {
    return this.makeRequest<ContractFileWithMetadata>(`/api/v1/files/${fileId}`);
  }

  // Get file processing status
  async getFileStatus(fileId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/v1/files/${fileId}/status`);
  }

  // Upload contract files
  async uploadFiles(files: File[]): Promise<ApiResponse<any>> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser handle it for FormData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Upload request failed:', error);
      return { 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.makeRequest<{ status: string }>('/health');
  }
}

export const apiService = new ApiService();
