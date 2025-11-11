import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// TypeScript Interfaces
interface Task {
  task_id: string;
  task_name: string;
  client_name: string;
  service_description: string;
  workflow_status: string;
  due_date: string;
  created_date: string;
  amount: string;
}

interface TasksResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    tasks: Task[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
  timestamp: string;
  request_id: string;
}

const ClientTasks = () => {
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    
    if (!email || role !== 'client') {
      navigate('/auth/signin');
      return;
    }
    
    setUserEmail(email);
  }, [navigate]);

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      if (!userEmail) return;

      setLoading(true);
      setError(null);

      try {
        const authToken = localStorage.getItem('authToken');
        const clientId = localStorage.getItem('clientId');
        
        if (!authToken) {
          navigate('/auth/signin');
          return;
        }

        if (!clientId) {
          setError('Client ID not found. Please sign in again.');
          setLoading(false);
          return;
        }

        // Build query parameters
        const params = new URLSearchParams({
          client_id: clientId,
          page: page.toString(),
          limit: '10' // Items per page as per API spec
        });

        if (workflowStatusFilter) {
          params.append('workflow_status', workflowStatusFilter);
        }

        const response = await axios.get<TasksResponse>(
          `${API_BASE_URL}/api/client-portal/tasks?${params.toString()}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data?.success && response.data?.data) {
          const { tasks, pagination } = response.data.data;
          setTasks(Array.isArray(tasks) ? tasks : []);
          setTotal(pagination?.total || 0);
          setTotalPages(pagination?.pages || 1);
        } else {
          // Handle case where response structure is different
          console.warn('Unexpected response structure:', response.data);
          throw new Error(response.data?.message || 'Failed to fetch tasks - unexpected response format');
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          const errorData = err.response?.data;
          
          if (status === 401 || status === 403) {
            // Handle authentication/authorization errors
            let errorMessage = 'Authentication failed';
            
            if (errorData?.detail) {
              errorMessage = typeof errorData.detail === 'string' 
                ? errorData.detail 
                : errorData.message || 'User not found or inactive';
            } else if (errorData?.message) {
              errorMessage = errorData.message;
            }
            
            // Check if it's a client contact authentication issue
            if (errorMessage.includes('User not found') || errorMessage.includes('inactive')) {
              setError(`Client Portal Access Error: ${errorMessage}. This may be because your client contact is not properly configured in the system. Please contact support.`);
              toast({
                title: "Access Denied",
                description: errorMessage,
                variant: "destructive"
              });
              return; // Don't redirect, show error instead
            }
            
            // For other auth errors, redirect to login
            toast({
              title: "Session Expired",
              description: "Please sign in again",
              variant: "destructive"
            });
            navigate('/auth/signin');
            return;
          }
          
          // Handle other errors
          const errorMessage = errorData?.detail || errorData?.message || 'Failed to load tasks';
          const errorText = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage);
          setError(errorText);
          toast({
            title: "Error",
            description: errorText,
            variant: "destructive"
          });
        } else {
          const errorText = 'An unexpected error occurred';
          setError(errorText);
          toast({
            title: "Error",
            description: errorText,
            variant: "destructive"
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [userEmail, page, workflowStatusFilter, navigate]);

  // Map workflow_status to display status
  const mapWorkflowStatus = (workflowStatus: string): 'completed' | 'ongoing' => {
    const completedStatuses = ['completed', 'closed', 'done', 'finished'];
    return completedStatuses.includes(workflowStatus?.toLowerCase()) ? 'completed' : 'ongoing';
  };

  const getStatusBadge = (workflowStatus: string) => {
    const status = mapWorkflowStatus(workflowStatus);
    const variants = {
      'completed': 'default',
      'ongoing': 'secondary'
    } as const;

    const colors = {
      'completed': 'text-green-700 bg-green-100',
      'ongoing': 'text-blue-700 bg-blue-100'
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {workflowStatus || (status === 'completed' ? 'Completed' : 'Ongoing')}
      </Badge>
    );
  };

  const calculateDueDateFilter = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch(dueDateFilter) {
      case "overdue":
        return (task: Task) => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today && mapWorkflowStatus(task.workflow_status) !== 'completed';
        };
      case "7":
        return (task: Task) => {
          if (!task.due_date) return true;
          const dueDate = new Date(task.due_date);
          const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return dueDate <= sevenDaysLater;
        };
      case "15":
        return (task: Task) => {
          if (!task.due_date) return true;
          const dueDate = new Date(task.due_date);
          const fifteenDaysLater = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
          return dueDate <= fifteenDaysLater;
        };
      case "20":
        return (task: Task) => {
          if (!task.due_date) return true;
          const dueDate = new Date(task.due_date);
          const twentyDaysLater = new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000);
          return dueDate <= twentyDaysLater;
        };
      case "31":
        return (task: Task) => {
          if (!task.due_date) return true;
          const dueDate = new Date(task.due_date);
          const thirtyOneDaysLater = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000);
          return dueDate <= thirtyOneDaysLater;
        };
      case "45":
        return (task: Task) => {
          if (!task.due_date) return true;
          const dueDate = new Date(task.due_date);
          const fortyFiveDaysLater = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);
          return dueDate <= fortyFiveDaysLater;
        };
      case "all":
      default:
        return () => true;
    }
  };

  // Helper function to check if a task is overdue
  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  if (!userEmail) {
    return null;
  }

  const filteredTasks = tasks.filter(calculateDueDateFilter());
  // Show all tasks including closed/completed tasks
  const allTasks = filteredTasks;
  const ongoingTasks = allTasks.filter(task => mapWorkflowStatus(task.workflow_status) === 'ongoing');
  const completedTasks = allTasks.filter(task => mapWorkflowStatus(task.workflow_status) === 'completed');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="client" email={userEmail} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ca-primary mb-2">
              My Projects
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your project progress and Project completion
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Due date filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="7">Next 7 Days</SelectItem>
                <SelectItem value="15">Next 15 Days</SelectItem>
                <SelectItem value="20">Next 20 Days</SelectItem>
                <SelectItem value="31">Next 31 Days</SelectItem>
                <SelectItem value="45">Next 45 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={workflowStatusFilter || "all"} onValueChange={(value) => setWorkflowStatusFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Summary */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{allTasks.length}</div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">{ongoingTasks.length}</div>
                  <p className="text-sm text-muted-foreground">Ongoing Projects</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
                  <p className="text-sm text-muted-foreground">Completed Projects</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-orange-600">{ongoingTasks.filter(task => isOverdue(task.due_date)).length}</div>
                  <p className="text-sm text-muted-foreground">Overdue Projects</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-ca-primary" />
              <span className="ml-2 text-muted-foreground">Loading Projects...</span>
            </div>
          )}

          {!loading && (
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ongoing" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="ongoing" className="mt-4">
                    {ongoingTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No ongoing projects found
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Project Name</TableHead>
                              <TableHead>Client Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Due Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {ongoingTasks.map((task) => (
                              <TableRow key={task.task_id}>
                                <TableCell className="font-medium">{task.task_name}</TableCell>
                                <TableCell className="max-w-xs truncate">{task.client_name}</TableCell>
                                <TableCell className="max-w-xs truncate">{task.service_description || 'N/A'}</TableCell>
                                <TableCell>{getStatusBadge(task.workflow_status)}</TableCell>
                                <TableCell>{formatDate(task.due_date)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                              Page {page} of {totalPages} ({total} total tasks)
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                              >
                                Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="completed" className="mt-4">
                    {completedTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No completed projects found
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Project Name</TableHead>
                              <TableHead>Client Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Due Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {completedTasks.map((task) => (
                              <TableRow key={task.task_id}>
                                <TableCell className="font-medium">{task.task_name}</TableCell>
                                <TableCell className="max-w-xs truncate">{task.client_name}</TableCell>
                                <TableCell className="max-w-xs truncate">{task.service_description || 'N/A'}</TableCell>
                                <TableCell>{getStatusBadge(task.workflow_status)}</TableCell>
                                <TableCell>{formatDate(task.due_date)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                              Page {page} of {totalPages} ({total} total tasks)
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                              >
                                Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientTasks;