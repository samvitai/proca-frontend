import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  User, 
  Building, 
  FileText, 
  Download, 
  Edit, 
  Save, 
  X, 
  MessageSquare, 
  Send, 
  Loader2,
  HelpCircle
} from "lucide-react";
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
  // Clarification fields
  require_clarification?: boolean;
  clarification_from?: string | null;
  clarification_from_name?: string | null;
  clarification_to?: string | null;
  clarification_to_name?: string | null;
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

interface AdminViewTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onUpdate: (task: Task) => void;
  onGenerateInvoice?: (task: Task) => void;
}

const AdminViewTaskDialog = ({ isOpen, onClose, task, onUpdate, onGenerateInvoice }: AdminViewTaskDialogProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
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
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  
  // Clarifications state
  const [isClarificationRequired, setIsClarificationRequired] = useState(false);
  const [selectedSupervisorAdmin, setSelectedSupervisorAdmin] = useState<string>("");
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>("comments");

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'pending-review', label: 'Pending Review' },
    { value: 'ready-for-close', label: 'Ready to Close' },
    { value: 'closed', label: 'Closed' }
  ];

  // Reset form data and current task when task prop changes
  useEffect(() => {
    setCurrentTask(task);
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
    
    // Initialize clarification state - start with checkbox unchecked for user control
    // Only show existing clarification data if there's actually a clarification assigned
    if (task.require_clarification && task.clarification_to_name) {
      setIsClarificationRequired(true);
      setSelectedSupervisorAdmin(task.clarification_to_name);
    } else {
      setIsClarificationRequired(false);
      setSelectedSupervisorAdmin("");
    }
    
    setIsEditMode(false);
    setActiveTab("comments"); // Reset to comments tab when task changes
  }, [task]);

  // Fetch users when entering edit mode or when dialog opens
  useEffect(() => {
    if ((isEditMode || isOpen) && users.length === 0) {
      fetchUsers();
    }
  }, [isEditMode, isOpen, users.length]);

  // Find the assigned user ID when assignedTo changes
  useEffect(() => {
    if (users.length > 0 && formData.assignedTo) {
      const assignedUser = users.find(user => 
        `${user.first_name} ${user.last_name}` === formData.assignedTo
      );
      setAssignedUserId(assignedUser ? String(assignedUser.id) : null);
      console.log('AdminViewTaskDialog - Mapped user:', formData.assignedTo, '-> ID:', assignedUser?.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.assignedTo, users.length]);

  const fetchUsers = async () => {
    setIsUsersLoading(true);
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
      setIsUsersLoading(false);
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      'open': 'secondary',
      'in-progress': 'default', 
      'pending-review': 'outline',
      'ready-for-close': 'outline',
      'closed': 'default'
    } as const;

    const labels = {
      'open': 'Open',
      'in-progress': 'In Progress',
      'pending-review': 'Pending Review',
      'ready-for-close': 'Ready for Close',
      'closed': 'Closed'
    } as const;

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  // Status progression rules
  const getAvailableStatuses = (currentStatus: string) => {
    const statusOrder = ['open', 'in-progress', 'pending-review', 'ready-for-close', 'closed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    // Can only move forward or stay in current status
    return statusOptions.filter((_, index) => index >= currentIndex);
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset form data
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
    }
    setIsEditMode(!isEditMode);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Validate clarification fields
      if (isClarificationRequired && !selectedSupervisorAdmin) {
        toast({
          title: "Validation Error",
          description: "Please select an advisor when clarification is required.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Convert UI status format (hyphens) to API format (underscores)
      const apiStatus = formData.status.replace(/-/g, '_');
      
      console.log('=== AdminViewTaskDialog Task Update ===');
      console.log('Current task status:', task.status);
      console.log('New formData.status:', formData.status);
      console.log('Current task assignedTo:', task.assignedTo);
      console.log('New formData.assignedTo:', formData.assignedTo);
      console.log('Resolved assignedUserId:', assignedUserId);
      console.log('Workflow status (API format):', apiStatus);
      console.log('Clarification required:', isClarificationRequired);
      console.log('Selected supervisor/admin:', selectedSupervisorAdmin);
      
      // Get user info from localStorage for clarification fields
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');

      // Prepare complete task update payload including assignee_id and workflow_status
      const updatePayload: {
        task_name: string;
        service_description: string;
        due_date: string | null;
        workflow_status: string;
        assignee_id: string | null;
        invoice_amount?: number;
        gst_override_percentage?: number;
        require_clarification: boolean;
        clarification_from: string | null;
        clarification_from_name: string | null;
        clarification_to: string | null;
        clarification_to_name: string | null;
      } = {
        task_name: formData.name,
        service_description: formData.description,
        due_date: formData.dueDate || null,
        workflow_status: apiStatus,
        assignee_id: assignedUserId,
        require_clarification: isClarificationRequired,
        clarification_from: isClarificationRequired ? userId : null,
        clarification_from_name: isClarificationRequired ? userName : null,
        clarification_to: null, // Always null as per requirements
        clarification_to_name: isClarificationRequired ? selectedSupervisorAdmin : null,
      };
      
      // Add optional financial fields if provided
      if (formData.amount) {
        updatePayload.invoice_amount = parseFloat(formData.amount);
      }
      
      if (formData.cgst && formData.sgst) {
        updatePayload.gst_override_percentage = parseFloat(formData.cgst) + parseFloat(formData.sgst);
      }

      console.log('Full update payload:', JSON.stringify(updatePayload, null, 2));
      console.log('Payload includes workflow_status?', 'workflow_status' in updatePayload);
      console.log('Payload includes assignee_id?', 'assignee_id' in updatePayload);

      // Update task with all fields in a single API call
      const updateResponse = await api.put(`/api/tasks/${task.id}`, updatePayload);
      
      console.log('API Response:', updateResponse.data);

      if (updateResponse.data?.success) {
        // Build a detailed log message
        const changes = [];
        if (formData.status !== task.status) changes.push(`Status: ${formData.status}`);
        if (formData.assignedTo !== task.assignedTo) changes.push(`Assigned to: ${formData.assignedTo}`);
        if (formData.name !== task.name) changes.push(`Name updated`);
        if (formData.description !== task.description) changes.push(`Description updated`);
        
        const logMessage = changes.length > 0 
          ? `Task updated - ${changes.join(', ')}` 
          : "Task updated";

        const updatedTask: Task = {
          ...task,
          name: formData.name,
          description: formData.description,
          status: formData.status,
          assignedTo: formData.assignedTo,
          dueDate: formData.dueDate,
          amount: formData.amount ? parseFloat(formData.amount) : undefined,
          cgst: formData.cgst ? parseFloat(formData.cgst) : undefined,
          sgst: formData.sgst ? parseFloat(formData.sgst) : undefined,
          // Update clarification fields
          require_clarification: isClarificationRequired,
          clarification_from: isClarificationRequired ? userId : null,
          clarification_from_name: isClarificationRequired ? userName : null,
          clarification_to: null,
          clarification_to_name: isClarificationRequired ? selectedSupervisorAdmin : null,
          logs: [
            ...task.logs,
            {
              id: Date.now().toString(),
              action: logMessage,
              user: getCurrentUser()?.first_name + ' ' + getCurrentUser()?.last_name || "Admin",
              timestamp: new Date().toLocaleString()
            }
          ]
        };

        console.log('Updated task being passed to onUpdate:', updatedTask);
        console.log('Updated task status:', updatedTask.status);
        // Update the parent component's state
        onUpdate(updatedTask);
        
        // Update local currentTask state to ensure immediate UI update
        setCurrentTask(updatedTask);
        
        setIsEditMode(false);
        
        // Show specific success message for clarifications
        const clarificationMessage = isClarificationRequired && selectedSupervisorAdmin 
          ? `Clarification requested from ${selectedSupervisorAdmin}.`
          : "";
        
        toast({
          title: "Task Updated",
          description: `Task has been updated successfully. ${clarificationMessage}`,
        });
        
        // Switch to comments tab if clarification was saved
        if (isClarificationRequired && selectedSupervisorAdmin) {
          setActiveTab("comments");
        }
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
          <div className="flex items-center justify-between">
            <DialogTitle>{isEditMode ? 'Edit Task' : 'Task Details'}</DialogTitle>
            <div className="flex gap-2">
              {isEditMode ? (
                <>
                  <Button 
                    onClick={handleSave} 
                    disabled={isLoading}
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleEditToggle}
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleEditToggle}
                  size="sm"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditMode ? (
                  // Edit Mode
                  <>
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
                        {isUsersLoading ? (
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
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={(value) => setFormData({...formData, status: value as Task['status']})}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue />
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
                  </>
                ) : (
                  // View Mode
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Building className="h-4 w-4" />
                          Client
                        </div>
                        <div className="font-medium">{currentTask.client}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <User className="h-4 w-4" />
                          Assigned To
                        </div>
                        <div className="font-medium">{currentTask.assignedTo}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Status</div>
                        <div>{getStatusBadge(currentTask.status)}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Calendar className="h-4 w-4" />
                          Due Date
                        </div>
                        <div className="font-medium">{currentTask.dueDate || 'Not set'}</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Task Name</div>
                      <div className="font-medium">{currentTask.name}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Description</div>
                      <div>{currentTask.description}</div>
                    </div>

                    {currentTask.amount && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Amount</div>
                            <div className="font-medium">₹{currentTask.amount.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Tax Details</div>
                            <div className="text-sm">
                              CGST: {currentTask.cgst}% | SGST: {currentTask.sgst}%
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Comments, Logs, and Clarifications Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="comments">Comments ({currentTask.comments.length})</TabsTrigger>
                <TabsTrigger value="logs">Activity Logs ({currentTask.logs.length})</TabsTrigger>
                <TabsTrigger value="clarifications">Clarifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="comments" className="space-y-4">
                {/* Add Comment Section */}
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
                    <CardTitle className="text-lg">Comments</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                  <CardContent>
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

              <TabsContent value="clarifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <HelpCircle className="h-5 w-5" />
                      Clarifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Clarification Required Checkbox */}
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="clarification-required"
                        checked={isClarificationRequired}
                        onCheckedChange={(checked) => setIsClarificationRequired(checked as boolean)}
                      />
                      <Label 
                        htmlFor="clarification-required" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Is clarification required?
                      </Label>
                    </div>

                    {/* Supervisor/Admin Selection Dropdown */}
                    {isClarificationRequired && (
                      <div className="space-y-2">
                        <Label htmlFor="supervisor-admin-select">Select Advisor</Label>
                        {isUsersLoading ? (
                          <Input value="Loading users..." disabled readOnly className="opacity-50" />
                        ) : (
                          <Select 
                            value={selectedSupervisorAdmin} 
                            onValueChange={setSelectedSupervisorAdmin}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an advisor" />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                .filter(user => user.role_name.toLowerCase() === 'admin' || user.role_name.toLowerCase() === 'supervisor')
                                .map(user => (
                                  <SelectItem key={user.id} value={`${user.first_name} ${user.last_name}`}>
                                    {user.first_name} {user.last_name} ({user.role_name})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {selectedSupervisorAdmin && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              <strong>Selected:</strong> {selectedSupervisorAdmin}
                            </p>
                          </div>
                        )}
                        
                        {/* Save Clarification Button */}
                        <div className="flex justify-end mt-4">
                          <Button 
                            onClick={handleSave}
                            disabled={isLoading || !selectedSupervisorAdmin}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Clarification
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isClarificationRequired && (
                      <div className="text-center text-muted-foreground py-8">
                        <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No clarification required for this task</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <div className="flex justify-start gap-3 pt-4 pb-2 border-t bg-background">
          {currentTask.status === 'closed' && !currentTask.invoice_id && onGenerateInvoice && !isEditMode && (
            <Button 
              onClick={() => onGenerateInvoice(currentTask)}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminViewTaskDialog;
