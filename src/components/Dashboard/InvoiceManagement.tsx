import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, FileText, Search } from "lucide-react";
import ViewInvoiceDetailsDialog from "./ViewInvoiceDetailsDialog";
import ViewGeneratedInvoiceDialog from "./ViewGeneratedInvoiceDialog";

interface Invoice {
  id: string;
  taskName: string;
  description: string;
  customer: string;
  invoiceAmount: number;
  creditNoteAmount: number;
  amountDue: number;
  status: 'paid' | 'unpaid' | 'partial' | 'overdue';
  dueDate: string;
  overdueDays?: number;
}

const InvoiceManagement = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isGeneratedInvoiceOpen, setIsGeneratedInvoiceOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  
  // Mock data
  const [invoices] = useState<Invoice[]>([
    {
      id: "1",
      taskName: "GST Return Filing Q1",
      description: "File GST return for Q1 2024",
      customer: "ABC Corp",
      invoiceAmount: 10000,
      creditNoteAmount: 0,
      amountDue: 10000,
      status: "overdue",
      dueDate: "2024-01-30",
      overdueDays: 15
    },
    {
      id: "2",
      taskName: "Tax Consultation",
      description: "Provide tax consultation for new business setup",
      customer: "XYZ Ltd",
      invoiceAmount: 15000,
      creditNoteAmount: 2000,
      amountDue: 13000,
      status: "partial",
      dueDate: "2024-02-15",
    },
  ]);

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleViewGeneratedInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsGeneratedInvoiceOpen(true);
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
    const matchesSearch = invoice.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = !customerFilter || customerFilter === "all" || invoice.customer === customerFilter;
    
    return matchesSearch && matchesCustomer;
  });

  const customers = Array.from(new Set(invoices.map(invoice => invoice.customer)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search invoices..."
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
                <TableHead>Project Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Invoice Amount</TableHead>
                <TableHead>Credit Note Amount</TableHead>
                <TableHead>Amount Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.taskName}</TableCell>
                  <TableCell className="max-w-xs truncate">{invoice.description}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell>₹{invoice.invoiceAmount.toLocaleString()}</TableCell>
                  <TableCell>₹{invoice.creditNoteAmount.toLocaleString()}</TableCell>
                  <TableCell>₹{invoice.amountDue.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    {invoice.status === 'overdue' && invoice.overdueDays ? 
                      `${invoice.overdueDays} days` : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewGeneratedInvoice(invoice)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedInvoice && (
        <>
          <ViewInvoiceDetailsDialog
            isOpen={isViewDialogOpen}
            onClose={() => {
              setIsViewDialogOpen(false);
              setSelectedInvoice(null);
            }}
            invoice={selectedInvoice}
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

export default InvoiceManagement;