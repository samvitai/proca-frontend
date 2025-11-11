import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, FileText, DollarSign, Clock, CheckCircle } from "lucide-react";

const ClientDashboard = () => {
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
      const role = localStorage.getItem('userRole');
      
      if (!email || role !== 'client') {
        navigate('/auth/signin');
        return;
      }
    
    setUserEmail(email);
  }, [navigate]);

  // Empty data arrays - replace with API calls
  const tasks: any[] = [];
  const invoices: any[] = [];

  const getTaskStatusBadge = (status: 'completed' | 'ongoing') => {
    const variants = {
      'completed': 'default',
      'ongoing': 'secondary'
    } as const;

    return <Badge variant={variants[status]}>{status === 'completed' ? 'Completed' : 'Ongoing'}</Badge>;
  };

  const getInvoiceStatusBadge = (status: 'paid' | 'unpaid') => {
    const variants = {
      'paid': 'default',
      'unpaid': 'destructive'
    } as const;

    return <Badge variant={variants[status]}>{status === 'paid' ? 'Paid' : 'Unpaid'}</Badge>;
  };

  if (!userEmail) return null;

  const completedTasks = tasks.filter(task => task.status === 'completed');
  const ongoingTasks = tasks.filter(task => task.status === 'ongoing');
  const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
  const unpaidInvoices = invoices.filter(invoice => invoice.status === 'unpaid');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="client" email={userEmail} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ca-primary mb-2">
              Client Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, {userEmail}
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tasks.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedTasks.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ongoingTasks.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks and Invoices Tabs */}
          <Tabs defaultValue="tasks" className="space-y-4">
            <TabsList>
              <TabsTrigger value="tasks">Project</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="space-y-4">
              <Tabs defaultValue="ongoing" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="ongoing">Ongoing ({ongoingTasks.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ongoing">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ongoing Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ongoingTasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.name}</TableCell>
                              <TableCell>{task.description}</TableCell>
                              <TableCell>{getTaskStatusBadge(task.status)}</TableCell>
                              <TableCell>{task.dueDate}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="completed">
                  <Card>
                    <CardHeader>
                      <CardTitle>Completed Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {completedTasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.name}</TableCell>
                              <TableCell>{task.description}</TableCell>
                              <TableCell>{getTaskStatusBadge(task.status)}</TableCell>
                              <TableCell>{task.dueDate}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <Tabs defaultValue="unpaid" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="unpaid">Unpaid ({unpaidInvoices.length})</TabsTrigger>
                  <TabsTrigger value="paid">Paid ({paidInvoices.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="unpaid">
                  <Card>
                    <CardHeader>
                      <CardTitle>Unpaid Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unpaidInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.id}</TableCell>
                              <TableCell>{invoice.taskName}</TableCell>
                              <TableCell>₹{invoice.amount.toLocaleString()}</TableCell>
                              <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                              <TableCell>{invoice.dueDate}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="paid">
                  <Card>
                    <CardHeader>
                      <CardTitle>Paid Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Paid Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paidInvoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.id}</TableCell>
                              <TableCell>{invoice.taskName}</TableCell>
                              <TableCell>₹{invoice.amount.toLocaleString()}</TableCell>
                              <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                              <TableCell>{invoice.paidDate}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;