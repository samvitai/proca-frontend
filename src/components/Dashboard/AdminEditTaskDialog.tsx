import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, Send, Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api, getCurrentUser } from "@/lib/utils";

interface Task {
  id: string;
  client: string;
  name: string;
  description: string;
  status: 'open' | 'in-progress' | 'pending-review' | 'ready-for-close' | 'closed';
  assignedTo: string;
  createdAt: string;
  dueDate?: string;
  invoiceGenerated?: boolean;
  invoice_id?: string | null;
  invoice_pdf_url?: string | null;
  credit_note_id?: string | null;
  amount?: number;
  cgst?: number;
  sgst?: number;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
    file?: {
      name: string;
      url: string;
    };
  }>;
  logs: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
  }>;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role_name: string;
}

interface AdminEditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onUpdate: (task: Task) => void;
  onGenerateInvoice?: (task: Task) => void;
}

const AdminEditTaskDialog = ({ isOpen, onClose, task, onUpdate, onGenerateInvoice }: AdminEditTaskDialogProps) => {
  const [currentTask, setCurrentTask] = useState(task);
  const [formData, setFormData] = useState({
    client: task.client,
    name: task.name,
    description: task.description,
    status: task.status,
    assignedTo: task.assignedTo,
    dueDate: task.dueDate || '',
    amount: task.amount?.toString() || '',
    cgst: task.cgst?.toString() || '9',
    sgst: task.sgst?.toString() || '9'
  });
  
  const [newComment, setNewComment] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'pending-review', label: 'Pending Review' },
    { value: 'ready-for-close', label: 'Ready for Close' },
    { value: 'closed', label: 'Closed' }
  ];

  // Status progression rules - can only move forward, never backward
  const getAvailableStatuses = (currentStatus: string) => {
    const statusOrder = ['open', 'in-progress', 'pending-review', 'ready-for-close', 'closed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    // Can only move forward or stay in current status, never go backward
    // Make sure current status is always included
    return statusOptions.filter((option, index) => index >= currentIndex);
  };

  // Fetch users when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      // Reset formData when dialog opens with fresh task data
      setFormData({
        client: task.client,
        name: task.name,
        description: task.description,
        status: task.status,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate || '',
        amount: task.amount?.toString() || '',
        cgst: task.cgst?.toString() || '9',
        sgst: task.sgst?.toString() || '9'
      });
      // Update currentTask when task prop changes
      setCurrentTask(task);
    }
  }, [isOpen, task]);

  // Find the assigned user ID when assignedTo changes
  useEffect(() => {
    if (users.length > 0 && formData.assignedTo) {
      console.log('Looking for user with name:', formData.assignedTo);
      console.log('Available users:', users.map(u => `${u.first_name} ${u.last_name} (ID: ${u.id})`));
      
      const assignedUser = users.find(user => 
        `${user.first_name} ${user.last_name}` === formData.assignedTo
      );
      
      const newUserId = assignedUser ? String(assignedUser.id) : null;
      console.log('Found user ID:', newUserId, 'for user:', assignedUser);
      setAssignedUserId(newUserId);
    }
  }, [formData.assignedTo, users]);

  const fetchUsers = async () => {
    setIsInitialLoading(true);
    try {
      const response = await api.get('/api/v1/users/users');
      const activeUsers = Array.isArray(response.data) 
        ? response.data.filter((user: User) => user.is_active) 
        : [];
      setUsers(activeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsCommentLoading(true);
    try {
      const formData = new FormData();
      formData.append('comment_text', newComment);

      const response = await api.post(`/api/tasks/${currentTask.id}/comments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        // Update local task with new comment
        const newCommentData = {
          id: response.data.data.comment_id,
          author: response.data.data.user_name,
          content: response.data.data.comment_text,
          timestamp: new Date(response.data.data.created_at).toLocaleString(),
          files: response.data.data.attached_files || []
        };

        const updatedTask = {
          ...currentTask,
          comments: [...currentTask.comments, newCommentData],
          logs: [
            ...currentTask.logs,
            {
              id: Date.now().toString(),
              action: 'Comment added',
              user: response.data.data.user_name,
              timestamp: new Date().toLocaleString()
            }
          ]
        };

        // Update local state for immediate UI update
        setCurrentTask(updatedTask);
        onUpdate(updatedTask);
        setNewComment("");
        
        toast({
          title: "Comment Added",
          description: "Your comment has been added successfully.",
        });
      }
    } catch (error: unknown) {
      console.error("Error adding comment:", error);
      const errorMessage = (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data?.message || 
                          (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data?.detail || 
                          "Failed to add comment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCommentLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    setIsLoading(true);
    try {
      // Convert UI status format (hyphens) to API format (underscores)
      const apiStatus = formData.status.replace(/-/g, '_');
      
      console.log('=== Admin Task Update Debug Info ===');
      console.log('Current task assignedTo:', currentTask.assignedTo);
      console.log('New formData.assignedTo:', formData.assignedTo);
      console.log('Resolved assignedUserId (string):', assignedUserId);
      console.log('Users list:', users);
      console.log('Is assignee changed?', currentTask.assignedTo !== formData.assignedTo);
      
      // Prepare task update payload matching supervisor format
      // Keep assignee_id as string (API expects string type based on spec)
      console.log('assignee_id value:', assignedUserId);
      
      if (!assignedUserId) {
        console.warn('⚠️ assignedUserId is null or undefined! This will not update the assignee.');
      }
      
      // Build complete payload - include all updateable fields
      const updatePayload: {
        task_name: string;
        service_description: string;
        due_date: string | null;
        workflow_status: string;
        assignee_id: string | null;
        invoice_amount?: number;
        gst_override_percentage?: number;
      } = {
        task_name: formData.name,
        service_description: formData.description,
        due_date: formData.dueDate || null,
        workflow_status: apiStatus,
        assignee_id: assignedUserId, // Keep as string
      };
      
      // Add optional financial fields if provided
      if (formData.amount) {
        updatePayload.invoice_amount = parseFloat(formData.amount);
      }
      
      if (formData.cgst && formData.sgst) {
        updatePayload.gst_override_percentage = parseFloat(formData.cgst) + parseFloat(formData.sgst);
      }

      console.log('Payload before sending:');
      console.log('  - workflow_status:', updatePayload.workflow_status, '(type:', typeof updatePayload.workflow_status, ')');
      console.log('  - assignee_id:', updatePayload.assignee_id, '(type:', typeof updatePayload.assignee_id, ')');
      console.log('Full Admin update payload:', JSON.stringify(updatePayload, null, 2));
      console.log('Payload keys:', Object.keys(updatePayload));
      
      // Check if fields are actually in the payload
      console.log('Has workflow_status?', 'workflow_status' in updatePayload);
      console.log('Has assignee_id?', 'assignee_id' in updatePayload);

      // Update task with all fields in a single API call
      console.log('Sending PUT request to:', `/api/tasks/${currentTask.id}`);
      const updateResponse = await api.put(`/api/tasks/${currentTask.id}`, updatePayload);
      
      console.log('API Response:', updateResponse.data);
      console.log('Response status:', updateResponse.status);

      if (updateResponse.data?.success) {
        // Build a detailed log message
        const changes = [];
        if (formData.status !== currentTask.status) changes.push(`Status: ${formData.status}`);
        if (formData.assignedTo !== currentTask.assignedTo) changes.push(`Assigned to: ${formData.assignedTo}`);
        if (formData.name !== currentTask.name) changes.push(`Name updated`);
        if (formData.description !== currentTask.description) changes.push(`Description updated`);
        
        const logMessage = changes.length > 0 
          ? `Task updated - ${changes.join(', ')}` 
          : "Task updated";

        const updatedTask: Task = {
          ...currentTask,
          name: formData.name,
          description: formData.description,
          status: formData.status,
          assignedTo: formData.assignedTo,
          dueDate: formData.dueDate,
          amount: formData.amount ? parseFloat(formData.amount) : undefined,
          cgst: formData.cgst ? parseFloat(formData.cgst) : undefined,
          sgst: formData.sgst ? parseFloat(formData.sgst) : undefined,
          logs: [
            ...currentTask.logs,
            {
              id: Date.now().toString(),
              action: logMessage,
              user: getCurrentUser()?.first_name + ' ' + getCurrentUser()?.last_name || "Admin",
              timestamp: new Date().toLocaleString()
            }
          ]
        };

        // Update local state for immediate UI update
        setCurrentTask(updatedTask);
        onUpdate(updatedTask);
        toast({
          title: "Project Updated",
          description: "Project has been updated successfully.",
        });
      }
    } catch (error: unknown) {
      console.error("Error updating task:", error);
      const errorMessage = (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data?.message || 
                          (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data?.detail || 
                          "Failed to update task";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (taskId: string, filePath: string, fileName: string) => {
    try {
      const response = await api.get(`/api/tasks/${taskId}/files/${filePath}`, {
        responseType: 'blob',
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Project Details</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  value={formData.client}
                  onChange={(e) => setFormData({...formData, client: e.target.value})}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                {isInitialLoading ? (
                  <Input value="Loading users..." disabled readOnly className="opacity-50" />
                ) : (
                  <Select 
                    value={formData.assignedTo} 
                    onValueChange={(value) => setFormData({...formData, assignedTo: value})}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={`${user.first_name} ${user.last_name}`}>
                          {user.first_name} {user.last_name} ({user.role_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({...formData, status: value as Task['status']})}
                  disabled={isLoading}
                  key={`status-select-${task.id}-${formData.status}`}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableStatuses(task.status).map(status => (
                      <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="cgst">CGST (%)</Label>
                <Input
                  id="cgst"
                  type="number"
                  value={formData.cgst}
                  onChange={(e) => setFormData({...formData, cgst: e.target.value})}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="sgst">SGST (%)</Label>
                <Input
                  id="sgst"
                  type="number"
                  value={formData.sgst}
                  onChange={(e) => setFormData({...formData, sgst: e.target.value})}
                  disabled={isLoading}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Add Comment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Write your comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  disabled={isCommentLoading}
                />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim() || isCommentLoading}
                  >
                    {isCommentLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Add Comment
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Existing Comments</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto">
                {currentTask.comments.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No comments yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentTask.comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{comment.author}</span>
                          <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        {comment.file && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{comment.file.name}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => downloadFile(currentTask.id, comment.file!.url, comment.file!.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Logs</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto">
                <div className="space-y-4">
                  {currentTask.logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-3 border-l-2 border-primary/20">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{log.action}</div>
                        <div className="text-sm text-muted-foreground">by {log.user}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{log.timestamp}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <div>
            {formData.status === 'closed' && !task.invoice_id && onGenerateInvoice && (
              <Button 
                onClick={() => {
                  handleUpdateTask();
                  onGenerateInvoice(task);
                }}
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Project'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditTaskDialog;
