// Mock contract data for ContractHub
export const mockContracts = [
  {
    doc_id: 1,
    filename: "Master Service Agreement",
    parties: "TechCorp & ClientCo",
    uploaded_on: "2024-11-15T10:30:00Z",
    expiry_date: "2025-11-15T00:00:00Z",
    status: "Active",
    risk_score: "Low",
    fileSize: "2.1MB",
    category: "Service Agreement",
    value: "$120,000"
  },
  {
    doc_id: 2,
    filename: "Software License Agreement", 
    parties: "Microsoft & TechCorp",
    uploaded_on: "2024-10-20T14:15:00Z",
    expiry_date: "2025-10-20T00:00:00Z",
    status: "Renewal Due",
    risk_score: "Medium",
    fileSize: "1.5MB",
    category: "License Agreement",
    value: "$85,000"
  },
  {
    doc_id: 3,
    filename: "Employment Contract",
    parties: "TechCorp & John Smith",
    uploaded_on: "2024-09-18T09:45:00Z", 
    expiry_date: "2025-09-18T00:00:00Z",
    status: "Active",
    risk_score: "Low",
    fileSize: "890KB",
    category: "HR Contract",
    value: "$75,000"
  },
  {
    doc_id: 4,
    filename: "Vendor Supply Agreement",
    parties: "SupplyCorp & TechCorp",
    uploaded_on: "2024-08-15T16:20:00Z",
    expiry_date: "2024-12-01T00:00:00Z",
    status: "Expired",
    risk_score: "High",
    fileSize: "3.2MB", 
    category: "Vendor Contract",
    value: "$200,000"
  },
  {
    doc_id: 5,
    filename: "Non-Disclosure Agreement",
    parties: "TechCorp & StartupX",
    uploaded_on: "2024-11-10T11:00:00Z",
    expiry_date: "2027-11-10T00:00:00Z",
    status: "Active",
    risk_score: "Low",
    fileSize: "650KB",
    category: "Legal Agreement",
    value: "$0"
  }
];

export const mockRecentActivity = [
  {
    date: "Today, 2:30 PM",
    user: "Sarah Johnson",
    action: "Created",
    item: "Master Service Agreement",
    category: "Service Contract"
  },
  {
    date: "Yesterday, 4:15 PM",
    user: "Mike Chen", 
    action: "Reviewed",
    item: "Employment Contract",
    category: "HR Contract"
  },
  {
    date: "2 days ago",
    user: "Anna Davis",
    action: "Signed",
    item: "NDA Agreement",
    category: "Legal"
  }
];

export const mockUser = {
  username: "sarah.johnson",
  email: "sarah@techcorp.com",
  firstName: "Sarah",
  lastName: "Johnson",
  avatar: "SJ"
};


export const mockContractDetail = {
  document: {
    doc_id: 1,
    filename: "Service Agreement - Google Cloud.pdf",
    uploaded_on: "2024-09-22T10:30:00Z"
  },
  clauses: [
    {
      title: "Payment Terms",
      text: "Payment shall be made within 30 days of invoice date. Late payments may incur a 1.5% monthly service charge.",
      confidence: 0.95
    },
    {
      title: "Service Level Agreement", 
      text: "99.9% uptime guarantee with credits available for service interruptions exceeding the threshold.",
      confidence: 0.88
    },
    {
      title: "Termination Clause",
      text: "Either party may terminate with 60 days written notice. Data migration support provided for 30 days post-termination.",
      confidence: 0.92
    }
  ],
  insights: [
    {
      risk: "Payment Risk",
      recommendation: "Consider automated payment setup to avoid late fees"
    },
    {
      risk: "Data Security",
      recommendation: "Review data retention policies before contract expiry"
    }
  ]
};



export const mockQueryResponse = {
  answer: "Based on the contract analysis, the termination notice period is 60 days. Either party must provide written notice 60 days prior to the desired termination date. The contract also includes a 30-day data migration support period following termination.",
  retrieved_chunks: [
    {
      text_chunk: "Either party may terminate this agreement with sixty (60) days written notice to the other party.",
      metadata: { page: 12 },
      relevance: 0.95,
      confidence: 0.92
    },
    {
      text_chunk: "Upon termination, Provider will assist with data migration for a period of thirty (30) days.",
      metadata: { page: 13 },
      relevance: 0.78,
      confidence: 0.85
    }
  ]
};
