import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { creditNoteService, CreateCreditNoteRequest } from "@/services/creditNoteService";
import { fetchInvoices } from "@/services/invoiceService";
import { useToast } from "@/hooks/use-toast";

interface CreditNoteUI {
  id: string;
  customerName: string;
  invoiceId: string;
  invoiceAmount: number;
  creditNoteAmount: number;
  dueFromCustomer: number;
  createdAt: string;
}

interface Invoice {
  id: string;
  customer: string;
  amount: number;
  cgst: number;
  sgst: number;
  igst: number;
}

interface Task {
  id: string;
  name: string;
  customer: string;
  amount: number;
  status: string;
  invoiceGenerated: boolean;
  fullyPaid: boolean;
}

interface AddCreditNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (creditNote: Omit<CreditNoteUI, 'id'>) => void;
}

const AddCreditNoteDialog = ({ isOpen, onClose, onAdd }: AddCreditNoteDialogProps) => {
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [creditNoteAmount, setCreditNoteAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [existingCreditNotes, setExistingCreditNotes] = useState<number>(0);
  const [loadingCreditNotes, setLoadingCreditNotes] = useState(false);
  const { toast } = useToast();

  // Fetch invoices when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchInvoicesData();
      // Reset form when dialog opens
      setSelectedInvoice("");
      setCreditNoteAmount("");
      setExistingCreditNotes(0);
    }
  }, [isOpen]);

  // Fetch existing credit notes when invoice is selected
  useEffect(() => {
    if (selectedInvoice) {
      fetchExistingCreditNotes(selectedInvoice);
    } else {
      setExistingCreditNotes(0);
    }
  }, [selectedInvoice]);

  const fetchInvoicesData = async () => {
    try {
      setLoadingInvoices(true);
      const result = await fetchInvoices();
      
      // Map API invoices to our Invoice interface
      const mappedInvoices: Invoice[] = result.invoices.map(invoice => ({
        id: invoice.invoiceNumber,
        customer: invoice.customer,
        amount: invoice.invoiceAmount,
        cgst: 9, // Default CGST - this should come from the API
        sgst: 9, // Default SGST - this should come from the API
        igst: 0  // Default IGST - this should come from the API
      }));
      
      setInvoices(mappedInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchExistingCreditNotes = async (invoiceNumber: string) => {
    try {
      setLoadingCreditNotes(true);
      const response = await creditNoteService.fetchCreditNotes();
      
      // Filter credit notes for the selected invoice and sum their amounts
      const invoiceCreditNotes = response.data.credit_notes.filter(
        (cn: { invoice_number: string; total_amount: number }) => 
          cn.invoice_number === invoiceNumber
      );
      
      const totalExistingAmount = invoiceCreditNotes.reduce(
        (sum: number, cn: { total_amount: number }) => sum + (cn.total_amount || 0),
        0
      );
      
      setExistingCreditNotes(totalExistingAmount);
    } catch (error) {
      console.error('Error fetching existing credit notes:', error);
      // Don't show error toast, just set to 0
      setExistingCreditNotes(0);
    } finally {
      setLoadingCreditNotes(false);
    }
  };

  const selectedInvoiceData = invoices.find(inv => inv.id === selectedInvoice);
  
  // Calculate the total amount (including tax) for a credit note based on base amount
  const calculateCreditNoteTotal = (baseAmount: number) => {
    if (!selectedInvoiceData) return 0;
    const cgstAmount = (baseAmount * selectedInvoiceData.cgst) / 100;
    const sgstAmount = (baseAmount * selectedInvoiceData.sgst) / 100;
    const igstAmount = (baseAmount * selectedInvoiceData.igst) / 100;
    return baseAmount + cgstAmount + sgstAmount + igstAmount;
  };
  
  // Calculate remaining invoice amount available for credit notes (comparing total amounts)
  const remainingInvoiceAmount = selectedInvoiceData 
    ? selectedInvoiceData.amount - existingCreditNotes 
    : 0;

  const handleAdd = async () => {
    if (!selectedInvoice || !creditNoteAmount || !selectedInvoiceData) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newCreditNoteBaseAmount = parseFloat(creditNoteAmount);
    
    // Validate that credit note amount is positive
    if (isNaN(newCreditNoteBaseAmount) || newCreditNoteBaseAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Credit note amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    // Calculate the total amount (including tax) for the new credit note
    const newCreditNoteTotalAmount = calculateCreditNoteTotal(newCreditNoteBaseAmount);

    // Validate that credit note total amount doesn't exceed remaining invoice amount
    if (newCreditNoteTotalAmount > remainingInvoiceAmount) {
      toast({
        title: "Validation Error",
        description: `Credit note total amount (₹${newCreditNoteTotalAmount.toLocaleString()}) cannot exceed the remaining invoice amount (₹${remainingInvoiceAmount.toLocaleString()}). Total credit notes already issued: ₹${existingCreditNotes.toLocaleString()}.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const creditNoteData: CreateCreditNoteRequest = {
        cgst: selectedInvoiceData.cgst,
        credit_note_amount: parseFloat(creditNoteAmount),
        igst: selectedInvoiceData.igst,
        invoice_number: selectedInvoice,
        sgst: selectedInvoiceData.sgst,
      };

      const response = await creditNoteService.createCreditNote(creditNoteData);
      
      // Create the credit note object for the parent component
      const newCreditNote = {
        customerName: selectedInvoiceData.customer,
        invoiceId: selectedInvoice,
        invoiceAmount: selectedInvoiceData.amount,
        creditNoteAmount: parseFloat(creditNoteAmount),
        dueFromCustomer: selectedInvoiceData.amount - parseFloat(creditNoteAmount),
        createdAt: new Date().toISOString().split('T')[0]
      };

      onAdd(newCreditNote);
      
      toast({
        title: "Success",
        description: `Credit note ${response.data.credit_note_id} created successfully.`,
      });
      
      // Reset form
      setSelectedInvoice("");
      setCreditNoteAmount("");
      setExistingCreditNotes(0);
    } catch (error) {
      console.error('Error creating credit note:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create credit note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Credit Note</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Invoice Selection */}
          <div>
            <Label htmlFor="invoice">Select Invoice</Label>
            {loadingInvoices ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <div className="text-sm text-muted-foreground">Loading invoices...</div>
              </div>
            ) : (
              <SearchableSelect
                options={invoices.map(inv => ({
                  value: inv.id,
                  label: `${inv.id} - ${inv.customer} - ₹${inv.amount.toLocaleString()}`
                }))}
                value={selectedInvoice}
                onValueChange={setSelectedInvoice}
                placeholder="Choose an invoice"
                searchPlaceholder="Search invoice by ID or customer..."
              />
            )}
          </div>

          {/* Invoice Details */}
          {selectedInvoiceData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-medium">{selectedInvoiceData.customer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Invoice Amount:</span>
                    <span className="font-medium">₹{selectedInvoiceData.amount.toLocaleString()}</span>
                  </div>
                  {loadingCreditNotes ? (
                    <div className="text-sm text-muted-foreground">Loading credit note information...</div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Existing Credit Notes:</span>
                        <span className={existingCreditNotes > 0 ? "text-orange-600 font-medium" : ""}>
                          ₹{existingCreditNotes.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining Amount:</span>
                        <span className={`font-medium ${remainingInvoiceAmount < 0 ? "text-destructive" : remainingInvoiceAmount === 0 ? "text-orange-600" : "text-green-600"}`}>
                          ₹{remainingInvoiceAmount.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span>CGST ({selectedInvoiceData.cgst}%):</span>
                    <span>₹{((selectedInvoiceData.amount * selectedInvoiceData.cgst) / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST ({selectedInvoiceData.sgst}%):</span>
                    <span>₹{((selectedInvoiceData.amount * selectedInvoiceData.sgst) / 100).toLocaleString()}</span>
                  </div>
                  {selectedInvoiceData.igst > 0 && (
                    <div className="flex justify-between">
                      <span>IGST ({selectedInvoiceData.igst}%):</span>
                      <span>₹{((selectedInvoiceData.amount * selectedInvoiceData.igst) / 100).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credit Note Amount */}
          <div>
            <Label htmlFor="creditNoteAmount">Credit Note Amount</Label>
            <Input
              id="creditNoteAmount"
              type="number"
              placeholder="Enter credit note amount"
              value={creditNoteAmount}
              onChange={(e) => setCreditNoteAmount(e.target.value)}
              min="0"
            />
            {selectedInvoiceData && creditNoteAmount && !isNaN(parseFloat(creditNoteAmount)) && parseFloat(creditNoteAmount) > 0 && (
              <div className="mt-2 text-sm">
                {(() => {
                  const baseAmount = parseFloat(creditNoteAmount);
                  const totalAmount = calculateCreditNoteTotal(baseAmount);
                  const remainingAfter = remainingInvoiceAmount - totalAmount;
                  
                  if (totalAmount > remainingInvoiceAmount) {
                    return (
                      <span className="text-destructive font-medium">
                        ⚠️ Credit note total amount (₹{totalAmount.toLocaleString()}) exceeds remaining invoice amount (₹{remainingInvoiceAmount.toLocaleString()})
                      </span>
                    );
                  } else {
                    return (
                      <span className="text-green-600">
                        ✓ Valid amount. Total: ₹{totalAmount.toLocaleString()}. Remaining after this credit note: ₹{remainingAfter.toLocaleString()}
                      </span>
                    );
                  }
                })()}
              </div>
            )}
          </div>

          {/* Credit Note Tax Details */}
          {selectedInvoiceData && creditNoteAmount && !isNaN(parseFloat(creditNoteAmount)) && parseFloat(creditNoteAmount) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Credit Note Tax Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Credit Note Amount:</span>
                    <span className="font-medium">₹{parseFloat(creditNoteAmount).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>CGST ({selectedInvoiceData.cgst}%):</span>
                    <span>₹{((parseFloat(creditNoteAmount) * selectedInvoiceData.cgst) / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST ({selectedInvoiceData.sgst}%):</span>
                    <span>₹{((parseFloat(creditNoteAmount) * selectedInvoiceData.sgst) / 100).toLocaleString()}</span>
                  </div>
                  {selectedInvoiceData.igst > 0 && (
                    <div className="flex justify-between">
                      <span>IGST ({selectedInvoiceData.igst}%):</span>
                      <span>₹{((parseFloat(creditNoteAmount) * selectedInvoiceData.igst) / 100).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isLoading}>
            {isLoading ? "Creating..." : "Add Credit Note"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCreditNoteDialog;