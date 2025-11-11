import { useState } from "react";
import Sidebar from "@/components/Dashboard/Sidebar";
import AdminCreditNoteManagement from "@/components/Dashboard/AdminCreditNoteManagement";

const AdminCreditNotes = () => {
  const userEmail = localStorage.getItem('userEmail') || 'admin@example.com';

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="admin" email={userEmail} />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Credit Notes</h1>
            <p className="text-muted-foreground mt-2">Manage credit notes and customer adjustments</p>
          </div>
          <AdminCreditNoteManagement />
        </div>
      </div>
    </div>
  );
};

export default AdminCreditNotes;