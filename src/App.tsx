import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import SignIn from "./pages/auth/SignIn";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import SuperAdminUsers from "./pages/dashboard/SuperAdminUsers";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AdminClients from "./pages/dashboard/AdminClients";
import AdminUsers from "./pages/dashboard/AdminUsers";
import AdminServiceCategories from "./pages/dashboard/AdminServiceCategories";
import AdminSHACodes from "./pages/dashboard/AdminSHACodes";
import AdminTasks from "./pages/dashboard/AdminTasks";
import AdminInvoices from "./pages/dashboard/AdminInvoices";
import AdminCreditNotes from "./pages/dashboard/AdminCreditNotes";
import AdminDebitNotes from "./pages/dashboard/AdminDebitNotes";
import AdminMessages from "./pages/dashboard/AdminMessages";
import SupervisorTasks from "./pages/dashboard/SupervisorTasks";
import EmployeeTasks from "./pages/dashboard/EmployeeTasks";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import ClientTasks from "./pages/dashboard/ClientTasks";
import ClientInvoices from "./pages/dashboard/ClientInvoices";
import ClientDebitNotes from "./pages/dashboard/ClientDebitNotes";
import SupervisorReports from "./pages/dashboard/SupervisorReports";
import EmployeeReports from "./pages/dashboard/EmployeeReports";
import SupervisorDashboard from "./pages/dashboard/SupervisorDashboard";
import EmployeeDashboard from "./pages/dashboard/EmployeeDashboard";
import Profile from "./pages/dashboard/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/dashboard/superadmin/users" element={<SuperAdminUsers />} />
          <Route path="/dashboard/superadmin/profile" element={<Profile />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/admin/clients" element={<AdminClients />} />
        <Route path="/dashboard/admin/users" element={<AdminUsers />} />
        <Route path="/dashboard/admin/messages" element={<AdminMessages />} />
        <Route path="/dashboard/admin/service-categories" element={<AdminServiceCategories />} />
          <Route path="/dashboard/admin/sha-codes" element={<AdminSHACodes />} />
          <Route path="/dashboard/admin/tasks" element={<AdminTasks />} />
          <Route path="/dashboard/admin/invoices" element={<AdminInvoices />} />
          <Route path="/dashboard/admin/credit-notes" element={<AdminCreditNotes />} />
          <Route path="/dashboard/admin/debit-notes" element={<AdminDebitNotes />} />
          <Route path="/dashboard/admin/profile" element={<Profile />} />
          
          {/* Supervisor Routes */}
          <Route path="/dashboard/supervisor" element={<SupervisorDashboard />} />
          <Route path="/dashboard/supervisor/tasks" element={<SupervisorTasks />} />
          <Route path="/dashboard/supervisor/reports" element={<SupervisorReports />} />
          <Route path="/dashboard/supervisor/profile" element={<Profile />} />
          
          {/* Employee Routes */}
          <Route path="/dashboard/employee" element={<EmployeeDashboard />} />
          <Route path="/dashboard/employee/tasks" element={<EmployeeTasks />} />
          <Route path="/dashboard/employee/reports" element={<EmployeeReports />} />
          <Route path="/dashboard/employee/profile" element={<Profile />} />
          
          {/* Client Routes */}
          <Route path="/dashboard/client" element={<ClientDashboard />} />
          <Route path="/dashboard/client/tasks" element={<ClientTasks />} />
          <Route path="/dashboard/client/invoices" element={<ClientInvoices />} />
          <Route path="/dashboard/client/debit-notes" element={<ClientDebitNotes />} />
          <Route path="/dashboard/client/profile" element={<Profile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
