import { useState } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import SHACodeManagement from "@/components/Dashboard/SHACodeManagement";

const AdminSHACodes = () => {
  const userEmail = localStorage.getItem('userEmail') || 'admin@example.com';

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="admin" email={userEmail} />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
        
          </div>
          <SHACodeManagement />
        </div>
      </div>
 
  );
};

export default AdminSHACodes;