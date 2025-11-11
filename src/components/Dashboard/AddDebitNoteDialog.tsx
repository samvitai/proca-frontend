import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { debitNoteService, CreateDebitNoteRequest } from "@/services/debitNoteService";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/utils";

interface Client {
  client_id: string | number;
  client_name: string;
  client_code: string;
}

interface AddDebitNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}

const AddDebitNoteDialog = ({ isOpen, onClose, onAdd }: AddDebitNoteDialogProps) => {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const { toast } = useToast();

  // Fetch clients when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchClients();
      // Reset form when dialog opens
      setSelectedClientId("");
      setAmount("");
      setDescription("");
      setComments("");
      setDueDate("");
    }
  }, [isOpen]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await api.get("/api/clients/?is_active=true");
      const clientsData = response.data?.data?.clients || [];
      console.log('Fetched clients data:', clientsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const handleAdd = async () => {
    console.log('Form data before validation:', {
      selectedClientId,
      amount,
      description,
      dueDate
    });

    if (!selectedClientId || !amount || !description || !dueDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const debitNoteAmount = parseFloat(amount);
    
    // Extract numeric part from client_id (e.g., "client_202" -> 202)
    const numericClientId = selectedClientId.replace('client_', '');
    const finalClientId = parseInt(numericClientId);
    
    console.log('Parsed values:', {
      debitNoteAmount,
      selectedClientId,
      numericClientId,
      finalClientId,
      selectedClientIdType: typeof selectedClientId
    });

    // Validate that amount is positive
    if (isNaN(debitNoteAmount) || debitNoteAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that client_id is a valid integer
    if (isNaN(finalClientId) || finalClientId <= 0) {
      console.error('Invalid client ID:', { selectedClientId, numericClientId, finalClientId, isNaN: isNaN(finalClientId) });
      toast({
        title: "Validation Error",
        description: "Please select a valid client.",
        variant: "destructive",
      });
      return;
    }

    // Validate due date is in the future or today
    const selectedDueDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDueDate.setHours(0, 0, 0, 0);
    
    if (selectedDueDate < today) {
      toast({
        title: "Validation Error",
        description: "Due date cannot be in the past.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const debitNoteData: CreateDebitNoteRequest = {
        amount: debitNoteAmount,
        client_id: finalClientId,
        comments: comments || "",
        description: description,
        due_date: new Date(dueDate).toISOString(),
      };

      console.log('Creating debit note with data:', debitNoteData);

      const response = await debitNoteService.createDebitNote(debitNoteData);
      
      toast({
        title: "Success",
        description: `Debit note ${response.data.debit_note_number} created successfully.`,
      });
      
      // Reset form
      setSelectedClientId("");
      setAmount("");
      setDescription("");
      setComments("");
      setDueDate("");
      
      // Notify parent to refresh
      onAdd();
    } catch (error) {
      console.error('Error creating debit note:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create debit note. Please try again.",
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
          <DialogTitle>Add Debit Note</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Client Selection */}
          <div>
            <Label htmlFor="client">Client *</Label>
            {loadingClients ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <div className="text-sm text-muted-foreground">Loading clients...</div>
              </div>
            ) : (
              <SearchableSelect
                options={clients.map(client => ({
                  value: client.client_id.toString(),
                  label: `${client.client_name} (${client.client_code})`
                }))}
                value={selectedClientId}
                onValueChange={(value) => {
                  console.log('Selected client ID:', value, 'Type:', typeof value);
                  setSelectedClientId(value);
                }}
                placeholder="Choose a client"
                searchPlaceholder="Search client by name or code..."
              />
            )}
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter description for the debit note"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Comments */}
          <div>
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              placeholder="Enter any additional comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={2}
            />
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={isLoading}>
            {isLoading ? "Creating..." : "Add Debit Note"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddDebitNoteDialog;

