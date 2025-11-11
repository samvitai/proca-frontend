// Invoice API service
import { api } from "@/lib/utils";

export interface ApiInvoice {
  invoice_id: string;
  invoice_number: string;
  taskname: string;
  customer: string;
  client_id: number;
  client_name: string;
  invoice_date: string;
  due_date: string;
  amount_before_tax: number;
  total_gst: number;
  invoice_amount: number;
  total_amount: number;
  paid_amount: number;
  amount_due: number;
  outstanding_amount: number;
  status: string;
  credit_note: string | null;
  invoice_url: string;
  created_at: string;
}

export interface ApiInvoiceResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    invoices: ApiInvoice[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
    };
    summary: {
      total_invoices: number;
      total_amount: number;
      paid_amount: number;
      outstanding_amount: number;
    };
  };
  error_code: string | null;
  timestamp: string;
  request_id: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  taskName: string;
  description: string;
  customer: string;
  invoiceAmount: number;
  creditNoteAmount: number;
  amountDue: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  dueDate: string;
  overdueDays?: number;
  createdAt: string;
  invoiceUrl?: string;
  comment?: string;
}

// Function to map API invoice to UI invoice format
export const mapApiInvoiceToInvoice = (apiInvoice: ApiInvoice): Invoice => {
  // Calculate overdue days if status is overdue
  // Due date is calculated as T+5 (5 days after creation)
  // Overdue days start counting from T+6 (6th day after creation)
  const calculateOverdueDays = (createdAt: string, status: string): number | undefined => {
    if (status !== 'overdue') return undefined;
    
    const creationDate = new Date(createdAt);
    const now = new Date();
    
    // Reset time to start of day for accurate calculation
    creationDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    // Calculate due date as T+5 (5 days after creation)
    const dueDate = new Date(creationDate);
    dueDate.setDate(dueDate.getDate() + 5);
    
    // Overdue days start from T+6, which is 1 day after the due date
    const diffTime = now.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Only return positive days (overdue starts on day 6, so if diffDays <= 0, it's not overdue yet)
    return diffDays > 0 ? diffDays : 0;
  };

  // Map status from API to UI format
  const mapStatus = (apiStatus: string): 'paid' | 'unpaid' | 'partial' | 'overdue' => {
    switch (apiStatus.toLowerCase()) {
      case 'paid':
        return 'paid';
      case 'partial':
        return 'partial';
      case 'overdue':
        return 'overdue';
      case 'unpaid':
      default:
        return 'unpaid';
    }
  };

  const mappedStatus = mapStatus(apiInvoice.status);

  return {
    id: apiInvoice.invoice_number, // Use invoice_number as display ID
    invoiceNumber: apiInvoice.invoice_number,
    taskName: apiInvoice.taskname,
    description: `Task: ${apiInvoice.taskname}`, // Using task name as description
    customer: apiInvoice.customer,
    invoiceAmount: apiInvoice.invoice_amount,
    creditNoteAmount: apiInvoice.credit_note ? parseFloat(apiInvoice.credit_note) : 0,
    amountDue: apiInvoice.amount_due,
    status: mappedStatus,
    dueDate: new Date(apiInvoice.due_date).toISOString().split('T')[0], // Format as YYYY-MM-DD
    overdueDays: calculateOverdueDays(apiInvoice.created_at, apiInvoice.status),
    createdAt: new Date(apiInvoice.created_at).toISOString().split('T')[0], // Format as YYYY-MM-DD
    invoiceUrl: apiInvoice.invoice_url,
    comment: undefined // Comments are fetched separately if needed
  };
};

// API service function to fetch invoices
export const fetchInvoices = async (): Promise<{
  invoices: Invoice[];
  summary: ApiInvoiceResponse['data']['summary'];
  pagination: ApiInvoiceResponse['data']['pagination'];
}> => {
  try {
    // Use the configured axios instance which automatically includes auth token
    const response = await api.get<ApiInvoiceResponse>('/api/invoices');
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch invoices');
    }
    
    // Map API invoices to UI format
    const mappedInvoices = data.data.invoices.map(mapApiInvoiceToInvoice);
    
    return {
      invoices: mappedInvoices,
      summary: data.data.summary,
      pagination: data.data.pagination
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    // Re-throw the error so the component can handle it
    throw error;
  }
};

// API service function to update invoice status
export const updateInvoiceStatus = async (
  invoiceId: string, 
  status: 'paid' | 'unpaid' | 'partially_paid'
): Promise<void> => {
  try {
    // Use the configured axios instance which automatically includes auth token
    const response = await api.put(`/api/invoices/${invoiceId}/status`, {
      status: status
    });
    
    // Check if the response indicates success
    if (response.data && !response.data.success) {
      throw new Error(response.data.message || 'Failed to update invoice status');
    }
  } catch (error) {
    console.error('Error updating invoice status:', error);
    // Re-throw the error so the component can handle it
    throw error;
  }
};

// API service function to create invoice comment
export const createInvoiceComment = async (
  invoiceNumber: string,
  commentText: string
): Promise<void> => {
  try {
    const response = await api.post(`/api/invoices/${invoiceNumber}/comment`, {
      comment_text: commentText
    });
    
    if (response.data && !response.data.success) {
      throw new Error(response.data.message || 'Failed to create invoice comment');
    }
  } catch (error) {
    console.error('Error creating invoice comment:', error);
    throw error;
  }
};

// API service function to update invoice comment
export const updateInvoiceComment = async (
  invoiceNumber: string,
  commentText: string
): Promise<void> => {
  try {
    const response = await api.put(`/api/invoices/${invoiceNumber}/comment`, {
      comment_text: commentText
    });
    
    if (response.data && !response.data.success) {
      throw new Error(response.data.message || 'Failed to update invoice comment');
    }
  } catch (error) {
    console.error('Error updating invoice comment:', error);
    throw error;
  }
};

// API service function to fetch invoice comment
export const fetchInvoiceComment = async (
  invoiceNumber: string
): Promise<string | null> => {
  try {
    const response = await api.get(`/api/invoices/${invoiceNumber}/comment`);
    
    if (response.data && !response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch invoice comment');
    }
    
    // Extract comment_text from the nested data object
    // Response structure: { data: { comment_text: "...", ... } }
    const commentData = response.data?.data;
    const commentText = commentData?.comment_text;
    
    // Return the comment text if it exists and is not empty, otherwise null
    return commentText && commentText.trim() ? commentText.trim() : null;
  } catch (error: unknown) {
    // Handle cases where comment doesn't exist
    const errorResponse = error as { response?: { status?: number; data?: { detail?: string } } };
    const status = errorResponse?.response?.status;
    const detail = errorResponse?.response?.data?.detail;
    
    // If comment doesn't exist (404 or "No comment found" message), return null
    if (status === 404 || detail?.toLowerCase().includes('no comment found')) {
      return null;
    }
    
    console.error('Error fetching invoice comment:', error);
    throw error;
  }
};
