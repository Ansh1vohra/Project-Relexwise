// src/mockData.d.ts 

export interface Contract {
    doc_id: number
    filename: string
    parties: string                // ✅ added
    uploaded_on: string
    expiry_date?: string | null
    status: "Active" | "Renewal Due" | "Expired"
    risk_score: "Low" | "Medium" | "High"
    fileSize?: string
    category: string
    value: string                  // ✅ added
  }
  
  export interface ContractClause {
    title: string
    text: string
    confidence: number
  }
  
  export interface ContractInsight {
    risk: string
    recommendation: string
  }
  
  export interface ContractDetail {
    document: Contract
    clauses: ContractClause[]
    insights: ContractInsight[]
  }
  
  export interface User {
    username: string
    email: string
    firstName: string
    lastName: string
    avatar?: string
  }
  
  export interface QueryChunk {
    text_chunk: string
    metadata: {
      page: number
    }
    relevance: number
    confidence: number
  }
  
  export interface QueryResponse {
    answer: string
    retrieved_chunks: QueryChunk[]
  }
  
  export interface RecentActivity {
    date: string
    user: string
    action: string
    item: string
    category: string
  }
  
  export const mockContracts: Contract[]
  export const mockContractDetail: ContractDetail
  export const mockUser: User
  export const mockQueryResponse: QueryResponse
  export const mockRecentActivity: RecentActivity[]   // ✅ typed properly
  