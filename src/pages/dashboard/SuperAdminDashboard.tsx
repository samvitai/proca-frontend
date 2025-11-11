import Sidebar from "@/components/Dashboard/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SuperAdminDashboard = () => {
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    
    if (!email || role !== 'superadmin') {
      navigate('/auth/signin');
      return;
    }
    
    setUserEmail(email);
    setUserRole(role);
  }, [navigate]);

  if (!userEmail) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="superadmin" email={userEmail} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ca-primary mb-2">
              Welcome to Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage System Users & Settings
            </p>
          </div>

          {/* Role Info Card */}
          <Card className="mb-8 border-ca-accent/20 bg-gradient-to-r from-ca-accent/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-ca-accent/10 rounded-xl flex items-center justify-center">
                  <Users className="h-8 w-8 text-ca-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-ca-primary mb-1">
                    Role: Super Admin
                  </h3>
                  <p className="text-muted-foreground">
                    Access: Users, Profile
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {userEmail}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-ca-primary">User Management</CardTitle>
                <CardDescription>
                  Manage system users and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Total Users</span>
                    <Badge variant="secondary">124</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Active Sessions</span>
                    <Badge variant="secondary">45</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Pending Approvals</span>
                    <Badge variant="destructive">12</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-ca-primary">System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Security Level</span>
                    <Badge className="bg-green-500">High</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">Backup Status</span>
                    <Badge className="bg-green-500">Up to Date</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <span className="font-medium">System Health</span>
                    <Badge className="bg-green-500">Optimal</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Logs */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-ca-primary">Recent System Activity</CardTitle>
              <CardDescription>
                Monitor system-wide user activities and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '10:30 AM', action: 'New user registration approved', user: 'admin@company.com' },
                  { time: '09:45 AM', action: 'Role permissions updated', user: 'supervisor@company.com' },
                  { time: '09:15 AM', action: 'System backup completed', user: 'System' },
                  { time: '08:30 AM', action: 'User access revoked', user: 'employee@company.com' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">by {activity.user}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
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

export default SuperAdminDashboard;