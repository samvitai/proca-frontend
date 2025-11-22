import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import AddDebitNoteDialog from "./AddDebitNoteDialog";
import AdminViewDebitNoteDialog from "./AdminViewDebitNoteDialog";
import { useToast } from "@/hooks/use-toast";
import { debitNoteService, DebitNote } from "@/services/debitNoteService";

interface DebitNoteUI {
  debit_note_id: string;
  debit_note_number: string;
  client_id: number;
  client_name: string;
  description: string;
  amount: number;
  due_date: string;
  status: string;
  comments: string;
  paid_amount: number;
  outstanding_amount: number;
  created_at: string;
  updated_at: string;
}

const EmployeeDebitNoteManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedDebitNote, setSelectedDebitNote] = useState<DebitNoteUI | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [debitNotes, setDebitNotes] = useState<DebitNoteUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Sorting States
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const fetchDebitNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await debitNoteService.fetchDebitNotes();
      
      console.log('Debit Notes API Response:', response);
      
      // Map API debit notes to UI format
      const mappedDebitNotes: DebitNoteUI[] = response.data.debit_notes.map((apiDebitNote: DebitNote) => ({
        debit_note_id: apiDebitNote.debit_note_id,
        debit_note_number: apiDebitNote.debit_note_number,
        client_id: apiDebitNote.client_id,
        client_name: apiDebitNote.client_name,
        description: apiDebitNote.description,
        amount: apiDebitNote.amount,
        due_date: apiDebitNote.due_date,
        status: apiDebitNote.status,
        comments: apiDebitNote.comments,
        paid_amount: apiDebitNote.paid_amount,
        outstanding_amount: apiDebitNote.outstanding_amount,
        created_at: apiDebitNote.created_at,
        updated_at: apiDebitNote.updated_at,
      }));
      
      setDebitNotes(mappedDebitNotes);
    } catch (error) {
      console.error('Error fetching debit notes:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch debit notes');
      toast({
        title: "Error",
        description: "Failed to load debit notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch debit notes from API
  useEffect(() => {
    fetchDebitNotes();
  }, [fetchDebitNotes]);

  const handleAddDebitNote = async () => {
    // Refresh the debit notes list after adding a new one
    await fetchDebitNotes();
    setIsAddDialogOpen(false);
    
    toast({
      title: "Success",
      description: "Debit note added successfully.",
    });
  };

  const handleViewDebitNote = (debitNote: DebitNoteUI) => {
    setSelectedDebitNote(debitNote);
    setIsViewDialogOpen(true);
  };

  const handleUpdateDebitNote = async () => {
    // Refresh the debit notes list after updating
    await fetchDebitNotes();
    setIsViewDialogOpen(false);
    setSelectedDebitNote(null);
  };

  const filteredDebitNotes = debitNotes.filter(debitNote => {
    const matchesSearch = 
      debitNote.debit_note_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debitNote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debitNote.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = !clientFilter || clientFilter === "all" || debitNote.client_name === clientFilter;
    const matchesStatus = !statusFilter || statusFilter === "all" || debitNote.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesClient && matchesStatus;
  });

  const clients = Array.from(new Set(debitNotes.map(debitNote => debitNote.client_name)));

  // Sorting function
  const sortDebitNotes = (debitNoteList: DebitNoteUI[]) => {
    if (!sortColumn) return debitNoteList;

    return [...debitNoteList].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortColumn) {
        case "debitNoteNumber":
          aValue = a.debit_note_number?.toLowerCase() || "";
          bValue = b.debit_note_number?.toLowerCase() || "";
          break;
        case "client":
          aValue = a.client_name?.toLowerCase() || "";
          bValue = b.client_name?.toLowerCase() || "";
          break;
        case "amount":
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        case "outstanding":
          aValue = a.outstanding_amount || 0;
          bValue = b.outstanding_amount || 0;
          break;
        case "status":
          aValue = a.status?.toLowerCase() || "";
          bValue = b.status?.toLowerCase() || "";
          break;
        case "dueDate":
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case "createdDate":
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'paid': 'default',
      'unpaid': 'secondary',
      'partial': 'outline',
      'overdue': 'destructive'
    };
    
    return (
      <Badge variant={variants[status.toLowerCase()] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  // Apply sorting
  const sortedDebitNotes = sortDebitNotes(filteredDebitNotes);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Debit Notes</CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Debit Note
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by debit note number, client, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client} value={client}>{client}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => handleSort("debitNoteNumber")}
                    className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                  >
                    Debit Note Number
                    {getSortIcon("debitNoteNumber")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("client")}
                    className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                  >
                    Client
                    {getSortIcon("client")}
                  </button>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("amount")}
                    className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                  >
                    Amount (₹)
                    {getSortIcon("amount")}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("outstanding")}
                    className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                  >
                    Outstanding (₹)
                    {getSortIcon("outstanding")}
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
                    onClick={() => handleSort("dueDate")}
                    className="flex items-center hover:text-foreground transition-colors cursor-pointer"
                  >
                    Due Date
                    {getSortIcon("dueDate")}
                  </button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading debit notes...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-destructive">
                      <p className="font-medium">Failed to load debit notes</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchDebitNotes}
                        className="mt-2"
                      >
                        Try Again
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedDebitNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <p className="font-medium">No debit notes found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || clientFilter !== "all" || statusFilter !== "all"
                          ? "Try adjusting your search or filter criteria" 
                          : "Create your first debit note to get started"
                        }
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedDebitNotes.map((debitNote) => (
                  <TableRow key={debitNote.debit_note_id}>
                    <TableCell className="font-medium">{debitNote.debit_note_number}</TableCell>
                    <TableCell>{debitNote.client_name}</TableCell>
                    <TableCell className="max-w-xs truncate" title={debitNote.description}>
                      {debitNote.description}
                    </TableCell>
                    <TableCell>₹{debitNote.amount.toLocaleString()}</TableCell>
                    <TableCell>₹{debitNote.outstanding_amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(debitNote.status)}</TableCell>
                    <TableCell>{new Date(debitNote.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDebitNote(debitNote)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddDebitNoteDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddDebitNote}
      />

      {selectedDebitNote && (
        <AdminViewDebitNoteDialog
          isOpen={isViewDialogOpen}
          onClose={() => {
            setIsViewDialogOpen(false);
            setSelectedDebitNote(null);
          }}
          debitNote={selectedDebitNote}
          onUpdate={handleUpdateDebitNote}
        />
      )}
    </div>
  );
};

export default EmployeeDebitNoteManagement;
