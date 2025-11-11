import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator, FileText, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/utils";

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

interface GenerateInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onGenerate: (taskId: string, invoiceData: InvoiceData) => void;
  onSuccess?: () => void; // Callback to refresh task data after invoice generation
}

interface InvoiceData {
  baseAmount: number;
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
}

const GenerateInvoiceDialog = ({ isOpen, onClose, task, onGenerate, onSuccess }: GenerateInvoiceDialogProps) => {
  const [baseAmount, setBaseAmount] = useState(task.amount || 0);
  const [cgstRate, setCgstRate] = useState(task.cgst || 9);
  const [sgstRate, setSgstRate] = useState(task.sgst || 9);
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate tax amounts
  const cgstAmount = (baseAmount * cgstRate) / 100;
  const sgstAmount = (baseAmount * sgstRate) / 100;
  const totalAmount = baseAmount + cgstAmount + sgstAmount;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Extract numeric ID from task ID (e.g., "task_22" -> 22)
      let taskId: number;
      
      if (task.id.includes('_')) {
        // Extract the number after the underscore
        const idParts = task.id.split('_');
        taskId = parseInt(idParts[idParts.length - 1], 10);
      } else {
        // If no underscore, try to parse the whole string
        taskId = parseInt(task.id, 10);
      }
      
      // Validate that task ID is a valid integer
      if (isNaN(taskId)) {
        throw new Error(`Invalid task ID: ${task.id}. Cannot generate invoice.`);
      }
      
      console.log("Original task ID:", task.id, "-> Extracted numeric ID:", taskId);
      
      // Call backend API to generate invoice with task_id in request body
      const response = await api.post(`/api/invoice/generate`, {
        task_id: taskId // Send task_id as number in request body
      });
      
      if (response.data?.success) {
        const invoiceData: InvoiceData = {
          baseAmount,
          cgstRate,
          sgstRate,
          cgstAmount,
          sgstAmount,
          totalAmount
        };

        // Call the local state update callback
        onGenerate(task.id, invoiceData);
        
        toast({
          title: "Invoice Generated Successfully",
          description: "Please open the Invoices tab to view your generated invoice.",
        });

        // Call success callback to refresh task data from backend
        if (onSuccess) {
          await onSuccess();
        }
        
        onClose();
      }
    } catch (error: unknown) {
      console.error("Error generating invoice:", error);
      let errorMessage = "Failed to generate invoice";
      
      // Handle Error instances (like our validation error)
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string; detail?: string; errors?: Array<{ field: string; message: string }> } } };
        const responseData = axiosError.response?.data;
        
        // Check for validation errors array
        if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          const validationMessages = responseData.errors.map(err => `${err.field}: ${err.message}`).join(', ');
          errorMessage = `Validation Error: ${validationMessages}`;
        } else {
          errorMessage = responseData?.message || responseData?.detail || errorMessage;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetToDefaults = () => {
    setBaseAmount(task.amount || 0);
    setCgstRate(task.cgst || 9);
    setSgstRate(task.sgst || 9);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Invoice - {task.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Client</Label>
                  <p className="font-medium">{task.client}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <p className="font-medium capitalize">{task.status.replace('-', ' ')}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="text-sm">{task.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
                  <p className="font-medium">{task.assignedTo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                  <p className="font-medium">{task.dueDate || 'Not set'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Invoice Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Base Amount */}
              <div>
                <Label htmlFor="baseAmount">Base Amount (₹)</Label>
                <Input
                  id="baseAmount"
                  type="number"
                  value={baseAmount}
                  placeholder="Enter base amount"
                  min="0"
                  step="0.01"
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Amount is locked from Project configuration
                </p>
              </div>

              {/* GST Rates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cgstRate">CGST Rate (%)</Label>
                  <Input
                    id="cgstRate"
                    type="number"
                    value={cgstRate}
                    placeholder="CGST %"
                    min="0"
                    max="28"
                    step="0.01"
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    GST rate is locked from Project configuration
                  </p>
                </div>
                <div>
                  <Label htmlFor="sgstRate">SGST Rate (%)</Label>
                  <Input
                    id="sgstRate"
                    type="number"
                    value={sgstRate}
                    placeholder="SGST %"
                    min="0"
                    max="28"
                    step="0.01"
                    readOnly
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    GST rate is locked from Project configuration
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200">
                <p>⚠️ All invoice amounts and GST rates are locked from Project configuration and cannot be modified.</p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg text-primary">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Base Amount:</span>
                <span className="font-medium">₹{baseAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>CGST ({cgstRate}%):</span>
                <span className="font-medium">₹{cgstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>SGST ({sgstRate}%):</span>
                <span className="font-medium">₹{sgstAmount.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold text-primary">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={baseAmount <= 0 || isGenerating}
            className="min-w-[120px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Invoice
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateInvoiceDialog;