import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { debitNoteService, UpdateDebitNoteRequest } from "@/services/debitNoteService";
import { api } from "@/lib/utils";

interface DebitNote {
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

interface Client {
  client_id: string;
  client_name: string;
  client_code: string;
}

interface AdminViewDebitNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  debitNote: DebitNote;
  onUpdate: () => void;
}

const AdminViewDebitNoteDialog = ({ isOpen, onClose, debitNote, onUpdate }: AdminViewDebitNoteDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    amount: debitNote.amount,
    description: debitNote.description,
    comments: debitNote.comments,
    due_date: debitNote.due_date.split('T')[0], // Extract date part
    client_id: debitNote.client_id.toString(),
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && isEditing) {
      fetchClients();
    }
  }, [isOpen, isEditing]);

  useEffect(() => {
    if (isOpen) {
      setEditData({
        amount: debitNote.amount,
        description: debitNote.description,
        comments: debitNote.comments,
        due_date: debitNote.due_date.split('T')[0],
        client_id: debitNote.client_id.toString(),
      });
      setIsEditing(false);
    }
  }, [debitNote, isOpen]);

  const fetchClients = async () => {
    try {
      const response = await api.get("/api/clients/?is_active=true");
      const clientsData = response.data?.data?.clients || [];
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSave = async () => {
    if (!editData.amount || !editData.description || !editData.due_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(editData.amount.toString());
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Extract numeric part from client_id (e.g., "client_202" -> 202)
      const numericClientId = editData.client_id.replace('client_', '');
      const finalClientId = parseInt(numericClientId);
      
      const updateData: UpdateDebitNoteRequest = {
        amount: amount,
        client_id: finalClientId,
        description: editData.description,
        comments: editData.comments || "",
        due_date: new Date(editData.due_date).toISOString(),
      };

      await debitNoteService.updateDebitNote(debitNote.debit_note_id, updateData);
      
      toast({
        title: "Success",
        description: "Debit note updated successfully.",
      });
      
      setIsEditing(false);
      onUpdate(); // Refresh the list
    } catch (error) {
      console.error('Error updating debit note:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update debit note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      amount: debitNote.amount,
      description: debitNote.description,
      comments: debitNote.comments,
      due_date: debitNote.due_date.split('T')[0],
      client_id: debitNote.client_id.toString(),
    });
    setIsEditing(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Debit Note Details - {debitNote.debit_note_number}</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isSaving}
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
                Debit Note Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Debit Note Number</Label>
                  <div className="font-medium">{debitNote.debit_note_number}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(debitNote.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Created Date</Label>
                  <div className="font-medium">{new Date(debitNote.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Last Updated</Label>
                  <div className="font-medium">{new Date(debitNote.updated_at).toLocaleDateString()}</div>
                </div>
              </div>

              <div>
                <Label htmlFor="client">Client</Label>
                {isEditing ? (
                  <select
                    id="client"
                    value={editData.client_id}
                    onChange={(e) => setEditData({...editData, client_id: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.client_id} value={client.client_id}>
                        {client.client_name} ({client.client_code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="font-medium">{debitNote.client_name}</div>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={editData.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                    rows={3}
                  />
                ) : (
                  <div className="font-medium">{debitNote.description}</div>
                )}
              </div>

              <div>
                <Label htmlFor="comments">Comments</Label>
                {isEditing ? (
                  <Textarea
                    id="comments"
                    value={editData.comments}
                    onChange={(e) => setEditData({...editData, comments: e.target.value})}
                    rows={2}
                  />
                ) : (
                  <div className="font-medium">{debitNote.comments || '-'}</div>
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
                  <Label htmlFor="amount">Amount (₹)</Label>
                  {isEditing ? (
                    <Input
                      id="amount"
                      type="number"
                      value={editData.amount}
                      onChange={(e) => setEditData({...editData, amount: parseFloat(e.target.value) || 0})}
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <div className="font-medium text-lg">₹{debitNote.amount.toLocaleString()}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  {isEditing ? (
                    <Input
                      id="dueDate"
                      type="date"
                      value={editData.due_date}
                      onChange={(e) => setEditData({...editData, due_date: e.target.value})}
                    />
                  ) : (
                    <div className="font-medium">{new Date(debitNote.due_date).toLocaleDateString()}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm text-muted-foreground">Total Amount</Label>
                  <div className="font-medium text-lg">₹{debitNote.amount.toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Paid Amount</Label>
                  <div className="font-medium text-lg text-green-600">₹{debitNote.paid_amount.toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Outstanding Amount</Label>
                  <div className="font-medium text-lg text-orange-600">₹{debitNote.outstanding_amount.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
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

export default AdminViewDebitNoteDialog;

