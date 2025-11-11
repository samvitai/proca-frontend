import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, FileText } from "lucide-react";

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
  invoiceGenerated?: boolean;
  invoice_id?: string | null;
  invoice_pdf_url?: string | null;
  credit_note_id?: string | null;
  shaCode?: string;
  serviceCategory?: string;
}

interface InvoiceSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const InvoiceSuccessModal = ({ isOpen, onClose, task }: InvoiceSuccessModalProps) => {
  if (!task) return null;

  // Calculate invoice details
  const baseAmount = task.amount || 0;
  const cgstRate = task.cgst || 9;
  const sgstRate = task.sgst || 9;
  const cgstAmount = (baseAmount * cgstRate) / 100;
  const sgstAmount = (baseAmount * sgstRate) / 100;
  const totalAmount = baseAmount + cgstAmount + sgstAmount;

  // Generate invoice number (you might want to get this from the actual invoice data)
  const invoiceNumber = `INV-2025-${task.invoice_id || task.id.padStart(4, '0')}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {/* Header with success icon and close button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Invoice Generated Successfully!</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Success message */}
        <p className="text-gray-600 mb-6">Your invoice has been generated successfully.</p>

        {/* Invoice details in two columns */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Invoice Number</div>
            <div className="font-semibold text-gray-900">{invoiceNumber}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Amount</div>
            <div className="font-semibold text-gray-900">₹{totalAmount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Client Name</div>
            <div className="font-semibold text-gray-900">{task.client}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Service</div>
            <div className="font-semibold text-gray-900">{task.serviceCategory || task.name}</div>
          </div>
        </div>

        {/* Navigation message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <p className="text-blue-800">
              To view this invoice, please navigate to the{" "}
              <span className="text-blue-600 font-medium cursor-pointer hover:underline">
                Invoices
              </span>{" "}
              tab.
            </p>
          </div>
        </div>

        {/* OK button */}
        <div className="flex justify-end">
          <Button 
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceSuccessModal;
