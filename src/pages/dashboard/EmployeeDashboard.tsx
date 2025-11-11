import Sidebar from "@/components/Dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Clock, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const EmployeeDashboard = () => {
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    
    if (!email || role !== 'employee') {
      navigate('/auth/signin');
      return;
    }
    
    setUserEmail(email);
  }, [navigate]);

  if (!userEmail) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="employee" email={userEmail} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ca-primary mb-2">
              Welcome to Employee Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Complete Projects & Track Progress
            </p>
          </div>

          <Card className="mb-8 border-ca-accent/20 bg-gradient-to-r from-ca-accent/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-ca-accent/10 rounded-xl flex items-center justify-center">
                  <CheckSquare className="h-8 w-8 text-ca-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-ca-primary mb-1">
                    Role: Employee
                  </h3>
                  <p className="text-muted-foreground">
                    Access: Projects, Reports
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {userEmail}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-ca-accent/10 rounded-lg flex items-center justify-center">
                    <CheckSquare className="h-6 w-6 text-ca-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">My Projects</p>
                    <p className="text-2xl font-bold text-ca-primary">12</p>
                    <p className="text-sm text-blue-600">3 in progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-ca-primary">8</p>
                    <p className="text-sm text-green-600">This week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Today</p>
                    <p className="text-2xl font-bold text-ca-primary">2</p>
                    <p className="text-sm text-red-600">Urgent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-ca-primary">My Active Projects</CardTitle>
                <CardDescription>Projects currently assigned to you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      title: 'Audit Report - TechCorp Ltd', 
                      due: 'Due: Today 5:00 PM', 
                      priority: 'High',
                      client: 'TechCorp Ltd'
                    },
                    { 
                      title: 'Tax Filing - Retail Co', 
                      due: 'Due: Tomorrow', 
                      priority: 'Medium',
                      client: 'Retail Co'
                    },
                    { 
                      title: 'Compliance Review - StartUp Inc', 
                      due: 'Due: Next Week', 
                      priority: 'Low',
                      client: 'StartUp Inc'
                    }
                  ].map((task, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/20 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-ca-primary">{task.title}</h4>
                        <Badge 
                          variant={task.priority === 'High' ? 'destructive' : 
                                 task.priority === 'Medium' ? 'secondary' : 'outline'}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{task.client}</p>
                      <p className="text-xs text-muted-foreground">{task.due}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-ca-primary">Recent Submissions</CardTitle>
                <CardDescription>Your recently completed work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      title: 'Monthly GST Return - ABC Traders', 
                      submitted: '2 hours ago', 
                      status: 'Approved'
                    },
                    { 
                      title: 'Financial Statement - XYZ Corp', 
                      submitted: 'Yesterday', 
                      status: 'Under Review'
                    },
                    { 
                      title: 'Tax Audit Report - DEF Ltd', 
                      submitted: '2 days ago', 
                      status: 'Approved'
                    }
                  ].map((submission, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{submission.title}</h4>
                        <Badge 
                          variant={submission.status === 'Approved' ? 'default' : 'secondary'}
                          className={submission.status === 'Approved' ? 'bg-green-500' : 'bg-blue-500'}
                        >
                          {submission.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Submitted: {submission.submitted}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-ca-primary">Performance Summary</CardTitle>
              <CardDescription>Your work statistics for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-ca-accent mb-1">95%</div>
                  <div className="text-xs text-muted-foreground">Projects On Time</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-ca-accent mb-1">42</div>
                  <div className="text-xs text-muted-foreground">Projects Completed</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-ca-accent mb-1">4.8</div>
                  <div className="text-xs text-muted-foreground">Avg. Rating</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-ca-accent mb-1">18h</div>
                  <div className="text-xs text-muted-foreground">Avg. Weekly Hours</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;