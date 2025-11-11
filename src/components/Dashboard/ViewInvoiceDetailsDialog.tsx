import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface ViewInvoiceDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
}

const ViewInvoiceDetailsDialog = ({ isOpen, onClose, invoice }: ViewInvoiceDetailsDialogProps) => {
  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      'paid': 'default',
      'unpaid': 'secondary',
      'partial': 'outline',
      'overdue': 'destructive'
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Project Name</p>
                    <p className="font-medium">{invoice.taskName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customer</p>
                    <p className="font-medium">{invoice.customer}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p>{invoice.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Invoice Amount</p>
                    <p className="font-medium">₹{invoice.invoiceAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Credit Note Amount</p>
                    <p className="font-medium">₹{invoice.creditNoteAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount Due</p>
                    <p className="font-medium">₹{invoice.amountDue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                    <p className="font-medium">{invoice.dueDate}</p>
                  </div>
                  {invoice.status === 'overdue' && invoice.overdueDays && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Overdue By</p>
                      <p className="font-medium text-destructive">{invoice.overdueDays} days</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewInvoiceDetailsDialog;