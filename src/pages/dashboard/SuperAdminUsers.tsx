import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Dashboard/Sidebar";
import SuperAdminUserManagement from "@/components/Dashboard/SuperAdminUserManagement";

const SuperAdminUsers = () => {
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');
    
    if (!email || role !== 'superadmin') {
      navigate('/auth/signin');
      return;
    }
    
    setUserEmail(email);
  }, [navigate]);

  if (!userEmail) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="superadmin" email={userEmail} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <SuperAdminUserManagement />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminUsers;
