import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, DollarSign, TrendingUp, FileText, Building2 } from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Users,
      title: "Employee Management",
      description: "Comprehensive employee profiles, organizational structure, and workforce analytics."
    },
    {
      icon: Calendar,
      title: "Leave Management",
      description: "Streamlined leave requests, approvals, and balance tracking for all employees."
    },
    {
      icon: DollarSign,
      title: "Payroll & Benefits",
      description: "Automated payroll processing, tax calculations, and benefits management."
    },
    {
      icon: TrendingUp,
      title: "Performance Reviews",
      description: "Goal setting, performance tracking, and comprehensive review processes."
    },
    {
      icon: FileText,
      title: "Reports & Analytics",
      description: "Data-driven insights and customizable reports for informed decision making."
    },
    {
      icon: Building2,
      title: "Department Management",
      description: "Organize teams, manage departments, and track organizational changes."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            HRIS Portal
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Complete Human Resource Information System for modern organizations. 
            Manage employees, track performance, and streamline HR processes.
          </p>
          
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Welcome to HRIS</CardTitle>
              <CardDescription>
                Please sign in to access your HR dashboard and manage your organization's workforce.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                asChild 
                className="w-full" 
                size="lg"
                data-testid="button-login"
              >
                <a href="/api/login">
                  Sign In to Continue
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
