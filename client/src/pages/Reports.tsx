import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Download, 
  BarChart3,
  Building2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Department } from "@shared/schema";

export default function Reports() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportType, setReportType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const { toast } = useToast();

  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });

  const form = useForm({
    defaultValues: {
      reportType: "",
      startDate: "",
      endDate: "",
      department: "",
    },
  });

  const reportCategories = [
    {
      icon: Users,
      title: "Employee Reports",
      description: "Demographics, headcount, turnover",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Calendar,
      title: "Leave Reports",
      description: "Usage, trends, balances",
      color: "bg-accent/10 text-accent",
    },
    {
      icon: DollarSign,
      title: "Payroll Reports",
      description: "Costs, overtime, benefits",
      color: "bg-chart-1/10 text-chart-1",
    },
    {
      icon: TrendingUp,
      title: "Performance Reports",
      description: "Reviews, goals, ratings",
      color: "bg-chart-2/10 text-chart-2",
    },
  ];

  const recentReports = [
    {
      id: 1,
      name: "Q4 Employee Headcount",
      type: "Employee Report",
      generatedAt: "2 hours ago",
      icon: FileText,
      color: "bg-primary/10 text-primary",
    },
    {
      id: 2,
      name: "November Leave Report",
      type: "Leave Report",
      generatedAt: "Yesterday",
      icon: Calendar,
      color: "bg-accent/10 text-accent",
    },
    {
      id: 3,
      name: "Performance Analytics",
      type: "Performance Report",
      generatedAt: "3 days ago",
      icon: TrendingUp,
      color: "bg-chart-1/10 text-chart-1",
    },
    {
      id: 4,
      name: "Payroll Summary Q4",
      type: "Payroll Report",
      generatedAt: "1 week ago",
      icon: DollarSign,
      color: "bg-chart-2/10 text-chart-2",
    },
  ];

  const handleGenerateReport = () => {
    if (!reportType || reportType === 'all') {
      toast({
        title: "Error",
        description: "Please select a report type.",
        variant: "destructive",
      });
      return;
    }

    // Simulate report generation
    toast({
      title: "Success",
      description: "Report generation started. You will be notified when it's ready.",
    });
    setIsDialogOpen(false);
    form.reset();
  };

  const onSubmit = (data: any) => {
    handleGenerateReport();
  };

  return (
    <div className="p-6" data-testid="reports-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Reports & Analytics</h2>
          <p className="text-muted-foreground">Generate comprehensive HR reports and view organizational analytics.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0" data-testid="button-generate-report">
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-report-form">
            <DialogHeader>
              <DialogTitle>Generate Report</DialogTitle>
              <DialogDescription>Create a custom report with your preferred parameters</DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="reportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Type</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setReportType(value);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-report-type">
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employee_headcount">Employee Headcount</SelectItem>
                          <SelectItem value="leave_summary">Leave Summary</SelectItem>
                          <SelectItem value="payroll_summary">Payroll Summary</SelectItem>
                          <SelectItem value="performance_overview">Performance Overview</SelectItem>
                          <SelectItem value="department_analysis">Department Analysis</SelectItem>
                          <SelectItem value="custom_report">Custom Report</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              setStartDate(e.target.value);
                            }}
                            data-testid="input-start-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              setEndDate(e.target.value);
                            }}
                            data-testid="input-end-date" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department (Optional)</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedDepartment(value);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-department">
                            <SelectValue placeholder="All Departments" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments?.map((dept: Department) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-report"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    data-testid="button-generate-report-submit"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {reportCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <Card 
              key={index} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              data-testid={`card-report-category-${index}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{category.title}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Report Generator & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Report Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Report Generator</CardTitle>
            <CardDescription>Generate standard reports with predefined templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-quick-report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee_headcount">Employee Headcount</SelectItem>
                  <SelectItem value="leave_summary">Leave Summary</SelectItem>
                  <SelectItem value="payroll_summary">Payroll Summary</SelectItem>
                  <SelectItem value="performance_overview">Performance Overview</SelectItem>
                  <SelectItem value="custom_report">Custom Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-quick-start-date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-quick-end-date"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger data-testid="select-quick-department">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments?.map((dept: Department) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleGenerateReport}
              data-testid="button-generate-quick-report"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Access your recently generated reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentReports.map((report) => {
              const Icon = report.icon;
              return (
                <div 
                  key={report.id} 
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  data-testid={`recent-report-${report.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${report.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground" data-testid={`text-report-name-${report.id}`}>
                        {report.name}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-report-time-${report.id}`}>
                        Generated {report.generatedAt}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    data-testid={`button-download-report-${report.id}`}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Report Templates Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Available Report Templates</CardTitle>
          <CardDescription>Pre-configured report templates for common HR needs</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow data-testid="row-template-1">
                <TableCell className="font-medium">Employee Demographics</TableCell>
                <TableCell>Employee</TableCell>
                <TableCell>Comprehensive breakdown of workforce demographics</TableCell>
                <TableCell>Dec 1, 2024</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" data-testid="button-use-template-1">
                    Use Template
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow data-testid="row-template-2">
                <TableCell className="font-medium">Monthly Leave Analysis</TableCell>
                <TableCell>Leave</TableCell>
                <TableCell>Monthly leave patterns and usage trends</TableCell>
                <TableCell>Nov 28, 2024</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" data-testid="button-use-template-2">
                    Use Template
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow data-testid="row-template-3">
                <TableCell className="font-medium">Payroll Cost Analysis</TableCell>
                <TableCell>Payroll</TableCell>
                <TableCell>Detailed breakdown of payroll costs and overtime</TableCell>
                <TableCell>Nov 25, 2024</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" data-testid="button-use-template-3">
                    Use Template
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow data-testid="row-template-4">
                <TableCell className="font-medium">Performance Summary</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell>Summary of performance reviews and ratings</TableCell>
                <TableCell>Nov 20, 2024</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" data-testid="button-use-template-4">
                    Use Template
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
