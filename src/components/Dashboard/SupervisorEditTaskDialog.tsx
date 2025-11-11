import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Loader2, Download, FileText, HelpCircle, Save } from "lucide-react";
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
  shaCode?: string;
  serviceCategory?: string;
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

interface ApiComment {
  comment_id: string;
  user_id: string;
  user_name: string;
  comment_text: string;
  attached_files: Array<{
    file_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    upload_date: string;
  }>;
  created_at: string;
}

interface ApiLog {
  log_id: string;
  event_type: string;
  description: string;
  user_id: string;
  user_name: string;
  timestamp: string;
}

interface SupervisorEditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onUpdate: (task: Task) => void;
}

const SupervisorEditTaskDialog = ({ isOpen, onClose, task, onUpdate }: SupervisorEditTaskDialogProps) => {
  const [status, setStatus] = useState(task.status);
  const [assignedTo, setAssignedTo] = useState(task.assignedTo);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [isLoadingTaskDetails, setIsLoadingTaskDetails] = useState(false);
  
  // Clarifications state
  const [isClarificationRequired, setIsClarificationRequired] = useState(false);
  const [selectedSupervisorAdmin, setSelectedSupervisorAdmin] = useState<string>("");
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>("comments");

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

  const fetchTaskDetails = useCallback(async () => {
    setIsLoadingTaskDetails(true);
    try {
      const response = await api.get(`/api/tasks/${task.id}`);
      console.log('Task details API response:', response.data);
      
      if (response.data.success && response.data.data) {
        const apiTask = response.data.data;
        
        // Transform the API response to match our Task interface
        const updatedTask: Task = {
          ...task,
          comments: (apiTask.comments || []).map((comment: ApiComment) => ({
            id: comment.comment_id,
            author: comment.user_name,
            content: comment.comment_text,
            timestamp: new Date(comment.created_at).toLocaleString(),
            file: comment.attached_files && comment.attached_files.length > 0
              ? {
                  name: comment.attached_files[0].file_name,
                  url: comment.attached_files[0].file_path,
                }
              : undefined,
          })),
          logs: (apiTask.running_log || []).map((log: ApiLog, index: number) => ({
            id: log.log_id || `log-${index}`,
            action: log.description || log.event_type,
            user: log.user_name,
            timestamp: log.timestamp,
          })),
        };
        
        setCurrentTask(updatedTask);
        console.log('Updated task with activity logs:', updatedTask.logs);
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      // Don't show error toast as this is not critical - we can still work with the basic task data
    } finally {
      setIsLoadingTaskDetails(false);
    }
  }, [task]);

  // Fetch users and task details when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchTaskDetails();
    }
  }, [isOpen, fetchTaskDetails]);

  // Find the assigned user ID when assignedTo changes
  useEffect(() => {
    if (users.length > 0 && assignedTo) {
      const assignedUser = users.find(user => 
        `${user.first_name} ${user.last_name}` === assignedTo
      );
      setAssignedUserId(assignedUser ? String(assignedUser.id) : null);
    }
  }, [assignedTo, users]);

  // Initialize clarification state - start with checkbox unchecked for user control
  useEffect(() => {
    // Only show existing clarification data if there's actually a clarification assigned
    if (currentTask.require_clarification && currentTask.clarification_to_name) {
      setIsClarificationRequired(true);
      setSelectedSupervisorAdmin(currentTask.clarification_to_name);
    } else {
      setIsClarificationRequired(false);
      setSelectedSupervisorAdmin("");
    }
    setActiveTab("comments"); // Reset to comments tab when task changes
  }, [currentTask]);

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

  const handleSubmit = async () => {
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
      const apiStatus = status.replace(/-/g, '_');
      
      // Get user info from localStorage for clarification fields
      const userId = localStorage.getItem('userId');
      const userNameFromStorage = localStorage.getItem('userName');
      
      // Prepare the complete request body as specified
      const updatePayload = {
        task_name: currentTask.name,
        service_description: currentTask.description,
        due_date: currentTask.dueDate || null,
        workflow_status: apiStatus,
        assignee_id: assignedUserId,
        require_clarification: isClarificationRequired,
        clarification_from: isClarificationRequired ? userId : null,
        clarification_from_name: isClarificationRequired ? userNameFromStorage : null,
        clarification_to: null, // Always null as per requirements
        clarification_to_name: isClarificationRequired ? selectedSupervisorAdmin : null,
      };

      console.log('Update payload:', updatePayload);

      // Make the PUT call to update the task
      await api.put(`/api/tasks/${currentTask.id}`, updatePayload);

      const currentUser = getCurrentUser();
      const userName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : "Supervisor";

      const updatedTask: Task = {
        ...currentTask,
        status,
        assignedTo,
        // Update clarification fields
        require_clarification: isClarificationRequired,
        clarification_from: isClarificationRequired ? userId : null,
        clarification_from_name: isClarificationRequired ? userNameFromStorage : null,
        clarification_to: null,
        clarification_to_name: isClarificationRequired ? selectedSupervisorAdmin : null,
        logs: [
          ...currentTask.logs,
          {
            id: Date.now().toString(),
            action: `Task updated - Status: ${status}, Assigned to: ${assignedTo}`,
            user: userName,
            timestamp: new Date().toLocaleString()
          }
        ]
      };

      // Update local state for immediate UI update
      setCurrentTask(updatedTask);
      onUpdate(updatedTask);
      
      // Show specific success message for clarifications
      const clarificationMessage = isClarificationRequired && selectedSupervisorAdmin 
        ? `Clarification requested from ${selectedSupervisorAdmin}.`
        : "";
      
      toast({
        title: "Project Updated",
        description: `Project has been updated successfully. ${clarificationMessage}`,
      });
      
      // Switch to comments tab if clarification was saved
      if (isClarificationRequired && selectedSupervisorAdmin) {
        setActiveTab("comments");
      }
      
      onClose();
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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Task - {currentTask.name}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-1">
            {/* Task Basic Info (Read-only) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client</Label>
                    <p className="text-sm text-muted-foreground mt-1">{currentTask.client}</p>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">{currentTask.dueDate || 'No due date'}</p>
                  </div>
                </div>
                <div>
                  <Label>Project Name</Label>
                  <p className="text-sm text-muted-foreground mt-1">{currentTask.name}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{currentTask.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Editable Fields */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Update Project</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={status} 
                      onValueChange={(value) => setStatus(value as Task['status'])}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="pending-review">Pending Review</SelectItem>
                        <SelectItem value="ready-for-close">Ready for Close</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    {isInitialLoading ? (
                      <Input value="Loading users..." disabled readOnly className="opacity-50" />
                    ) : (
                      <Select 
                        value={assignedTo} 
                        onValueChange={setAssignedTo}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter(user => user.role_name.toLowerCase() === 'supervisor' || user.role_name.toLowerCase() === 'employee')
                            .map(user => (
                              <SelectItem key={user.id} value={`${user.first_name} ${user.last_name}`}>
                                {user.first_name} {user.last_name} ({user.role_name})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Comment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    disabled={isCommentLoading}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim() || isCommentLoading}
                  >
                    {isCommentLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Comment'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments and Logs Tabbed Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                    <TabsTrigger value="clarifications">Clarifications</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="comments" className="mt-4">
                    {isLoadingTaskDetails ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading comments...</span>
                      </div>
                    ) : currentTask.comments.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No comments yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {currentTask.comments.map((comment) => (
                          <div key={comment.id} className="border-l-2 border-primary/20 pl-4 py-2">
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
                  </TabsContent>
                  
                  <TabsContent value="logs" className="mt-4">
                    {isLoadingTaskDetails ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading activity logs...</span>
                      </div>
                    ) : currentTask.logs.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">No activity logs yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {currentTask.logs.map((log) => (
                          <div key={log.id} className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium">{log.action}</p>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-xs text-muted-foreground">by {log.user}</p>
                              <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="clarifications" className="mt-4">
                    <div className="space-y-6">
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
                          {isInitialLoading ? (
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
                              onClick={handleSubmit}
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
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading || isCommentLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isCommentLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Project'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupervisorEditTaskDialog;
