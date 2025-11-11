import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Edit, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CreditNote {
  id: string;
  customerName: string;
  invoiceId: string;
  invoiceAmount: number;
  creditNoteAmount: number;
  dueFromCustomer: number;
  createdAt: string;
  cgst: number;
  sgst: number;
  taskName?: string;
}

interface AdminViewCreditNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  creditNote: CreditNote;
  onUpdate: (creditNote: CreditNote) => void;
}

const AdminViewCreditNoteDialog = ({ isOpen, onClose, creditNote, onUpdate }: AdminViewCreditNoteDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(creditNote);

  const handleSave = () => {
    // Recalculate due from customer
    const updatedCreditNote = {
      ...editData,
      dueFromCustomer: editData.invoiceAmount - editData.creditNoteAmount
    };
    
    onUpdate(updatedCreditNote);
    setIsEditing(false);
    
    toast({
      title: "Credit Note Updated",
      description: "Credit note has been updated successfully.",
    });
  };

  const handleCancel = () => {
    setEditData(creditNote);
    setIsEditing(false);
  };

  const calculateTax = (amount: number, rate: number) => {
    return (amount * rate) / 100;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Credit Note Details - {creditNote.id}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Credit Note Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Credit Note ID</Label>
                  <div className="font-medium">{creditNote.id}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Created Date</Label>
                  <div className="font-medium">{creditNote.createdAt}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  {isEditing ? (
                    <Input
                      id="customerName"
                      value={editData.customerName}
                      onChange={(e) => setEditData({...editData, customerName: e.target.value})}
                    />
                  ) : (
                    <div className="font-medium">{creditNote.customerName}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="invoiceId">Invoice ID</Label>
                  {isEditing ? (
                    <Input
                      id="invoiceId"
                      value={editData.invoiceId}
                      onChange={(e) => setEditData({...editData, invoiceId: e.target.value})}
                    />
                  ) : (
                    <div className="font-medium">{creditNote.invoiceId}</div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="taskName">Project Name</Label>
                {isEditing ? (
                  <Input
                    id="taskName"
                    value={editData.taskName || ''}
                    onChange={(e) => setEditData({...editData, taskName: e.target.value})}
                  />
                ) : (
                  <div className="font-medium">{creditNote.taskName || '-'}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceAmount">Credit Note Amount (₹)</Label>
                  {isEditing ? (
                    <Input
                      id="invoiceAmount"
                      type="number"
                      value={editData.invoiceAmount}
                      onChange={(e) => setEditData({...editData, invoiceAmount: parseFloat(e.target.value) || 0})}
                    />
                  ) : (
                    <div className="font-medium text-lg">₹{creditNote.invoiceAmount.toLocaleString()}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="creditNoteAmount">Credit Note Amount include Tax (₹)</Label>
                  {isEditing ? (
                    <Input
                      id="creditNoteAmount"
                      type="number"
                      value={editData.creditNoteAmount}
                      onChange={(e) => setEditData({...editData, creditNoteAmount: parseFloat(e.target.value) || 0})}
                    />
                  ) : (
                    <div className="font-medium text-lg">₹{creditNote.creditNoteAmount.toLocaleString()}</div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cgst">CGST (%)</Label>
                  {isEditing ? (
                    <Input
                      id="cgst"
                      type="number"
                      value={editData.cgst}
                      onChange={(e) => setEditData({...editData, cgst: parseFloat(e.target.value) || 0})}
                    />
                  ) : (
                    <div className="font-medium">{creditNote.cgst}%</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="sgst">SGST (%)</Label>
                  {isEditing ? (
                    <Input
                      id="sgst"
                      type="number"
                      value={editData.sgst}
                      onChange={(e) => setEditData({...editData, sgst: parseFloat(e.target.value) || 0})}
                    />
                  ) : (
                    <div className="font-medium">{creditNote.sgst}%</div>
                  )}
                </div>
              </div>

              {/* Tax Calculations */}
              <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
                <div className="text-sm font-medium">Tax Breakdown (Credit Note Amount)</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>CGST ({(isEditing ? editData : creditNote).cgst}%):</span>
                    <span>₹{calculateTax((isEditing ? editData : creditNote).creditNoteAmount, (isEditing ? editData : creditNote).cgst).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST ({(isEditing ? editData : creditNote).sgst}%):</span>
                    <span>₹{calculateTax((isEditing ? editData : creditNote).creditNoteAmount, (isEditing ? editData : creditNote).sgst).toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>Close</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminViewCreditNoteDialog;