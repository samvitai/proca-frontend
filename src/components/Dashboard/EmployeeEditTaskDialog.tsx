import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/utils";

interface Task {
  id: string;
  client: string;
  name: string;
  description: string;
  status: 'open' | 'in-progress' | 'pending-review' | 'ready-for-close' | 'closed';
  assignedTo: string;
  assignedToId?: string | null; // Add assignee ID field
  createdAt: string;
  dueDate: string;
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
  }>;
}

interface EmployeeEditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onUpdate: (task: Task) => void;
}

const EmployeeEditTaskDialog = ({ isOpen, onClose, task, onUpdate }: EmployeeEditTaskDialogProps) => {
  const [newComment, setNewComment] = useState("");
  const [taskStatus, setTaskStatus] = useState<Task['status']>(task?.status || 'open');
  const [isLoading, setIsLoading] = useState(false);

  // Reset status when task changes
  useEffect(() => {
    if (task) {
      setTaskStatus(task.status);
    }
  }, [task]);

  const handleSubmit = async () => {
    // Allow updating even if there's no comment (status change only)
    const statusChanged = taskStatus !== task.status;
    const hasComment = newComment.trim();

    if (!statusChanged && !hasComment) {
      return; // Nothing to update
    }

    setIsLoading(true);
    try {
      // Map UI status back to API status
      const mapToApiStatus = (status: Task['status']) => {
        switch (status) {
          case 'open':
            return 'open';
          case 'in-progress':
            return 'in_progress';
          case 'pending-review':
            return 'pending_review';
          case 'ready-for-close':
            return 'ready_for_close';
          case 'closed':
            return 'closed';
          default:
            return 'open';
        }
      };

      // Update task status if changed
      if (statusChanged) {
        const updatePayload = {
          workflow_status: mapToApiStatus(taskStatus),
          // Always include clarification fields to maintain consistency
          require_clarification: task.require_clarification || false,
          clarification_from: task.clarification_from || null,
          clarification_from_name: task.clarification_from_name || null,
          clarification_to: task.clarification_to || null,
          clarification_to_name: task.clarification_to_name || null,
        };

        console.log('Employee update payload:', updatePayload);

        // Make the PUT call to update the task status
        await api.put(`/api/tasks/${task.id}`, updatePayload);
      }

      // Add comment if provided
      if (hasComment) {
        const formData = new FormData();
        const commentText = statusChanged 
          ? `Status changed to ${getStatusLabel(taskStatus)}. ${newComment}`
          : newComment;
        formData.append('comment_text', commentText);

        await api.post(`/api/tasks/${task.id}/comments`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      const updatedTask: Task = {
        ...task,
        status: taskStatus,
        comments: hasComment
          ? [
              ...task.comments,
              {
                id: Date.now().toString(),
                author: task.assignedTo,
                content: statusChanged 
                  ? `Status changed to ${getStatusLabel(taskStatus)}. ${newComment}`
                  : newComment,
                timestamp: new Date().toLocaleString()
              }
            ]
          : task.comments
      };

      onUpdate(updatedTask);
      setNewComment("");
      
      toast({
        title: "Project Updated",
        description: "Project has been updated successfully.",
      });
      
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

  const getStatusLabel = (status: Task['status']) => {
    const labels = {
      'open': 'Open',
      'in-progress': 'In Progress',
      'pending-review': 'Pending Review',
      'ready-for-close': 'Ready for Close',
      'closed': 'Closed'
    };
    return labels[status];
  };

  const getStatusBadgeVariant = (status: Task['status']) => {
    const variants = {
      'open': 'secondary',
      'in-progress': 'default',
      'pending-review': 'outline',
      'ready-for-close': 'outline',
      'closed': 'default'
    } as const;
    return variants[status];
  };

  // Safety check - don't render if task is missing
  if (!task) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Update Project - {task.name}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 p-1">
            {/* Task Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Client</Label>
                    <p className="text-sm text-muted-foreground mt-1">{task.client}</p>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <p className="text-sm text-muted-foreground mt-1">{task.dueDate}</p>
                  </div>
                </div>
                <div>
                  <Label>Project Name</Label>
                  <p className="text-sm text-muted-foreground mt-1">{task.name}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                </div>
                <div>
                  <Label htmlFor="status">Update Project Status</Label>
                  <Select value={taskStatus} onValueChange={(value) => setTaskStatus(value as Task['status'])}>
                    <SelectTrigger className="mt-2">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(taskStatus)}>
                            {getStatusLabel(taskStatus)}
                          </Badge>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Open</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="in-progress">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">In Progress</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="pending-review">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Pending Review</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="ready-for-close">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Ready for Close</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {taskStatus !== task.status && (
                    <p className="text-sm text-ca-accent mt-2">
                      Status will be changed from {getStatusLabel(task.status)} to {getStatusLabel(taskStatus)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Add Comment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Comment (Optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    placeholder="Add your progress update or comment... (optional if updating status)"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Existing Comments */}
            {task.comments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Previous Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-ca-accent pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium">{comment.author}</span>
                          <span className="text-sm text-muted-foreground">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={(!newComment.trim() && taskStatus === task.status) || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              taskStatus !== task.status && newComment.trim() 
                ? 'Update Status & Add Comment' 
                : taskStatus !== task.status 
                ? 'Update Status' 
                : 'Add Comment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeEditTaskDialog;
