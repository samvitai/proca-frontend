import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, BarChart3, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  fetchTaskReport, 
  fetchInvoiceRegisterReport,
  fetchAgingReport,
  fetchRevenueByClientReport,
  fetchClientStatementReport,
  exportReport,
  type ReportTask,
  type ReportFilters,
  type InvoiceRegisterReport,
  type AgingReport,
  type RevenueByClientReport,
  type ClientStatementReport
} from "@/services/reportService";
import { api } from "@/lib/utils";

type ReportType = 'tasks' | 'invoice-register' | 'aging' | 'revenue-by-client' | 'client-statement';

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

const AdminReportsManagement = () => {
  const [reportType, setReportType] = useState<ReportType>('tasks');
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
  const [invoiceRegister, setInvoiceRegister] = useState<InvoiceRegisterReport[]>([]);
  const [agingReport, setAgingReport] = useState<AgingReport[]>([]);
  const [revenueByClient, setRevenueByClient] = useState<RevenueByClientReport[]>([]);
  const [clientStatement, setClientStatement] = useState<ClientStatementReport | null>(null);

  // Filter options
  const [clients, setClients] = useState<Client[]>([]);
  const [assignees, setAssignees] = useState<User[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedClientForStatement, setSelectedClientForStatement] = useState<string>("");

  // Stats for task report
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

  // Reset data when report type changes
  useEffect(() => {
    setTasks([]);
    setInvoiceRegister([]);
    setAgingReport([]);
    setRevenueByClient([]);
    setClientStatement(null);
    setStats({
      total: 0,
      assigned: 0,
      completed: 0,
      overdue: 0
    });
  }, [reportType]);

  // Fetch report data
  useEffect(() => {
    if (reportType === 'client-statement' && !selectedClientForStatement) {
      return; // Don't fetch if no client selected
    }

    const loadReport = async () => {
      setIsLoading(true);
      try {
        switch (reportType) {
          case 'tasks':
            await loadTaskReport();
            break;
          case 'invoice-register':
            await loadInvoiceRegisterReport();
            break;
          case 'aging':
            await loadAgingReport();
            break;
          case 'revenue-by-client':
            await loadRevenueByClientReport();
            break;
          case 'client-statement':
            if (selectedClientForStatement) {
              await loadClientStatementReport();
            }
            break;
        }
      } catch (error) {
        console.error('Error loading report:', error);
        toast({
          title: "Error",
          description: "Failed to load report data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [reportType, selectedClientForStatement, assignmentStatusFilter, workflowStatusFilter, 
      workflowStatusGroupFilter, assigneeFilter, clientFilter, serviceCategoryFilter, 
      dueDateFrom, dueDateTo, searchTerm]);

  const loadTaskReport = async () => {
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
      
      // Ensure we have an array
      const taskList: ReportTask[] = Array.isArray(response.data) ? response.data : [];
      
      setTasks(taskList);
      
      // Calculate stats - ensure taskList is an array
      if (Array.isArray(taskList)) {
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
      } else {
        setStats({
          total: 0,
          assigned: 0,
          completed: 0,
          overdue: 0
        });
      }
    } catch (error) {
      console.error('Error loading task report:', error);
      setTasks([]);
      setStats({
        total: 0,
        assigned: 0,
        completed: 0,
        overdue: 0
      });
      throw error;
    }
  };

  const loadInvoiceRegisterReport = async () => {
    try {
      const filters = {
        clientId: clientFilter !== 'all' ? clientFilter : undefined,
        dateFrom: dueDateFrom || undefined,
        dateTo: dueDateTo || undefined,
      };
      const response = await fetchInvoiceRegisterReport(filters);
      const data: InvoiceRegisterReport[] = Array.isArray(response.data) ? response.data : [];
      setInvoiceRegister(data);
    } catch (error) {
      console.error('Error loading invoice register report:', error);
      setInvoiceRegister([]);
      throw error;
    }
  };

  const loadAgingReport = async () => {
    try {
      const filters = {
        clientId: clientFilter !== 'all' ? clientFilter : undefined,
        asOfDate: dueDateTo || undefined,
      };
      const response = await fetchAgingReport(filters);
      const data: AgingReport[] = Array.isArray(response.data) ? response.data : [];
      setAgingReport(data);
    } catch (error) {
      console.error('Error loading aging report:', error);
      setAgingReport([]);
      throw error;
    }
  };

  const loadRevenueByClientReport = async () => {
    try {
      const filters = {
        dateFrom: dueDateFrom || undefined,
        dateTo: dueDateTo || undefined,
        clientId: clientFilter !== 'all' ? clientFilter : undefined,
      };
      const response = await fetchRevenueByClientReport(filters);
      const data: RevenueByClientReport[] = Array.isArray(response.data) ? response.data : [];
      setRevenueByClient(data);
    } catch (error) {
      console.error('Error loading revenue by client report:', error);
      setRevenueByClient([]);
      throw error;
    }
  };

  const loadClientStatementReport = async () => {
    try {
      const filters = {
        dateFrom: dueDateFrom || undefined,
        dateTo: dueDateTo || undefined,
      };
      const response = await fetchClientStatementReport(selectedClientForStatement, filters);
      setClientStatement(response.data || null);
    } catch (error) {
      console.error('Error loading client statement report:', error);
      throw error;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let filters: any = {};
      
      if (reportType === 'tasks') {
        filters = {
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
      } else if (reportType === 'invoice-register') {
        filters = {
          clientId: clientFilter !== 'all' ? clientFilter : undefined,
          dateFrom: dueDateFrom || undefined,
          dateTo: dueDateTo || undefined,
        };
      } else if (reportType === 'aging') {
        filters = {
          clientId: clientFilter !== 'all' ? clientFilter : undefined,
          asOfDate: dueDateTo || undefined,
        };
      } else if (reportType === 'revenue-by-client') {
        filters = {
          dateFrom: dueDateFrom || undefined,
          dateTo: dueDateTo || undefined,
          clientId: clientFilter !== 'all' ? clientFilter : undefined,
        };
      } else if (reportType === 'client-statement') {
        filters = {
          dateFrom: dueDateFrom || undefined,
          dateTo: dueDateTo || undefined,
        };
      }

      const blob = await exportReport(
        reportType,
        exportFormat as 'xlsx' | 'csv',
        filters,
        reportType === 'client-statement' ? selectedClientForStatement : undefined
      );

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.${exportFormat}`;
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

  // Filter tasks based on search (client-side filtering for search term)
  const filteredTasks = Array.isArray(tasks) ? tasks.filter(task => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      task.name.toLowerCase().includes(searchLower) ||
      task.client.toLowerCase().includes(searchLower) ||
      (task.description && task.description.toLowerCase().includes(searchLower))
    );
  }) : [];

  return (
    <div className="space-y-6">
      {/* Report Type Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Report Type:</label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tasks">Task Report</SelectItem>
                <SelectItem value="invoice-register">Invoice Register</SelectItem>
                <SelectItem value="aging">Aging Report (Receivables)</SelectItem>
                <SelectItem value="revenue-by-client">Revenue by Client</SelectItem>
                <SelectItem value="client-statement">Client Statement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards - Only for Task Report */}
      {reportType === 'tasks' && (
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
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {reportType === 'tasks' && 'Project Reports'}
              {reportType === 'invoice-register' && 'Invoice Register Report'}
              {reportType === 'aging' && 'Aging Report (Receivables)'}
              {reportType === 'revenue-by-client' && 'Revenue by Client Report'}
              {reportType === 'client-statement' && 'Client Statement Report'}
            </CardTitle>
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
          {reportType === 'tasks' && (
            <>
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
            </>
          )}

          {/* Filters for other report types */}
          {reportType !== 'tasks' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {reportType === 'client-statement' && (
                <Select value={selectedClientForStatement} onValueChange={setSelectedClientForStatement}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.client_id} value={client.client_id}>
                        {client.client_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {(reportType === 'invoice-register' || reportType === 'aging' || reportType === 'revenue-by-client') && (
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
              )}

              <Input
                type="date"
                placeholder="Date from"
                value={dueDateFrom}
                onChange={(e) => setDueDateFrom(e.target.value)}
              />

              <Input
                type="date"
                placeholder="Date to"
                value={dueDateTo}
                onChange={(e) => setDueDateTo(e.target.value)}
              />
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-ca-primary" />
            </div>
          ) : (
            <>
              {/* Task Report Table */}
              {reportType === 'tasks' && (
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

              {/* Invoice Register Report Table */}
              {reportType === 'invoice-register' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Invoice Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Outstanding Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!Array.isArray(invoiceRegister) || invoiceRegister.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No invoices found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoiceRegister.map((invoice, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.invoice_date}</TableCell>
                          <TableCell>{invoice.client_name}</TableCell>
                          <TableCell>{invoice.task_name}</TableCell>
                          <TableCell>₹{invoice.invoice_amount.toLocaleString()}</TableCell>
                          <TableCell>₹{invoice.paid_amount.toLocaleString()}</TableCell>
                          <TableCell>₹{invoice.outstanding_amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{invoice.due_date}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Aging Report Table */}
              {reportType === 'aging' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Invoice Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Outstanding Amount</TableHead>
                      <TableHead>Days Overdue</TableHead>
                      <TableHead>Age Bucket</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!Array.isArray(agingReport) || agingReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No aging data found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      agingReport.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.client_name}</TableCell>
                          <TableCell>{item.invoice_number}</TableCell>
                          <TableCell>{item.invoice_date}</TableCell>
                          <TableCell>{item.due_date}</TableCell>
                          <TableCell>₹{item.invoice_amount.toLocaleString()}</TableCell>
                          <TableCell>₹{item.paid_amount.toLocaleString()}</TableCell>
                          <TableCell>₹{item.outstanding_amount.toLocaleString()}</TableCell>
                          <TableCell>{item.days_overdue}</TableCell>
                          <TableCell>
                            <Badge>{item.age_bucket}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Revenue by Client Report Table */}
              {reportType === 'revenue-by-client' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Total Invoices</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Outstanding Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!Array.isArray(revenueByClient) || revenueByClient.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No revenue data found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      revenueByClient.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.client_name}</TableCell>
                          <TableCell>{item.total_invoices}</TableCell>
                          <TableCell>₹{item.total_revenue.toLocaleString()}</TableCell>
                          <TableCell>₹{item.paid_amount.toLocaleString()}</TableCell>
                          <TableCell>₹{item.outstanding_amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {/* Client Statement Report */}
              {reportType === 'client-statement' && (
                <div className="space-y-4">
                  {clientStatement ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Opening Balance</p>
                            <p className="text-2xl font-bold">₹{clientStatement.opening_balance.toLocaleString()}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground">Closing Balance</p>
                            <p className="text-2xl font-bold">₹{clientStatement.closing_balance.toLocaleString()}</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Invoices</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Invoice Number</TableHead>
                                <TableHead>Invoice Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Paid Amount</TableHead>
                                <TableHead>Outstanding</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Array.isArray(clientStatement.invoices) && clientStatement.invoices.length > 0 ? (
                                clientStatement.invoices.map((invoice, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{invoice.invoice_number}</TableCell>
                                    <TableCell>{invoice.invoice_date}</TableCell>
                                    <TableCell>₹{invoice.amount.toLocaleString()}</TableCell>
                                    <TableCell>₹{invoice.paid_amount.toLocaleString()}</TableCell>
                                    <TableCell>₹{invoice.outstanding_amount.toLocaleString()}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                    No invoices found.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-2">Payments</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Payment Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Invoice Number</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Array.isArray(clientStatement.payments) && clientStatement.payments.length > 0 ? (
                                clientStatement.payments.map((payment, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{payment.payment_date}</TableCell>
                                    <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                                    <TableCell>{payment.invoice_number}</TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                    No payments found.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Please select a client to view the statement.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReportsManagement;

