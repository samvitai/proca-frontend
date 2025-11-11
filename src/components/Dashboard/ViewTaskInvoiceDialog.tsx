import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText, Printer, Lock } from "lucide-react";

interface Task {
  id: string;
  client: string;
  name: string;
  description: string;
  status: 'open' | 'in-progress' | 'pending-review' | 'ready-for-close' | 'closed';
  assignedTo: string;
  createdAt: string;
  dueDate?: string;
  amount?: number;
  cgst?: number;
  sgst?: number;
}

interface ViewTaskInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

const ViewTaskInvoiceDialog = ({ isOpen, onClose, task }: ViewTaskInvoiceDialogProps) => {
  const baseAmount = task.amount || 0;
  const cgstRate = task.cgst || 9;
  const sgstRate = task.sgst || 9;
  const cgstAmount = (baseAmount * cgstRate) / 100;
  const sgstAmount = (baseAmount * sgstRate) / 100;
  const totalAmount = baseAmount + cgstAmount + sgstAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice - {task.name}
            </DialogTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Read Only
            </Badge>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="space-y-6 p-6 bg-muted/30 rounded-lg border-2 border-muted">
            {/* Read-only notice */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
              <p className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                This invoice has been generated and cannot be edited. For any changes, please contact administration.
              </p>
            </div>

            {/* Invoice Header */}
            <div className="text-center border-b pb-4 bg-background rounded-lg p-4">
              <h1 className="text-3xl font-bold text-foreground">INVOICE</h1>
              <p className="text-sm text-muted-foreground mt-1">Invoice #{task.id}</p>
              <p className="text-sm text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Client and Task Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client & Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bill To</p>
                    <p className="font-semibold text-lg">{task.client}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                    <p className="font-medium">{task.dueDate || 'Not specified'}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service Description</p>
                  <p className="font-medium">{task.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                    <p className="font-medium">{task.assignedTo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{task.status.replace('-', ' ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Breakdown */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Invoice Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Base Amount:</span>
                    <span className="font-semibold text-lg">₹{baseAmount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span>CGST ({cgstRate}%):</span>
                    <span className="font-medium">₹{cgstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>SGST ({sgstRate}%):</span>
                    <span className="font-medium">₹{sgstAmount.toLocaleString()}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center py-3 bg-primary/5 rounded-lg px-4">
                    <span className="text-lg font-bold text-primary">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Please make payment within the specified due date. For any queries regarding this invoice, 
                  please contact our accounts department.
                </p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between sm:justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Invoice locked - no edits allowed
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTaskInvoiceDialog;
