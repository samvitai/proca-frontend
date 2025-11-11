import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Calendar, BarChart3 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReportTask {
  id: string;
  client: string;
  name: string;
  description: string;
  serviceCategory: string;
  assignmentStatus: 'assigned' | 'not_assigned';
  workflowStatus: 'open' | 'in_progress' | 'in_review' | 'closed';
  workflowStatusGroup: 'pending' | 'completed';
  assigneeId: string;
  assigneeName: string;
  clientId: string;
  serviceCategoryId: string;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
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
  const [exportFormat, setExportFormat] = useState<string>("xlsx");

  // Mock data
  const [tasks] = useState<ReportTask[]>([
    {
      id: "1",
      client: "ABC Corp",
      name: "GST Return Filing Q1",
      description: "File GST return for Q1 2024",
      serviceCategory: "Return Filing",
      assignmentStatus: "assigned",
      workflowStatus: "in_progress",
      workflowStatusGroup: "pending",
      assigneeId: "emp1",
      assigneeName: "John Doe",
      clientId: "client1",
      serviceCategoryId: "cat1",
      dueDate: "2024-02-15",
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      client: "XYZ Ltd",
      name: "Tax Consultation",
      description: "Provide tax consultation for new business setup",
      serviceCategory: "Consultation",
      assignmentStatus: "assigned",
      workflowStatus: "closed",
      workflowStatusGroup: "completed",
      assigneeId: "emp2",
      assigneeName: "Jane Smith",
      clientId: "client2",
      serviceCategoryId: "cat2",
      dueDate: "2024-02-10",
      createdAt: "2024-01-16",
      completedAt: "2024-02-08"
    },
    {
      id: "3",
      client: "DEF Inc",
      name: "Audit Report",
      description: "Complete annual audit report",
      serviceCategory: "Audit",
      assignmentStatus: "not_assigned",
      workflowStatus: "open",
      workflowStatusGroup: "pending",
      assigneeId: "",
      assigneeName: "",
      clientId: "client3",
      serviceCategoryId: "cat3",
      dueDate: "2024-03-01",
      createdAt: "2024-01-20"
    }
  ]);

  const clients = Array.from(new Set(tasks.map(task => task.client)));
  const assignees = Array.from(new Set(tasks.filter(task => task.assigneeName).map(task => task.assigneeName)));
  const serviceCategories = Array.from(new Set(tasks.map(task => task.serviceCategory)));

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAssignmentStatus = assignmentStatusFilter === "all" || task.assignmentStatus === assignmentStatusFilter;
    const matchesWorkflowStatus = workflowStatusFilter === "all" || task.workflowStatus === workflowStatusFilter;
    const matchesWorkflowStatusGroup = workflowStatusGroupFilter === "all" || task.workflowStatusGroup === workflowStatusGroupFilter;
    const matchesAssignee = assigneeFilter === "all" || task.assigneeName === assigneeFilter;
    const matchesClient = clientFilter === "all" || task.client === clientFilter;
    const matchesServiceCategory = serviceCategoryFilter === "all" || task.serviceCategory === serviceCategoryFilter;
    const matchesDueDateFrom = !dueDateFrom || task.dueDate >= dueDateFrom;
    const matchesDueDateTo = !dueDateTo || task.dueDate <= dueDateTo;
    
    return matchesSearch && matchesAssignmentStatus && matchesWorkflowStatus && 
           matchesWorkflowStatusGroup && matchesAssignee && matchesClient && 
           matchesServiceCategory && matchesDueDateFrom && matchesDueDateTo;
  });

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: `Exporting ${filteredTasks.length} records as ${exportFormat.toUpperCase()}`,
    });
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

  // Calculate statistics
  const stats = {
    total: filteredTasks.length,
    assigned: filteredTasks.filter(t => t.assignmentStatus === 'assigned').length,
    completed: filteredTasks.filter(t => t.workflowStatusGroup === 'completed').length,
    overdue: filteredTasks.filter(t => new Date(t.dueDate) < new Date() && t.workflowStatusGroup === 'pending').length
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
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
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
                  <SelectItem key={assignee} value={assignee}>{assignee}</SelectItem>
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
                  <SelectItem key={client} value={client}>{client}</SelectItem>
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
                  <SelectItem key={category} value={category}>{category}</SelectItem>
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
              ))}
            </TableBody>
          </Table>

          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No projects found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupervisorReportsManagement;