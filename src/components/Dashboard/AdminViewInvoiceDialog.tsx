import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Calendar, AlertTriangle, Loader2, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { updateInvoiceStatus, Invoice, createInvoiceComment, updateInvoiceComment, fetchInvoiceComment } from "@/services/invoiceService";


interface AdminViewInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onStatusUpdate?: (invoiceId: string, newStatus: Invoice['status']) => void;
  onCommentUpdate?: (invoiceId: string, comment: string | undefined) => void;
}

const AdminViewInvoiceDialog = ({ isOpen, onClose, invoice, onStatusUpdate, onCommentUpdate }: AdminViewInvoiceDialogProps) => {
  const [editableInvoice, setEditableInvoice] = useState(invoice);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [originalStatus] = useState(invoice.status);
  const [hasStatusChanged, setHasStatusChanged] = useState(false);
  const [commentText, setCommentText] = useState(invoice.comment || "");
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [isLoadingComment, setIsLoadingComment] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);

  // Fetch comment and update state when dialog opens
  useEffect(() => {
    if (isOpen && invoice) {
      setEditableInvoice(invoice);
      setIsEditingComment(false);
      
      // Always fetch comment from API when dialog opens to ensure we have the latest
      const loadComment = async () => {
        setIsLoadingComment(true);
        try {
          const invoiceNumber = invoice.invoiceNumber || invoice.id;
          const comment = await fetchInvoiceComment(invoiceNumber);
          // Set comment text to empty if no comment exists (so user can add one)
          setCommentText(comment || "");
          setEditableInvoice(prev => ({
            ...prev,
            comment: comment || undefined
          }));
        } catch (error) {
          console.error('Error loading comment:', error);
          // If comment fetch fails, clear comment state so user can add one
          setCommentText("");
          setEditableInvoice(prev => ({
            ...prev,
            comment: undefined
          }));
        } finally {
          setIsLoadingComment(false);
        }
      };
      
      loadComment();
    }
  }, [invoice, isOpen]); // Refetch comment whenever dialog opens or invoice changes

  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      'paid': 'default',
      'unpaid': 'secondary',
      'partial': 'outline',
      'overdue': 'destructive'
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const handleStatusChange = (newStatus: string) => {
    const typedStatus = newStatus as Invoice['status'];
    
    setEditableInvoice({
      ...editableInvoice,
      status: typedStatus
    });
    
    // Track if status has changed from original
    setHasStatusChanged(typedStatus !== originalStatus);
  };

  const handleSaveStatus = async () => {
    const currentStatus = editableInvoice.status;
    
    // Don't make API call if status hasn't changed
    if (currentStatus === originalStatus) {
      return;
    }

    // Map UI status to API status
    const mapStatusToApi = (status: Invoice['status']): 'paid' | 'unpaid' | 'partially_paid' => {
      switch (status) {
        case 'paid':
          return 'paid';
        case 'partial':
          return 'partially_paid';
        case 'unpaid':
        default:
          return 'unpaid';
      }
    };

    try {
      setIsUpdatingStatus(true);
      
      // Call the API to update status
      await updateInvoiceStatus(invoice.invoiceNumber || invoice.id, mapStatusToApi(currentStatus));
      
      // Notify parent component about the status change
      if (onStatusUpdate) {
        onStatusUpdate(invoice.id, currentStatus);
      }
      
      // Reset the changed flag
      setHasStatusChanged(false);
      
      toast({
        title: "Status Updated",
        description: `Invoice status successfully changed to ${currentStatus}`,
      });
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveComment = async () => {
    if (!commentText.trim()) {
      toast({
        title: "Validation Error",
        description: "Comment cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingComment(true);
      const invoiceNumber = invoice.invoiceNumber || invoice.id;
      
      // First, check if a comment already exists by trying to fetch it
      let hasExistingComment = false;
      try {
        const existingComment = await fetchInvoiceComment(invoiceNumber);
        hasExistingComment = existingComment !== null && existingComment.trim().length > 0;
      } catch (fetchError) {
        // If fetch fails (404 or other), assume no comment exists
        hasExistingComment = false;
      }
      
      // Try to save the comment - use PUT if comment exists, POST if it doesn't
      try {
        if (hasExistingComment) {
          await updateInvoiceComment(invoiceNumber, commentText.trim());
        } else {
          await createInvoiceComment(invoiceNumber, commentText.trim());
        }
      } catch (saveError: unknown) {
        // If POST fails because comment already exists, retry with PUT
        const errorResponse = saveError as { response?: { data?: { detail?: string; message?: string } } };
        const errorDetail = errorResponse?.response?.data?.detail || errorResponse?.response?.data?.message || "";
        
        // Check if the error indicates comment already exists
        if (!hasExistingComment && (
          errorDetail.toLowerCase().includes("already exists") || 
          errorDetail.toLowerCase().includes("use put") ||
          errorDetail.toLowerCase().includes("comment already exists")
        )) {
          // Retry with PUT
          await updateInvoiceComment(invoiceNumber, commentText.trim());
          hasExistingComment = true; // Update flag since we used PUT
        } else {
          throw saveError;
        }
      }
      
      // Refetch the comment from API to ensure we have the latest version
      try {
        const fetchedComment = await fetchInvoiceComment(invoiceNumber);
        const savedComment = fetchedComment || commentText.trim();
        
        // Update local state with the fetched comment
        setEditableInvoice({
          ...editableInvoice,
          comment: savedComment
        });
        setCommentText(savedComment);
        setIsEditingComment(false);
        
        // Notify parent component about the comment update
        if (onCommentUpdate) {
          onCommentUpdate(invoice.id, savedComment);
        }
      } catch (fetchError) {
        // If refetch fails, use the saved text
        const savedComment = commentText.trim();
        setEditableInvoice({
          ...editableInvoice,
          comment: savedComment
        });
        setCommentText(savedComment);
        setIsEditingComment(false);
        
        if (onCommentUpdate) {
          onCommentUpdate(invoice.id, savedComment);
        }
      }
      
      toast({
        title: "Success",
        description: hasExistingComment ? "Comment updated successfully." : "Comment added successfully.",
      });
    } catch (error: unknown) {
      console.error('Failed to save comment:', error);
      const errorResponse = error as { response?: { data?: { detail?: string; message?: string } } };
      const errorMessage = errorResponse?.response?.data?.detail || errorResponse?.response?.data?.message || "Failed to save comment. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleCancelComment = () => {
    setCommentText(editableInvoice.comment || "");
    setIsEditingComment(false);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Invoice Details - {editableInvoice.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Invoice ID</Label>
                    <div className="font-medium">{editableInvoice.id}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Customer</Label>
                    <div className="font-medium">{editableInvoice.customer}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Project Name</Label>
                    <div className="font-medium">{editableInvoice.taskName}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created Date</Label>
                    <div className="font-medium">{editableInvoice.createdAt}</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <div>{editableInvoice.description}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Invoice Amount</Label>
                    <div className="font-medium text-lg">₹{editableInvoice.invoiceAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Credit Note Amount</Label>
                    <div className="font-medium">₹{editableInvoice.creditNoteAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Amount Due</Label>
                    <div className="font-medium text-lg text-destructive">₹{editableInvoice.amountDue.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Due Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{editableInvoice.dueDate}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Current Status</Label>
                    <div className="mt-2">{getStatusBadge(editableInvoice.status)}</div>
                  </div>
                  <div>
                    <Label htmlFor="status">Update Status</Label>
                    <Select 
                      value={editableInvoice.status} 
                      onValueChange={handleStatusChange}
                      disabled={isUpdatingStatus}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                        <SelectItem value="partial">Partial Paid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasStatusChanged && (
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveStatus} 
                      disabled={isUpdatingStatus}
                      className="min-w-[100px]"
                    >
                      {isUpdatingStatus ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save Status'
                      )}
                    </Button>
                  </div>
                )}

                {editableInvoice.status === 'overdue' && editableInvoice.overdueDays && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">
                      This invoice is {editableInvoice.overdueDays} days overdue
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingComment ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading comment...</span>
                  </div>
                ) : !isEditingComment && editableInvoice.comment && editableInvoice.comment.trim().length > 0 ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-muted rounded-lg border border-border">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm whitespace-pre-wrap flex-1">{editableInvoice.comment}</p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditingComment(true);
                          setCommentText(editableInvoice.comment || "");
                        }}
                        disabled={isSavingComment || isLoadingComment}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Update Comment
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="comment">
                        {editableInvoice.comment && editableInvoice.comment.trim().length > 0 
                          ? "Update Comment" 
                          : "Add Comment"}
                      </Label>
                      <Textarea
                        id="comment"
                        placeholder="Enter your comment here..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        rows={4}
                        disabled={isSavingComment || isLoadingComment}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      {editableInvoice.comment && editableInvoice.comment.trim().length > 0 && isEditingComment && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelComment}
                          disabled={isSavingComment || isLoadingComment}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleSaveComment}
                        disabled={isSavingComment || isLoadingComment || !commentText.trim()}
                      >
                        {isSavingComment ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {editableInvoice.comment && editableInvoice.comment.trim().length > 0 ? 'Update Comment' : 'Add Comment'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>

        <div className="flex justify-between pt-4">
          <div>
            {hasStatusChanged && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {hasStatusChanged && (
              <Button 
                onClick={handleSaveStatus} 
                disabled={isUpdatingStatus}
                className="min-w-[100px]"
              >
                {isUpdatingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Status'
                )}
              </Button>
            )}
            <Button variant="outline" onClick={onClose} disabled={isUpdatingStatus}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminViewInvoiceDialog;