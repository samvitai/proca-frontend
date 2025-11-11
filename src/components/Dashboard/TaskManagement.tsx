import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, FileText, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AddTaskDialog from "./AddTaskDialog";
import ViewTaskDetailsDialog from "./ViewTaskDetailsDialog";

interface Task {
  id: string;
  client: string;
  name: string;
  description: string;
  shaCode: string;
  serviceCategory: string;
  status: 'open' | 'in-progress' | 'pending-review' | 'ready-for-close' | 'closed';
  assignedTo: string;
  createdAt: string;
  dueDate?: string;
  invoiceGenerated?: boolean;
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

const TaskManagement = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dueDateFilter, setDueDateFilter] = useState<string>("");
  
  // Mock data - replace with actual data fetching
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      client: "ABC Corp",
      name: "GST Return Filing Q1",
      description: "File GST return for Q1 2024",
      shaCode: "SHA001",
      serviceCategory: "Return Filing",
      status: "in-progress",
      assignedTo: "John Doe",
      createdAt: "2024-01-15",
      dueDate: "2024-02-15",
      invoiceGenerated: false,
      comments: [
        {
          id: "1",
          author: "John Doe",
          content: "Started working on the GST return",
          timestamp: "2024-01-15 10:30 AM"
        }
      ],
      logs: [
        {
          id: "1",
          action: "Task created",
          user: "Admin",
          timestamp: "2024-01-15 09:00 AM"
        },
        {
          id: "2", 
          action: "Assigned to John Doe",
          user: "Admin",
          timestamp: "2024-01-15 09:15 AM"
        }
      ]
    },
    {
      id: "2",
      client: "XYZ Ltd",
      name: "Tax Consultation",
      description: "Provide tax consultation for new business setup",
      shaCode: "SHA003",
      serviceCategory: "Consultation",
      status: "open",
      assignedTo: "Jane Smith",
      createdAt: "2024-01-16",
      dueDate: "2024-02-16",
      invoiceGenerated: false,
      comments: [],
      logs: [
        {
          id: "1",
          action: "Task created",
          user: "Admin",
          timestamp: "2024-01-16 11:00 AM"
        }
      ]
    },
  ]);

  const handleAddTask = (newTask: Omit<Task, 'id' | 'comments' | 'logs'>) => {
    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      invoiceGenerated: false,
      comments: [],
      logs: [
        {
          id: "1",
          action: "Task created",
          user: "Admin", 
          timestamp: new Date().toLocaleString()
        }
      ]
    };
    setTasks([...tasks, task]);
    setIsAddDialogOpen(false);
    
    // Show success toast
    toast({
      title: "Task Created",
      description: `Task "${newTask.name}" has been created successfully.`,
    });
  };

  const handleGenerateInvoice = (taskId: string) => {
    // Remove the task from the table since invoice has been generated
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    toast({
      title: "Invoice Generated",
      description: "Invoice has been generated successfully. Task removed from table.",
    });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.shaCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || statusFilter === "all" || task.status === statusFilter;
    const matchesDueDate = !dueDateFilter || task.dueDate === dueDateFilter;
    
    return matchesSearch && matchesStatus && matchesDueDate;
  });

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsViewDialogOpen(true);
  };

  const getStatusBadge = (status: Task['status']) => {
    const variants = {
      'open': 'secondary',
      'in-progress': 'default', 
      'pending-review': 'outline',
      'ready-for-close': 'outline',
      'closed': 'default'
    } as const;

    return <Badge variant={variants[status]}>{status.replace('-', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Tasks</CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending-review">Pending Review</SelectItem>
                <SelectItem value="ready-for-close">Ready for Close</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Filter by due date"
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              className="w-[180px]"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>SCA/SHA Code</TableHead>
                <TableHead>Service Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.client}</TableCell>
                  <TableCell>{task.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                  <TableCell>{task.shaCode}</TableCell>
                  <TableCell>{task.serviceCategory}</TableCell>
                  <TableCell>{getStatusBadge(task.status)}</TableCell>
                  <TableCell>{task.assignedTo}</TableCell>
                  <TableCell>{task.dueDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewTask(task)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {task.status === 'closed' && !task.invoiceGenerated && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleGenerateInvoice(task.id)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddTaskDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddTask}
      />

      {selectedTask && (
        <ViewTaskDetailsDialog
          isOpen={isViewDialogOpen}
          onClose={() => {
            setIsViewDialogOpen(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
        />
      )}
    </div>
  );
};

export default TaskManagement;