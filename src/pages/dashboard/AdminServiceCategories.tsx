import { useState } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import ServiceCategoryManagement from "@/components/Dashboard/ServiceCategoryManagement";

const AdminServiceCategories = () => {
  const userEmail = localStorage.getItem('userEmail') || 'admin@example.com';

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="admin" email={userEmail} />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8"></div>

          <ServiceCategoryManagement />
        </div>
      </div>
    </div>
  );
};

export default AdminServiceCategories;