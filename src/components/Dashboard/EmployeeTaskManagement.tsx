/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, Edit, Search, Loader2, AlertCircle, FileText, Clock, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/utils";
import axios, { AxiosError } from "axios";
import EmployeeViewTaskDialog from "./EmployeeViewTaskDialog";
import EmployeeEditTaskDialog from "./EmployeeEditTaskDialog";

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

interface Task {
  id: string;
  client: string;
  name: string;
  description: string;
  status: 'open' | 'in-progress' | 'pending-review' | 'ready-for-close' | 'closed';
  assignedTo: string;
  assignedToId?: string | null; // Add assignee ID field
  createdAt: string;
  dueDate: string;
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
  }>;
}

const EmployeeTaskManagement = () => {
  // Dialog States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");
  const [clarificationFilter, setClarificationFilter] = useState<string>("all");
  
  // Client-side Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Data States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Debug mode: Set to true to show all tasks (for debugging)
  const DEBUG_SHOW_ALL_TASKS = false;
  
  // Get current user info from localStorage
  const currentUser = localStorage.getItem('userName') || 
                      localStorage.getItem('user_name') || 
                      localStorage.getItem('email') || 
                      "Employee";
  const currentUserId = localStorage.getItem('userId') || 
                       localStorage.getItem('user_id') || 
                       localStorage.getItem('id');

  // Debug: Log user info
  console.log('Current User Info:', {
    currentUser,
    currentUserId,
    allLocalStorage: Object.keys(localStorage).reduce((acc, key) => {
      acc[key] = localStorage.getItem(key);
      return acc;
    }, {} as Record<string, string | null>)
  });

  // Helper functions
  const getSafeStringValue = (
    value: string | null | undefined,
    defaultValue: string = ""
  ): string => {
    return value === null || value === undefined || value === ""
      ? defaultValue
      : String(value);
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

  // Transform API response to UI format
  const transformApiTaskToUi = (apiTask: ApiTask): Task => {
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

    return {
      id: apiTask.task_id,
      client: safeClientName,
      name: safeTaskName,
      description: safeDescription,
      status: mapWorkflowStatus(apiTask.workflow_status),
      assignedTo: safeAssigneeName,
      assignedToId: apiTask.assignee_id, // Preserve the assignee ID
      createdAt: new Date(apiTask.created_at).toISOString().split("T")[0],
      dueDate: apiTask.due_date
        ? new Date(apiTask.due_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
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
      })),
    };
  };

  // Error handling helper
  const handleApiError = (error: unknown): string => {
    console.error("API Error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;

        switch (status) {
          case 400:
            return data?.message || "Invalid request. Please check your input.";
          case 401:
            return "Authentication required. Please log in again.";
          case 403:
            return "You don't have permission to access this resource.";
          case 404:
            return "Requested resource not found.";
          case 500:
            return data?.message || "Server error. Please try again later.";
          default:
            return data?.message || `Error: ${status}`;
        }
      } else if (axiosError.request) {
        return "No response from server. Please check your internet connection.";
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "An unexpected error occurred. Please try again.";
  };

  // Fetch tasks from API - filtered for current employee
  const fetchTasks = async (): Promise<void> => {
    try {
      setIsInitialLoading(true);
      setError(null);

      // Fetch tasks with maximum allowed limit (100 per page)
      const response = await api.get<ApiListResponse>(
        `/api/tasks/?page=1&limit=100`
      );

      if (response.data.success) {
        // Check if response contains list data structure
        if (
          typeof response.data.data === "object" &&
          "tasks" in response.data.data &&
          response.data.data.tasks
        ) {
          // Filter tasks assigned to current employee
          const allTasks = response.data.data.tasks;
          
          console.log('Total tasks fetched from API:', allTasks.length);
          console.log('Sample task for debugging:', allTasks[0]);
          console.log('All tasks:', allTasks);
          
          // Filter by assignee_id or assignee_name (or show all in debug mode)
          const myTasks = DEBUG_SHOW_ALL_TASKS ? allTasks : allTasks.filter(task => {
            console.log('Checking task:', {
              task_id: task.task_id,
              assignee_id: task.assignee_id,
              assignee_name: task.assignee_name,
              currentUserId,
              currentUser
            });
            
            // First try matching by ID
            if (currentUserId && task.assignee_id) {
              const match = task.assignee_id === currentUserId || 
                           task.assignee_id.toString() === currentUserId.toString();
              console.log('ID match result:', match);
              if (match) return true;
            }
            
            // Fallback to name matching if ID not available or doesn't match
            if (task.assignee_name && currentUser) {
              const match = task.assignee_name.toLowerCase().includes(currentUser.toLowerCase()) ||
                           currentUser.toLowerCase().includes(task.assignee_name.toLowerCase());
              console.log('Name match result:', match);
              if (match) return true;
            }
            
            return false;
          });

          console.log('Filtered tasks for current employee:', myTasks.length);
          console.log('DEBUG_SHOW_ALL_TASKS mode:', DEBUG_SHOW_ALL_TASKS);

          const transformedTasks = myTasks.map(transformApiTaskToUi);
          
          // Sort by due date (earliest first)
          const sortedTasks = transformedTasks.sort((a, b) => 
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          );
          
          console.log('Final tasks to display:', sortedTasks);
          setTasks(sortedTasks);
        } else if (
          typeof response.data.data === "object" &&
          "task_id" in response.data.data
        ) {
          // Handle single task response format (fallback)
          const singleTask = transformApiTaskToUi(
            response.data.data as ApiTask
          );
          
          // Only include if assigned to current employee
          if (singleTask.assignedTo.toLowerCase().includes(currentUser.toLowerCase())) {
            setTasks([singleTask]);
          } else {
            setTasks([]);
          }
        } else {
          throw new Error("Unexpected response format");
        }
      } else {
        throw new Error("Failed to fetch tasks");
      }
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Load tasks on component mount
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clients = Array.from(new Set(tasks.map(task => task.client)));

  const calculateDueDateFilter = () => {
    const today = new Date();
    switch(dueDateFilter) {
      case "all":
        return () => true;
      case "overdue":
        return (task: Task) => new Date(task.dueDate) < today && task.status !== 'closed';
      case "1":
        return (task: Task) => new Date(task.dueDate) <= new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
      case "3":
        return (task: Task) => new Date(task.dueDate) <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      case "7":
        return (task: Task) => new Date(task.dueDate) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      case "14":
        return (task: Task) => new Date(task.dueDate) <= new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      case "15":
        return (task: Task) => new Date(task.dueDate) <= new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
      case "20":
        return (task: Task) => new Date(task.dueDate) <= new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000);
      case "30":
        return (task: Task) => new Date(task.dueDate) <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      case "31":
        return (task: Task) => new Date(task.dueDate) <= new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000);
      case "45":
        return (task: Task) => new Date(task.dueDate) <= new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);
      default:
        return () => true;
    }
  };

  // Helper function to check if a task is overdue
  const isOverdue = (dueDate: string) => {
    const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const due = toDateOnly(new Date(dueDate));
    const today = toDateOnly(new Date());
    return due < today;
  };

  const isTodayOrFuture = (dueDate: string) => {
    const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const due = toDateOnly(new Date(dueDate));
    const today = toDateOnly(new Date());
    return due >= today;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = clientFilter === "all" || task.client === clientFilter;
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
    
    return matchesSearch && matchesClient && matchesDueDate && matchesClarification && isNotClosed;
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

  // Calculate stats for cards
  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'closed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingReviewTasks = tasks.filter(t => t.status === 'pending-review').length;

  const handleViewTask = (task: Task) => {
    console.log('Opening view dialog for task:', task);
    if (!task || !task.id) {
      console.error('Invalid task data:', task);
      toast({
        title: "Error",
        description: "Unable to load Project details. Please try again.",
        variant: "destructive",
      });
      return;
    }
    setSelectedTask(task);
    setIsViewDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    console.log('Opening edit dialog for task:', task);
    if (!task || !task.id) {
      console.error('Invalid task data:', task);
      toast({
        title: "Error",
        description: "Unable to load Project details. Please try again.",
        variant: "destructive",
      });
      return;
    }
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      setIsLoading(true);
      
      // Update local state
      setTasks(tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
      
      setIsEditDialogOpen(false);
      
      // Note: API call is now handled in the dialog component
      // Just refresh tasks from server to ensure consistency
      await fetchTasks();
    } catch (error: unknown) {
      const errorMessage = handleApiError(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold text-ca-primary">{totalTasks}</p>
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
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
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
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-green-600" />
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
          <CardTitle>My Projects</CardTitle>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search Projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client} value={client}>{client}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Due date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Days</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="1">Next 1 Day</SelectItem>
                <SelectItem value="3">Next 3 Days</SelectItem>
                <SelectItem value="7">Next 7 Days</SelectItem>
                <SelectItem value="14">Next 14 Days</SelectItem>
                <SelectItem value="15">Next 15 Days</SelectItem>
                <SelectItem value="20">Next 20 Days</SelectItem>
                <SelectItem value="30">Next 30 Days</SelectItem>
                <SelectItem value="31">Next 31 Days</SelectItem>
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
          {isInitialLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading Projects...</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No Projects found matching your filters.</p>
              {tasks.length === 0 && (
                <p className="mt-2">You don't have any assigned Projects yet.</p>
              )}
            </div>
          ) : (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Project Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTasks.map((task) => (
                <TableRow key={task.id} className={isOverdue(task.dueDate) && task.status !== 'closed' ? 'bg-red-50' : ''}>
                  <TableCell className="font-medium">{task.client}</TableCell>
                  <TableCell>{task.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>
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
              ))}
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
          </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs - only render when we have a valid selected task */}
      {selectedTask && selectedTask.id && (
        <>
          <EmployeeViewTaskDialog
            isOpen={isViewDialogOpen}
            onClose={() => {
              setIsViewDialogOpen(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
          />
          
          <EmployeeEditTaskDialog
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

export default EmployeeTaskManagement;