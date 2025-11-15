import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, BarChart3, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchTaskReport, exportReport, type ReportTask, type ReportFilters } from "@/services/reportService";
import { api } from "@/lib/utils";

interface Client {
  client_id: string;
  client_name: string;
  client_code: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ServiceCategory {
  service_category_id: string;
  service_category_name: string;
}

const SupervisorReportsManagement = () => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Data states
  const [tasks, setTasks] = useState<ReportTask[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    assigned: 0,
    completed: 0,
    overdue: 0
  });

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Fetch clients
        const clientsRes = await api.get("/api/clients/?is_active=true");
        const clientsData = clientsRes.data?.data?.clients || [];
        setClients(clientsData);

        // Fetch users (for assignees)
        const usersRes = await api.get("/api/v1/users/organization/users?role=USERS");
        const usersData = usersRes.data || {};
        const allUsers = [
          ...(usersData.admin || []),
          ...(usersData.supervisor || []),
          ...(usersData.employee || []),
        ].filter((user: User) => user.is_active);
        setAssignees(allUsers);

        // Fetch service categories
        const categoriesRes = await api.get("/api/master/service-categories?is_active=true");
        const categoriesData = categoriesRes.data?.data?.service_categories || [];
        setServiceCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };

    fetchFilterOptions();
  }, []);

  // Fetch report data
  useEffect(() => {
    const loadTaskReport = async () => {
      setIsLoading(true);
      try {
        const filters: ReportFilters = {
          assignmentStatus: assignmentStatusFilter as any,
          workflowStatus: workflowStatusFilter as any,
          workflowStatusGroup: workflowStatusGroupFilter as any,
          assigneeId: assigneeFilter !== 'all' ? assigneeFilter : undefined,
          clientId: clientFilter !== 'all' ? clientFilter : undefined,
          serviceCategoryId: serviceCategoryFilter !== 'all' ? serviceCategoryFilter : undefined,
          dueDateFrom: dueDateFrom || undefined,
          dueDateTo: dueDateTo || undefined,
          search: searchTerm || undefined,
        };

        const response = await fetchTaskReport(filters);
        const taskList: ReportTask[] = Array.isArray(response.data) ? response.data : [];
        setTasks(taskList);
        
        // Calculate stats
        setStats({
          total: taskList.length,
          assigned: taskList.filter(t => t.assignmentStatus === 'assigned').length,
          completed: taskList.filter(t => t.workflowStatusGroup === 'completed').length,
          overdue: taskList.filter(t => {
            const dueDate = new Date(t.dueDate);
            const now = new Date();
            return dueDate < now && t.workflowStatusGroup === 'pending';
          }).length
        });
      } catch (error) {
        console.error('Error loading task report:', error);
        toast({
          title: "Error",
          description: "Failed to load report data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTaskReport();
  }, [assignmentStatusFilter, workflowStatusFilter, workflowStatusGroupFilter, 
      assigneeFilter, clientFilter, serviceCategoryFilter, dueDateFrom, dueDateTo, searchTerm]);

  // Filter tasks based on search (client-side filtering for search term)
  const filteredTasks = tasks.filter(task => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      task.name.toLowerCase().includes(searchLower) ||
      task.client.toLowerCase().includes(searchLower) ||
      (task.description && task.description.toLowerCase().includes(searchLower))
    );
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filters: any = {
        assignmentStatus: assignmentStatusFilter,
        workflowStatus: workflowStatusFilter,
        workflowStatusGroup: workflowStatusGroupFilter,
        assigneeId: assigneeFilter !== 'all' ? assigneeFilter : undefined,
        clientId: clientFilter !== 'all' ? clientFilter : undefined,
        serviceCategoryId: serviceCategoryFilter !== 'all' ? serviceCategoryFilter : undefined,
        dueDateFrom: dueDateFrom || undefined,
        dueDateTo: dueDateTo || undefined,
        search: searchTerm || undefined,
      };

      const blob = await exportReport('tasks', exportFormat as 'xlsx' | 'csv', filters);
      
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task-report.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `Report exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting report:', error);
    toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
    });
    } finally {
      setIsExporting(false);
    }
  };

  const getWorkflowStatusBadge = (status: ReportTask['workflowStatus']) => {
    const colors = {
      'open': 'bg-gray-500',
      'in_progress': 'bg-blue-500',
      'in_review': 'bg-yellow-500',
      'closed': 'bg-green-500'
    };

    return (
      <Badge className={colors[status]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getAssignmentStatusBadge = (status: ReportTask['assignmentStatus']) => {
    return (
      <Badge variant={status === 'assigned' ? 'default' : 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getWorkflowStatusGroupBadge = (group: ReportTask['workflowStatusGroup']) => {
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
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold text-ca-primary">{stats.total}</p>
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
                <p className="text-2xl font-bold text-ca-primary">{stats.assigned}</p>
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
                <p className="text-2xl font-bold text-ca-primary">{stats.completed}</p>
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
                <p className="text-2xl font-bold text-ca-primary">{stats.overdue}</p>
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
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
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
                      <SelectItem key={assignee.id} value={assignee.id}>
                        {assignee.first_name} {assignee.last_name}
                      </SelectItem>
                    ))}
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
                  <SelectItem key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </SelectItem>
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
                  <SelectItem key={category.service_category_id} value={category.service_category_id}>
                    {category.service_category_name}
                  </SelectItem>
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
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-ca-primary" />
            </div>
          ) : (
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
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No projects found matching the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>{task.client}</TableCell>
                      <TableCell>{task.serviceCategory}</TableCell>
                      <TableCell>{getAssignmentStatusBadge(task.assignmentStatus)}</TableCell>
                      <TableCell>{getWorkflowStatusBadge(task.workflowStatus)}</TableCell>
                      <TableCell>{getWorkflowStatusGroupBadge(task.workflowStatusGroup)}</TableCell>
                      <TableCell>{task.assigneeName || 'Unassigned'}</TableCell>
                      <TableCell>{task.dueDate}</TableCell>
                      <TableCell>{task.createdAt}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorReportsManagement;