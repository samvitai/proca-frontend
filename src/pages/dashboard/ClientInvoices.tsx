import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle, CreditCard, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { useRazorpay } from "@/hooks/useRazorpay";
import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// TypeScript Interfaces
interface Invoice {
  invoice_id: string;
  client_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  service_description: string;
  task_name: string;
  total_amount: number;
  paid_amount: number;
  credit_note_amount: number;
  outstanding_amount: number;
  status: 'paid' | 'unpaid' | 'partially_paid';
  can_pay: boolean;
  pdf_url: string;
}

interface InvoicesResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    invoices: Invoice[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
    summary: {
      total_amount: number;
      paid_amount: number;
      credit_note_amount: number;
      outstanding_amount: number;
    };
  };
  error_code: string | null;
  timestamp: string;
  request_id: string;
}

const ClientInvoices = () => {
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    total_amount: 0,
    paid_amount: 0,
    credit_note_amount: 0,
    outstanding_amount: 0
  });
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);

  const { initiatePayment } = useRazorpay();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    
    if (!email || role !== 'client') {
      navigate('/auth/signin');
      return;
    }
    
    setUserEmail(email);
  }, [navigate]);

  // Fetch invoices from API - extracted to a function so it can be called from payment callback
  const fetchInvoices = useCallback(async (showLoading = true) => {
    if (!userEmail) return;

    if (showLoading) {
      setLoading(true);
    }
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
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      // Build query parameters
      const params = new URLSearchParams({
        client_id: clientId,
        page: page.toString(),
        limit: '10' // Items per page as per API spec
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      console.log('🔄 Fetching invoices...', { clientId, page, statusFilter });

      const response = await axios.get<InvoicesResponse>(
        `${API_BASE_URL}/api/client-portal/invoices?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Invoices fetched:', response.data);

      if (response.data.success && response.data.data) {
        const { invoices, pagination, summary } = response.data.data;
        console.log('📊 Updated invoices:', invoices);
        console.log('💰 Summary:', summary);
        setInvoices(invoices || []);
        setTotal(pagination.total || 0);
        setTotalPages(pagination.pages || 1);
        setSummary(summary || { total_amount: 0, paid_amount: 0, credit_note_amount: 0, outstanding_amount: 0 });
        return invoices;
      } else {
        throw new Error(response.data.message || 'Failed to fetch invoices');
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      
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
        const errorMessage = errorData?.detail || errorData?.message || 'Failed to load invoices';
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
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [userEmail, page, statusFilter, navigate]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Handle payment initiation
  const handlePayment = async (invoice: Invoice) => {
    if (!invoice.can_pay) {
      toast({
        title: "Payment Not Available",
        description: "Payment is not available for this invoice",
        variant: "destructive",
      });
      return;
    }

    setPayingInvoice(invoice.invoice_id);

    try {
      // Get customer details (you might want to fetch from user profile)
      const customerName = userEmail.split('@')[0] || 'Customer';
      const customerEmail = userEmail;

      await initiatePayment(
        invoice.invoice_number,
        invoice.outstanding_amount || invoice.total_amount,
        customerName,
        customerEmail,
        // On success callback
        async () => {
          setPayingInvoice(null);
          console.log('✅ Payment verified successfully, refreshing invoices...');
          
          // Retry logic: Try refreshing multiple times with increasing delays
          // Sometimes the backend needs a moment to update the database
          const refreshWithRetry = async (attempt = 1, maxAttempts = 3) => {
            const delay = attempt * 2000; // 2s, 4s, 6s
            console.log(`🔄 Refresh attempt ${attempt}/${maxAttempts} after ${delay}ms delay...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            const updatedInvoices = await fetchInvoices(false);
            
            if (updatedInvoices) {
              // Check if the paid invoice now shows as paid
              const paidInvoice = updatedInvoices.find(inv => 
                inv.invoice_id === invoice.invoice_id || inv.invoice_number === invoice.invoice_number
              );
              
              if (paidInvoice) {
                console.log('📊 Invoice after payment:', {
                  id: paidInvoice.invoice_id,
                  number: paidInvoice.invoice_number,
                  outstanding: paidInvoice.outstanding_amount,
                  paid: paidInvoice.paid_amount,
                  status: paidInvoice.status
                });
                
                // If outstanding is 0, payment was processed
                if (paidInvoice.outstanding_amount === 0 || paidInvoice.paid_amount > 0) {
                  console.log('✅ Payment status updated successfully!');
                  toast({
                    title: "Payment Successful",
                    description: `Invoice ${invoice.invoice_number} has been marked as paid.`,
                    variant: "default",
                  });
                  setLoading(false);
                  return;
                }
              }
            }
            
            // If not updated yet and we have more attempts, retry
            if (attempt < maxAttempts) {
              console.log(`⏳ Payment status not yet updated, retrying in ${delay}ms...`);
              return refreshWithRetry(attempt + 1, maxAttempts);
            } else {
              // Final attempt failed
              console.warn('⚠️ Payment may have succeeded but status not yet updated in database');
              toast({
                title: "Payment Processed",
                description: "Your payment was successful. The status may take a moment to update. Please refresh the page.",
                variant: "default",
              });
              setLoading(false);
            }
          };
          
          // Start the refresh process
          await refreshWithRetry();
        },
        // On failure callback
        (error: string) => {
          setPayingInvoice(null);
          console.error('Payment failed:', error);
        }
      );
    } catch (error) {
      setPayingInvoice(null);
      console.error('Payment initiation failed:', error);
    }
  };

  const getInvoiceStatusBadge = (invoice: Invoice) => {
    // Determine actual status based on outstanding amount and paid amount
    let actualStatus: 'paid' | 'unpaid' | 'partially_paid';
    if (invoice.outstanding_amount === 0 || (invoice.paid_amount > 0 && invoice.outstanding_amount === 0)) {
      actualStatus = 'paid';
    } else if (invoice.paid_amount > 0 && invoice.outstanding_amount > 0) {
      actualStatus = 'partially_paid';
    } else {
      actualStatus = 'unpaid';
    }

    const variants = {
      'paid': 'default',
      'unpaid': 'destructive',
      'partially_paid': 'secondary'
    } as const;

    const colors = {
      'paid': 'text-green-700 bg-green-100',
      'unpaid': 'text-red-700 bg-red-100',
      'partially_paid': 'text-yellow-700 bg-yellow-100'
    };

    const labels = {
      'paid': 'Paid',
      'unpaid': 'Unpaid',
      'partially_paid': 'Partially Paid'
    };

    return (
      <Badge variant={variants[actualStatus]} className={colors[actualStatus]}>
        {labels[actualStatus]}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string, outstandingAmount: number) => {
    return outstandingAmount > 0 && new Date(dueDate) < new Date();
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

  const calculateDueDateFilter = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch(dueDateFilter) {
      case "overdue":
        return (invoice: Invoice) => {
          if (!invoice.due_date) return false;
          const dueDate = new Date(invoice.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today && invoice.outstanding_amount > 0;
        };
      case "7":
        return (invoice: Invoice) => {
          if (!invoice.due_date) return true;
          const dueDate = new Date(invoice.due_date);
          const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return dueDate <= sevenDaysLater;
        };
      case "15":
        return (invoice: Invoice) => {
          if (!invoice.due_date) return true;
          const dueDate = new Date(invoice.due_date);
          const fifteenDaysLater = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
          return dueDate <= fifteenDaysLater;
        };
      case "20":
        return (invoice: Invoice) => {
          if (!invoice.due_date) return true;
          const dueDate = new Date(invoice.due_date);
          const twentyDaysLater = new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000);
          return dueDate <= twentyDaysLater;
        };
      case "31":
        return (invoice: Invoice) => {
          if (!invoice.due_date) return true;
          const dueDate = new Date(invoice.due_date);
          const thirtyOneDaysLater = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000);
          return dueDate <= thirtyOneDaysLater;
        };
      case "45":
        return (invoice: Invoice) => {
          if (!invoice.due_date) return true;
          const dueDate = new Date(invoice.due_date);
          const fortyFiveDaysLater = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);
          return dueDate <= fortyFiveDaysLater;
        };
      case "all":
      default:
        return () => true;
    }
  };

  if (!userEmail) {
    return null;
  }

  const filteredInvoices = invoices.filter(calculateDueDateFilter());
  // Determine status based on outstanding_amount and paid_amount, not just status field
  const paidInvoices = filteredInvoices.filter(invoice => invoice.outstanding_amount === 0 || (invoice.paid_amount > 0 && invoice.outstanding_amount === 0));
  const unpaidInvoices = filteredInvoices.filter(invoice => invoice.outstanding_amount > 0 && (!invoice.paid_amount || invoice.paid_amount === 0));
  const partiallyPaidInvoices = filteredInvoices.filter(invoice => invoice.paid_amount > 0 && invoice.outstanding_amount > 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="client" email={userEmail} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-ca-primary mb-2">
                My Invoices
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your payments and track invoice status
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInvoices(true)}
              disabled={loading}
              className="mt-2"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="7">Next 7 Days</SelectItem>
                <SelectItem value="15">Next 15 Days</SelectItem>
                <SelectItem value="20">Next 20 Days</SelectItem>
                <SelectItem value="31">Next 31 Days</SelectItem>
                <SelectItem value="45">Next 45 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Summary */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">₹{summary.total_amount.toLocaleString('en-IN')}</div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">₹{(summary.credit_note_amount || 0).toLocaleString('en-IN')}</div>
                  <p className="text-sm text-muted-foreground">Credit Notes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">₹{summary.outstanding_amount.toLocaleString('en-IN')}</div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">₹{summary.paid_amount.toLocaleString('en-IN')}</div>
                  <p className="text-sm text-muted-foreground">Paid Amount</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{total}</div>
                  <p className="text-sm text-muted-foreground">Total Invoices</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-ca-primary" />
              <span className="ml-2 text-muted-foreground">Loading invoices...</span>
            </div>
          )}

          {!loading && (
          <Tabs defaultValue="unpaid" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 max-w-lg">
              <TabsTrigger value="unpaid" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Unpaid ({unpaidInvoices.length})
              </TabsTrigger>
                <TabsTrigger value="partially_paid" className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Partial ({partiallyPaidInvoices.length})
                </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Paid ({paidInvoices.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="unpaid">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    Unpaid Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    {unpaidInvoices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No unpaid invoices found
                      </div>
                    ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                            <TableHead>Invoice Number</TableHead>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Project Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Credit Note</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Invoice Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaidInvoices.map((invoice) => (
                        <TableRow 
                              key={invoice.invoice_id}
                              className={isOverdue(invoice.due_date, invoice.outstanding_amount) ? 'bg-red-50' : ''}
                            >
                              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                              <TableCell className="max-w-xs truncate">{invoice.client_name}</TableCell>
                              <TableCell className="max-w-xs truncate">{invoice.task_name}</TableCell>
                              <TableCell className="font-semibold">₹{invoice.total_amount.toLocaleString('en-IN')}</TableCell>
                              <TableCell className="text-blue-600">₹{(invoice.credit_note_amount || 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell>{getInvoiceStatusBadge(invoice)}</TableCell>
                              <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                          <TableCell>
                                <div className={isOverdue(invoice.due_date, invoice.outstanding_amount) ? 'text-red-600 font-medium' : ''}>
                                  {formatDate(invoice.due_date)}
                                  {isOverdue(invoice.due_date, invoice.outstanding_amount) && (
                                <div className="text-xs text-red-500">Overdue</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                                  {invoice.can_pay && invoice.outstanding_amount > 0 && (
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      className="bg-ca-primary hover:bg-ca-primary/90"
                                      onClick={() => handlePayment(invoice)}
                                      disabled={payingInvoice === invoice.invoice_id}
                                    >
                                      {payingInvoice === invoice.invoice_id ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      ) : (
                                        <CreditCard className="h-4 w-4 mr-1" />
                                      )}
                                      {payingInvoice === invoice.invoice_id ? 'Processing...' : 'Pay'}
                                    </Button>
                                  )}
                                  {invoice.outstanding_amount === 0 && (
                                    <span className="text-sm text-muted-foreground">Paid</span>
                                  )}
                              <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Page {page} of {totalPages} ({total} total invoices)
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="partially_paid">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      Partially Paid Invoices
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {partiallyPaidInvoices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No partially paid invoices found
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice Number</TableHead>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Credit Note</TableHead>
                            <TableHead>Paid Amount</TableHead>
                            <TableHead>Outstanding</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Invoice Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partiallyPaidInvoices.map((invoice) => (
                            <TableRow key={invoice.invoice_id}>
                              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                              <TableCell className="max-w-xs truncate">{invoice.client_name}</TableCell>
                              <TableCell className="max-w-xs truncate">{invoice.task_name}</TableCell>
                              <TableCell className="font-semibold">₹{invoice.total_amount.toLocaleString('en-IN')}</TableCell>
                              <TableCell className="text-blue-600">₹{(invoice.credit_note_amount || 0).toLocaleString('en-IN')}</TableCell>
                              <TableCell className="text-green-600">₹{invoice.paid_amount.toLocaleString('en-IN')}</TableCell>
                              <TableCell className="text-red-600">₹{invoice.outstanding_amount.toLocaleString('en-IN')}</TableCell>
                              <TableCell>{getInvoiceStatusBadge(invoice)}</TableCell>
                              <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                              <TableCell>{formatDate(invoice.due_date)}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  {invoice.can_pay && invoice.outstanding_amount > 0 && (
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      className="bg-ca-primary hover:bg-ca-primary/90"
                                      onClick={() => handlePayment(invoice)}
                                      disabled={payingInvoice === invoice.invoice_id}
                                    >
                                      {payingInvoice === invoice.invoice_id ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      ) : (
                                        <CreditCard className="h-4 w-4 mr-1" />
                                      )}
                                      {payingInvoice === invoice.invoice_id ? 'Processing...' : 'Pay'}
                              </Button>
                                  )}
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                    )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="paid">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Paid Invoices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    {paidInvoices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No paid invoices found
                      </div>
                    ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                            <TableHead>Invoice Number</TableHead>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Project Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Credit Note</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Invoice Date</TableHead>
                            <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidInvoices.map((invoice) => (
                            <TableRow key={invoice.invoice_id}>
                              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                              <TableCell className="max-w-xs truncate">{invoice.client_name}</TableCell>
                              <TableCell className="max-w-xs truncate">{invoice.task_name}</TableCell>
                              <TableCell className="font-semibold">₹{invoice.total_amount.toLocaleString('en-IN')}</TableCell>
                              <TableCell className="text-blue-600">₹{(invoice.credit_note_amount || 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell>{getInvoiceStatusBadge(invoice)}</TableCell>
                              <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                              <TableCell>{formatDate(invoice.due_date)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                    )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientInvoices;