import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Dashboard/Sidebar";
import AdminReportsManagement from "@/components/Dashboard/AdminReportsManagement";

const AdminReports = () => {
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="admin" email={userEmail} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ca-primary mb-2">
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground text-lg">
              View team performance and Project analytics
            </p>
          </div>

          <AdminReportsManagement />
        </div>
      </main>
    </div>
  );
};

export default AdminReports;

