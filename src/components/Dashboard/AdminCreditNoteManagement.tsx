import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, FileText, Loader2 } from "lucide-react";
import AddCreditNoteDialog from "./AddCreditNoteDialog";
import AdminViewCreditNoteDialog from "./AdminViewCreditNoteDialog";
import { useToast } from "@/hooks/use-toast";
import { creditNoteService, CreditNote as ApiCreditNote } from "@/services/creditNoteService";
import { api } from "@/lib/utils";

interface CreditNoteUI {
  id: string;
  creditNoteNumber: string;
  customerName: string;
  invoiceId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  creditNoteAmount: number;
  dueFromCustomer: number;
  reason: string;
  creditNoteDate: string;
  status: string;
  createdAt: string;
  cgst: number;
  sgst: number;
  igst: number;
  creditnoteUrl: string | null;
}

const AdminCreditNoteManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState<CreditNoteUI | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [creditNotes, setCreditNotes] = useState<CreditNoteUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to fetch tax information from task
  const fetchTaskTaxInfo = useCallback(async (invoiceId: string) => {
    try {
      // Extract task ID from invoice ID (assuming invoice ID format like "inv_73")
      const taskId = invoiceId.replace('inv_', 'task_');
      
      const response = await api.get(`/api/tasks/${taskId}`);
      
      if (response.data.success && response.data.data) {
        const task = response.data.data;
        return {
          cgst: task.cgst || 9,
          sgst: task.sgst || 9,
          igst: task.igst || 0
        };
      }
    } catch (error) {
      console.warn('Could not fetch tax info for invoice:', invoiceId, error);
    }
    
    // Return default tax rates if task fetch fails
    return {
      cgst: 9,
      sgst: 9,
      igst: 0
    };
  }, []);

  const fetchCreditNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await creditNoteService.fetchCreditNotes();
      
      console.log('Credit Notes API Response:', response);
      console.log('Credit Notes Data:', response.data.credit_notes);
      
      // Map API credit notes to UI format with tax information
      const mappedCreditNotes: CreditNoteUI[] = await Promise.all(
        response.data.credit_notes.map(async (apiCreditNote: ApiCreditNote) => {
          const taxInfo = await fetchTaskTaxInfo(apiCreditNote.invoice_id);
          
          return {
            id: apiCreditNote.credit_note_id || `CN-${Date.now()}`,
            creditNoteNumber: apiCreditNote.credit_note_number || "N/A",
            customerName: apiCreditNote.client_name || "Unknown Customer",
            invoiceId: apiCreditNote.invoice_id || "N/A",
            invoiceNumber: apiCreditNote.invoice_number || "N/A",
            invoiceAmount: typeof apiCreditNote.amount_before_tax === 'number' ? apiCreditNote.amount_before_tax : 0,
            creditNoteAmount: typeof apiCreditNote.total_amount === 'number' ? apiCreditNote.total_amount : 0,
            dueFromCustomer: (typeof apiCreditNote.amount_before_tax === 'number' ? apiCreditNote.amount_before_tax : 0) - (typeof apiCreditNote.total_amount === 'number' ? apiCreditNote.total_amount : 0),
            reason: apiCreditNote.reason || "Credit Note",
            creditNoteDate: apiCreditNote.credit_note_date || new Date().toISOString().split('T')[0],
            status: apiCreditNote.status || "issued",
            createdAt: apiCreditNote.created_at || new Date().toISOString().split('T')[0],
            cgst: taxInfo.cgst,
            sgst: taxInfo.sgst,
            igst: taxInfo.igst,
            creditnoteUrl: apiCreditNote.creditnote_url
          };
        })
      );
      
      setCreditNotes(mappedCreditNotes);
    } catch (error) {
      console.error('Error fetching credit notes:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch credit notes');
      toast({
        title: "Error",
        description: "Failed to load credit notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchTaskTaxInfo]);

  // Fetch credit notes from API
  useEffect(() => {
    fetchCreditNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddCreditNote = async (newCreditNote: Partial<CreditNoteUI>) => {
    try {
      // Refresh the credit notes list after adding a new one
      await fetchCreditNotes();
      setIsAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Credit note added successfully.",
      });
    } catch (error) {
      console.error('Error adding credit note:', error);
      toast({
        title: "Error",
        description: "Failed to add credit note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewCreditNote = (creditNote: CreditNoteUI) => {
    setSelectedCreditNote(creditNote);
    setIsViewDialogOpen(true);
  };

  const handleUpdateCreditNote = (updatedCreditNote: Partial<CreditNoteUI>) => {
    if (updatedCreditNote.id) {
      const updatedNotes = creditNotes.map(cn => 
        cn.id === updatedCreditNote.id ? { ...cn, ...updatedCreditNote } : cn
      );
      setCreditNotes(updatedNotes as CreditNoteUI[]);
    }
    setIsViewDialogOpen(false);
    setSelectedCreditNote(null);
  };

  const filteredCreditNotes = creditNotes.filter(creditNote => {
    const matchesSearch = creditNote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creditNote.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creditNote.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = !customerFilter || customerFilter === "all" || creditNote.customerName === customerFilter;
    
    return matchesSearch && matchesCustomer;
  });

  const customers = Array.from(new Set(creditNotes.map(creditNote => creditNote.customerName)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Credit Notes</CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Credit Note
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by credit note number, invoice number, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer} value={customer}>{customer}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credit Note Number</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Credit Note Amount</TableHead>
                <TableHead>CN Amount include Tax</TableHead>
                <TableHead>CGST</TableHead>
                <TableHead>SGST</TableHead>
                <TableHead>IGST</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Credit Note Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading credit notes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="text-destructive">
                      <p className="font-medium">Failed to load credit notes</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchCreditNotes}
                        className="mt-2"
                      >
                        Try Again
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCreditNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <p className="font-medium">No credit notes found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || customerFilter !== "all" 
                          ? "Try adjusting your search or filter criteria" 
                          : "Create your first credit note to get started"
                        }
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCreditNotes.map((creditNote) => (
                <TableRow key={creditNote.id}>
                  <TableCell className="font-medium">{creditNote.creditNoteNumber}</TableCell>
                  <TableCell>{creditNote.customerName}</TableCell>
                  <TableCell>{creditNote.invoiceNumber}</TableCell>
                  <TableCell>₹{(creditNote.invoiceAmount || 0).toLocaleString()}</TableCell>
                  <TableCell>₹{(creditNote.creditNoteAmount || 0).toLocaleString()}</TableCell>
                  <TableCell>{creditNote.cgst || 0}%</TableCell>
                  <TableCell>{creditNote.sgst || 0}%</TableCell>
                  <TableCell>{creditNote.igst || 0}%</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      creditNote.status === 'issued' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {creditNote.status}
                    </span>
                  </TableCell>
                  <TableCell>{creditNote.creditNoteDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewCreditNote(creditNote)}
                        title="View Credit Note"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {creditNote.creditnoteUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          title="Download PDF"
                          onClick={() => window.open(creditNote.creditnoteUrl!, '_blank')}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddCreditNoteDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddCreditNote}
      />

      {selectedCreditNote && (
        <AdminViewCreditNoteDialog
          isOpen={isViewDialogOpen}
          onClose={() => {
            setIsViewDialogOpen(false);
            setSelectedCreditNote(null);
          }}
          creditNote={{
            ...selectedCreditNote,
            taskName: selectedCreditNote.customerName
          }}
          onUpdate={handleUpdateCreditNote}
        />
      )}
    </div>
  );
};

export default AdminCreditNoteManagement;