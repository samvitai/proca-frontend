import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, FileText, Search, Building, AlertTriangle, Download, X, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import AdminViewInvoiceDialog from "./AdminViewInvoiceDialog";
import ViewGeneratedInvoiceDialog from "./ViewGeneratedInvoiceDialog";
import { fetchInvoices, Invoice } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/utils";

// Task interface for fetching task data
interface Task {
  task_id: string;
  task_name: string;
  due_date: string | null;
  client_name: string;
}

const AdminInvoiceManagement = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isGeneratedInvoiceOpen, setIsGeneratedInvoiceOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [invoiceIdSearch, setInvoiceIdSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("current");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    total_amount: number;
    paid_amount: number;
    outstanding_amount: number;
  } | null>(null);
  const { toast } = useToast();

  // Sorting States
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch tasks from API with pagination
  const fetchTasks = async (): Promise<Task[]> => {
    try {
      let allTasks: Task[] = [];
      let page = 1;
      const limit = 100; // API limit
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await api.get(`/api/tasks/?page=${page}&limit=${limit}`);
        
        if (response.data.success && response.data.data.tasks) {
          const pageTasks = response.data.data.tasks.map((task: {
            task_id: string;
            task_name: string;
            due_date: string | null;
            client_name: string;
          }) => ({
            task_id: task.task_id,
            task_name: task.task_name,
            due_date: task.due_date,
            client_name: task.client_name
          }));
          
          allTasks = [...allTasks, ...pageTasks];
          
          // Check if there are more pages
          const pagination = response.data.data.pagination;
          hasMorePages = pagination && page < pagination.total_pages;
          page++;
        } else {
          hasMorePages = false;
        }
      }
      
      return allTasks;
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      return [];
    }
  };

  // Load invoices and tasks from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load invoices and tasks in parallel
        const [invoiceResult, tasksData] = await Promise.all([
          fetchInvoices(),
          fetchTasks()
        ]);
        
        setInvoices(invoiceResult.invoices);
        setTasks(tasksData);
        setSummary(invoiceResult.summary);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: "Error",
          description: "Failed to load invoices. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleStatusUpdate = (invoiceId: string, newStatus: Invoice['status']) => {
    // Update the invoice in the local state
    setInvoices(prevInvoices => 
      prevInvoices.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: newStatus }
          : inv
      )
    );
    // Also update selectedInvoice if it's the same one
    setSelectedInvoice(prev => 
      prev && prev.id === invoiceId 
        ? { ...prev, status: newStatus }
        : prev
    );
  };

  const handleCommentUpdate = (invoiceId: string, comment: string | undefined) => {
    // Update the invoice comment in the local state
    setInvoices(prevInvoices => 
      prevInvoices.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, comment: comment }
          : inv
      )
    );
    // Also update selectedInvoice if it's the same one
    setSelectedInvoice(prev => 
      prev && prev.id === invoiceId 
        ? { ...prev, comment: comment }
        : prev
    );
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleViewGeneratedInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsGeneratedInvoiceOpen(true);
  };

  const handleViewInvoicePDF = (invoice: Invoice) => {
    if (invoice.invoiceUrl) {
      window.open(invoice.invoiceUrl, '_blank');
    } else {
      toast({
        title: "Error",
        description: "Invoice PDF not available.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      'paid': 'default',
      'unpaid': 'secondary',
      'partial': 'outline',
      'overdue': 'destructive'
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.taskName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = invoice.customer.toLowerCase().includes(companySearch.toLowerCase());
    const matchesInvoiceId = invoice.id.toLowerCase().includes(invoiceIdSearch.toLowerCase());
    const matchesCustomer = !customerFilter || customerFilter === "all" || invoice.customer === customerFilter;
    const matchesStatus = !statusFilter || statusFilter === "all" || invoice.status === statusFilter;
    
    // Tab filtering
    const tabFilter = activeTab === "current" 
      ? ['unpaid', 'partial', 'overdue'].includes(invoice.status)
      : invoice.status === 'paid';
    
    return matchesSearch && matchesCompany && matchesInvoiceId && matchesCustomer && matchesStatus && tabFilter;
  });

  const customers = Array.from(new Set(invoices.map(invoice => invoice.customer)));
  
  // Calculate aging - days overdue or days remaining
  // Due date is calculated as T+5 (5 days after creation)
  // Overdue days start counting from T+6 (6th day after creation)
  const getAgingInfo = (invoice: Invoice) => {
    if (invoice.status === 'paid') return { text: 'Paid', variant: 'default' as const };
    
    if (!invoice.createdAt) {
      return { text: 'No creation date', variant: 'secondary' as const };
    }
    
    const today = new Date();
    const creationDate = new Date(invoice.createdAt);
    
    // Reset time to start of day for accurate calculation
    today.setHours(0, 0, 0, 0);
    creationDate.setHours(0, 0, 0, 0);
    
    // Calculate due date as T+5 (5 days after creation)
    const dueDate = new Date(creationDate);
    dueDate.setDate(dueDate.getDate() + 5);
    
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      // Overdue (counts from T+6, which is 1 day after T+5 due date)
      return { text: `${diffDays} days overdue`, variant: 'destructive' as const };
    } else if (diffDays === 0) {
      // Due today
      return { text: 'Due today', variant: 'secondary' as const };
    } else {
      // Not due yet
      const daysRemaining = Math.abs(diffDays);
      return { text: `${daysRemaining} days left`, variant: 'secondary' as const };
    }
  };

  // Sorting function
  const sortInvoices = (invoiceList: Invoice[]) => {
    if (!sortColumn) return invoiceList;

    return [...invoiceList].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortColumn) {
        case "invoiceId":
          aValue = a.id?.toLowerCase() || "";
          bValue = b.id?.toLowerCase() || "";
          break;
        case "customer":
          aValue = a.customer?.toLowerCase() || "";
          bValue = b.customer?.toLowerCase() || "";
          break;
        case "projectName":
          aValue = a.taskName?.toLowerCase() || "";
          bValue = b.taskName?.toLowerCase() || "";
          break;
        case "invoiceAmount":
          aValue = a.invoiceAmount || 0;
          bValue = b.invoiceAmount || 0;
          break;
        case "creditNote":
          aValue = a.creditNoteAmount || 0;
          bValue = b.creditNoteAmount || 0;
          break;
        case "amountDue":
          aValue = a.amountDue || 0;
          bValue = b.amountDue || 0;
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "aging": {
          // For aging, extract numeric value from aging text
          const agingA = getAgingInfo(a);
          const agingB = getAgingInfo(b);
          // Extract days from text (e.g., "5 days overdue" -> 5)
          const extractDays = (text: string) => {
            const match = text.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          };
          aValue = extractDays(agingA.text);
          bValue = extractDays(agingB.text);
          break;
        }
        case "createdDate":
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

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

  // Calculate counts based on all invoices (not filtered) for the tab labels
  const currentInvoicesCount = invoices.filter(inv => ['unpaid', 'partial', 'overdue'].includes(inv.status)).length;
  const historyInvoicesCount = invoices.filter(inv => inv.status === 'paid').length;
  
  // Filter invoices for display based on current filters and active tab
  const filteredCurrentInvoices = filteredInvoices.filter(inv => ['unpaid', 'partial', 'overdue'].includes(inv.status));
  const filteredHistoryInvoices = filteredInvoices.filter(inv => inv.status === 'paid');
  
  // Apply sorting
  const currentInvoices = sortInvoices(filteredCurrentInvoices);
  const historyInvoices = sortInvoices(filteredHistoryInvoices);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search company..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Invoice ID..."
                value={invoiceIdSearch}
                onChange={(e) => setInvoiceIdSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading invoices...</span>
            </div>
          ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current ({currentInvoicesCount})</TabsTrigger>
              <TabsTrigger value="history">History ({historyInvoicesCount})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Showing unpaid, partial paid, and overdue invoices
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => handleSort("invoiceId")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Invoice ID
                        {getSortIcon("invoiceId")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("customer")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Customer
                        {getSortIcon("customer")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("projectName")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Project Name
                        {getSortIcon("projectName")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("invoiceAmount")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Invoice Amount
                        {getSortIcon("invoiceAmount")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("creditNote")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Credit Note
                        {getSortIcon("creditNote")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("amountDue")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Amount Due
                        {getSortIcon("amountDue")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Status
                        {getSortIcon("status")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("aging")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Aging
                        {getSortIcon("aging")}
                      </button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.customer}</TableCell>
                      <TableCell>{invoice.taskName}</TableCell>
                      <TableCell>₹{invoice.invoiceAmount.toLocaleString()}</TableCell>
                      <TableCell>₹{invoice.creditNoteAmount.toLocaleString()}</TableCell>
                      <TableCell>₹{invoice.amountDue.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {(() => {
                          const agingInfo = getAgingInfo(invoice);
                          return (
                            <Badge variant={agingInfo.variant}>
                              {agingInfo.text}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewInvoicePDF(invoice)}
                            title="View Invoice PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {/* <Button 
                            variant="ghost" 
                            size="sm"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" /> */}
                          {/* </Button> */}
                          {/* <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            title="Close Invoice"
                          >
                            <X className="h-4 w-4" />
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Showing all paid invoices
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        onClick={() => handleSort("invoiceId")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Invoice ID
                        {getSortIcon("invoiceId")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("customer")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Customer
                        {getSortIcon("customer")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("projectName")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Project Name
                        {getSortIcon("projectName")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("invoiceAmount")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Invoice Amount
                        {getSortIcon("invoiceAmount")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("creditNote")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Credit Note
                        {getSortIcon("creditNote")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("amountDue")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Amount Due
                        {getSortIcon("amountDue")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("status")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Status
                        {getSortIcon("status")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("createdDate")}
                        className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                      >
                        Created Date
                        {getSortIcon("createdDate")}
                      </button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.customer}</TableCell>
                      <TableCell>{invoice.taskName}</TableCell>
                      <TableCell>₹{invoice.invoiceAmount.toLocaleString()}</TableCell>
                      <TableCell>₹{invoice.creditNoteAmount.toLocaleString()}</TableCell>
                      <TableCell>₹{invoice.amountDue.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{invoice.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewInvoicePDF(invoice)}
                            title="View Invoice PDF"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewInvoicePDF(invoice)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
          )}
        </CardContent>
      </Card>

      {selectedInvoice && (
        <>
          <AdminViewInvoiceDialog
            isOpen={isViewDialogOpen}
            onClose={() => {
              setIsViewDialogOpen(false);
              setSelectedInvoice(null);
            }}
            invoice={selectedInvoice}
            onStatusUpdate={handleStatusUpdate}
            onCommentUpdate={handleCommentUpdate}
          />
          <ViewGeneratedInvoiceDialog
            isOpen={isGeneratedInvoiceOpen}
            onClose={() => {
              setIsGeneratedInvoiceOpen(false);
              setSelectedInvoice(null);
            }}
            invoice={selectedInvoice}
          />
        </>
      )}
    </div>
  );
};

export default AdminInvoiceManagement;