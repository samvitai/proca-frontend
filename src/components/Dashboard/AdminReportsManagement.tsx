import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, BarChart3, Loader2, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchTaskReport, TaskReport, fetchInvoiceReport, InvoiceReportItem, fetchCreditNoteReport, CreditNoteReportItem, fetchDebitNoteReport, DebitNoteReportItem } from "@/services/reportService";
import { api } from "@/lib/utils";
import { exportTasks, exportInvoices, exportCreditNotes, exportDebitNotes } from "@/lib/exportUtils";

interface Client {
  id: string;
  name: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface Assignee {
  id: string;
  name: string;
}

const AdminReportsManagement = () => {
  const [activeTab, setActiveTab] = useState<"projects" | "invoices" | "credit-notes" | "debit-notes">("projects");
  
  // Project Reports State
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>("all");
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState<string>("all");
  const [workflowStatusGroupFilter, setWorkflowStatusGroupFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>("all");
  const [dueDateFrom, setDueDateFrom] = useState<string>("");
  const [dueDateTo, setDueDateTo] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [tasks, setTasks] = useState<TaskReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    completed: 0,
    overdue: 0
  });

  // Invoice Reports State
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState("");
  const [invoiceClientFilter, setInvoiceClientFilter] = useState<string>("all");
  const [invoiceServiceCategoryFilter, setInvoiceServiceCategoryFilter] = useState<string>("all");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("all");
  const [invoiceDateFrom, setInvoiceDateFrom] = useState<string>("");
  const [invoiceDateTo, setInvoiceDateTo] = useState<string>("");
  const [invoiceExportFormat, setInvoiceExportFormat] = useState<string>("csv");
  const [invoices, setInvoices] = useState<InvoiceReportItem[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [invoiceExporting, setInvoiceExporting] = useState(false);
  const [invoiceStats, setInvoiceStats] = useState({
    total_invoices: 0,
    total_amount: 0,
    paid_amount: 0,
    outstanding_amount: 0
  });

  // Credit Notes Reports State
  const [creditNoteSearchTerm, setCreditNoteSearchTerm] = useState("");
  const [creditNoteClientFilter, setCreditNoteClientFilter] = useState<string>("all");
  const [creditNoteStatusFilter, setCreditNoteStatusFilter] = useState<string>("all");
  const [creditNoteDateFrom, setCreditNoteDateFrom] = useState<string>("");
  const [creditNoteDateTo, setCreditNoteDateTo] = useState<string>("");
  const [creditNoteExportFormat, setCreditNoteExportFormat] = useState<string>("csv");
  const [creditNotes, setCreditNotes] = useState<CreditNoteReportItem[]>([]);
  const [creditNoteLoading, setCreditNoteLoading] = useState(true);
  const [creditNoteExporting, setCreditNoteExporting] = useState(false);
  const [creditNoteStats, setCreditNoteStats] = useState({
    total_credit_notes: 0,
    total_amount: 0
  });

  // Debit Notes Reports State
  const [debitNoteSearchTerm, setDebitNoteSearchTerm] = useState("");
  const [debitNoteClientFilter, setDebitNoteClientFilter] = useState<string>("all");
  const [debitNoteStatusFilter, setDebitNoteStatusFilter] = useState<string>("all");
  const [debitNoteDateFrom, setDebitNoteDateFrom] = useState<string>("");
  const [debitNoteDateTo, setDebitNoteDateTo] = useState<string>("");
  const [debitNoteExportFormat, setDebitNoteExportFormat] = useState<string>("csv");
  const [debitNotes, setDebitNotes] = useState<DebitNoteReportItem[]>([]);
  const [debitNoteLoading, setDebitNoteLoading] = useState(true);
  const [debitNoteExporting, setDebitNoteExporting] = useState(false);
  const [debitNoteStats, setDebitNoteStats] = useState({
    total_debit_notes: 0,
    total_amount: 0,
    paid_amount: 0,
    outstanding_amount: 0
  });

  // Filter options
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch clients
        const clientsResponse = await api.get('/api/clients/?is_active=true');
        const clientsData = clientsResponse.data?.data?.clients || clientsResponse.data?.data || [];
        if (Array.isArray(clientsData) && clientsData.length > 0) {
          setClients(clientsData.map((c: any) => ({
            id: String(c.client_id || c.id || ''),
            name: c.client_name || c.company_name || c.name || 'Unknown Client'
          })));
        }

        // Fetch service categories
        const categoriesResponse = await api.get('/api/master/service-categories?is_active=true');
        const categoriesData = categoriesResponse.data?.data?.service_categories 
          || categoriesResponse.data?.data 
          || (Array.isArray(categoriesResponse.data?.data) ? categoriesResponse.data.data : []);
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          setServiceCategories(categoriesData.map((c: any) => ({
            id: String(c.service_category_id || c.category_id || c.id || ''),
            name: c.name || c.category_name || 'Unknown Category'
          })));
        }

        // Fetch assignees (employees and supervisors)
        const usersResponse = await api.get('/api/v1/users/organization/users?role=USERS');
        const usersData = usersResponse.data || {};
        const allUsers = [
          ...(usersData.employee || []),
          ...(usersData.supervisor || []),
          ...(usersData.admin || [])
        ].filter((user: any) => user.is_active !== false);
        
        if (allUsers.length > 0) {
          setAssignees(allUsers.map((u: any) => ({
            id: String(u.user_id || u.id || ''),
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Unknown User'
          })));
        }
      } catch (error: any) {
        console.error('Error fetching filter options:', error);
        toast({
          title: "Warning",
          description: "Some filter options may not be available. " + (error.response?.data?.message || error.message || ""),
          variant: "default",
        });
      }
    };

    fetchFilterOptions();
  }, []);

  // Helper function to extract numeric ID from string IDs like "client_220"
  const extractNumericId = (id: string): number | string => {
    if (!id || id === "all") return id;
    
    // If it's already a number, return as is
    if (/^\d+$/.test(id)) {
      return parseInt(id, 10);
    }
    
    // If it contains "client_", extract the numeric part
    if (id.startsWith('client_')) {
      const numericPart = id.replace('client_', '');
      const parsed = parseInt(numericPart, 10);
      return isNaN(parsed) ? id : parsed;
    }
    
    // If it contains other prefixes, try to extract numeric part
    const match = id.match(/(\d+)$/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      return isNaN(parsed) ? id : parsed;
    }
    
    // Fallback: return as is
    return id;
  };

  // Fetch tasks report
  useEffect(() => {
    const loadTaskReport = async () => {
      setLoading(true);
      try {
        const params: any = {};
        
        if (assignmentStatusFilter !== "all") {
          params.assignment_status = assignmentStatusFilter;
        }
        if (workflowStatusFilter !== "all") {
          params.workflow_status = workflowStatusFilter;
        }
        if (workflowStatusGroupFilter !== "all") {
          params.status_group = workflowStatusGroupFilter;
        }
        if (assigneeFilter !== "all") {
          params.assignee_id = extractNumericId(assigneeFilter);
        }
        if (clientFilter !== "all") {
          params.client_id = extractNumericId(clientFilter);
        }
        if (serviceCategoryFilter !== "all") {
          params.service_category_id = extractNumericId(serviceCategoryFilter);
        }
        
        // Validate and add date filters
        // Trim and validate date strings to ensure they're not empty
        const trimmedFromDate = (dueDateFrom || '').trim();
        const trimmedToDate = (dueDateTo || '').trim();
        
        // Date format regex - only validate complete dates
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        
        // Check if dates are complete and valid before validating
        const isFromDateComplete = trimmedFromDate && dateRegex.test(trimmedFromDate);
        const isToDateComplete = trimmedToDate && dateRegex.test(trimmedToDate);
        
        if (isFromDateComplete && isToDateComplete) {
          // Both dates are complete - validate range
          // Compare date strings directly (YYYY-MM-DD format from input type="date")
          // This avoids timezone issues
          if (trimmedToDate < trimmedFromDate) {
            toast({
              title: "Invalid Date Range",
              description: "The 'To' date must be after or equal to the 'From' date. Please adjust your date range.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          // Both dates are valid and complete - send them
          params.due_date_from = trimmedFromDate;
          params.due_date_to = trimmedToDate;
        } else if (isFromDateComplete) {
          // Only from date is complete and valid
          params.due_date_from = trimmedFromDate;
          // Don't validate or send incomplete to date
        } else if (isToDateComplete) {
          // Only to date is complete and valid
          params.due_date_to = trimmedToDate;
          // Don't validate or send incomplete from date
        }
        // If dates are incomplete (user still typing), don't validate or send them
        // This prevents errors while user is entering dates
        
        if (searchTerm) {
          params.search = searchTerm;
        }

        const result = await fetchTaskReport(params);
        setTasks(result.tasks);
        
        // Calculate stats from tasks if summary is not available or incomplete
        const calculatedStats = {
          total: result.tasks.length,
          assigned: result.tasks.filter(t => t.assignment_status === 'assigned').length,
          completed: result.tasks.filter(t => t.status_group === 'completed').length,
          overdue: result.tasks.filter(t => {
            if (t.status_group !== 'pending' || !t.due_date) return false;
            const dueDate = new Date(t.due_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < today;
          }).length
        };
        
        // Use API summary if available, otherwise use calculated stats
        setStats({
          total: result.summary?.total_projects ?? calculatedStats.total,
          assigned: result.summary?.assigned ?? calculatedStats.assigned,
          completed: result.summary?.completed ?? calculatedStats.completed,
          overdue: result.summary?.overdue ?? calculatedStats.overdue
        });
      } catch (error: any) {
        console.error('Error loading task report:', error);
        
        // Extract error message
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           "Failed to load task report";
        
        // Check if it's a date validation error
        const errorMessageLower = errorMessage.toLowerCase();
        const isDateValidationError = 
          errorMessageLower.includes('due_date') ||
          errorMessageLower.includes('date') && (
            errorMessageLower.includes('invalid') ||
            errorMessageLower.includes('format') ||
            errorMessageLower.includes('after') ||
            errorMessageLower.includes('before') ||
            errorMessageLower.includes('range')
          );
        
        toast({
          title: isDateValidationError ? "Date Filter Error" : "Error",
          description: isDateValidationError 
            ? `Date filter error: ${errorMessage}. Please check your date range and try again.`
            : errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTaskReport();
  }, [
    assignmentStatusFilter,
    workflowStatusFilter,
    workflowStatusGroupFilter,
    assigneeFilter,
    clientFilter,
    serviceCategoryFilter,
    dueDateFrom,
    dueDateTo,
    searchTerm
  ]);

  // Fetch invoice reports
  useEffect(() => {
    const loadInvoiceReport = async () => {
      setInvoiceLoading(true);
      try {
        const params: any = {};
        
        if (invoiceClientFilter !== "all") {
          params.client_id = extractNumericId(invoiceClientFilter);
        }
        if (invoiceServiceCategoryFilter !== "all") {
          params.service_category_id = extractNumericId(invoiceServiceCategoryFilter);
        }
        if (invoiceStatusFilter !== "all") {
          params.status = invoiceStatusFilter;
        }
        
        // Validate and add date filters
        const trimmedFromDate = (invoiceDateFrom || '').trim();
        const trimmedToDate = (invoiceDateTo || '').trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        
        const isFromDateComplete = trimmedFromDate && dateRegex.test(trimmedFromDate);
        const isToDateComplete = trimmedToDate && dateRegex.test(trimmedToDate);
        
        if (isFromDateComplete && isToDateComplete) {
          if (trimmedToDate < trimmedFromDate) {
            toast({
              title: "Invalid Date Range",
              description: "The 'To' date must be after or equal to the 'From' date. Please adjust your date range.",
              variant: "destructive",
            });
            setInvoiceLoading(false);
            return;
          }
          params.date_from = trimmedFromDate;
          params.date_to = trimmedToDate;
        } else if (isFromDateComplete) {
          params.date_from = trimmedFromDate;
        } else if (isToDateComplete) {
          params.date_to = trimmedToDate;
        }
        
        if (invoiceSearchTerm) {
          params.search = invoiceSearchTerm;
        }

        const result = await fetchInvoiceReport(params);
        setInvoices(result.invoices);
        setInvoiceStats(result.summary);
      } catch (error: any) {
        console.error('Error loading invoice report:', error);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           "Failed to load invoice report";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setInvoiceLoading(false);
      }
    };

    if (activeTab === "invoices") {
      loadInvoiceReport();
    }
  }, [
    activeTab,
    invoiceClientFilter,
    invoiceServiceCategoryFilter,
    invoiceStatusFilter,
    invoiceDateFrom,
    invoiceDateTo,
    invoiceSearchTerm
  ]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Fetch credit note reports
  useEffect(() => {
    const loadCreditNoteReport = async () => {
      setCreditNoteLoading(true);
      try {
        const params: any = {};
        
        if (creditNoteClientFilter !== "all") {
          params.client_id = extractNumericId(creditNoteClientFilter);
        }
        if (creditNoteStatusFilter !== "all") {
          params.status = creditNoteStatusFilter;
        }
        
        const trimmedFromDate = (creditNoteDateFrom || '').trim();
        const trimmedToDate = (creditNoteDateTo || '').trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        
        const isFromDateComplete = trimmedFromDate && dateRegex.test(trimmedFromDate);
        const isToDateComplete = trimmedToDate && dateRegex.test(trimmedToDate);
        
        if (isFromDateComplete && isToDateComplete) {
          if (trimmedToDate < trimmedFromDate) {
            toast({
              title: "Invalid Date Range",
              description: "The 'To' date must be after or equal to the 'From' date.",
              variant: "destructive",
            });
            setCreditNoteLoading(false);
            return;
          }
          params.date_from = trimmedFromDate;
          params.date_to = trimmedToDate;
        } else if (isFromDateComplete) {
          params.date_from = trimmedFromDate;
        } else if (isToDateComplete) {
          params.date_to = trimmedToDate;
        }
        
        if (creditNoteSearchTerm) {
          params.search = creditNoteSearchTerm;
        }

        const result = await fetchCreditNoteReport(params);
        setCreditNotes(result.credit_notes);
        setCreditNoteStats(result.summary);
      } catch (error: any) {
        console.error('Error loading credit note report:', error);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           "Failed to load credit note report";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setCreditNoteLoading(false);
      }
    };

    if (activeTab === "credit-notes") {
      loadCreditNoteReport();
    }
  }, [
    activeTab,
    creditNoteClientFilter,
    creditNoteStatusFilter,
    creditNoteDateFrom,
    creditNoteDateTo,
    creditNoteSearchTerm
  ]);

  // Fetch debit note reports
  useEffect(() => {
    const loadDebitNoteReport = async () => {
      setDebitNoteLoading(true);
      try {
        const params: any = {};
        
        if (debitNoteClientFilter !== "all") {
          params.client_id = extractNumericId(debitNoteClientFilter);
        }
        if (debitNoteStatusFilter !== "all") {
          params.status = debitNoteStatusFilter;
        }
        
        const trimmedFromDate = (debitNoteDateFrom || '').trim();
        const trimmedToDate = (debitNoteDateTo || '').trim();
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        
        const isFromDateComplete = trimmedFromDate && dateRegex.test(trimmedFromDate);
        const isToDateComplete = trimmedToDate && dateRegex.test(trimmedToDate);
        
        if (isFromDateComplete && isToDateComplete) {
          if (trimmedToDate < trimmedFromDate) {
            toast({
              title: "Invalid Date Range",
              description: "The 'To' date must be after or equal to the 'From' date.",
              variant: "destructive",
            });
            setDebitNoteLoading(false);
            return;
          }
          params.date_from = trimmedFromDate;
          params.date_to = trimmedToDate;
        } else if (isFromDateComplete) {
          params.date_from = trimmedFromDate;
        } else if (isToDateComplete) {
          params.date_to = trimmedToDate;
        }
        
        if (debitNoteSearchTerm) {
          params.search = debitNoteSearchTerm;
        }

        const result = await fetchDebitNoteReport(params);
        setDebitNotes(result.debit_notes);
        setDebitNoteStats(result.summary);
      } catch (error: any) {
        console.error('Error loading debit note report:', error);
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           "Failed to load debit note report";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setDebitNoteLoading(false);
      }
    };

    if (activeTab === "debit-notes") {
      loadDebitNoteReport();
    }
  }, [
    activeTab,
    debitNoteClientFilter,
    debitNoteStatusFilter,
    debitNoteDateFrom,
    debitNoteDateTo,
    debitNoteSearchTerm
  ]);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !invoiceSearchTerm || 
      invoice.invoice_number.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
      invoice.client_name.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
      invoice.task_name.toLowerCase().includes(invoiceSearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const filteredCreditNotes = creditNotes.filter(note => {
    const matchesSearch = !creditNoteSearchTerm || 
      note.credit_note_number.toLowerCase().includes(creditNoteSearchTerm.toLowerCase()) ||
      note.invoice_number.toLowerCase().includes(creditNoteSearchTerm.toLowerCase()) ||
      note.client_name.toLowerCase().includes(creditNoteSearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const filteredDebitNotes = debitNotes.filter(note => {
    const matchesSearch = !debitNoteSearchTerm || 
      note.debit_note_number.toLowerCase().includes(debitNoteSearchTerm.toLowerCase()) ||
      note.client_name.toLowerCase().includes(debitNoteSearchTerm.toLowerCase()) ||
      note.description.toLowerCase().includes(debitNoteSearchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      // Export only the filtered tasks that are currently displayed in the table
      // filteredTasks already includes all applied filters (from API) + search term filter
      if (filteredTasks.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no tasks to export with the current filters.",
          variant: "default",
        });
        setExporting(false);
        return;
      }

      // Fetch comments and updated_at for tasks that don't already have them
      const tasksWithComments = await Promise.all(
        filteredTasks.map(async (task) => {
          // If task already has both comments and updated_at, use them
          if (task.comments && task.updated_at) {
            return task;
          }

          // Otherwise, fetch task details from the API
          try {
            const response = await api.get(`/api/tasks/${task.id}`);
            if (response.data?.success && response.data?.data) {
              const taskData = response.data.data;
              const updatedTask: TaskReport = { ...task };

              // Fetch updated_at if not already present
              if (!task.updated_at && (taskData.updated_at || taskData.updated_date)) {
                updatedTask.updated_at = taskData.updated_at || taskData.updated_date;
              }

              // Fetch comments if not already present
              if (!task.comments && taskData.comments && Array.isArray(taskData.comments)) {
                const comments = taskData.comments;
                const commentsText = comments
                  .map((comment: any) => {
                    const text = comment.comment_text || comment.content || '';
                    const author = comment.user_name || comment.author || 'Unknown';
                    const date = comment.created_at || comment.timestamp || '';
                    return `[${author}${date ? ' - ' + new Date(date).toLocaleDateString() : ''}]: ${text}`;
                  })
                  .join(' | ');
                
                updatedTask.comments = commentsText || undefined;
              }
              
              return updatedTask;
            }
          } catch (error) {
            console.error(`Error fetching details for task ${task.id}:`, error);
            // Continue with task without comments/updated_at if fetch fails
          }
          
          return task;
        })
      );

      exportTasks(tasksWithComments, exportFormat as 'csv' | 'xlsx', 'task-report');

      toast({
        title: "Export Successful",
        description: `Exported ${filteredTasks.length} tasks as ${exportFormat.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error('Error exporting report:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export report",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleInvoiceExport = async () => {
    setInvoiceExporting(true);
    try {
      // Export only the filtered invoices that are currently displayed in the table
      // filteredInvoices already includes all applied filters (from API) + search term filter
      if (filteredInvoices.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no invoices to export with the current filters.",
          variant: "default",
        });
        setInvoiceExporting(false);
        return;
      }

      exportInvoices(filteredInvoices, invoiceExportFormat as 'csv' | 'xlsx', 'invoice-report');

      toast({
        title: "Export Successful",
        description: `Exported ${filteredInvoices.length} invoices as ${invoiceExportFormat.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error('Error exporting invoice report:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export invoice report",
        variant: "destructive",
      });
    } finally {
      setInvoiceExporting(false);
    }
  };

  const handleCreditNoteExport = async () => {
    setCreditNoteExporting(true);
    try {
      // Export only the filtered credit notes that are currently displayed in the table
      // filteredCreditNotes already includes all applied filters (from API) + search term filter
      if (filteredCreditNotes.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no credit notes to export with the current filters.",
          variant: "default",
        });
        setCreditNoteExporting(false);
        return;
      }

      exportCreditNotes(filteredCreditNotes, creditNoteExportFormat as 'csv' | 'xlsx', 'credit-note-report');

      toast({
        title: "Export Successful",
        description: `Exported ${filteredCreditNotes.length} credit notes as ${creditNoteExportFormat.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error('Error exporting credit note report:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export credit note report",
        variant: "destructive",
      });
    } finally {
      setCreditNoteExporting(false);
    }
  };

  const handleDebitNoteExport = async () => {
    setDebitNoteExporting(true);
    try {
      // Export only the filtered debit notes that are currently displayed in the table
      // filteredDebitNotes already includes all applied filters (from API) + search term filter
      if (filteredDebitNotes.length === 0) {
        toast({
          title: "No Data to Export",
          description: "There are no debit notes to export with the current filters.",
          variant: "default",
        });
        setDebitNoteExporting(false);
        return;
      }

      exportDebitNotes(filteredDebitNotes, debitNoteExportFormat as 'csv' | 'xlsx', 'debit-note-report');

      toast({
        title: "Export Successful",
        description: `Exported ${filteredDebitNotes.length} debit notes as ${debitNoteExportFormat.toUpperCase()}`,
      });
    } catch (error: any) {
      console.error('Error exporting debit note report:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export debit note report",
        variant: "destructive",
      });
    } finally {
      setDebitNoteExporting(false);
    }
  };

  const getWorkflowStatusBadge = (status: TaskReport['workflow_status']) => {
    const colors: Record<string, string> = {
      'open': 'bg-gray-500',
      'in_progress': 'bg-blue-500',
      'in_review': 'bg-yellow-500',
      'closed': 'bg-green-500'
    };

    return (
      <Badge className={colors[status] || 'bg-gray-500'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getAssignmentStatusBadge = (status: TaskReport['assignment_status']) => {
    return (
      <Badge variant={status === 'assigned' ? 'default' : 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getWorkflowStatusGroupBadge = (group: TaskReport['status_group']) => {
    return (
      <Badge 
        variant={group === 'completed' ? 'default' : 'secondary'} 
        className={group === 'completed' ? 'bg-green-500' : 'bg-orange-500'}
      >
        {group}
      </Badge>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    const colors: Record<string, string> = {
      'paid': 'bg-green-500',
      'unpaid': 'bg-red-500',
      'partial': 'bg-yellow-500',
      'overdue': 'bg-orange-500'
    };

    return (
      <Badge className={colors[statusLower] || 'bg-gray-500'}>
        {status}
      </Badge>
    );
  };

  const getCreditNoteStatusBadge = (status: string | undefined) => {
    if (!status) {
      return (
        <Badge className="bg-gray-500">
          N/A
        </Badge>
      );
    }
    const statusLower = status.toLowerCase();
    const colors: Record<string, string> = {
      'active': 'bg-green-500',
      'cancelled': 'bg-red-500',
      'pending': 'bg-yellow-500'
    };

    return (
      <Badge className={colors[statusLower] || 'bg-gray-500'}>
        {status}
      </Badge>
    );
  };

  const getDebitNoteStatusBadge = (status: string | undefined) => {
    if (!status) {
      return (
        <Badge className="bg-gray-500">
          N/A
        </Badge>
      );
    }
    const statusLower = status.toLowerCase();
    const colors: Record<string, string> = {
      'paid': 'bg-green-500',
      'unpaid': 'bg-red-500',
      'partial': 'bg-yellow-500',
      'overdue': 'bg-orange-500'
    };

    return (
      <Badge className={colors[statusLower] || 'bg-gray-500'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "projects" | "invoices" | "credit-notes" | "debit-notes")}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">Project Reports</TabsTrigger>
          <TabsTrigger value="invoices">Invoice Reports</TabsTrigger>
          <TabsTrigger value="credit-notes">Credit Notes</TabsTrigger>
          <TabsTrigger value="debit-notes">Debit Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-ca-accent/10 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-ca-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Projects</p>
                    <p className="text-2xl font-bold text-ca-primary">{stats.total ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned</p>
                    <p className="text-2xl font-bold text-ca-primary">{stats.assigned ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-ca-primary">{stats.completed ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold text-ca-primary">{stats.overdue ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Project Reports</CardTitle>
                <div className="flex gap-2">
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleExport} disabled={exporting}>
                    {exporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Export
                  </Button>
                </div>
              </div>
          
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search Project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={assignmentStatusFilter} onValueChange={setAssignmentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Assignment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignment</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="not_assigned">Not Assigned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={workflowStatusFilter} onValueChange={setWorkflowStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Workflow Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflow</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={workflowStatusGroupFilter} onValueChange={setWorkflowStatusGroupFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {assignees.map(assignee => (
                  <SelectItem key={assignee.id} value={assignee.id}>{assignee.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={serviceCategoryFilter} onValueChange={setServiceCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Service Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {serviceCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Due Date Range</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dueDateFrom}
                    onChange={(e) => setDueDateFrom(e.target.value)}
                    placeholder="From"
                    className="flex-1"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="date"
                    value={dueDateTo}
                    onChange={(e) => setDueDateTo(e.target.value)}
                    placeholder="To"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service Category</TableHead>
                    <TableHead>Assignment Status</TableHead>
                    <TableHead>Workflow Status</TableHead>
                    <TableHead>Status Group</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.project_name}</TableCell>
                      <TableCell>{task.client}</TableCell>
                      <TableCell>{task.service_category}</TableCell>
                      <TableCell>{getAssignmentStatusBadge(task.assignment_status)}</TableCell>
                      <TableCell>{getWorkflowStatusBadge(task.workflow_status)}</TableCell>
                      <TableCell>{getWorkflowStatusGroupBadge(task.status_group)}</TableCell>
                      <TableCell>{task.assignee_name || 'Unassigned'}</TableCell>
                      <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{task.created_date ? new Date(task.created_date).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredTasks.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  No projects found matching the current filters.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          {/* Invoice Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-ca-accent/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-ca-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invoices</p>
                    <p className="text-2xl font-bold text-ca-primary">{invoiceStats.total_invoices ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-ca-primary">₹{invoiceStats.total_amount?.toLocaleString('en-IN') ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Amount</p>
                    <p className="text-2xl font-bold text-ca-primary">₹{invoiceStats.paid_amount?.toLocaleString('en-IN') ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold text-ca-primary">₹{invoiceStats.total_amount?.toLocaleString('en-IN') ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Invoice Reports</CardTitle>
                <div className="flex gap-2">
                  <Select value={invoiceExportFormat} onValueChange={setInvoiceExportFormat}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInvoiceExport} disabled={invoiceExporting}>
                    {invoiceExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Export
                  </Button>
                </div>
              </div>
              
              {/* Invoice Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
                  <Input
                    placeholder="Search Invoice..."
                    value={invoiceSearchTerm}
                    onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={invoiceClientFilter} onValueChange={setInvoiceClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={invoiceServiceCategoryFilter} onValueChange={setInvoiceServiceCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Service Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {serviceCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date Range Filter - Separate Row */}
              <div className="mt-4">
                <div className="space-y-1 max-w-md">
                  <label className="text-sm font-medium text-muted-foreground">Date Range</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={invoiceDateFrom}
                      onChange={(e) => setInvoiceDateFrom(e.target.value)}
                      placeholder="From"
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                      type="date"
                      value={invoiceDateTo}
                      onChange={(e) => setInvoiceDateTo(e.target.value)}
                      placeholder="To"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {invoiceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Invoice Date</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Task Name</TableHead>
                        <TableHead>Service Category</TableHead>
                        <TableHead>Amount Before Tax</TableHead>
                        <TableHead>Invoice Amount</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.invoice_id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{invoice.client_name}</TableCell>
                          <TableCell>{invoice.task_name}</TableCell>
                          <TableCell>{invoice.service_category}</TableCell>
                          <TableCell>₹{invoice.amount_before_tax?.toLocaleString('en-IN') ?? 0}</TableCell>
                          <TableCell className="font-medium">₹{invoice.invoice_amount?.toLocaleString('en-IN') ?? 0}</TableCell>
                          <TableCell>₹{invoice.paid_amount?.toLocaleString('en-IN') ?? 0}</TableCell>
                          <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                          <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredInvoices.length === 0 && !invoiceLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      No invoices found matching the current filters.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit-notes" className="space-y-6">
          {/* Credit Note Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-ca-accent/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-ca-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Credit Notes</p>
                    <p className="text-2xl font-bold text-ca-primary">{creditNoteStats.total_credit_notes ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-ca-primary">₹{creditNoteStats.total_amount?.toLocaleString('en-IN') ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Credit Notes Reports</CardTitle>
                <div className="flex gap-2">
                  <Select value={creditNoteExportFormat} onValueChange={setCreditNoteExportFormat}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreditNoteExport} disabled={creditNoteExporting}>
                    {creditNoteExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Export
                  </Button>
                </div>
              </div>
              
              {/* Credit Note Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
                  <Input
                    placeholder="Search Credit Note..."
                    value={creditNoteSearchTerm}
                    onChange={(e) => setCreditNoteSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={creditNoteStatusFilter} onValueChange={setCreditNoteStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={creditNoteClientFilter} onValueChange={setCreditNoteClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date Range Filter */}
              <div className="mt-4">
                <div className="space-y-1 max-w-md">
                  <label className="text-sm font-medium text-muted-foreground">Date Range</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={creditNoteDateFrom}
                      onChange={(e) => setCreditNoteDateFrom(e.target.value)}
                      placeholder="From"
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                      type="date"
                      value={creditNoteDateTo}
                      onChange={(e) => setCreditNoteDateTo(e.target.value)}
                      placeholder="To"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {creditNoteLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Credit Note Number</TableHead>
                        <TableHead>Credit Note Date</TableHead>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Amount Before Tax</TableHead>
                        <TableHead>Total GST</TableHead>
                        <TableHead>Credit Note Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCreditNotes.map((note) => (
                        <TableRow key={note.credit_note_id}>
                          <TableCell className="font-medium">{note.credit_note_number}</TableCell>
                          <TableCell>{note.credit_note_date ? new Date(note.credit_note_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{note.invoice_number}</TableCell>
                          <TableCell>{note.client_name}</TableCell>
                          <TableCell>₹{note.amount_before_tax?.toLocaleString('en-IN') ?? 0}</TableCell>
                          <TableCell>₹{note.total_gst?.toLocaleString('en-IN') ?? 0}</TableCell>
                          <TableCell className="font-medium">₹{note.credit_note_amount?.toLocaleString('en-IN') ?? 0}</TableCell>
                          <TableCell>{getCreditNoteStatusBadge(note.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredCreditNotes.length === 0 && !creditNoteLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      No credit notes found matching the current filters.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debit-notes" className="space-y-6">
          {/* Debit Note Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-ca-accent/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-ca-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Debit Notes</p>
                    <p className="text-2xl font-bold text-ca-primary">{debitNoteStats.total_debit_notes ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-ca-primary">₹{debitNoteStats.total_amount?.toLocaleString('en-IN') ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Amount</p>
                    <p className="text-2xl font-bold text-ca-primary">₹{debitNoteStats.paid_amount?.toLocaleString('en-IN') ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold text-ca-primary">₹{debitNoteStats.outstanding_amount?.toLocaleString('en-IN') ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Debit Notes Reports</CardTitle>
                <div className="flex gap-2">
                  <Select value={debitNoteExportFormat} onValueChange={setDebitNoteExportFormat}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">XLSX</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleDebitNoteExport} disabled={debitNoteExporting}>
                    {debitNoteExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Export
                  </Button>
                </div>
              </div>
              
              {/* Debit Note Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
                  <Input
                    placeholder="Search Debit Note..."
                    value={debitNoteSearchTerm}
                    onChange={(e) => setDebitNoteSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={debitNoteStatusFilter} onValueChange={setDebitNoteStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={debitNoteClientFilter} onValueChange={setDebitNoteClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Date Range Filter */}
              <div className="mt-4">
                <div className="space-y-1 max-w-md">
                  <label className="text-sm font-medium text-muted-foreground">Date Range</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={debitNoteDateFrom}
                      onChange={(e) => setDebitNoteDateFrom(e.target.value)}
                      placeholder="From"
                      className="flex-1"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                      type="date"
                      value={debitNoteDateTo}
                      onChange={(e) => setDebitNoteDateTo(e.target.value)}
                      placeholder="To"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {debitNoteLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Debit Note Number</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid Amount</TableHead>
                        <TableHead>Outstanding Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDebitNotes.map((note) => (
                        <TableRow key={note.debit_note_id}>
                          <TableCell className="font-medium">{note.debit_note_number}</TableCell>
                          <TableCell>{note.client_name}</TableCell>
                          <TableCell>{note.description}</TableCell>
                          <TableCell className="font-medium">₹{note.amount?.toLocaleString('en-IN') ?? 0}</TableCell>
                          <TableCell>₹{note.paid_amount?.toLocaleString('en-IN') ?? 0}</TableCell>
                          <TableCell>₹{note.outstanding_amount?.toLocaleString('en-IN') ?? 0}</TableCell>
                          <TableCell>{note.due_date ? new Date(note.due_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{getDebitNoteStatusBadge(note.status)}</TableCell>
                          <TableCell>{note.created_at ? new Date(note.created_at).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {filteredDebitNotes.length === 0 && !debitNoteLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      No debit notes found matching the current filters.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReportsManagement;
