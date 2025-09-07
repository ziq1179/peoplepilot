import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertLeaveRequestSchema } from "@shared/schema";
import { Plus, Calendar, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeaveRequest, LeaveType, Employee } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Leave() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leaveRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/leave/requests', { status: statusFilter }],
  });

  const { data: leaveTypes } = useQuery({
    queryKey: ['/api/leave/types'],
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const form = useForm({
    resolver: zodResolver(insertLeaveRequestSchema),
    defaultValues: {
      employeeId: "",
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      daysRequested: 0,
      reason: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/leave/requests", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave request submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leave/requests'] });
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
        description: "Failed to submit leave request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/leave/requests/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave request updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leave/requests'] });
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
        description: "Failed to update leave request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-chart-4/10 text-chart-4">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-accent/10 text-accent">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find((emp: Employee) => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown";
  };

  const getLeaveTypeName = (leaveTypeId: string) => {
    const leaveType = leaveTypes?.find((type: LeaveType) => type.id === leaveTypeId);
    return leaveType?.name || "Unknown";
  };

  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleApprove = (id: string) => {
    updateMutation.mutate({
      id,
      data: { status: 'approved', approvalDate: new Date().toISOString() }
    });
  };

  const handleReject = (id: string) => {
    updateMutation.mutate({
      id,
      data: { status: 'rejected', approvalDate: new Date().toISOString() }
    });
  };

  const onSubmit = (data: any) => {
    const days = calculateDays(data.startDate, data.endDate);
    createMutation.mutate({ ...data, daysRequested: days });
  };

  if (requestsLoading) {
    return (
      <div className="p-6" data-testid="leave-loading">
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
    pending: leaveRequests?.filter((req: LeaveRequest) => req.status === 'pending').length || 0,
    approved: leaveRequests?.filter((req: LeaveRequest) => req.status === 'approved').length || 0,
    current: leaveRequests?.filter((req: LeaveRequest) => {
      const today = new Date();
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      return req.status === 'approved' && start <= today && end >= today;
    }).length || 0,
    average: 18.5
  };

  return (
    <div className="p-6" data-testid="leave-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Leave Management</h2>
          <p className="text-muted-foreground">Manage employee leave requests, approvals, and leave balances.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0" data-testid="button-new-leave-request">
              <Plus className="w-4 h-4 mr-2" />
              New Leave Request
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-leave-form">
            <DialogHeader>
              <DialogTitle>New Leave Request</DialogTitle>
              <DialogDescription>Submit a new leave request for approval</DialogDescription>
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

                <FormField
                  control={form.control}
                  name="leaveTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-leave-type">
                            <SelectValue placeholder="Select leave type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leaveTypes?.map((type: LeaveType) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
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
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-start-date" />
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
                          <Input type="date" {...field} data-testid="input-end-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Reason for leave..." 
                          {...field} 
                          data-testid="textarea-leave-reason" 
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
                    data-testid="button-cancel-leave"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-submit-leave"
                  >
                    Submit Request
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-pending-requests">
                  {stats.pending}
                </p>
              </div>
              <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved This Month</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-approved-requests">
                  {stats.approved}
                </p>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Currently On Leave</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-current-leave">
                  {stats.current}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Days/Employee</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-average-days">
                  {stats.average}
                </p>
              </div>
              <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Leave Requests</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="All Requests" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests?.map((request: LeaveRequest) => (
                <TableRow key={request.id} data-testid={`row-leave-request-${request.id}`}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {getEmployeeName(request.employeeId).split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground" data-testid={`text-employee-name-${request.id}`}>
                          {getEmployeeName(request.employeeId)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {employees?.find((emp: Employee) => emp.id === request.employeeId)?.departmentId || "N/A"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-leave-type-${request.id}`}>
                    {getLeaveTypeName(request.leaveTypeId)}
                  </TableCell>
                  <TableCell data-testid={`text-start-date-${request.id}`}>
                    {new Date(request.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell data-testid={`text-end-date-${request.id}`}>
                    {new Date(request.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell data-testid={`text-days-requested-${request.id}`}>
                    {request.daysRequested}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {request.status === 'pending' ? (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-accent hover:bg-accent/90"
                            onClick={() => handleApprove(request.id)}
                            data-testid={`button-approve-${request.id}`}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleReject(request.id)}
                            data-testid={`button-reject-${request.id}`}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          data-testid={`button-view-${request.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
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
