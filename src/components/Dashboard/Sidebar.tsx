import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  User, 
  Code, 
  List, 
  CheckSquare, 
  FileText, 
  Receipt,
  FileMinus,
  BarChart3,
  LogOut,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Mail
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type UserRole = 'superadmin' | 'admin' | 'supervisor' | 'employee' | 'client';

interface SidebarProps {
  role: UserRole;
  email: string;
}

const Sidebar = ({ role, email }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    // localStorage.removeItem('userEmail');
    // localStorage.removeItem('userRole');
    localStorage.clear();
    navigate('/auth/signin');
  };

  const menuItems = {
    superadmin: [
      { icon: Users, label: 'Users', path: '/dashboard/superadmin/users' }
    ],
    admin: [
      { icon: Users, label: 'Clients', path: '/dashboard/admin/clients' },
      { icon: User, label: 'Users', path: '/dashboard/admin/users' },
      { icon: Code, label: 'SCA/SHA Codes', path: '/dashboard/admin/sha-codes' },
      { icon: List, label: 'Service Categories', path: '/dashboard/admin/service-categories' },
      { icon: CheckSquare, label: 'Projects', path: '/dashboard/admin/tasks' },
      { icon: FileText, label: 'Invoices', path: '/dashboard/admin/invoices' },
      { icon: Receipt, label: 'Credit Notes', path: '/dashboard/admin/credit-notes' },
      { icon: FileMinus, label: 'Debit Notes', path: '/dashboard/admin/debit-notes' },
      { icon: Mail, label: 'Messages', path: '/dashboard/admin/messages' },
      { icon: BarChart3, label: 'Reports', path: '/dashboard/admin/reports' }
    ],
    supervisor: [
      { icon: CheckSquare, label: 'Projects', path: '/dashboard/supervisor/tasks' },
      { icon: BarChart3, label: 'Reports', path: '/dashboard/supervisor/reports' }
    ],
    employee: [
      { icon: CheckSquare, label: 'Projects', path: '/dashboard/employee/tasks' },
      { icon: BarChart3, label: 'Reports', path: '/dashboard/employee/reports' }
    ],
    client: [
      { icon: Home, label: 'Dashboard', path: '/dashboard/client' },
      { icon: CheckSquare, label: 'Projects', path: '/dashboard/client/tasks' },
      { icon: Receipt, label: 'Invoices', path: '/dashboard/client/invoices' },
      { icon: FileMinus, label: 'Debit Notes', path: '/dashboard/client/debit-notes' }
    ]
  };

  const roleLabels = {
    superadmin: 'Super Admin',
    admin: 'Admin', 
    supervisor: 'Supervisor',
    employee: 'Employee',
    client: 'Client'
  };

  const roleAccess = {
    superadmin: 'Users, Profile',
    admin: 'Full System Management',
    supervisor: 'Tasks, Reports',
    employee: 'Tasks, Reports',
    client: 'Tasks, Invoices'
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-ca-primary text-ca-primary-foreground h-screen flex flex-col transition-all duration-300 flex-shrink-0 sticky top-0 overflow-hidden`}>
      <div className="relative w-full h-full flex flex-col">
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-10 bg-ca-primary border border-ca-primary-foreground/20 hover:bg-ca-primary-foreground/10 rounded-full p-1 h-6 w-6"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* Header */}
      <div className="p-6 border-b border-ca-primary-foreground/20">
        <Link to="/" className="flex items-center space-x-2 mb-4">
          <div className="w-10 h-10 bg-ca-accent rounded-lg flex items-center justify-center">
            <span className="text-ca-accent-foreground font-bold text-lg">NA</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold">NAGA & Associates</h1>
              <p className="text-xs text-ca-primary-foreground/70">Dashboard</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation - Scrollable */}
      <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-6'}`} style={{scrollbarWidth: 'thin', scrollbarColor: 'transparent transparent'}}>
        <div className="space-y-2">
          {menuItems[role].map((item) => (
            <Link key={item.path} to={item.path}>
              <div
                className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-4 py-3'} rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-ca-accent text-ca-accent-foreground'
                    : 'text-ca-primary-foreground/80 hover:bg-ca-primary-foreground/10'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            </Link>
          ))}
        </div>

        {!isCollapsed && (
          <>


          </>
        )}
      </nav>

      {/* Footer */}
      <div className={`${isCollapsed ? 'p-2' : 'p-6'} border-t border-ca-primary-foreground/20 space-y-4`}>
        <Link to={`/dashboard/${role}/profile`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center px-2 py-2' : 'space-x-3 px-4 py-2'} rounded-lg text-ca-primary-foreground/80 hover:bg-ca-primary-foreground/10 transition-colors`} title={isCollapsed ? 'Profile' : undefined}>
            <UserCircle className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} flex-shrink-0`} />
            {!isCollapsed && <span>Profile</span>}
          </div>
        </Link>
        
        <Button 
          variant="ca-accent" 
          className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'}`}
          onClick={handleLogout}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className={`${isCollapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0`} />
          {!isCollapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
      </div>
    </div>
  );
};

export default Sidebar;