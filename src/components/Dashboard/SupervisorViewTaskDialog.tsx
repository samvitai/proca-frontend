import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, HelpCircle } from "lucide-react";
import { api } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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

interface User {
  id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role_name: string;
}

interface SupervisorViewTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

const SupervisorViewTaskDialog = ({ isOpen, onClose, task }: SupervisorViewTaskDialogProps) => {
  const [currentTask, setCurrentTask] = useState<Task>(task);
  const [isLoadingTaskDetails, setIsLoadingTaskDetails] = useState(false);
  
  // Clarifications state
  const [isClarificationRequired, setIsClarificationRequired] = useState(false);
  const [selectedSupervisorAdmin, setSelectedSupervisorAdmin] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

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

  // Fetch task details when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchTaskDetails();
    }
  }, [isOpen, fetchTaskDetails]);

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

  // Fetch users when dialog opens
  useEffect(() => {
    if (isOpen && users.length === 0) {
      fetchUsers();
    }
  }, [isOpen, users.length]);

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
  }, [currentTask]);

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
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-1">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Client</label>
                <p className="text-lg">{currentTask.client}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">{getStatusBadge(currentTask.status)}</div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Project Name</label>
              <p className="text-lg">{currentTask.name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm">{currentTask.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                <p>{currentTask.assignedTo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                <p>{currentTask.dueDate || 'No due date'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p>{currentTask.createdAt}</p>
              </div>
            </div>

            {/* Comments and Logs Tabbed Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="comments" className="w-full">
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
                        <p className="text-muted-foreground">No comments yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {currentTask.comments.map((comment) => (
                          <div key={comment.id} className="border-l-2 border-ca-accent pl-4 py-2">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{comment.author}</span>
                              <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
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
                        <p className="text-muted-foreground">No activity logs.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {currentTask.logs.map((log) => (
                          <div key={log.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{log.action}</p>
                              <p className="text-xs text-muted-foreground">by {log.user}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">{log.timestamp}</span>
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
      </DialogContent>
    </Dialog>
  );
};

export default SupervisorViewTaskDialog;