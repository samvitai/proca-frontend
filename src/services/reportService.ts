// Report API service
import { api } from "@/lib/utils";

export interface ReportTask {
  id: string;
  client: string;
  name: string;
  description?: string;
  serviceCategory: string;
  assignmentStatus: 'assigned' | 'not_assigned';
  workflowStatus: 'open' | 'in_progress' | 'in_review' | 'closed';
  workflowStatusGroup: 'pending' | 'completed';
  assigneeId?: string;
  assigneeName?: string;
  clientId: string;
  serviceCategoryId: string;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
}

export interface InvoiceRegisterReport {
  invoice_number: string;
  invoice_date: string;
  client_name: string;
  task_name: string;
  invoice_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  status: string;
  due_date: string;
}

export interface AgingReport {
  client_id: string;
  client_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  invoice_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  days_overdue: number;
  age_bucket: string; // e.g., "0-30", "31-60", "61-90", "90+"
}

export interface RevenueByClientReport {
  client_id: string;
  client_name: string;
  total_invoices: number;
  total_revenue: number;
  paid_amount: number;
  outstanding_amount: number;
}

export interface ClientStatementReport {
  client_id: string;
  client_name: string;
  statement_period: {
    start_date: string;
    end_date: string;
  };
  opening_balance: number;
  invoices: Array<{
    invoice_number: string;
    invoice_date: string;
    amount: number;
    paid_amount: number;
    outstanding_amount: number;
  }>;
  payments: Array<{
    payment_date: string;
    amount: number;
    invoice_number: string;
  }>;
  closing_balance: number;
}

export interface TaskReportResponse {
  success: boolean;
  data: ReportTask[] | {
    tasks?: ReportTask[];
    [key: string]: any;
  };
  summary?: {
    total: number;
    assigned: number;
    completed: number;
    overdue: number;
  };
}

export interface InvoiceRegisterReportResponse {
  success: boolean;
  data: InvoiceRegisterReport[];
}

export interface AgingReportResponse {
  success: boolean;
  data: AgingReport[];
}

export interface RevenueByClientReportResponse {
  success: boolean;
  data: RevenueByClientReport[];
}

export interface ClientStatementReportResponse {
  success: boolean;
  data: ClientStatementReport;
}

// Query parameters for reports
export interface ReportFilters {
  assignmentStatus?: 'assigned' | 'not_assigned' | 'all';
  workflowStatus?: 'open' | 'in_progress' | 'in_review' | 'closed' | 'all';
  workflowStatusGroup?: 'pending' | 'completed' | 'all';
  assigneeId?: string;
  clientId?: string;
  serviceCategoryId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  search?: string;
}

// Fetch Task Report
export const fetchTaskReport = async (filters?: ReportFilters): Promise<TaskReportResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.assignmentStatus && filters.assignmentStatus !== 'all') {
        params.append('assignment_status', filters.assignmentStatus);
      }
      if (filters.workflowStatus && filters.workflowStatus !== 'all') {
        params.append('workflow_status', filters.workflowStatus);
      }
      if (filters.workflowStatusGroup && filters.workflowStatusGroup !== 'all') {
        params.append('workflow_status_group', filters.workflowStatusGroup);
      }
      if (filters.assigneeId) {
        params.append('assignee_id', filters.assigneeId);
      }
      if (filters.clientId) {
        params.append('client_id', filters.clientId);
      }
      if (filters.serviceCategoryId) {
        params.append('service_category_id', filters.serviceCategoryId);
      }
      if (filters.dueDateFrom) {
        params.append('due_date_from', filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        params.append('due_date_to', filters.dueDateTo);
      }
      if (filters.createdDateFrom) {
        params.append('created_date_from', filters.createdDateFrom);
      }
      if (filters.createdDateTo) {
        params.append('created_date_to', filters.createdDateTo);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
    }

    const url = `/api/reports/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<any>(url);
    
    if (!response.data || !response.data.success) {
      throw new Error('Failed to fetch task report');
    }
    
    // Normalize the response structure
    let normalizedData: ReportTask[] = [];
    if (Array.isArray(response.data.data)) {
      normalizedData = response.data.data;
    } else if (response.data.data && Array.isArray(response.data.data.tasks)) {
      normalizedData = response.data.data.tasks;
    } else if (Array.isArray(response.data.tasks)) {
      normalizedData = response.data.tasks;
    }
    
    return {
      success: response.data.success,
      data: normalizedData,
      summary: response.data.summary || response.data.data?.summary
    };
  } catch (error) {
    console.error('Error fetching task report:', error);
    throw error;
  }
};

// Fetch Invoice Register Report
export const fetchInvoiceRegisterReport = async (filters?: {
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}): Promise<InvoiceRegisterReportResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.clientId) {
        params.append('client_id', filters.clientId);
      }
      if (filters.dateFrom) {
        params.append('date_from', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('date_to', filters.dateTo);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
    }

    const url = `/api/reports/invoice-register${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<any>(url);
    
    if (!response.data || !response.data.success) {
      throw new Error('Failed to fetch invoice register report');
    }
    
    // Normalize the response structure
    let normalizedData: InvoiceRegisterReport[] = [];
    if (Array.isArray(response.data.data)) {
      normalizedData = response.data.data;
    } else if (response.data.data && Array.isArray(response.data.data.invoices)) {
      normalizedData = response.data.data.invoices;
    } else if (Array.isArray(response.data.invoices)) {
      normalizedData = response.data.invoices;
    }
    
    return {
      success: response.data.success,
      data: normalizedData
    };
  } catch (error) {
    console.error('Error fetching invoice register report:', error);
    throw error;
  }
};

// Fetch Aging Report (Receivables)
export const fetchAgingReport = async (filters?: {
  clientId?: string;
  asOfDate?: string;
}): Promise<AgingReportResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.clientId) {
        params.append('client_id', filters.clientId);
      }
      if (filters.asOfDate) {
        params.append('as_of_date', filters.asOfDate);
      }
    }

    const url = `/api/reports/aging${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<any>(url);
    
    if (!response.data || !response.data.success) {
      throw new Error('Failed to fetch aging report');
    }
    
    // Normalize the response structure
    let normalizedData: AgingReport[] = [];
    if (Array.isArray(response.data.data)) {
      normalizedData = response.data.data;
    } else if (response.data.data && Array.isArray(response.data.data.aging)) {
      normalizedData = response.data.data.aging;
    } else if (Array.isArray(response.data.aging)) {
      normalizedData = response.data.aging;
    }
    
    return {
      success: response.data.success,
      data: normalizedData
    };
  } catch (error) {
    console.error('Error fetching aging report:', error);
    throw error;
  }
};

// Fetch Revenue by Client Report
export const fetchRevenueByClientReport = async (filters?: {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
}): Promise<RevenueByClientReportResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.dateFrom) {
        params.append('date_from', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('date_to', filters.dateTo);
      }
      if (filters.clientId) {
        params.append('client_id', filters.clientId);
      }
    }

    const url = `/api/reports/revenue-by-client${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<any>(url);
    
    if (!response.data || !response.data.success) {
      throw new Error('Failed to fetch revenue by client report');
    }
    
    // Normalize the response structure
    let normalizedData: RevenueByClientReport[] = [];
    if (Array.isArray(response.data.data)) {
      normalizedData = response.data.data;
    } else if (response.data.data && Array.isArray(response.data.data.revenue)) {
      normalizedData = response.data.data.revenue;
    } else if (Array.isArray(response.data.revenue)) {
      normalizedData = response.data.revenue;
    }
    
    return {
      success: response.data.success,
      data: normalizedData
    };
  } catch (error) {
    console.error('Error fetching revenue by client report:', error);
    throw error;
  }
};

// Fetch Client Statement Report
export const fetchClientStatementReport = async (
  clientId: string,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ClientStatementReportResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.dateFrom) {
        params.append('date_from', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('date_to', filters.dateTo);
      }
    }

    const url = `/api/reports/client-statement/${clientId}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await api.get<ClientStatementReportResponse>(url);
    
    if (!response.data.success) {
      throw new Error('Failed to fetch client statement report');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching client statement report:', error);
    throw error;
  }
};

// Export report as file
export const exportReport = async (
  reportType: 'tasks' | 'invoice-register' | 'aging' | 'revenue-by-client' | 'client-statement',
  format: 'xlsx' | 'csv',
  filters?: any,
  clientId?: string
): Promise<Blob> => {
  try {
    let url = `/api/reports/${reportType}`;
    
    if (reportType === 'client-statement' && clientId) {
      url = `/api/reports/client-statement/${clientId}`;
    }
    
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, String(value));
        }
      });
    }

    const response = await api.get(`${url}?${params.toString()}`, {
      responseType: 'blob',
    });
    
    return response.data;
  } catch (error) {
    console.error('Error exporting report:', error);
    throw error;
  }
};

