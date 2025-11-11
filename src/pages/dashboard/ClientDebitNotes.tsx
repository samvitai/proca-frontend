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
import { debitNoteService, DebitNote } from "@/services/debitNoteService";
import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface DebitNotesResponse {
  success: boolean;
  status: string;
  message: string;
  data: {
    debit_notes: DebitNote[];
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
      outstanding_amount: number;
    };
  };
  error_code: string | null;
  timestamp: string;
  request_id: string;
}

const ClientDebitNotes = () => {
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({
    total_amount: 0,
    paid_amount: 0,
    outstanding_amount: 0
  });
  const [payingDebitNote, setPayingDebitNote] = useState<string | null>(null);

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

  // Fetch debit notes from API - extracted to a function so it can be called from payment callback
  const fetchDebitNotes = useCallback(async (showLoading = true) => {
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
        limit: '10'
      });

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      console.log('🔄 Fetching debit notes...', { clientId, page, statusFilter });

      const response = await axios.get<DebitNotesResponse>(
        `${API_BASE_URL}/api/client-portal/debit-notes?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Debit notes fetched:', response.data);

      if (response.data.success && response.data.data) {
        const { debit_notes, pagination, summary } = response.data.data;
        console.log('📊 Updated debit notes:', debit_notes);
        console.log('💰 Summary:', summary);
        setDebitNotes(debit_notes || []);
        setTotal(pagination.total || 0);
        setTotalPages(pagination.pages || 1);
        setSummary(summary || { total_amount: 0, paid_amount: 0, outstanding_amount: 0 });
        return debit_notes;
      } else {
        throw new Error(response.data.message || 'Failed to fetch debit notes');
      }
    } catch (err) {
      console.error('Error fetching debit notes:', err);
      
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const errorData = err.response?.data;
        
        if (status === 401 || status === 403) {
          let errorMessage = 'Authentication failed';
          
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : errorData.message || 'User not found or inactive';
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
          
          if (errorMessage.includes('User not found') || errorMessage.includes('inactive')) {
            setError(`Client Portal Access Error: ${errorMessage}. This may be because your client contact is not properly configured in the system. Please contact support.`);
            toast({
              title: "Access Denied",
              description: errorMessage,
              variant: "destructive"
            });
            return;
          }
          
          toast({
            title: "Session Expired",
            description: "Please sign in again",
            variant: "destructive"
          });
          navigate('/auth/signin');
          return;
        }
        
        const errorMessage = errorData?.detail || errorData?.message || 'Failed to load debit notes';
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
    fetchDebitNotes();
  }, [fetchDebitNotes]);

  // Handle payment initiation
  const handlePayment = async (debitNote: DebitNote) => {
    // Check if payment can be made (outstanding amount > 0)
    if (!debitNote.outstanding_amount || debitNote.outstanding_amount <= 0) {
      toast({
        title: "Payment Not Available",
        description: "This debit note is already paid",
        variant: "destructive",
      });
      return;
    }

    setPayingDebitNote(debitNote.debit_note_id);

    try {
      // Get customer details
      const customerName = userEmail.split('@')[0] || 'Customer';
      const customerEmail = userEmail;

      await initiatePayment(
        undefined, // invoiceNumber - not used for debit notes
        debitNote.outstanding_amount || debitNote.amount,
        customerName,
        customerEmail,
        // On success callback
        async () => {
          setPayingDebitNote(null);
          console.log('✅ Payment verified successfully, refreshing debit notes...');
          
          // Retry logic: Try refreshing multiple times with increasing delays
          // Sometimes the backend needs a moment to update the database
          const refreshWithRetry = async (attempt = 1, maxAttempts = 3) => {
            const delay = attempt * 2000; // 2s, 4s, 6s
            console.log(`🔄 Refresh attempt ${attempt}/${maxAttempts} after ${delay}ms delay...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            const updatedDebitNotes = await fetchDebitNotes(false);
            
            if (updatedDebitNotes) {
              // Check if the paid debit note now shows as paid
              const paidNote = updatedDebitNotes.find(dn => 
                dn.debit_note_id === debitNote.debit_note_id
              );
              
              if (paidNote) {
                console.log('📊 Debit note after payment:', {
                  id: paidNote.debit_note_id,
                  outstanding: paidNote.outstanding_amount,
                  paid: paidNote.paid_amount,
                  status: paidNote.status
                });
                
                // If outstanding is 0, payment was processed
                if (paidNote.outstanding_amount === 0 || paidNote.paid_amount > 0) {
                  console.log('✅ Payment status updated successfully!');
                  toast({
                    title: "Payment Successful",
                    description: `Debit note ${debitNote.debit_note_number} has been marked as paid.`,
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
          setPayingDebitNote(null);
          console.error('Payment failed:', error);
        },
        debitNote.debit_note_number // Pass debit note number
      );
    } catch (error) {
      setPayingDebitNote(null);
      console.error('Payment initiation failed:', error);
    }
  };

  const getDebitNoteStatusBadge = (status: string, paidAmount: number, outstandingAmount: number) => {
    // Determine status based on paid and outstanding amounts
    let actualStatus = status;
    if (outstandingAmount === 0 || paidAmount > 0 && outstandingAmount === 0) {
      actualStatus = 'paid';
    } else if (paidAmount > 0 && outstandingAmount > 0) {
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

    const statusKey = actualStatus as keyof typeof labels;

    return (
      <Badge variant={variants[statusKey] || 'default'} className={colors[statusKey] || ''}>
        {labels[statusKey] || status}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string, status: string, outstandingAmount: number) => {
    return (status === 'unpaid' || outstandingAmount > 0) && new Date(dueDate) < new Date();
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
        return (debitNote: DebitNote) => {
          if (!debitNote.due_date) return false;
          const dueDate = new Date(debitNote.due_date);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today && (debitNote.outstanding_amount > 0 || debitNote.status === 'unpaid');
        };
      case "7":
        return (debitNote: DebitNote) => {
          if (!debitNote.due_date) return true;
          const dueDate = new Date(debitNote.due_date);
          const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return dueDate <= sevenDaysLater;
        };
      case "15":
        return (debitNote: DebitNote) => {
          if (!debitNote.due_date) return true;
          const dueDate = new Date(debitNote.due_date);
          const fifteenDaysLater = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
          return dueDate <= fifteenDaysLater;
        };
      case "31":
        return (debitNote: DebitNote) => {
          if (!debitNote.due_date) return true;
          const dueDate = new Date(debitNote.due_date);
          const thirtyOneDaysLater = new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000);
          return dueDate <= thirtyOneDaysLater;
        };
      case "all":
      default:
        return () => true;
    }
  };

  if (!userEmail) {
    return null;
  }

  const filteredDebitNotes = debitNotes.filter(calculateDueDateFilter());
  // Determine status based on outstanding_amount and paid_amount, not just status field
  const paidDebitNotes = filteredDebitNotes.filter(dn => dn.outstanding_amount === 0 || (dn.paid_amount > 0 && dn.outstanding_amount === 0));
  const unpaidDebitNotes = filteredDebitNotes.filter(dn => dn.outstanding_amount > 0 && (!dn.paid_amount || dn.paid_amount === 0));
  const partiallyPaidDebitNotes = filteredDebitNotes.filter(dn => dn.paid_amount > 0 && dn.outstanding_amount > 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="client" email={userEmail} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-ca-primary mb-2">
                My Debit Notes
              </h1>
              <p className="text-muted-foreground text-lg">
                Manage your debit note payments and track status
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDebitNotes(true)}
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
                <SelectItem value="all">All Debit Notes</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="7">Next 7 Days</SelectItem>
                <SelectItem value="15">Next 15 Days</SelectItem>
                <SelectItem value="31">Next 31 Days</SelectItem>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">₹{summary.total_amount.toLocaleString('en-IN')}</div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
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
                  <p className="text-sm text-muted-foreground">Total Debit Notes</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-ca-primary" />
              <span className="ml-2 text-muted-foreground">Loading debit notes...</span>
            </div>
          )}

          {!loading && (
          <Tabs defaultValue="unpaid" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 max-w-lg">
              <TabsTrigger value="unpaid" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Unpaid ({unpaidDebitNotes.length})
              </TabsTrigger>
                <TabsTrigger value="partially_paid" className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Partial ({partiallyPaidDebitNotes.length})
                </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Paid ({paidDebitNotes.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="unpaid">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    Unpaid Debit Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    {unpaidDebitNotes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No unpaid debit notes found
                      </div>
                    ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Paid / Unpaid</TableHead>
                            <TableHead>Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unpaidDebitNotes.map((debitNote) => (
                        <TableRow 
                              key={debitNote.debit_note_id}
                              className={isOverdue(debitNote.due_date, debitNote.status, debitNote.outstanding_amount) ? 'bg-red-50' : ''}
                            >
                              <TableCell className="max-w-xs truncate">{debitNote.description || 'N/A'}</TableCell>
                              <TableCell className="max-w-xs truncate">{debitNote.client_name}</TableCell>
                              <TableCell className="font-semibold">₹{debitNote.amount.toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                                <div className={isOverdue(debitNote.due_date, debitNote.status, debitNote.outstanding_amount) ? 'text-red-600 font-medium' : ''}>
                                  {formatDate(debitNote.due_date)}
                                  {isOverdue(debitNote.due_date, debitNote.status, debitNote.outstanding_amount) && (
                                <div className="text-xs text-red-500">Overdue</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getDebitNoteStatusBadge(debitNote.status, debitNote.paid_amount, debitNote.outstanding_amount)}</TableCell>
                          <TableCell>
                                  {debitNote.outstanding_amount > 0 && (
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      className="bg-ca-primary hover:bg-ca-primary/90"
                                      onClick={() => handlePayment(debitNote)}
                                      disabled={payingDebitNote === debitNote.debit_note_id}
                                    >
                                      {payingDebitNote === debitNote.debit_note_id ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      ) : (
                                        <CreditCard className="h-4 w-4 mr-1" />
                                      )}
                                      {payingDebitNote === debitNote.debit_note_id ? 'Processing...' : 'Pay'}
                                    </Button>
                                  )}
                                  {debitNote.outstanding_amount === 0 && (
                                    <span className="text-sm text-muted-foreground">Paid</span>
                                  )}
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
                          Page {page} of {totalPages} ({total} total debit notes)
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
                      Partially Paid Debit Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {partiallyPaidDebitNotes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No partially paid debit notes found
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Paid / Unpaid</TableHead>
                            <TableHead>Pay</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partiallyPaidDebitNotes.map((debitNote) => (
                            <TableRow key={debitNote.debit_note_id}>
                              <TableCell className="max-w-xs truncate">{debitNote.description || 'N/A'}</TableCell>
                              <TableCell className="max-w-xs truncate">{debitNote.client_name}</TableCell>
                              <TableCell className="font-semibold">₹{debitNote.amount.toLocaleString('en-IN')}</TableCell>
                              <TableCell>{formatDate(debitNote.due_date)}</TableCell>
                              <TableCell>{getDebitNoteStatusBadge(debitNote.status, debitNote.paid_amount, debitNote.outstanding_amount)}</TableCell>
                              <TableCell>
                                  {debitNote.outstanding_amount > 0 && (
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      className="bg-ca-primary hover:bg-ca-primary/90"
                                      onClick={() => handlePayment(debitNote)}
                                      disabled={payingDebitNote === debitNote.debit_note_id}
                                    >
                                      {payingDebitNote === debitNote.debit_note_id ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                      ) : (
                                        <CreditCard className="h-4 w-4 mr-1" />
                                      )}
                                      {payingDebitNote === debitNote.debit_note_id ? 'Processing...' : 'Pay'}
                                    </Button>
                                  )}
                                  {debitNote.outstanding_amount === 0 && (
                                    <span className="text-sm text-muted-foreground">Paid</span>
                                  )}
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
                    Paid Debit Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    {paidDebitNotes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No paid debit notes found
                      </div>
                    ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Client Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Paid / Unpaid</TableHead>
                            <TableHead>Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidDebitNotes.map((debitNote) => (
                            <TableRow key={debitNote.debit_note_id}>
                              <TableCell className="max-w-xs truncate">{debitNote.description || 'N/A'}</TableCell>
                              <TableCell className="max-w-xs truncate">{debitNote.client_name}</TableCell>
                              <TableCell className="font-semibold">₹{debitNote.amount.toLocaleString('en-IN')}</TableCell>
                              <TableCell>{formatDate(debitNote.due_date)}</TableCell>
                          <TableCell>{getDebitNoteStatusBadge(debitNote.status, debitNote.paid_amount, debitNote.outstanding_amount)}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">Paid</span>
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

export default ClientDebitNotes;

