import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Calendar, BarChart3, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchTaskReport, TaskReport } from "@/services/reportService";
import { api } from "@/lib/utils";
import { exportTasks } from "@/lib/exportUtils";

interface Client {
  id: string;
  name: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

const EmployeeReportsManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>("all");
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState<string>("all");
  const [workflowStatusGroupFilter, setWorkflowStatusGroupFilter] = useState<string>("all");
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

  // Filter options
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);

  // Get current employee ID from localStorage
  const currentEmployeeId = localStorage.getItem('userId') || '';

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

  // Fetch tasks report - only for current employee
  useEffect(() => {
    const loadTaskReport = async () => {
      setLoading(true);
      try {
        const params: any = {
          assignee_id: extractNumericId(currentEmployeeId) // Filter by current employee
        };
        
        if (assignmentStatusFilter !== "all") {
          params.assignment_status = assignmentStatusFilter;
        }
        if (workflowStatusFilter !== "all") {
          params.workflow_status = workflowStatusFilter;
        }
        if (workflowStatusGroupFilter !== "all") {
          params.status_group = workflowStatusGroupFilter;
        }
        if (clientFilter !== "all") {
          params.client_id = extractNumericId(clientFilter);
        }
        if (serviceCategoryFilter !== "all") {
          params.service_category_id = extractNumericId(serviceCategoryFilter);
        }
        if (dueDateFrom) {
          params.due_date_from = dueDateFrom;
        }
        if (dueDateTo) {
          params.due_date_to = dueDateTo;
        }
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
        toast({
          title: "Error",
          description: error.response?.data?.message || error.message || "Failed to load task report",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentEmployeeId) {
      loadTaskReport();
    }
  }, [
    currentEmployeeId,
    assignmentStatusFilter,
    workflowStatusFilter,
    workflowStatusGroupFilter,
    clientFilter,
    serviceCategoryFilter,
    dueDateFrom,
    dueDateTo,
    searchTerm
  ]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleExport = () => {
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

      exportTasks(filteredTasks, exportFormat as 'csv' | 'xlsx', 'my-task-report');

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
      <Badge variant={group === 'completed' ? 'default' : 'secondary'} 
             className={group === 'completed' ? 'bg-green-500' : 'bg-orange-500'}>
        {group}
      </Badge>
    );
  };


  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-ca-accent/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-ca-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">My Tasks</p>
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
            <CardTitle>My Task Reports</CardTitle>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks..."
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
              </SelectContent>
            </Select>

            <Select value={workflowStatusGroupFilter} onValueChange={setWorkflowStatusGroupFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                <SelectItem value="pending">Ongoing Projects</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
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

            <Input
              type="date"
              placeholder="Due date from"
              value={dueDateFrom}
              onChange={(e) => setDueDateFrom(e.target.value)}
            />

            <Input
              type="date"
              placeholder="Due date to"
              value={dueDateTo}
              onChange={(e) => setDueDateTo(e.target.value)}
            />
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
                    <TableHead>Task Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service Category</TableHead>
                    <TableHead>Assignment Status</TableHead>
                    <TableHead>Workflow Status</TableHead>
                    <TableHead>Status Group</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Completed Date</TableHead>
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
                      <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{task.created_date ? new Date(task.created_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{task.completed_date ? new Date(task.completed_date).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredTasks.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks found matching the current filters.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeReportsManagement;