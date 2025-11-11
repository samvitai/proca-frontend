import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import AddCreditNoteDialog from "./AddCreditNoteDialog";

interface CreditNote {
  id: string;
  customerName: string;
  invoiceId: string;
  invoiceAmount: number;
  creditNoteAmount: number;
  dueFromCustomer: number;
  createdAt: string;
}

const CreditNoteManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  
  // Mock data
  const [creditNotes] = useState<CreditNote[]>([
    {
      id: "1",
      customerName: "ABC Corp",
      invoiceId: "INV-001",
      invoiceAmount: 10000,
      creditNoteAmount: 2000,
      dueFromCustomer: 8000,
      createdAt: "2024-01-20"
    },
    {
      id: "2",
      customerName: "XYZ Ltd",
      invoiceId: "INV-002",
      invoiceAmount: 15000,
      creditNoteAmount: 3000,
      dueFromCustomer: 12000,
      createdAt: "2024-01-22"
    },
  ]);

  const handleAddCreditNote = (newCreditNote: Omit<CreditNote, 'id'>) => {
    // In real implementation, this would add to database
    console.log('Adding credit note:', newCreditNote);
    setIsAddDialogOpen(false);
  };

  const filteredCreditNotes = creditNotes.filter(creditNote => {
    const matchesSearch = creditNote.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creditNote.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
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
                placeholder="Search credit notes..."
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
                <TableHead>Customer Name</TableHead>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Invoice Amount</TableHead>
                <TableHead>Credit Note Amount</TableHead>
                <TableHead>Due from Customer</TableHead>
                <TableHead>Created Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCreditNotes.map((creditNote) => (
                <TableRow key={creditNote.id}>
                  <TableCell className="font-medium">{creditNote.customerName}</TableCell>
                  <TableCell>{creditNote.invoiceId}</TableCell>
                  <TableCell>₹{creditNote.invoiceAmount.toLocaleString()}</TableCell>
                  <TableCell>₹{creditNote.creditNoteAmount.toLocaleString()}</TableCell>
                  <TableCell>₹{creditNote.dueFromCustomer.toLocaleString()}</TableCell>
                  <TableCell>{creditNote.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddCreditNoteDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddCreditNote}
      />
    </div>
  );
};

export default CreditNoteManagement;