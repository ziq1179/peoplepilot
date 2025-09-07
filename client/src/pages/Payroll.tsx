import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPayrollRecordSchema } from "@shared/schema";
import { Plus, DollarSign, TrendingUp, FileText, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PayrollRecord, Employee } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Payroll() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payrollRecords, isLoading: payrollLoading } = useQuery({
    queryKey: ['/api/payroll', { status: statusFilter, employeeId: employeeFilter }],
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const form = useForm({
    resolver: zodResolver(insertPayrollRecordSchema),
    defaultValues: {
      employeeId: "",
      payPeriodStart: "",
      payPeriodEnd: "",
      baseSalary: "",
      overtime: "0",
      bonuses: "0",
      deductions: "0",
      taxes: "0",
      netPay: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/payroll", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payroll record created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create payroll record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/payroll/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payroll record updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payroll'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update payroll record. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'processed':
        return <Badge className="bg-chart-4/10 text-chart-4">Processed</Badge>;
      case 'paid':
        return <Badge className="bg-accent/10 text-accent">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find((emp: Employee) => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown";
  };

  const calculateNetPay = (baseSalary: number, overtime: number, bonuses: number, deductions: number, taxes: number) => {
    return baseSalary + overtime + bonuses - deductions - taxes;
  };

  const handleProcessPayroll = (id: string) => {
    updateMutation.mutate({
      id,
      data: { status: 'processed', processedAt: new Date().toISOString() }
    });
  };

  const onSubmit = (data: any) => {
    const netPay = calculateNetPay(
      parseFloat(data.baseSalary),
      parseFloat(data.overtime || 0),
      parseFloat(data.bonuses || 0),
      parseFloat(data.deductions || 0),
      parseFloat(data.taxes || 0)
    );
    createMutation.mutate({ ...data, netPay: netPay.toString() });
  };

  if (payrollLoading) {
    return (
      <div className="p-6" data-testid="payroll-loading">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    totalPayroll: payrollRecords?.reduce((sum: number, record: PayrollRecord) => 
      sum + parseFloat(record.netPay), 0) || 0,
    processingCount: payrollRecords?.filter((record: PayrollRecord) => record.status === 'processed').length || 0,
    draftCount: payrollRecords?.filter((record: PayrollRecord) => record.status === 'draft').length || 0,
    paidCount: payrollRecords?.filter((record: PayrollRecord) => record.status === 'paid').length || 0,
  };

  return (
    <div className="p-6" data-testid="payroll-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Payroll Management</h2>
          <p className="text-muted-foreground">Manage employee payroll, salaries, and compensation.</p>
        </div>
        
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button variant="outline" data-testid="button-run-payroll">
            <FileText className="w-4 h-4 mr-2" />
            Run Payroll
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-payroll-record">
                <Plus className="w-4 h-4 mr-2" />
                New Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" data-testid="dialog-payroll-form">
              <DialogHeader>
                <DialogTitle>New Payroll Record</DialogTitle>
                <DialogDescription>Create a new payroll record for an employee</DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-employee">
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees?.map((emp: Employee) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.firstName} {emp.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="payPeriodStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pay Period Start</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-pay-period-start" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payPeriodEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pay Period End</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-pay-period-end" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="baseSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Salary</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="5000.00" 
                              {...field} 
                              data-testid="input-base-salary" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="overtime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Overtime</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field} 
                              data-testid="input-overtime" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bonuses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bonuses</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field} 
                              data-testid="input-bonuses" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deductions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deductions</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              {...field} 
                              data-testid="input-deductions" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="taxes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxes</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            {...field} 
                            data-testid="input-taxes" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      data-testid="button-cancel-payroll"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      data-testid="button-save-payroll"
                    >
                      Create Record
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payroll Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-payroll">
                  ${stats.totalPayroll.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-processing-count">
                  {stats.processingCount}
                </p>
              </div>
              <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draft Records</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-draft-count">
                  {stats.draftCount}
                </p>
              </div>
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Records</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-paid-count">
                  {stats.paidCount}
                </p>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payroll Records</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-48" data-testid="select-employee-filter">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Employees</SelectItem>
                  {employees?.map((emp: Employee) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" size="icon" data-testid="button-export-payroll">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Pay Period</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Bonuses</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollRecords?.map((record: PayrollRecord) => (
                <TableRow key={record.id} data-testid={`row-payroll-record-${record.id}`}>
                  <TableCell>
                    <div className="font-medium text-foreground" data-testid={`text-employee-name-${record.id}`}>
                      {getEmployeeName(record.employeeId)}
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-pay-period-${record.id}`}>
                    {new Date(record.payPeriodStart).toLocaleDateString()} - {new Date(record.payPeriodEnd).toLocaleDateString()}
                  </TableCell>
                  <TableCell data-testid={`text-base-salary-${record.id}`}>
                    ${parseFloat(record.baseSalary).toLocaleString()}
                  </TableCell>
                  <TableCell data-testid={`text-overtime-${record.id}`}>
                    ${parseFloat(record.overtime).toLocaleString()}
                  </TableCell>
                  <TableCell data-testid={`text-bonuses-${record.id}`}>
                    ${parseFloat(record.bonuses).toLocaleString()}
                  </TableCell>
                  <TableCell data-testid={`text-deductions-${record.id}`}>
                    ${parseFloat(record.deductions).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium" data-testid={`text-net-pay-${record.id}`}>
                      ${parseFloat(record.netPay).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(record.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {record.status === 'draft' && (
                        <Button 
                          size="sm"
                          onClick={() => handleProcessPayroll(record.id)}
                          data-testid={`button-process-${record.id}`}
                        >
                          Process
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        data-testid={`button-download-${record.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
