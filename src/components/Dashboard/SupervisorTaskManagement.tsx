import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, Edit, Search, User, CheckSquare, AlertCircle, Clock, FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/utils";
import axios, { AxiosError } from "axios";
import SupervisorViewTaskDialog from "./SupervisorViewTaskDialog";
import SupervisorEditTaskDialog from "./SupervisorEditTaskDialog";

interface Supervisor {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  designation: string;
  is_active: boolean;
  firm_name: string;
  address: string;
  role_id: number;
  role_name: string;
  organization_id: number;
  created_at: string;
  updated_at: string;
}

// API Interfaces
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
  invoice_amount?: number | null;
  assignee_id: string | null;
  assignee_name: string | null;
  assignment_status: "assigned" | "unassigned" | "not_assigned";
  workflow_status:
    | "open"
    | "in_progress"
    | "pending_review"
    | "ready_for_close"
    | "closed";
  invoice_id?: string | null;
  invoice_pdf_url?: string | null;
  credit_note_id?: string | null;
  // Clarification fields
  require_clarification?: boolean;
  clarification_from?: string | null;
  clarification_from_name?: string | null;
  clarification_to?: string | null;
  clarification_to_name?: string | null;
  running_log?: Array<{
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

interface ApiListResponse {
  success: boolean;
  status?: string;
  message: string;
  data:
    | {
        tasks?: ApiTask[];
        task_id?: string;
        client_id?: string;
        client_name?: string;
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
    | ApiTask;
  error_code?: string;
  timestamp?: string;
  request_id?: string;
}

interface ApiSingleTaskResponse {
  success: boolean;
  data: ApiTask;
}

interface ApiClient {
  client_id: string;
  client_name: string;
  client_code: string;
  email: string;
  phone: string;
  is_active: boolean;
}

interface ApiClientsResponse {
  success: boolean;
  message: string;
  data: {
    clients: ApiClient[];
  };
}

interface Task {
  id: string;
  client: string;
  name: string;
  description: string;
  status: 'open' | 'in-progress' | 'pending-review' | 'ready-for-close' | 'closed';
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

const SupervisorTaskManagement = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");
  const [clarificationFilter, setClarificationFilter] = useState<string>("all");
  
  // Client-side Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Supervisors state
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(true);
  const [supervisorsError, setSupervisorsError] = useState<string | null>(null);
  const [supervisorFilter, setSupervisorFilter] = useState<string>("all");
  
  // Tasks and Clients state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [clientsError, setClientsError] = useState<string | null>(null);

  // Helper functions
  const getSafeStringValue = React.useCallback((
    value: string | null | undefined,
    defaultValue: string = ""
  ): string => {
    return value === null || value === undefined || value === ""
      ? defaultValue
      : String(value);
  }, []);

  // Map API workflow status to local status
  const mapWorkflowStatus = React.useCallback((apiStatus: string): Task["status"] => {
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
  }, []);

  // Transform API response to UI format
  const transformApiTaskToUi = React.useCallback((apiTask: ApiTask): Task => {
    const safeInvoiceAmount = apiTask.invoice_amount !== undefined && apiTask.invoice_amount !== null
      ? Number(apiTask.invoice_amount) 
      : undefined;
    
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
      amount: safeInvoiceAmount,
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
  }, [getSafeStringValue, mapWorkflowStatus]);

  // Fetch supervisors from API
  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        setIsLoadingSupervisors(true);
        setSupervisorsError(null);
        
        const response = await api.get<Supervisor[]>('/api/v1/users/users/supervisors');
        console.log('Supervisors fetched:', response.data);
        setSupervisors(response.data);
      } catch (error) {
        console.error('Error fetching supervisors:', error);
        let errorMessage = 'Failed to load supervisors';
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 500) {
            errorMessage = 'Server error while fetching supervisors';
          } else if (error.response?.data) {
            errorMessage = typeof error.response.data === 'string' 
              ? error.response.data 
              : error.response.data.message || errorMessage;
          }
        }
        
        setSupervisorsError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoadingSupervisors(false);
      }
    };

    fetchSupervisors();
  }, []);

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoadingTasks(true);
        setTasksError(null);

        // Fetch first page
        const response = await api.get<ApiListResponse>('/api/tasks/?page=1&limit=100');
        console.log('Tasks API Response:', response.data);

        if (response.data.success) {
          console.log('Response data type:', typeof response.data.data);
          console.log('Has tasks property:', "tasks" in response.data.data);
          
          if (
            typeof response.data.data === "object" &&
            "tasks" in response.data.data &&
            response.data.data.tasks
          ) {
            let allTasks = response.data.data.tasks;
            console.log('Initial tasks loaded:', allTasks.length);
            
            // Check if there are multiple pages and fetch them all
            if (response.data.data.pagination && response.data.data.pagination.total_pages > 1) {
              const totalPages = response.data.data.pagination.total_pages;
              const pagePromises = [];
              
              // Fetch remaining pages
              for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(
                  api.get<ApiListResponse>(`/api/tasks/?page=${page}&limit=100`)
                );
              }
              
              // Wait for all pages
              const pageResponses = await Promise.all(pagePromises);
              
              // Combine all tasks
              pageResponses.forEach(pageResponse => {
                if (
                  pageResponse.data.success &&
                  typeof pageResponse.data.data === "object" &&
                  "tasks" in pageResponse.data.data &&
                  pageResponse.data.data.tasks
                ) {
                  allTasks = [...allTasks, ...pageResponse.data.data.tasks];
                }
              });
            }
            
            // Supervisors can view ALL tasks (assigned to anyone: admin, supervisor, employee)
            console.log('Total tasks fetched:', allTasks.length);
            
            // Log first few tasks to check their structure
            if (allTasks.length > 0) {
              console.log('Sample task structure:', allTasks[0]);
              console.log('All task assignee_ids:', allTasks.map(t => ({
                task_id: t.task_id,
                assignee_id: t.assignee_id,
                assignee_name: t.assignee_name,
                assignment_status: t.assignment_status
              })));
            }
            
            // Show ALL tasks - supervisors can view tasks assigned to anyone
            const allVisibleTasks = allTasks;
            
            console.log('All visible tasks for supervisor:', allVisibleTasks.length);
            
            const transformedTasks = allVisibleTasks.map(transformApiTaskToUi);
            console.log('Transformed tasks:', transformedTasks.length);
            // Sort by due date
            const sortedTasks = transformedTasks.sort((a, b) => {
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
            console.log('Sorted tasks to be set:', sortedTasks.length);
            console.log('Setting tasks in state:', sortedTasks);
            setTasks(sortedTasks);
            console.log('Tasks state should now be updated');
          } else if (
            typeof response.data.data === "object" &&
            "task_id" in response.data.data
          ) {
            console.log('Single task response detected');
            const singleTask = transformApiTaskToUi(response.data.data as ApiTask);
            setTasks([singleTask]);
          } else {
            console.warn('Unexpected response structure:', response.data.data);
            console.log('Response data keys:', Object.keys(response.data.data));
            setTasks([]);
          }
        } else {
          console.error('API response success is false');
          throw new Error("Failed to fetch tasks");
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        let errorMessage = 'Failed to load tasks';
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 500) {
            errorMessage = 'Server error while fetching tasks';
          } else if (error.response?.data) {
            errorMessage = typeof error.response.data === 'string' 
              ? error.response.data 
              : error.response.data.message || errorMessage;
          }
        }
        
        setTasksError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoadingTasks(false);
      }
    };

    // Only fetch tasks after supervisors are loaded
    if (supervisors.length > 0) {
      console.log('Fetching tasks for supervisors:', supervisors.map(s => s.id));
      fetchTasks();
    } else if (!isLoadingSupervisors) {
      // If supervisors loaded but list is empty, set tasks loading to false
      console.log('No supervisors found, setting tasks to empty');
      setIsLoadingTasks(false);
      setTasks([]);
    }
  }, [transformApiTaskToUi, supervisors, isLoadingSupervisors]);

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoadingClients(true);
        setClientsError(null);

        const response = await api.get<ApiClientsResponse>('/api/clients/');
        console.log('Clients API Response:', response.data);

        if (response.data.success && response.data.data.clients) {
          // For now, show all active clients
          // We can filter later based on tasks
          setClients(response.data.data.clients);
          console.log('Clients set:', response.data.data.clients.length);
        } else {
          throw new Error("Failed to fetch clients");
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        let errorMessage = 'Failed to load clients';
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 500) {
            errorMessage = 'Server error while fetching clients';
          } else if (error.response?.data) {
            errorMessage = typeof error.response.data === 'string' 
              ? error.response.data 
              : error.response.data.message || errorMessage;
          }
        }
        
        setClientsError(errorMessage);
        // Don't show toast for clients error as it's not critical
      } finally {
        setIsLoadingClients(false);
        console.log('Clients loading finished');
      }
    };

    // Fetch clients once after tasks are initially loaded
    if (!isLoadingTasks && clients.length === 0) {
      console.log('Fetching clients...');
      fetchClients();
    }
  }, [isLoadingTasks, clients.length]);

  const calculateDueDateFilter = () => {
    const today = new Date();
    switch(dueDateFilter) {
      case "all":
        return () => true;
      case "overdue":
        return (task: Task) => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) < today && task.status !== 'closed';
        };
      case "7":
        return (task: Task) => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        };
      case "15":
        return (task: Task) => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) <= new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
        };
      case "21":
        return (task: Task) => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) <= new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);
        };
      case "30":
        return (task: Task) => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        };
      case "45":
        return (task: Task) => {
          if (!task.dueDate) return false;
          return new Date(task.dueDate) <= new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);
        };
      default:
        return () => true;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesClient = clientFilter === "all" || task.client === clientFilter;
    const matchesSupervisor = supervisorFilter === "all" || task.assignedTo === supervisorFilter;
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
    
    // Filter out closed tasks - only show non-closed tasks
    const isNotClosed = task.status !== 'closed';
    
    // Debug logging for first task to see what's filtering
    if (task.id === tasks[0]?.id) {
      console.log('Filter check for first task:', {
        taskId: task.id,
        taskStatus: task.status,
        matchesSearch,
        matchesStatus,
        matchesClient,
        matchesSupervisor,
        matchesDueDate,
        isNotClosed,
        finalResult: matchesSearch && matchesStatus && matchesClient && matchesSupervisor && matchesDueDate && matchesClarification && isNotClosed
      });
    }
    
    return matchesSearch && matchesStatus && matchesClient && matchesSupervisor && matchesDueDate && matchesClarification && isNotClosed;
  });

  // Client-side pagination helpers
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

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

  // Stats
  const unassignedTasks = tasks.filter(t => !t.assignedTo || t.assignedTo === "").length;
  const overdueTasks = tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'closed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingReviewTasks = tasks.filter(t => t.status === 'pending-review').length;

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsViewDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    setTasks(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));
    setIsEditDialogOpen(false);
    toast({
      title: "Project Updated",
      description: "Project has been updated successfully.",
    });
    
    // Refresh tasks from server to ensure consistency
    try {
      // Only fetch tasks after supervisors are loaded
      if (supervisors.length > 0) {
        console.log('Refreshing tasks after update...');
        // Re-fetch tasks to get the latest data from the server
        const response = await api.get<ApiListResponse>('/api/tasks/?page=1&limit=100');
        console.log('Tasks refresh API Response:', response.data);

        if (response.data.success) {
          if (
            typeof response.data.data === "object" &&
            "tasks" in response.data.data &&
            response.data.data.tasks
          ) {
            let allTasks = response.data.data.tasks;
            
            // Check if there are multiple pages and fetch them all
            if (response.data.data.pagination && response.data.data.pagination.total_pages > 1) {
              const totalPages = response.data.data.pagination.total_pages;
              const pagePromises = [];
              
              // Fetch remaining pages
              for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(
                  api.get<ApiListResponse>(`/api/tasks/?page=${page}&limit=100`)
                );
              }
              
              // Wait for all pages
              const pageResponses = await Promise.all(pagePromises);
              
              // Combine all tasks
              pageResponses.forEach(pageResponse => {
                if (
                  pageResponse.data.success &&
                  typeof pageResponse.data.data === "object" &&
                  "tasks" in pageResponse.data.data &&
                  pageResponse.data.data.tasks
                ) {
                  allTasks = [...allTasks, ...pageResponse.data.data.tasks];
                }
              });
            }
            
            // Supervisors can view ALL tasks (assigned to anyone: admin, supervisor, employee)
            // Same logic as initial load - show all tasks
            const allVisibleTasks = allTasks;
            console.log('All visible tasks after refresh:', allVisibleTasks.length);
            
            const transformedTasks = allVisibleTasks.map(transformApiTaskToUi);
            
            // Sort by due date
            const sortedTasks = transformedTasks.sort((a, b) => {
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
            
            setTasks(sortedTasks);
            console.log('Tasks refreshed successfully');
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      // Don't show error toast as the update was successful, just refresh failed
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      'open': 'secondary',
      'in-progress': 'default', 
      'pending-review': 'outline',
      'ready-for-close': 'outline',
      'closed': 'default'
    } as const;

    const labels = {
      'open': 'Open',
      'in-progress': 'In Progress',
      'pending-review': 'Pending Review',
      'ready-for-close': 'Ready for Close',
      'closed': 'Closed'
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const due = toDateOnly(new Date(dueDate));
    const today = toDateOnly(new Date());
    return due < today;
  };

  const isTodayOrFuture = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const due = toDateOnly(new Date(dueDate));
    const today = toDateOnly(new Date());
    return due >= today;
  };


  // Show loading state (only block on tasks and supervisors, clients can load in background)
  if (isLoadingTasks || isLoadingSupervisors) {
    console.log('Loading state:', { isLoadingTasks, isLoadingClients, isLoadingSupervisors });
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-ca-primary" />
      </div>
    );
  }

  console.log('Rendering with tasks:', tasks.length);
  console.log('Tasks in state:', tasks);
  console.log('Filtered tasks for display:', filteredTasks.length);

  return (
    <div className="space-y-6">
      {/* Error Alerts */}
      {supervisorsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{supervisorsError}</AlertDescription>
        </Alert>
      )}
      {tasksError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{tasksError}</AlertDescription>
        </Alert>
      )}
      {clientsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{clientsError}</AlertDescription>
        </Alert>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className="text-2xl font-bold text-ca-primary">{unassignedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-ca-primary">{overdueTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-ca-primary">{inProgressTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-ca-primary">{pendingReviewTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle>Projects Overview</CardTitle>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending-review">Pending Review</SelectItem>
                <SelectItem value="ready-for-close">Ready for Close</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients
                  .filter(client => client.is_active)
                  .map(client => (
                    <SelectItem key={client.client_id} value={client.client_name}>
                      {client.client_name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            <Select value={supervisorFilter} onValueChange={setSupervisorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Supervisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Supervisors</SelectItem>
                {isLoadingSupervisors ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  supervisors
                    .filter(supervisor => supervisor.is_active)
                    .map(supervisor => (
                      <SelectItem 
                        key={supervisor.id} 
                        value={`${supervisor.first_name} ${supervisor.last_name}`}
                      >
                        {supervisor.first_name} {supervisor.last_name}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
            <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Due date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="7">Next 7 Days</SelectItem>
                <SelectItem value="15">Next 15 Days</SelectItem>
                <SelectItem value="21">Next 21 Days</SelectItem>
                <SelectItem value="30">Next 30 Days</SelectItem>
                <SelectItem value="45">Next 45 Days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={clarificationFilter} onValueChange={setClarificationFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Clarifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="clarifications">Clarifications</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {filteredTasks.length === 0 
                      ? "No projects found matching the current filters. You don't have any assigned Projects yet."
                      : "No projects on this page."
                    }         
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTasks.map((task) => (
                <TableRow key={task.id} className={task.dueDate && isOverdue(task.dueDate) && task.status !== 'closed' ? 'bg-red-50' : ''}>
                  <TableCell className="font-medium">{task.client}</TableCell>
                  <TableCell>{task.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>{task.assignedTo}</TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <div className={
                        isOverdue(task.dueDate) && task.status !== 'closed'
                          ? 'text-red-600 font-medium'
                          : isTodayOrFuture(task.dueDate)
                          ? 'text-green-600'
                          : ''
                      }>
                        {task.dueDate}
                        {isOverdue(task.dueDate) && task.status !== 'closed' && (
                          <div className="text-xs text-red-500">Overdue</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No due date</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewTask(task)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditTask(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Showing{" "}
                  {startIndex + 1}{" "}
                  to{" "}
                  {Math.min(endIndex, filteredTasks.length)}{" "}
                  of {filteredTasks.length} results
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

      {selectedTask && (
        <>
          <SupervisorViewTaskDialog
            isOpen={isViewDialogOpen}
            onClose={() => {
              setIsViewDialogOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
          />
          
          <SupervisorEditTaskDialog
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
            onUpdate={handleUpdateTask}
          />
        </>
      )}
    </div>
  );
};

export default SupervisorTaskManagement;