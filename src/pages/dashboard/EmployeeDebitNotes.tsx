import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/Dashboard/Sidebar";
import EmployeeDebitNoteManagement from "@/components/Dashboard/EmployeeDebitNoteManagement";

const EmployeeDebitNotes = () => {
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
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Debit Notes</h1>
            <p className="text-muted-foreground mt-2">Manage debit notes and additional charges</p>
          </div>
          <EmployeeDebitNoteManagement />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDebitNotes;
