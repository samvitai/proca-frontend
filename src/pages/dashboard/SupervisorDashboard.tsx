import Sidebar from "@/components/Dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SupervisorDashboard = () => {
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    
    if (!email || role !== 'supervisor') {
      navigate('/auth/signin');
      return;
    }
    
    setUserEmail(email);
  }, [navigate]);

  if (!userEmail) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="supervisor" email={userEmail} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ca-primary mb-2">
              Welcome to Supervisor Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage Projects & Monitor Progress
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
                    Role: Supervisor
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-ca-primary">Project Management</CardTitle>
                <CardDescription>Overview of team Projects and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Assigned Projects</span>
                    <Badge variant="secondary">45</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">In Progress</span>
                    <Badge className="bg-blue-500">28</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Completed Today</span>
                    <Badge className="bg-green-500">12</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Overdue</span>
                    <Badge variant="destructive">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-ca-primary">Team Performance</CardTitle>
                <CardDescription>Monitor team productivity and efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Team Members</span>
                    <Badge variant="secondary">8</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Active Now</span>
                    <Badge className="bg-green-500">6</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Avg Completion</span>
                    <Badge className="bg-blue-500">94%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">This Week's Target</span>
                    <Badge className="bg-green-500">87%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-ca-primary">Recent Project Updates</CardTitle>
              <CardDescription>Latest activity from your team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '15:30', task: 'Audit Report - ABC Corp', status: 'Completed', employee: 'John Doe' },
                  { time: '14:45', task: 'Tax Filing - XYZ Ltd', status: 'In Progress', employee: 'Jane Smith' },
                  { time: '13:20', task: 'Compliance Check - DEF Inc', status: 'Review Required', employee: 'Mike Johnson' },
                  { time: '12:15', task: 'Financial Analysis - GHI Co', status: 'Started', employee: 'Sarah Wilson' }
                ].map((update, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{update.task}</p>
                      <p className="text-xs text-muted-foreground">by {update.employee}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={update.status === 'Completed' ? 'default' : 
                               update.status === 'In Progress' ? 'secondary' : 
                               'destructive'}
                        className={update.status === 'Completed' ? 'bg-green-500' : 
                                 update.status === 'In Progress' ? 'bg-blue-500' : ''}
                      >
                        {update.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{update.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SupervisorDashboard;