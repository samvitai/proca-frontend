import Sidebar from "@/components/Dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building, Code, List, CheckSquare, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    
    if (!email || role !== 'admin') {
      navigate('/auth/signin');
      return;
    }
    
    setUserEmail(email);
  }, [navigate]);

  if (!userEmail) return null;

  const stats = [
    { icon: Building, label: 'Total Clients', value: '248', change: '+12%' },
    { icon: Users, label: 'Active Users', value: '89', change: '+8%' },
    { icon: CheckSquare, label: 'Pending Tasks', value: '34', change: '-5%' },
    { icon: FileText, label: 'Invoices Due', value: '15', change: '+3%' }
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="admin" email={userEmail} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ca-primary mb-2">
              Welcome to Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage System Operations & Settings
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-ca-accent/10 rounded-lg flex items-center justify-center">
                      <stat.icon className="h-6 w-6 text-ca-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-ca-primary">{stat.value}</p>
                      <p className="text-sm text-green-600">{stat.change}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-ca-primary">Recent Activity</CardTitle>
                <CardDescription>Latest system operations and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { time: '2:30 PM', action: 'New client onboarded', client: 'Tech Solutions Ltd.' },
                    { time: '1:45 PM', action: 'Task assigned to employee', task: 'Tax Filing #TF-2024-045' },
                    { time: '12:20 PM', action: 'Invoice generated', invoice: 'INV-2024-0234' },
                    { time: '11:15 AM', action: 'User role updated', user: 'supervisor@company.com' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.client || activity.task || activity.invoice || activity.user}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-ca-primary">System Overview</CardTitle>
                <CardDescription>Current system status and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">System Status</span>
                    <Badge className="bg-green-500">Online</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Active Sessions</span>
                    <Badge variant="secondary">89</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Pending Reviews</span>
                    <Badge variant="destructive">23</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Today's Tasks</span>
                    <Badge variant="secondary">156</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;