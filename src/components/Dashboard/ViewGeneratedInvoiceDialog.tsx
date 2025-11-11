import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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

interface ViewGeneratedInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

const ViewGeneratedInvoiceDialog = ({ isOpen, onClose, invoice }: ViewGeneratedInvoiceDialogProps) => {
  const taxAmount = invoice.invoiceAmount * 0.18; // 18% GST
  const subtotal = invoice.invoiceAmount - taxAmount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Generated Invoice</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 p-6 bg-white text-black">
            {/* Invoice Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold">INVOICE</h1>
              <p className="text-sm text-gray-600">Invoice #{invoice.id}</p>
            </div>

            <Separator />

            {/* Billing Information */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-2">Bill To:</h3>
                <p className="font-medium">{invoice.customer}</p>
                <p className="text-sm text-gray-600">Customer Address</p>
                <p className="text-sm text-gray-600">City, State - 000000</p>
              </div>
              <div className="text-right">
                <h3 className="font-semibold mb-2">Invoice Details:</h3>
                <p className="text-sm"><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                <p className="text-sm"><span className="font-medium">Due Date:</span> {invoice.dueDate}</p>
                <p className="text-sm"><span className="font-medium">Terms:</span> Net 30</p>
              </div>
            </div>

            <Separator />

            {/* Invoice Items */}
            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">
                      <p className="font-medium">{invoice.taskName}</p>
                      <p className="text-sm text-gray-600">{invoice.description}</p>
                    </td>
                    <td className="text-right py-2">₹{subtotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-1">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>CGST (9%):</span>
                  <span>₹{(taxAmount/2).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>SGST (9%):</span>
                  <span>₹{(taxAmount/2).toLocaleString()}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between py-2 font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{invoice.invoiceAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="mt-8 text-sm text-gray-600">
              <h4 className="font-semibold mb-2">Payment Instructions:</h4>
              <p>Please make payment within 30 days of invoice date.</p>
              <p>Bank Transfer Details: Account No. XXXX-XXXX-XXXX</p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-between pt-4">
          <Button variant="outline">Download PDF</Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewGeneratedInvoiceDialog;