// Reports API service
import { api } from "@/lib/utils";

// Task Report Interfaces
export interface TaskReport {
  id: string;
  project_name: string;
  client: string;
  client_id: string;
  service_category: string;
  service_category_id: string;
  assignment_status: 'assigned' | 'not_assigned';
  workflow_status: 'open' | 'in_progress' | 'in_review' | 'closed';
  status_group: 'pending' | 'completed';
  assignee_id: string | null;
  assignee_name: string | null;
  due_date: string;
  created_date: string;
  completed_date?: string;
  updated_at?: string;
  comments?: string;
}

// Raw API Task Report (what the API actually returns)
interface ApiTaskReport {
  task_id?: string;
  id?: string;
  task_name?: string;
  project_name?: string;
  name?: string;
  client_name?: string;
  client?: string;
  client_id: string;
  service_category_name?: string;
  service_category?: string;
  service_category_id: string;
  assignment_status: 'assigned' | 'not_assigned' | 'unassigned';
  workflow_status: 'open' | 'in_progress' | 'in_review' | 'closed';
  status_group?: 'pending' | 'completed';
  assignee_id: string | null;
  assignee_name: string | null;
  due_date: string;
  created_at?: string;
  created_date?: string;
  completed_date?: string;
  completed_at?: string;
  updated_at?: string;
  updated_date?: string;
  comments?: Array<{
    comment_id?: string;
    id?: string;
    comment_text?: string;
    content?: string;
    user_name?: string;
    author?: string;
    created_at?: string;
    timestamp?: string;
  }>;
}

export interface TaskReportResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    tasks: ApiTaskReport[] | TaskReport[]; // Can be either format
    summary: {
      total_projects: number;
      assigned: number;
      completed: number;
      overdue: number;
    };
  };
  error_code: string | null;
  timestamp: string;
  request_id: string;
}

// Invoice Register Report Interfaces
export interface InvoiceRegisterItem {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  client_id: string;
  client_name: string;
  task_name: string;
  service_category: string;
  amount_before_tax: number;
  total_gst: number;
  invoice_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: string;
  due_date: string;
}

export interface InvoiceRegisterResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    invoices: InvoiceRegisterItem[];
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

// Aging Report Interfaces
export interface AgingReportItem {
  client_id: string;
  client_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  invoice_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  days_overdue: number;
  age_bucket: '0-30' | '31-60' | '61-90' | '91-120' | '120+';
}

export interface AgingReportResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    receivables: AgingReportItem[];
    summary: {
      total_outstanding: number;
      bucket_0_30: number;
      bucket_31_60: number;
      bucket_61_90: number;
      bucket_91_120: number;
      bucket_120_plus: number;
    };
  };
  error_code: string | null;
  timestamp: string;
  request_id: string;
}

// Revenue by Client Report Interfaces
export interface RevenueByClientItem {
  client_id: string;
  client_name: string;
  total_invoices: number;
  total_revenue: number;
  paid_amount: number;
  outstanding_amount: number;
  service_categories: Array<{
    category: string;
    revenue: number;
  }>;
}

export interface RevenueByClientResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    clients: RevenueByClientItem[];
    summary: {
      total_clients: number;
      total_revenue: number;
      total_paid: number;
      total_outstanding: number;
    };
  };
  error_code: string | null;
  timestamp: string;
  request_id: string;
}

// Client Statement Interfaces
export interface ClientStatementItem {
  transaction_id: string;
  transaction_type: 'invoice' | 'payment' | 'credit_note' | 'debit_note';
  transaction_date: string;
  invoice_number?: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
}

export interface ClientStatementResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    client_id: string;
    client_name: string;
    statement_period: {
      from_date: string;
      to_date: string;
    };
    opening_balance: number;
    closing_balance: number;
    transactions: ClientStatementItem[];
    summary: {
      total_invoices: number;
      total_payments: number;
      total_credit_notes: number;
      total_debit_notes: number;
      net_amount: number;
    };
  };
  error_code: string | null;
  timestamp: string;
  request_id: string;
}

// API service functions

// Helper function to map API task report to TaskReport
const mapApiTaskReportToTaskReport = (apiTask: ApiTaskReport): TaskReport => {
  // Map task name - try multiple possible field names
  const projectName = apiTask.project_name || apiTask.task_name || apiTask.name || 'Untitled Project';
  
  // Map client name - try multiple possible field names
  const clientName = apiTask.client_name || apiTask.client || 'Unknown Client';
  
  // Map service category
  const serviceCategory = apiTask.service_category_name || apiTask.service_category || 'Unknown Category';
  
  // Map created date
  const createdDate = apiTask.created_date || apiTask.created_at || new Date().toISOString();
  
  // Map completed date
  const completedDate = apiTask.completed_date || apiTask.completed_at;
  
  // Map updated date
  const updatedDate = apiTask.updated_at || apiTask.updated_date;
  
  // Map comments - combine all comments into a single string
  let commentsText = '';
  if (apiTask.comments && Array.isArray(apiTask.comments) && apiTask.comments.length > 0) {
    commentsText = apiTask.comments.map((comment: any) => {
      const text = comment.comment_text || comment.content || '';
      const author = comment.user_name || comment.author || 'Unknown';
      const date = comment.created_at || comment.timestamp || '';
      return `[${author}${date ? ' - ' + new Date(date).toLocaleDateString() : ''}]: ${text}`;
    }).join(' | ');
  }
  
  // Map assignment status (handle 'unassigned' as 'not_assigned')
  const assignmentStatus = apiTask.assignment_status === 'unassigned' 
    ? 'not_assigned' 
    : apiTask.assignment_status;
  
  // Determine status group if not provided
  let statusGroup: 'pending' | 'completed' = apiTask.status_group || 'pending';
  if (!apiTask.status_group) {
    // Infer from workflow status
    if (apiTask.workflow_status === 'closed') {
      statusGroup = 'completed';
    } else {
      statusGroup = 'pending';
    }
  }
  
  return {
    id: apiTask.task_id || apiTask.id || '',
    project_name: projectName,
    client: clientName,
    client_id: apiTask.client_id,
    service_category: serviceCategory,
    service_category_id: apiTask.service_category_id,
    assignment_status: assignmentStatus as 'assigned' | 'not_assigned',
    workflow_status: apiTask.workflow_status,
    status_group: statusGroup,
    assignee_id: apiTask.assignee_id,
    assignee_name: apiTask.assignee_name,
    due_date: apiTask.due_date,
    created_date: createdDate,
    completed_date: completedDate,
    updated_at: updatedDate,
    comments: commentsText || undefined
  };
};

// Fetch Task Report
export const fetchTaskReport = async (params?: {
  assignment_status?: string;
  workflow_status?: string;
  status_group?: string;
  assignee_id?: string;
  client_id?: string;
  service_category_id?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
}): Promise<{
  tasks: TaskReport[];
  summary: TaskReportResponse['data']['summary'];
}> => {
  try {
    const response = await api.get<TaskReportResponse>('/api/reports/tasks', {
      params: params || {}
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch task report');
    }
    
    // Map API tasks to TaskReport format
    const mappedTasks = data.data.tasks.map((task: any) => mapApiTaskReportToTaskReport(task));
    
    return {
      tasks: mappedTasks,
      summary: data.data.summary
    };
  } catch (error) {
    console.error('Error fetching task report:', error);
    throw error;
  }
};

// Fetch Invoice Register Report
export const fetchInvoiceRegisterReport = async (params?: {
  client_id?: string;
  service_category_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<{
  invoices: InvoiceRegisterItem[];
  summary: InvoiceRegisterResponse['data']['summary'];
}> => {
  try {
    const response = await api.get<InvoiceRegisterResponse>('/api/reports/invoice-register', {
      params: params || {}
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch invoice register report');
    }
    
    return {
      invoices: data.data.invoices,
      summary: data.data.summary
    };
  } catch (error) {
    console.error('Error fetching invoice register report:', error);
    throw error;
  }
};

// Fetch Aging Report (Receivables)
export const fetchAgingReport = async (params?: {
  client_id?: string;
  as_of_date?: string;
}): Promise<{
  receivables: AgingReportItem[];
  summary: AgingReportResponse['data']['summary'];
}> => {
  try {
    const response = await api.get<AgingReportResponse>('/api/reports/aging', {
      params: params || {}
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch aging report');
    }
    
    return {
      receivables: data.data.receivables,
      summary: data.data.summary
    };
  } catch (error) {
    console.error('Error fetching aging report:', error);
    throw error;
  }
};

// Fetch Revenue by Client Report
export const fetchRevenueByClientReport = async (params?: {
  date_from?: string;
  date_to?: string;
  client_id?: string;
}): Promise<{
  clients: RevenueByClientItem[];
  summary: RevenueByClientResponse['data']['summary'];
}> => {
  try {
    const response = await api.get<RevenueByClientResponse>('/api/reports/revenue-by-client', {
      params: params || {}
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch revenue by client report');
    }
    
    return {
      clients: data.data.clients,
      summary: data.data.summary
    };
  } catch (error) {
    console.error('Error fetching revenue by client report:', error);
    throw error;
  }
};

// Fetch Client Statement
export const fetchClientStatement = async (
  clientId: string,
  params?: {
    from_date?: string;
    to_date?: string;
  }
): Promise<ClientStatementResponse['data']> => {
  try {
    const response = await api.get<ClientStatementResponse>(`/api/reports/client-statement/${clientId}`, {
      params: params || {}
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch client statement');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching client statement:', error);
    throw error;
  }
};

// Invoice Report Interfaces
export interface InvoiceReportItem {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  client_id: string;
  client_name: string;
  task_name: string;
  service_category: string;
  amount_before_tax: number;
  total_gst: number;
  invoice_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  amount_due: number;
  status: string;
  due_date: string;
  created_at?: string;
}

export interface InvoiceReportResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    invoices: InvoiceReportItem[];
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

// Helper function to map API invoice report to InvoiceReportItem
const mapApiInvoiceReportToInvoiceReport = (apiInvoice: any): InvoiceReportItem => {
  // Map task name - try multiple possible field names (prioritize taskname as that's what the API uses)
  const taskName = apiInvoice.taskname || 
                   apiInvoice.task_name || 
                   apiInvoice.task || 
                   apiInvoice.taskName ||
                   apiInvoice.project_name ||
                   apiInvoice.project ||
                   '';
  
  // Map outstanding amount - try multiple possible field names
  const outstandingAmount = apiInvoice.outstanding_amount || 
                           apiInvoice.outstanding || 
                           apiInvoice.amount_due || 
                           0;
  
  // Use outstanding_amount as invoice_amount for display (as requested)
  const invoiceAmount = outstandingAmount || apiInvoice.invoice_amount || 0;
  
  return {
    invoice_id: apiInvoice.invoice_id || apiInvoice.id || '',
    invoice_number: apiInvoice.invoice_number || apiInvoice.invoice_no || '',
    invoice_date: apiInvoice.invoice_date || apiInvoice.date || '',
    client_id: String(apiInvoice.client_id || apiInvoice.client_id || ''),
    client_name: apiInvoice.client_name || apiInvoice.client || apiInvoice.customer || '',
    task_name: taskName,
    service_category: apiInvoice.service_category || apiInvoice.category || '',
    amount_before_tax: apiInvoice.amount_before_tax || apiInvoice.before_tax || 0,
    total_gst: apiInvoice.total_gst || apiInvoice.gst || 0,
    invoice_amount: invoiceAmount,
    paid_amount: apiInvoice.paid_amount || apiInvoice.paid || 0,
    outstanding_amount: outstandingAmount,
    amount_due: apiInvoice.amount_due || apiInvoice.due || 0,
    status: apiInvoice.status || 'unpaid',
    due_date: apiInvoice.due_date || apiInvoice.due || '',
    created_at: apiInvoice.created_at || apiInvoice.created_date
  };
};

// Fetch Invoice Report
export const fetchInvoiceReport = async (params?: {
  client_id?: string;
  service_category_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<{
  invoices: InvoiceReportItem[];
  summary: InvoiceReportResponse['data']['summary'];
}> => {
  try {
    const response = await api.get<InvoiceReportResponse>('/api/reports/invoices', {
      params: params || {}
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch invoice report');
    }
    
    // Fetch invoices from regular endpoint to get task names (they include taskname field)
    let invoiceTaskMap: Map<string, string> = new Map();
    try {
      const invoicesResponse = await api.get('/api/invoices');
      
      if (invoicesResponse.data?.success && invoicesResponse.data?.data?.invoices) {
        const invoices = invoicesResponse.data.data.invoices;
        invoices.forEach((invoice: any) => {
          // Map invoice_number to taskname
          if (invoice.invoice_number && invoice.taskname) {
            invoiceTaskMap.set(invoice.invoice_number, invoice.taskname);
          }
        });
      }
    } catch (invoiceError) {
      console.warn('Could not fetch invoices for task names:', invoiceError);
      // Continue without task names if invoice fetch fails
    }
    
    // Also try fetching tasks to get task names
    let taskMap: Map<string, string> = new Map();
    try {
      const tasksResponse = await api.get('/api/tasks', {
        params: { is_active: true }
      });
      
      if (tasksResponse.data?.success && tasksResponse.data?.data?.tasks) {
        const tasks = tasksResponse.data.data.tasks;
        tasks.forEach((task: any) => {
          // Map invoice_id to task_name
          if (task.invoice_id) {
            const invoiceId = String(task.invoice_id).replace('invoice_', '');
            const taskName = task.task_name || task.name || task.project_name || '';
            if (taskName) {
              taskMap.set(invoiceId, taskName);
            }
          }
        });
      }
    } catch (taskError) {
      console.warn('Could not fetch tasks for invoice reports:', taskError);
      // Continue without task names if task fetch fails
    }
    
    // Map API invoices to InvoiceReportItem format
    const mappedInvoices = data.data.invoices.map((invoice: any) => {
      const mappedInvoice = mapApiInvoiceReportToInvoiceReport(invoice);
      
      // Try to get task name from invoice map first (by invoice_number) - most reliable
      if (!mappedInvoice.task_name && invoice.invoice_number) {
        const taskName = invoiceTaskMap.get(invoice.invoice_number);
        if (taskName) {
          mappedInvoice.task_name = taskName;
        }
      }
      
      // If still no task name, try from task map (by invoice_id) - fallback
      if (!mappedInvoice.task_name) {
        const invoiceId = String(invoice.invoice_id || '').replace('invoice_', '');
        const taskName = taskMap.get(invoiceId);
        if (taskName) {
          mappedInvoice.task_name = taskName;
        }
      }
      
      return mappedInvoice;
    });
    
    return {
      invoices: mappedInvoices,
      summary: data.data.summary
    };
  } catch (error) {
    console.error('Error fetching invoice report:', error);
    throw error;
  }
};

// Credit Note Report Interfaces
export interface CreditNoteReportItem {
  credit_note_id: string;
  credit_note_number: string;
  credit_note_date: string;
  invoice_id: string;
  invoice_number: string;
  client_id: string;
  client_name: string;
  amount_before_tax: number;
  total_gst: number;
  credit_note_amount: number;
  reason: string;
  status: string;
  created_at?: string;
}

export interface CreditNoteReportResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    credit_notes: CreditNoteReportItem[];
    summary: {
      total_credit_notes: number;
      total_amount: number;
    };
  };
  error_code: string | null;
  timestamp: string;
  request_id: string;
}

// Debit Note Report Interfaces
export interface DebitNoteReportItem {
  debit_note_id: string;
  debit_note_number: string;
  client_id: string;
  client_name: string;
  description: string;
  amount: number;
  paid_amount: number;
  outstanding_amount: number;
  due_date: string;
  status: string;
  comments: string;
  created_at: string;
  updated_at?: string;
}

export interface DebitNoteReportResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    debit_notes: DebitNoteReportItem[];
    summary: {
      total_debit_notes: number;
      total_amount: number;
      paid_amount: number;
      outstanding_amount: number;
    };
  };
  error_code: string | null;
  timestamp: string;
  request_id: string;
}

// Helper function to map API credit note report to CreditNoteReportItem
const mapApiCreditNoteReportToCreditNoteReport = (apiCreditNote: any): CreditNoteReportItem => {
  // Map amount before tax - try multiple possible field names
  const amountBeforeTax = apiCreditNote.amount_before_tax || 
                         apiCreditNote.amount_before_tax_amount ||
                         apiCreditNote.before_tax || 
                         0;
  
  // Map credit note amount - try multiple possible field names
  let creditNoteAmount = apiCreditNote.credit_note_amount || 
                        apiCreditNote.total_amount ||
                        apiCreditNote.amount || 
                        apiCreditNote.credit_note_total ||
                        0;
  
  // Map total GST - try multiple possible field names
  let totalGst = apiCreditNote.total_gst || 
                apiCreditNote.total_gst_amount ||
                apiCreditNote.gst || 
                apiCreditNote.tax ||
                0;
  
  // If GST is missing or zero, try to calculate it from amounts
  if ((!totalGst || totalGst === 0) && creditNoteAmount && amountBeforeTax) {
    totalGst = creditNoteAmount - amountBeforeTax;
    // Only use calculated GST if it's positive (amount should be >= before tax)
    if (totalGst < 0) {
      totalGst = 0;
    }
  }
  
  // Ensure credit note amount is at least amount before tax + GST
  if (creditNoteAmount && amountBeforeTax && totalGst && creditNoteAmount < (amountBeforeTax + totalGst)) {
    creditNoteAmount = amountBeforeTax + totalGst;
  }
  
  // Map credit note date - try multiple possible field names
  const creditNoteDate = apiCreditNote.credit_note_date || 
                        apiCreditNote.date || 
                        apiCreditNote.cn_date ||
                        apiCreditNote.created_at || 
                        apiCreditNote.created_date || 
                        '';
  
  return {
    credit_note_id: apiCreditNote.credit_note_id || apiCreditNote.id || '',
    credit_note_number: apiCreditNote.credit_note_number || apiCreditNote.credit_note_no || '',
    credit_note_date: creditNoteDate,
    invoice_id: apiCreditNote.invoice_id || apiCreditNote.invoice_id || '',
    invoice_number: apiCreditNote.invoice_number || apiCreditNote.invoice_no || apiCreditNote.invoice_number || '',
    client_id: String(apiCreditNote.client_id || apiCreditNote.client_id || ''),
    client_name: apiCreditNote.client_name || apiCreditNote.client || apiCreditNote.customer || '',
    amount_before_tax: amountBeforeTax,
    total_gst: totalGst,
    credit_note_amount: creditNoteAmount,
    reason: apiCreditNote.reason || apiCreditNote.description || '',
    status: apiCreditNote.status || 'active',
    created_at: apiCreditNote.created_at || apiCreditNote.created_date
  };
};

// Fetch Credit Note Report
export const fetchCreditNoteReport = async (params?: {
  client_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<{
  credit_notes: CreditNoteReportItem[];
  summary: CreditNoteReportResponse['data']['summary'];
}> => {
  try {
    const response = await api.get<CreditNoteReportResponse>('/api/reports/credit-notes', {
      params: params || {}
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch credit note report');
    }
    
    // Also fetch from regular credit notes endpoint to get complete data
    let creditNoteDataMap: Map<string, any> = new Map();
    try {
      const creditNotesResponse = await api.get('/api/credit-notes');
      
      if (creditNotesResponse.data?.success && creditNotesResponse.data?.data?.credit_notes) {
        const creditNotes = creditNotesResponse.data.data.credit_notes;
        creditNotes.forEach((cn: any) => {
          // Map by credit_note_number for matching
          if (cn.credit_note_number) {
            creditNoteDataMap.set(cn.credit_note_number, cn);
          }
        });
      }
    } catch (creditNoteError) {
      console.warn('Could not fetch credit notes for additional data:', creditNoteError);
      // Continue without additional data if fetch fails
    }
    
    // Map API credit notes to CreditNoteReportItem format
    const mappedCreditNotes = data.data.credit_notes.map((creditNote: any) => {
      const mappedCreditNote = mapApiCreditNoteReportToCreditNoteReport(creditNote);
      
      // Try to get additional data from credit note map if available
      if (creditNote.credit_note_number) {
        const additionalData = creditNoteDataMap.get(creditNote.credit_note_number);
        if (additionalData) {
          // Update credit note date - prioritize the one from additional data if available
          if (additionalData.credit_note_date) {
            mappedCreditNote.credit_note_date = additionalData.credit_note_date;
          } else if (additionalData.date && (!mappedCreditNote.credit_note_date || mappedCreditNote.credit_note_date === '')) {
            mappedCreditNote.credit_note_date = additionalData.date;
          }
          // Update amounts if they're missing or zero
          if ((!mappedCreditNote.amount_before_tax || mappedCreditNote.amount_before_tax === 0) && additionalData.amount_before_tax) {
            mappedCreditNote.amount_before_tax = additionalData.amount_before_tax;
          }
          if ((!mappedCreditNote.credit_note_amount || mappedCreditNote.credit_note_amount === 0) && additionalData.total_amount) {
            mappedCreditNote.credit_note_amount = additionalData.total_amount;
          }
          if ((!mappedCreditNote.credit_note_amount || mappedCreditNote.credit_note_amount === 0) && additionalData.credit_note_amount) {
            mappedCreditNote.credit_note_amount = additionalData.credit_note_amount;
          }
          // Update GST if missing
          if ((!mappedCreditNote.total_gst || mappedCreditNote.total_gst === 0) && additionalData.total_gst) {
            mappedCreditNote.total_gst = additionalData.total_gst;
          }
        }
      }
      
      return mappedCreditNote;
    });
    
    return {
      credit_notes: mappedCreditNotes,
      summary: data.data.summary
    };
  } catch (error) {
    console.error('Error fetching credit note report:', error);
    throw error;
  }
};

// Helper function to map API debit note report to DebitNoteReportItem
const mapApiDebitNoteReportToDebitNoteReport = (apiDebitNote: any): DebitNoteReportItem => {
  // Map created date - try multiple possible field names
  const createdDate = apiDebitNote.created_at || 
                     apiDebitNote.created_date || 
                     apiDebitNote.created ||
                     apiDebitNote.date_created ||
                     '';
  
  return {
    debit_note_id: apiDebitNote.debit_note_id || apiDebitNote.id || '',
    debit_note_number: apiDebitNote.debit_note_number || apiDebitNote.debit_note_no || '',
    client_id: String(apiDebitNote.client_id || apiDebitNote.client_id || ''),
    client_name: apiDebitNote.client_name || apiDebitNote.client || apiDebitNote.customer || '',
    description: apiDebitNote.description || apiDebitNote.desc || '',
    amount: apiDebitNote.amount || apiDebitNote.total_amount || 0,
    paid_amount: apiDebitNote.paid_amount || apiDebitNote.paid || 0,
    outstanding_amount: apiDebitNote.outstanding_amount || apiDebitNote.outstanding || 0,
    due_date: apiDebitNote.due_date || apiDebitNote.due || '',
    status: apiDebitNote.status || 'unpaid',
    comments: apiDebitNote.comments || apiDebitNote.comment || '',
    created_at: createdDate,
    updated_at: apiDebitNote.updated_at || apiDebitNote.updated_date
  };
};

// Fetch Debit Note Report
export const fetchDebitNoteReport = async (params?: {
  client_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<{
  debit_notes: DebitNoteReportItem[];
  summary: DebitNoteReportResponse['data']['summary'];
}> => {
  try {
    const response = await api.get<DebitNoteReportResponse>('/api/reports/debit-notes', {
      params: params || {}
    });
    
    const data = response.data;
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch debit note report');
    }
    
    // Also fetch from regular debit notes endpoint to get complete data
    let debitNoteDataMap: Map<string, any> = new Map();
    try {
      const debitNotesResponse = await api.get('/api/debit-notes');
      
      if (debitNotesResponse.data?.success && debitNotesResponse.data?.data?.debit_notes) {
        const debitNotes = debitNotesResponse.data.data.debit_notes;
        debitNotes.forEach((dn: any) => {
          // Map by debit_note_number for matching
          if (dn.debit_note_number) {
            debitNoteDataMap.set(dn.debit_note_number, dn);
          }
        });
      }
    } catch (debitNoteError) {
      console.warn('Could not fetch debit notes for additional data:', debitNoteError);
      // Continue without additional data if fetch fails
    }
    
    // Map API debit notes to DebitNoteReportItem format
    const mappedDebitNotes = data.data.debit_notes.map((debitNote: any) => {
      const mappedDebitNote = mapApiDebitNoteReportToDebitNoteReport(debitNote);
      
      // Try to get additional data from debit note map if available
      if (debitNote.debit_note_number) {
        const additionalData = debitNoteDataMap.get(debitNote.debit_note_number);
        if (additionalData) {
          // Update created date - prioritize the one from additional data if available
          if (additionalData.created_at) {
            mappedDebitNote.created_at = additionalData.created_at;
          } else if (additionalData.created_date && (!mappedDebitNote.created_at || mappedDebitNote.created_at === '')) {
            mappedDebitNote.created_at = additionalData.created_date;
          }
          // Update amounts if they're missing or zero
          if ((!mappedDebitNote.amount || mappedDebitNote.amount === 0) && additionalData.amount) {
            mappedDebitNote.amount = additionalData.amount;
          }
          if ((!mappedDebitNote.paid_amount || mappedDebitNote.paid_amount === 0) && additionalData.paid_amount) {
            mappedDebitNote.paid_amount = additionalData.paid_amount;
          }
          if ((!mappedDebitNote.outstanding_amount || mappedDebitNote.outstanding_amount === 0) && additionalData.outstanding_amount) {
            mappedDebitNote.outstanding_amount = additionalData.outstanding_amount;
          }
        }
      }
      
      return mappedDebitNote;
    });
    
    return {
      debit_notes: mappedDebitNotes,
      summary: data.data.summary
    };
  } catch (error) {
    console.error('Error fetching debit note report:', error);
    throw error;
  }
};

// Export report to file
export const exportReport = async (
  reportType: 'tasks' | 'invoice-register' | 'aging' | 'revenue-by-client' | 'client-statement' | 'invoices' | 'credit-notes' | 'debit-notes',
  format: 'xlsx' | 'csv',
  params?: Record<string, any>,
  clientId?: string
): Promise<Blob> => {
  try {
    let endpoint = '';
    
    switch (reportType) {
      case 'tasks':
        endpoint = '/api/reports/tasks';
        break;
      case 'invoice-register':
        endpoint = '/api/reports/invoice-register';
        break;
      case 'aging':
        endpoint = '/api/reports/aging';
        break;
      case 'revenue-by-client':
        endpoint = '/api/reports/revenue-by-client';
        break;
      case 'client-statement':
        if (!clientId) {
          throw new Error('Client ID is required for client statement export');
        }
        endpoint = `/api/reports/client-statement/${clientId}`;
        break;
      case 'invoices':
        endpoint = '/api/reports/invoices';
        break;
      case 'credit-notes':
        endpoint = '/api/reports/credit-notes';
        break;
      case 'debit-notes':
        endpoint = '/api/reports/debit-notes';
        break;
    }
    
    const response = await api.get(endpoint, {
      params: {
        ...params,
        export: true,
        format: format
      },
      responseType: 'blob'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};
