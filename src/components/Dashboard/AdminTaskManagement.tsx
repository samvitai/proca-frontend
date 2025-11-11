/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Eye,
  MessageSquare,
  FileText,
  Upload,
  Search,
  Building,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AddTaskDialog from "./AddTaskDialog";
import AdminViewTaskDialog from "./AdminViewTaskDialog";
import AdminEditTaskDialog from "./AdminEditTaskDialog";
import GenerateInvoiceDialog from "./GenerateInvoiceDialog";
import ViewTaskInvoiceDialog from "./ViewTaskInvoiceDialog";
import InvoiceSuccessModal from "./InvoiceSuccessModal";
import { api } from "@/lib/utils";
import axios, { AxiosError } from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// TypeScript Interfaces for API - Updated with proper null/undefined types
interface ApiTask {
  task_id: string;
  client_id: string;
  client_name: string;
  client_code: string;
  service_category_id: string;
  service_category_name: string;
  sac_code_id: string;
  sac_code: string;
  task_name: string;
  service_description: string;
  due_date: string | null;
  type_of_delivery: "domestic" | "export";
  invoice_amount?: number | null; // This field may not be present in all responses
  assignee_id: string | null;
  assignee_name: string | null;
  assignment_status: "assigned" | "unassigned" | "not_assigned"; // Added "not_assigned" from API response
  workflow_status:
    | "open"
    | "in_progress"
    | "pending_review"
    | "ready_for_close"
    | "closed";
  invoice_id?: string | null; // Made optional as it may not be present
  invoice_pdf_url?: string | null; // Made optional as it may not be present
  credit_note_id?: string | null; // Made optional as it may not be present
  // Clarification fields
  require_clarification?: boolean;
  clarification_from?: string | null;
  clarification_from_name?: string | null;
  clarification_to?: string | null;
  clarification_to_name?: string | null;
  running_log?: Array<{ // Made optional as it may not be present in list responses
    log_id: string;
    event_type: string;
    description: string;
    user_id: string;
    user_name: string;
    timestamp: string;
  }>;
  comments: Array<{
    comment_id: string;
    user_id: string;
    user_name: string;
    comment_text: string;
    attached_files: Array<{
      file_id: string;
      file_name: string;
      file_path: string;
      file_size: number;
      upload_date: string;
    }>;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

// Response structure for list endpoint - Updated to handle both single task and list responses
interface ApiListResponse {
  success: boolean;
  status?: string;
  message: string;
  data:
    | {
        tasks?: ApiTask[]; // Optional for list response
        task_id?: string; // Optional for single task response
        client_id?: string; // Fields that might be in single task response
        client_name?: string;
        // ... other single task fields
        pagination?: {
          current_page: number;
          total_pages: number;
          total_items: number;
          items_per_page: number;
        };
        summary?: {
          total_tasks: number;
          pending_tasks: number;
          completed_tasks: number;
          assigned_tasks: number;
          unassigned_tasks: number;
        };
      }
    | ApiTask; // Allow data to be either the list format or a single task
  error_code?: string;
  timestamp?: string;
  request_id?: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
    context: Record<string, unknown>;
  }>;
}

// Response structure for single task endpoint
interface ApiSingleTaskResponse {
  success: boolean;
  data: ApiTask;
}

interface ApiErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface ValidationErrorResponse {
  detail: ApiErrorDetail[];
}

// UI Interface for Task
interface Task {
  id: string;
  client: string;
  name: string;
  description: string;
  status:
    | "open"
    | "in-progress"
    | "pending-review"
    | "ready-for-close"
    | "closed";
  assignedTo: string;
  createdAt: string;
  dueDate?: string;
  invoiceGenerated?: boolean;
  invoice_id?: string | null;
  invoice_pdf_url?: string | null;
  credit_note_id?: string | null;
  amount?: number;
  cgst?: number;
  sgst?: number;
  shaCode?: string;
  serviceCategory?: string;
  // Clarification fields
  require_clarification?: boolean;
  clarification_from?: string | null;
  clarification_from_name?: string | null;
  clarification_to?: string | null;
  clarification_to_name?: string | null;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
    file?: {
      name: string;
      url: string;
    };
  }>;
  logs: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
  }>;
}

// Custom Error Class
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Helper function to safely check for null and undefined values
const isNullOrUndefined = (value: any): value is null | undefined => {
  return value === null || value === undefined;
};

// Helper function to get safe string value
const getSafeStringValue = (
  value: string | null | undefined,
  defaultValue: string = ""
): string => {
  return isNullOrUndefined(value) || value === ""
    ? defaultValue
    : String(value);
};

// Helper function to get safe number value
const getSafeNumberValue = (
  value: number | null | undefined
): number | undefined => {
  return isNullOrUndefined(value) || isNaN(value!) ? undefined : Number(value);
};

// Type Guards
const isError = (error: unknown): error is Error => {
  return error instanceof Error;
};

const isAxiosError = (error: unknown): error is AxiosError => {
  return axios.isAxiosError(error);
};

const isValidationErrorResponse = (
  obj: unknown
): obj is ValidationErrorResponse => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "detail" in obj &&
    Array.isArray((obj as ValidationErrorResponse).detail)
  );
};

const isApiErrorResponse = (obj: unknown): obj is ApiListResponse => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "success" in obj &&
    "status" in obj &&
    "message" in obj
  );
};

const AdminTaskManagement = () => {
  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isGenerateInvoiceDialogOpen, setIsGenerateInvoiceDialogOpen] =
    useState(false);
  const [isViewInvoiceDialogOpen, setIsViewInvoiceDialogOpen] = useState(false);
  const [isInvoiceSuccessModalOpen, setIsInvoiceSuccessModalOpen] = useState(false);
  const [isInvoicePopupOpen, setIsInvoicePopupOpen] = useState(false);
  const [generatedInvoiceData, setGeneratedInvoiceData] = useState<any>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");
  const [clarificationFilter, setClarificationFilter] = useState<string>("all");

  // Data States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Client-side Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sorting States
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Summary States
  const [summary, setSummary] = useState({
    total_tasks: 0,
    pending_tasks: 0,
    completed_tasks: 0,
    assigned_tasks: 0,
    unassigned_tasks: 0,
  });

  // Error handling helper
  const handleApiError = (error: unknown): string => {
    console.error("API Error:", error);

    if (isAxiosError(error)) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data;

      switch (statusCode) {
        case 400:
          if (isApiErrorResponse(responseData)) {
            if (responseData.errors && responseData.errors.length > 0) {
              const errorMessages = responseData.errors
                .map((err) => `${err.field}: ${err.message}`)
                .join(", ");
              return `Validation error: ${errorMessages}`;
            }
            return responseData.message || "Validation error or duplicate data";
          }
          return "Validation error or duplicate data";

        case 422:
          if (isValidationErrorResponse(responseData)) {
            const errorMessages = responseData.detail
              .map((err) => err.msg)
              .join(", ");
            return `Validation Error: ${errorMessages}`;
          }
          return "Validation error occurred";

        case 500:
          if (isApiErrorResponse(responseData)) {
            return responseData.message || "Internal server error";
          }
          return "Internal server error";

        default:
          return `Server error: ${error.message}`;
      }
    }

    if (isError(error)) {
      if (error.message.includes("timeout")) {
        return "Request timeout. Please check your connection.";
      }
      return `Network error: ${error.message}`;
    }

    return "An unknown error occurred";
  };

  // Transform API response to UI format with comprehensive null/undefined handling
  const transformApiTaskToUi = (apiTask: ApiTask): Task => {
    // Handle invoice_amount which may not be present in the API response
    // Check if the field exists and has a valid value (including 0)
    const safeInvoiceAmount = apiTask.invoice_amount !== undefined && apiTask.invoice_amount !== null
      ? Number(apiTask.invoice_amount) 
      : undefined;
    
    // Debug logging to check if invoice_amount is in the API response
    if (apiTask.task_id) {
      console.log(`Task ${apiTask.task_id} - invoice_amount from API:`, apiTask.invoice_amount, `| Transformed to:`, safeInvoiceAmount);
      console.log(`Task ${apiTask.task_id} - invoice_id from API:`, apiTask.invoice_id, `| invoiceGenerated:`, apiTask.invoice_id !== null && apiTask.invoice_id !== undefined);
    }
      
    const safeAssigneeName = getSafeStringValue(
      apiTask.assignee_name,
      "Unassigned"
    );
    const safeClientName = getSafeStringValue(
      apiTask.client_name,
      "Unknown Client"
    );
    const safeTaskName = getSafeStringValue(apiTask.task_name, "Untitled Task");
    const safeDescription = getSafeStringValue(
      apiTask.service_description,
      "No description"
    );

    const transformedTask: Task = {
      id: apiTask.task_id,
      client: safeClientName,
      name: safeTaskName,
      description: safeDescription,
      status: mapWorkflowStatus(apiTask.workflow_status),
      assignedTo: safeAssigneeName,
      createdAt: new Date(apiTask.created_at).toISOString().split("T")[0],
      dueDate: apiTask.due_date
        ? new Date(apiTask.due_date).toISOString().split("T")[0]
        : undefined,
      invoiceGenerated: apiTask.invoice_id !== null && apiTask.invoice_id !== undefined,
      invoice_id: apiTask.invoice_id,
      invoice_pdf_url: apiTask.invoice_pdf_url,
      credit_note_id: apiTask.credit_note_id,
      amount: safeInvoiceAmount, // Will be undefined if not present in API response
      cgst: 9,
      sgst: 9,
      shaCode: getSafeStringValue(apiTask.sac_code, ""),
      serviceCategory: getSafeStringValue(apiTask.service_category_name, ""),
      // Clarification fields
      require_clarification: apiTask.require_clarification || false,
      clarification_from: apiTask.clarification_from || null,
      clarification_from_name: apiTask.clarification_from_name || null,
      clarification_to: apiTask.clarification_to || null,
      clarification_to_name: apiTask.clarification_to_name || null,
      comments: (apiTask.comments || []).map((comment) => ({
        id: comment.comment_id,
        author: comment.user_name,
        content: comment.comment_text,
        timestamp: new Date(comment.created_at).toLocaleString(),
        file:
          comment.attached_files && comment.attached_files.length > 0
            ? {
                name: comment.attached_files[0].file_name,
                url: comment.attached_files[0].file_path,
              }
            : undefined,
      })),
      logs: (apiTask.running_log || []).map((log, index) => ({
        id: log.log_id || `log-${index}`,
        action: log.description || log.event_type,
        user: log.user_name,
        timestamp: log.timestamp,
      })),
    };

    return transformedTask;
  };

  // Map API workflow status to local status
  const mapWorkflowStatus = (apiStatus: string): Task["status"] => {
    switch (apiStatus) {
      case "open":
        return "open";
      case "in_progress":
        return "in-progress";
      case "pending_review":
        return "pending-review";
      case "ready_for_close":
        return "ready-for-close";
      case "closed":
        return "closed";
      default:
        return "open";
    }
  };

  // Fetch individual task details
  const fetchTaskDetails = async (taskId: string): Promise<Task | null> => {
    try {
      const response = await api.get<ApiSingleTaskResponse>(
        `/api/tasks/${taskId}`
      );

      // console.log("Single Task Response:", response.data);

      if (response.data.success && response.data.data) {
        return transformApiTaskToUi(response.data.data);
      }
      return null;
    } catch (error: unknown) {
      console.error("Error fetching task details:", error);
      return null;
    }
  };

  // Fetch all tasks from API (client-side pagination)
  const fetchTasks = async (): Promise<void> => {
    try {
      setIsInitialLoading(true);
      setError(null);

      // Fetch all tasks by getting all pages
      let allTasks: ApiTask[] = [];
      let page = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await api.get<ApiListResponse>(
          `/api/tasks/?page=${page}&limit=100`
        );

        if (response.data.success) {
          if (
            typeof response.data.data === "object" &&
            "tasks" in response.data.data &&
            response.data.data.tasks
          ) {
            allTasks = [...allTasks, ...response.data.data.tasks];
            
            // Check if there are more pages
            const pagination = response.data.data.pagination;
            hasMorePages = pagination && page < pagination.total_pages;
            page++;
          } else {
            hasMorePages = false;
          }
        } else {
          hasMorePages = false;
        }
      }

      // Fetch detailed data for each task to get invoice_amount and other fields
      const enrichedTasksPromises = allTasks.map(async (apiTask) => {
        try {
          const detailResponse = await api.get<ApiSingleTaskResponse>(
            `/api/tasks/${apiTask.task_id}`
          );
          if (detailResponse.data.success && detailResponse.data.data) {
            return transformApiTaskToUi(detailResponse.data.data);
          }
          return transformApiTaskToUi(apiTask);
        } catch (error) {
          console.warn(`Failed to fetch details for task ${apiTask.task_id}:`, error);
          return transformApiTaskToUi(apiTask);
        }
      });

      // Wait for all detail fetches to complete
      const enrichedTasks = await Promise.all(enrichedTasksPromises);
      
      // Sort all tasks by due date (ascending)
      const sortedTasks = enrichedTasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      
      setTasks(sortedTasks);
      setSummary({
        total_tasks: sortedTasks.length,
        pending_tasks: sortedTasks.filter(t => t.status !== "closed").length,
        completed_tasks: sortedTasks.filter(t => t.status === "closed").length,
        assigned_tasks: sortedTasks.filter(t => t.assignedTo !== "Unassigned").length,
        unassigned_tasks: sortedTasks.filter(t => t.assignedTo === "Unassigned").length,
      });
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Handle task addition
  const handleAddTask = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('=== handleAddTask - Before refresh ===');
      console.log('Current tasks before refresh:', tasks.map(t => ({ id: t.id, name: t.name, status: t.status, invoiceGenerated: t.invoiceGenerated })));
      
      // Remember which closed tasks didn't have invoices before refresh
      const closedTasksWithoutInvoices = tasks
        .filter(task => task.status === 'closed' && !task.invoiceGenerated)
        .map(task => task.id);
      
      console.log('Closed tasks without invoices to preserve:', closedTasksWithoutInvoices);
      
      // Simply refresh tasks from server - don't try to merge local data
      await fetchTasks();
      
      // Restore the original invoice status for closed tasks that didn't have invoices
      setTasks(prevTasks => {
        return prevTasks.map(task => {
          if (closedTasksWithoutInvoices.includes(task.id) && task.status === 'closed') {
            console.log(`Restoring original invoice status for task ${task.id}: invoiceGenerated=false`);
            return {
              ...task,
              invoiceGenerated: false,
              invoice_id: null
            };
          }
          return task;
        });
      });
      
      console.log('=== handleAddTask - After refresh and restoration ===');
      console.log('Tasks after refresh:', tasks.map(t => ({ id: t.id, name: t.name, status: t.status, invoiceGenerated: t.invoiceGenerated })));
      
      setIsAddDialogOpen(false);

      setSuccess(`Project has been created successfully.`);

      setTimeout(() => {
        setSuccess(null);
      }, 3000);

      toast({
        title: "Project Created",
        description: `Project has been created successfully.`,
      });
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    // Refresh tasks from backend to get the latest data with updated assignee
    await fetchTasks();
    setIsEditDialogOpen(false);
    setSelectedTask(null);
  };

  const handleViewTaskUpdate = (updatedTask: Task) => {
    console.log('=== handleViewTaskUpdate ===');
    console.log('Updated task received:', updatedTask);
    console.log('Updated task status:', updatedTask.status);
    setTasks((prevTasks) => {
      const newTasks = prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
      console.log('New tasks after update:', newTasks);
      return newTasks;
    });
    // Don't close the dialog, just update the state
  };

  const handleGenerateInvoice = (taskId: string, invoiceData: any) => {
    // Remove the task from the table since invoice has been generated
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));

  };

  const handleInvoiceGenerationSuccess = async () => {
    // Refresh all tasks from the backend to get updated invoice_pdf_url and other fields
    await fetchTasks();
  };

  const handleDirectGenerateInvoice = async (task: Task) => {
    setIsGeneratingInvoice(task.id);
    try {
      // Extract numeric ID from task ID (e.g., "task_33" -> 33)
      let taskId: number;
      
      if (task.id.includes('_')) {
        // Extract the number after the underscore
        const idParts = task.id.split('_');
        taskId = parseInt(idParts[idParts.length - 1], 10);
      } else {
        // If no underscore, try to parse the whole string
        taskId = parseInt(task.id, 10);
      }
      
      // Validate that task ID is a valid integer
      if (isNaN(taskId)) {
        throw new Error(`Invalid task ID: ${task.id}. Cannot generate invoice.`);
      }
      
      console.log("Original task ID:", task.id, "-> Extracted numeric ID:", taskId);
      
      // Use the correct endpoint with task_id in request body
      const response = await api.post(`/api/invoice/generate`, {
        task_id: taskId // Send task_id as number in request body
      });
      
      if (response.data.success) {
        // Show success popup with invoice data
        setGeneratedInvoiceData(response.data.data);
        setIsInvoicePopupOpen(true);
        
        // Remove the task from the table since invoice has been generated
        setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
        
        // Show success toast
        toast({
          title: "Invoice Generated Successfully",
          description: `Invoice ${response.data.data.invoice_number} has been generated. Task removed from table.`,
        });
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Invoice Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInvoice(null);
    }
  };

  const handleOpenGenerateInvoice = (task: Task) => {
    setSelectedTask(task);
    setIsGenerateInvoiceDialogOpen(true);
  };

  const handleOpenViewInvoice = (task: Task) => {
    setSelectedTask(task);
    setIsInvoiceSuccessModalOpen(true);
  };

  const calculateDueDateFilter = () => {
    const today = new Date();
    switch (dueDateFilter) {
      case "overdue":
        return (task: Task) => task.dueDate && new Date(task.dueDate) < today;
      case "7":
        return (task: Task) =>
          task.dueDate &&
          new Date(task.dueDate) <=
            new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      case "15":
        return (task: Task) =>
          task.dueDate &&
          new Date(task.dueDate) <=
            new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
      case "21":
        return (task: Task) =>
          task.dueDate &&
          new Date(task.dueDate) <=
            new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);
      case "30":
        return (task: Task) =>
          task.dueDate &&
          new Date(task.dueDate) <=
            new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      case "45":
        return (task: Task) =>
          task.dueDate &&
          new Date(task.dueDate) <=
            new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);
      case "all":
        return () => true;
      default:
        return () => true;
    }
  };

  // Apply filters to tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCompany = task.client
      .toLowerCase()
      .includes(companySearch.toLowerCase());
    const matchesStatus =
      !statusFilter || statusFilter === "all" || task.status === statusFilter;
    const matchesDueDate = calculateDueDateFilter()(task);
    
    // Clarification filter logic
    const currentUserId = localStorage.getItem('userId');
    const currentUserName = localStorage.getItem('userName');
    const matchesClarification = (() => {
      if (!clarificationFilter || clarificationFilter === "all") return true;
      if (clarificationFilter === "clarifications") {
        // Show tasks where clarification is required AND it's assigned to current user
        return task.require_clarification === true && 
               (task.clarification_to === currentUserId || task.clarification_to_name === currentUserName);
      }
      return true;
    })();
    
    // Show closed tasks only if they don't have an invoice generated
    const isVisibleClosedTask = task.status !== 'closed' || !task.invoiceGenerated;

    // Debug logging for closed tasks
    if (task.status === 'closed') {
      console.log(`Closed task ${task.id} (${task.name}): invoiceGenerated=${task.invoiceGenerated}, invoice_id=${task.invoice_id}, visible=${isVisibleClosedTask}`);
    }

    return matchesSearch && matchesCompany && matchesStatus && matchesDueDate && matchesClarification && isVisibleClosedTask;
  });

  // Sorting function
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case "projectName":
        aValue = a.name?.toLowerCase() || "";
        bValue = b.name?.toLowerCase() || "";
        break;
      case "client":
        aValue = a.client?.toLowerCase() || "";
        bValue = b.client?.toLowerCase() || "";
        break;
      case "status":
        aValue = a.status || "";
        bValue = b.status || "";
        break;
      case "assignedTo":
        aValue = (a.assignedTo || "Unassigned").toLowerCase();
        bValue = (b.assignedTo || "Unassigned").toLowerCase();
        break;
      case "createdDate":
        aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        break;
      case "dueDate":
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Handle column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle sort direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort column with ascending direction
      setSortColumn(column);
      setSortDirection("asc");
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Get sort icon for a column
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-foreground" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-foreground" />
    );
  };

  // Client-side pagination helpers
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = sortedTasks.slice(startIndex, endIndex);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Auto-adjust page when tasks are removed
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleViewTask = async (task: Task) => {
    // Fetch detailed task information before opening the dialog
    const detailedTask = await fetchTaskDetails(task.id);
    if (detailedTask) {
      setSelectedTask(detailedTask);
    } else {
      setSelectedTask(task); // Fallback to existing task data
    }
    setIsViewDialogOpen(true);
  };

  const handleEditTask = async (task: Task) => {
    // Fetch detailed task information before opening the dialog
    const detailedTask = await fetchTaskDetails(task.id);
    if (detailedTask) {
      setSelectedTask(detailedTask);
    } else {
      setSelectedTask(task); // Fallback to existing task data
    }
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: Task["status"]) => {
    const variants = {
      open: "secondary",
      "in-progress": "default",
      "pending-review": "outline",
      "ready-for-close": "outline",
      closed: "default",
    } as const;

    const labels = {
      open: "Open",
      "in-progress": "In Progress",
      "pending-review": "Pending Review",
      "ready-for-close": "Ready for Close",
      closed: "Closed",
    } as const;

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  // Date helpers to compare by date-only (ignore time)
  const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const isOverdueDate = (dateStr?: string) => {
    if (!dateStr) return false;
    const due = toDateOnly(new Date(dateStr));
    const today = toDateOnly(new Date());
    return due < today;
  };
  const isTodayOrFuture = (dateStr?: string) => {
    if (!dateStr) return false;
    const due = toDateOnly(new Date(dateStr));
    const today = toDateOnly(new Date());
    return due >= today;
  };

  // Tasks are already sorted by due date in fetchTasks, just use paginatedTasks

  return (
    <div className="space-y-6">
      {/* Success/Error Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <AlertDescription className="text-green-600">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-ca-primary">
                Projects
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Total: {summary.total_tasks} | Ongoing Projects: {summary.pending_tasks}{" "}
                | Completed: {summary.completed_tasks} | Assigned:{" "}
                {summary.assigned_tasks} | Unassigned:{" "}
                {summary.unassigned_tasks}
              </p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-ca-accent hover:bg-ca-accent/90 text-ca-accent-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by company"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: string) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending-review">Pending Review</SelectItem>
                <SelectItem value="ready-for-close">Ready for Close</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={dueDateFilter}
              onValueChange={(value: string) => setDueDateFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by due date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Due Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="7">Next 7 Days</SelectItem>
                <SelectItem value="15">Next 15 Days</SelectItem>
                <SelectItem value="21">Next 21 Days</SelectItem>
                <SelectItem value="30">Next 30 Days</SelectItem>
                <SelectItem value="45">Next 45 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={clarificationFilter}
              onValueChange={(value: string) => setClarificationFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by clarification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="clarifications">Clarifications</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {/* Task List Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("projectName")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Project Name
                      {getSortIcon("projectName")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("client")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Client
                      {getSortIcon("client")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Status
                      {getSortIcon("status")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("assignedTo")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Assigned To
                      {getSortIcon("assignedTo")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("createdDate")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Created Date
                      {getSortIcon("createdDate")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <button
                      onClick={() => handleSort("dueDate")}
                      className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                    >
                      Due Date
                      {getSortIcon("dueDate")}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInitialLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p>Loading tasks...</p>
                    </TableCell>
                  </TableRow>
                 ) : paginatedTasks.length > 0 ? (
                  paginatedTasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">
                          {task.name}
                        </TableCell>
                        <TableCell>{task.client}</TableCell>
                        <TableCell>
                          {getStatusBadge(task.status)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              !task.assignedTo ||
                              task.assignedTo === "Unassigned" ||
                              task.assignedTo.trim() === ""
                                ? "text-muted-foreground italic"
                                : ""
                            }
                          >
                            {task.assignedTo || "Unassigned"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {task.createdAt ? (
                            <span>
                              {task.createdAt}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.dueDate ? (
                            <span
                              className={
                                isOverdueDate(task.dueDate)
                                  ? "text-red-600"
                                  : isTodayOrFuture(task.dueDate)
                                  ? "text-green-600"
                                  : ""
                              }
                            >
                              {task.dueDate}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              No due date
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTask(task)}
                              className="text-ca-primary border-ca-primary hover:bg-ca-primary hover:text-ca-primary-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {/* Show generate invoice button for closed tasks without invoice */}
                            {task.status === "closed" && !task.invoiceGenerated && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDirectGenerateInvoice(task)}
                                disabled={isGeneratingInvoice === task.id}
                                className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                              >
                                {isGeneratingInvoice === task.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="h-4 w-4 mr-1" />
                                    Generate Invoice
                                  </>
                                )}
                              </Button>
                            )}
                            {/* Show view invoice button for closed tasks with invoice */}
                            {task.status === "closed" && task.invoiceGenerated && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenViewInvoice(task)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {tasks.length === 0 ? (
                        <div>
                          <p className="text-lg font-medium">No Projects found</p>
                          <p className="text-sm">
                            Click "Create Project" to create your first project
                          </p>
                        </div>
                      ) : (
                        "No Projects found matching your criteria."
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Showing{" "}
                  {startIndex + 1}{" "}
                  to{" "}
                  {Math.min(endIndex, sortedTasks.length)}{" "}
                  of {sortedTasks.length} results
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddTaskDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddTask={handleAddTask}
        isLoading={isLoading}
      />

      {selectedTask && (
        <>
          <AdminViewTaskDialog
            isOpen={isViewDialogOpen}
            onClose={() => {
              setIsViewDialogOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
            onUpdate={handleViewTaskUpdate}
            onGenerateInvoice={handleOpenGenerateInvoice}
          />
          <AdminEditTaskDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
            onUpdate={handleUpdateTask}
            onGenerateInvoice={handleOpenGenerateInvoice}
          />
          <GenerateInvoiceDialog
            isOpen={isGenerateInvoiceDialogOpen}
            onClose={() => {
              setIsGenerateInvoiceDialogOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
            onGenerate={handleGenerateInvoice}
            onSuccess={handleInvoiceGenerationSuccess}
          />
          <ViewTaskInvoiceDialog
            isOpen={isViewInvoiceDialogOpen}
            onClose={() => {
              setIsViewInvoiceDialogOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
          />
          <InvoiceSuccessModal
            isOpen={isInvoiceSuccessModalOpen}
            onClose={() => {
              setIsInvoiceSuccessModalOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
          />
        </>
      )}

      {/* Invoice Generated Success Popup */}
      <Dialog open={isInvoicePopupOpen} onOpenChange={setIsInvoicePopupOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <DialogTitle className="text-xl">Invoice Generated Successfully!</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              Your invoice has been generated successfully.
            </DialogDescription>
          </DialogHeader>
          
          {generatedInvoiceData && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Invoice Number</p>
                  <p className="text-base font-semibold">{generatedInvoiceData.invoice_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-base font-semibold">₹{generatedInvoiceData.total_amount?.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client Name</p>
                  <p className="text-base">{generatedInvoiceData.client_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service</p>
                  <p className="text-base">{generatedInvoiceData.service_name}</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  📋 To view this invoice, please navigate to the <span className="font-bold">Invoices</span> tab.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              onClick={() => setIsInvoicePopupOpen(false)}
              className="bg-ca-accent hover:bg-ca-accent/90"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTaskManagement;
