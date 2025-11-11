import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Task {
  id: string;
  client: string;
  name: string;
  description: string;
  status: 'open' | 'in-progress' | 'pending-review' | 'ready-for-close' | 'closed';
  assignedTo: string;
  createdAt: string;
  dueDate?: string;
  comments: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
  }>;
  logs: Array<{
    id: string;
    action: string;
    user: string;
    timestamp: string;
  }>;
}

interface ViewTaskDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

const ViewTaskDetailsDialog = ({ isOpen, onClose, task }: ViewTaskDetailsDialogProps) => {
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Project Details</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Client</p>
                    <p className="font-medium">{task.client}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Project Name</p>
                    <p className="font-medium">{task.name}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p>{task.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(task.status)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                    <p className="font-medium">{task.assignedTo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                    <p className="font-medium">{task.createdAt}</p>
                  </div>
                  {task.dueDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                      <p className="font-medium">{task.dueDate}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comments</CardTitle>
              </CardHeader>
              <CardContent>
                {task.comments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No comments yet</p>
                ) : (
                  <div className="space-y-4">
                    {task.comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{comment.author}</p>
                          <p className="text-sm text-muted-foreground">{comment.timestamp}</p>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {task.logs.map((log, index) => (
                    <div key={log.id}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">by {log.user}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.timestamp}</p>
                      </div>
                      {index < task.logs.length - 1 && <Separator className="mt-3" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTaskDetailsDialog;