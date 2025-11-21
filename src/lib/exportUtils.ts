// Export utility functions for reports
import { TaskReport, InvoiceReportItem, CreditNoteReportItem, DebitNoteReportItem } from "@/services/reportService";

// Escape CSV fields that contain commas, quotes, or newlines
const escapeCSV = (field: string | number | null | undefined): string => {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Format date for CSV
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  } catch {
    return dateString;
  }
};

// Export tasks to CSV
export const exportTasksToCSV = (tasks: TaskReport[], filename: string = 'task-report'): void => {
  // CSV Headers
  const headers = [
    'Project Name',
    'Client',
    'Service Category',
    'Assignment Status',
    'Workflow Status',
    'Status Group',
    'Assignee',
    'Due Date',
    'Created Date',
    'Last Updated Date',
    'Comments'
  ];

  // Convert tasks to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...tasks.map(task => [
      escapeCSV(task.project_name),
      escapeCSV(task.client),
      escapeCSV(task.service_category),
      escapeCSV(task.assignment_status.replace('_', ' ')),
      escapeCSV(task.workflow_status.replace('_', ' ')),
      escapeCSV(task.status_group),
      escapeCSV(task.assignee_name || 'Unassigned'),
      escapeCSV(formatDate(task.due_date)),
      escapeCSV(formatDate(task.created_date)),
      escapeCSV(formatDate(task.updated_at)),
      escapeCSV(task.comments || '')
    ].join(','))
  ];

  // Create CSV content with BOM for Excel compatibility
  const csvContent = '\uFEFF' + csvRows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Export tasks to XLSX (using CSV format - Excel will open it correctly with proper column separation)
export const exportTasksToXLSX = (tasks: TaskReport[], filename: string = 'task-report'): void => {
  // CSV Headers
  const headers = [
    'Project Name',
    'Client',
    'Service Category',
    'Assignment Status',
    'Workflow Status',
    'Status Group',
    'Assignee',
    'Due Date',
    'Created Date',
    'Last Updated Date',
    'Comments'
  ];

  // Convert tasks to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...tasks.map(task => [
      escapeCSV(task.project_name),
      escapeCSV(task.client),
      escapeCSV(task.service_category),
      escapeCSV(task.assignment_status.replace('_', ' ')),
      escapeCSV(task.workflow_status.replace('_', ' ')),
      escapeCSV(task.status_group),
      escapeCSV(task.assignee_name || 'Unassigned'),
      escapeCSV(formatDate(task.due_date)),
      escapeCSV(formatDate(task.created_date)),
      escapeCSV(formatDate(task.updated_at)),
      escapeCSV(task.comments || '')
    ].join(','))
  ];

  // Create CSV content with BOM for Excel compatibility
  const csvContent = '\uFEFF' + csvRows.join('\n');

  // Create blob with Excel MIME type for better compatibility
  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Generic export function
export const exportTasks = (
  tasks: TaskReport[],
  format: 'csv' | 'xlsx',
  filename: string = 'task-report'
): void => {
  if (format === 'csv') {
    exportTasksToCSV(tasks, filename);
  } else {
    exportTasksToXLSX(tasks, filename);
  }
};

// Export invoices to CSV
export const exportInvoicesToCSV = (invoices: InvoiceReportItem[], filename: string = 'invoice-report'): void => {
  // CSV Headers
  const headers = [
    'Invoice Number',
    'Invoice Date',
    'Client Name',
    'Task Name',
    'Service Category',
    'Amount Before Tax',
    'Total GST',
    'Invoice Amount',
    'Paid Amount',
    'Status',
    'Due Date'
  ];

  // Convert invoices to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...invoices.map(invoice => [
      escapeCSV(invoice.invoice_number),
      escapeCSV(formatDate(invoice.invoice_date)),
      escapeCSV(invoice.client_name),
      escapeCSV(invoice.task_name),
      escapeCSV(invoice.service_category),
      escapeCSV(invoice.amount_before_tax),
      escapeCSV(invoice.total_gst),
      escapeCSV(invoice.invoice_amount),
      escapeCSV(invoice.paid_amount),
      escapeCSV(invoice.status),
      escapeCSV(formatDate(invoice.due_date))
    ].join(','))
  ];

  // Create CSV content with BOM for Excel compatibility
  const csvContent = '\uFEFF' + csvRows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Export invoices to XLSX
export const exportInvoicesToXLSX = (invoices: InvoiceReportItem[], filename: string = 'invoice-report'): void => {
  // CSV Headers
  const headers = [
    'Invoice Number',
    'Invoice Date',
    'Client Name',
    'Task Name',
    'Service Category',
    'Amount Before Tax',
    'Total GST',
    'Invoice Amount',
    'Paid Amount',
    'Status',
    'Due Date'
  ];

  // Convert invoices to CSV rows
  const csvRows = [
    headers.join(','), // Header row
    ...invoices.map(invoice => [
      escapeCSV(invoice.invoice_number),
      escapeCSV(formatDate(invoice.invoice_date)),
      escapeCSV(invoice.client_name),
      escapeCSV(invoice.task_name),
      escapeCSV(invoice.service_category),
      escapeCSV(invoice.amount_before_tax),
      escapeCSV(invoice.total_gst),
      escapeCSV(invoice.invoice_amount),
      escapeCSV(invoice.paid_amount),
      escapeCSV(invoice.status),
      escapeCSV(formatDate(invoice.due_date))
    ].join(','))
  ];

  // Create CSV content with BOM for Excel compatibility
  const csvContent = '\uFEFF' + csvRows.join('\n');

  // Create blob with Excel MIME type for better compatibility
  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Generic export function for invoices
export const exportInvoices = (
  invoices: InvoiceReportItem[],
  format: 'csv' | 'xlsx',
  filename: string = 'invoice-report'
): void => {
  if (format === 'csv') {
    exportInvoicesToCSV(invoices, filename);
  } else {
    exportInvoicesToXLSX(invoices, filename);
  }
};

// Export credit notes to CSV
export const exportCreditNotesToCSV = (creditNotes: CreditNoteReportItem[], filename: string = 'credit-note-report'): void => {
  const headers = [
    'Credit Note Number',
    'Credit Note Date',
    'Invoice Number',
    'Client Name',
    'Amount Before Tax',
    'Total GST',
    'Credit Note Amount',
    'Status'
  ];

  const csvRows = [
    headers.join(','),
    ...creditNotes.map(note => [
      escapeCSV(note.credit_note_number),
      escapeCSV(formatDate(note.credit_note_date)),
      escapeCSV(note.invoice_number),
      escapeCSV(note.client_name),
      escapeCSV(note.amount_before_tax),
      escapeCSV(note.total_gst),
      escapeCSV(note.credit_note_amount),
      escapeCSV(note.status)
    ].join(','))
  ];

  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Export credit notes to XLSX
export const exportCreditNotesToXLSX = (creditNotes: CreditNoteReportItem[], filename: string = 'credit-note-report'): void => {
  const headers = [
    'Credit Note Number',
    'Credit Note Date',
    'Invoice Number',
    'Client Name',
    'Amount Before Tax',
    'Total GST',
    'Credit Note Amount',
    'Status'
  ];

  const csvRows = [
    headers.join(','),
    ...creditNotes.map(note => [
      escapeCSV(note.credit_note_number),
      escapeCSV(formatDate(note.credit_note_date)),
      escapeCSV(note.invoice_number),
      escapeCSV(note.client_name),
      escapeCSV(note.amount_before_tax),
      escapeCSV(note.total_gst),
      escapeCSV(note.credit_note_amount),
      escapeCSV(note.status)
    ].join(','))
  ];

  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Generic export function for credit notes
export const exportCreditNotes = (
  creditNotes: CreditNoteReportItem[],
  format: 'csv' | 'xlsx',
  filename: string = 'credit-note-report'
): void => {
  if (format === 'csv') {
    exportCreditNotesToCSV(creditNotes, filename);
  } else {
    exportCreditNotesToXLSX(creditNotes, filename);
  }
};

// Export debit notes to CSV
export const exportDebitNotesToCSV = (debitNotes: DebitNoteReportItem[], filename: string = 'debit-note-report'): void => {
  const headers = [
    'Debit Note Number',
    'Client Name',
    'Description',
    'Amount',
    'Paid Amount',
    'Outstanding Amount',
    'Due Date',
    'Status',
    'Created Date'
  ];

  const csvRows = [
    headers.join(','),
    ...debitNotes.map(note => [
      escapeCSV(note.debit_note_number),
      escapeCSV(note.client_name),
      escapeCSV(note.description),
      escapeCSV(note.amount),
      escapeCSV(note.paid_amount),
      escapeCSV(note.outstanding_amount),
      escapeCSV(formatDate(note.due_date)),
      escapeCSV(note.status),
      escapeCSV(formatDate(note.created_at))
    ].join(','))
  ];

  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Export debit notes to XLSX
export const exportDebitNotesToXLSX = (debitNotes: DebitNoteReportItem[], filename: string = 'debit-note-report'): void => {
  const headers = [
    'Debit Note Number',
    'Client Name',
    'Description',
    'Amount',
    'Paid Amount',
    'Outstanding Amount',
    'Due Date',
    'Status',
    'Created Date'
  ];

  const csvRows = [
    headers.join(','),
    ...debitNotes.map(note => [
      escapeCSV(note.debit_note_number),
      escapeCSV(note.client_name),
      escapeCSV(note.description),
      escapeCSV(note.amount),
      escapeCSV(note.paid_amount),
      escapeCSV(note.outstanding_amount),
      escapeCSV(formatDate(note.due_date)),
      escapeCSV(note.status),
      escapeCSV(formatDate(note.created_at))
    ].join(','))
  ];

  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Generic export function for debit notes
export const exportDebitNotes = (
  debitNotes: DebitNoteReportItem[],
  format: 'csv' | 'xlsx',
  filename: string = 'debit-note-report'
): void => {
  if (format === 'csv') {
    exportDebitNotesToCSV(debitNotes, filename);
  } else {
    exportDebitNotesToXLSX(debitNotes, filename);
  }
};
