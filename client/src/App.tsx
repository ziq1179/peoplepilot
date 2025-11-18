import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import EmployeeForm from "@/pages/EmployeeForm";
import Departments from "@/pages/Departments";
import Leave from "@/pages/Leave";
import LeaveTypes from "@/pages/LeaveTypes";
import LeaveRequest from "@/pages/LeaveRequest";
import MyLeaveRequests from "@/pages/MyLeaveRequests";
import LeaveApprovals from "@/pages/LeaveApprovals";
import Payroll from "@/pages/Payroll";
import Performance from "@/pages/Performance";
import Goals from "@/pages/Goals";
import Reports from "@/pages/Reports";
import Documents from "@/pages/Documents";
import MyProfile from "@/pages/MyProfile";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={() => <Layout><Dashboard /></Layout>} />
      <ProtectedRoute path="/employees" component={() => <Layout><Employees /></Layout>} />
      <ProtectedRoute path="/employees/new" component={() => <Layout><EmployeeForm /></Layout>} />
      <ProtectedRoute path="/employees/:id/edit" component={() => <Layout><EmployeeForm /></Layout>} />
      <ProtectedRoute path="/departments" component={() => <Layout><Departments /></Layout>} />
      <ProtectedRoute path="/leave" component={() => <Layout><Leave /></Layout>} />
      <ProtectedRoute path="/leave/types" component={() => <Layout><LeaveTypes /></Layout>} />
      <ProtectedRoute path="/leave/request" component={() => <Layout><LeaveRequest /></Layout>} />
      <ProtectedRoute path="/leave/my-requests" component={() => <Layout><MyLeaveRequests /></Layout>} />
      <ProtectedRoute path="/leave/approvals" component={() => <Layout><LeaveApprovals /></Layout>} />
      <ProtectedRoute path="/payroll" component={() => <Layout><Payroll /></Layout>} />
      <ProtectedRoute path="/performance" component={() => <Layout><Performance /></Layout>} />
      <ProtectedRoute path="/performance/goals" component={() => <Layout><Goals /></Layout>} />
      <ProtectedRoute path="/reports" component={() => <Layout><Reports /></Layout>} />
      <ProtectedRoute path="/documents" component={() => <Layout><Documents /></Layout>} />
      <ProtectedRoute path="/my-profile" component={() => <Layout><MyProfile /></Layout>} />
      <ProtectedRoute path="/my-leave" component={() => <Layout><Leave /></Layout>} />
      <ProtectedRoute path="/my-payslips" component={() => <Layout><Payroll /></Layout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
