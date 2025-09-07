import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import EmployeeForm from "@/pages/EmployeeForm";
import Departments from "@/pages/Departments";
import Leave from "@/pages/Leave";
import Payroll from "@/pages/Payroll";
import Performance from "@/pages/Performance";
import Reports from "@/pages/Reports";
import Documents from "@/pages/Documents";
import MyProfile from "@/pages/MyProfile";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mb-4 mx-auto">
            <i className="fas fa-users text-primary-foreground"></i>
          </div>
          <p className="text-muted-foreground">Loading HRIS Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/">
            <Layout>
              <Dashboard />
            </Layout>
          </Route>
          <Route path="/employees">
            <Layout>
              <Employees />
            </Layout>
          </Route>
          <Route path="/employees/new">
            <Layout>
              <EmployeeForm />
            </Layout>
          </Route>
          <Route path="/employees/:id/edit">
            <Layout>
              <EmployeeForm />
            </Layout>
          </Route>
          <Route path="/departments">
            <Layout>
              <Departments />
            </Layout>
          </Route>
          <Route path="/leave">
            <Layout>
              <Leave />
            </Layout>
          </Route>
          <Route path="/payroll">
            <Layout>
              <Payroll />
            </Layout>
          </Route>
          <Route path="/performance">
            <Layout>
              <Performance />
            </Layout>
          </Route>
          <Route path="/reports">
            <Layout>
              <Reports />
            </Layout>
          </Route>
          <Route path="/documents">
            <Layout>
              <Documents />
            </Layout>
          </Route>
          <Route path="/my-profile">
            <Layout>
              <MyProfile />
            </Layout>
          </Route>
          <Route path="/my-leave">
            <Layout>
              <Leave />
            </Layout>
          </Route>
          <Route path="/my-payslips">
            <Layout>
              <Payroll />
            </Layout>
          </Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
