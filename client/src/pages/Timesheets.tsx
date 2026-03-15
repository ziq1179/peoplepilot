import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Calendar, CheckCircle2, XCircle, Clock, Send, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO, eachDayOfInterval } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import type { Timesheet, AttendanceRecord } from "@shared/schema";

export default function Timesheets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 }); // Sunday
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  // Get current user's employee record
  const { data: employee } = useQuery({
    queryKey: ['/api/employees/by-user', user?.id],
    enabled: !!user?.id,
    retry: false,
  });

  // Get timesheets
  const { data: timesheets, isLoading } = useQuery<Timesheet[]>({
    queryKey: ['/api/timesheets', { employeeId: employee?.id }],
    enabled: !!employee?.id,
  });

  // Get attendance records for the current week
  const { data: attendanceRecords } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance', { 
      employeeId: employee?.id, 
      startDate: weekStartStr, 
      endDate: weekEndStr 
    }],
    enabled: !!employee?.id,
  });

  // Get current week's timesheet
  const currentTimesheet = timesheets?.find(
    ts => ts.weekStartDate === weekStartStr
  );

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/timesheets/${id}/submit`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheets'] });
      toast({
        title: "Success",
        description: "Timesheet submitted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit timesheet",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/timesheets/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheets'] });
      toast({
        title: "Success",
        description: "Timesheet approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve timesheet",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return await apiRequest("POST", `/api/timesheets/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timesheets'] });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      toast({
        title: "Success",
        description: "Timesheet rejected",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject timesheet",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateWeekHours = () => {
    if (!attendanceRecords) return 0;
    return attendanceRecords.reduce((total, record) => {
      if (record.totalHours) {
        return total + parseFloat(record.totalHours);
      }
      return total;
    }, 0);
  };

  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekHours = calculateWeekHours();
  const isManager = user?.role === 'manager' || user?.role === 'hr' || user?.role === 'admin';

  // Get all timesheets for manager view
  const { data: allTimesheets } = useQuery<Timesheet[]>({
    queryKey: ['/api/timesheets'],
    enabled: isManager,
  });

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleSubmit = () => {
    if (currentTimesheet) {
      submitMutation.mutate(currentTimesheet.id);
    }
  };

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet);
    setIsRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedTimesheet && rejectionReason.trim()) {
      rejectMutation.mutate({ id: selectedTimesheet.id, reason: rejectionReason });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-9 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="timesheets-page">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Timesheets</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage your weekly timesheets
        </p>
      </div>

      {/* Week Navigation */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handlePreviousWeek}>
              ← Previous Week
            </Button>
            <div className="text-center">
              <p className="font-semibold text-lg">
                {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
              </p>
              <p className="text-sm text-muted-foreground">Week of {format(weekStart, "MMMM yyyy")}</p>
            </div>
            <Button variant="outline" onClick={handleNextWeek}>
              Next Week →
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Timesheet */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Timesheet</CardTitle>
                <CardDescription>
                  {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                </CardDescription>
              </div>
              {currentTimesheet && getStatusBadge(currentTimesheet.status)}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekDays.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const record = attendanceRecords?.find(r => r.date === dayStr);
                  const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  
                  return (
                    <TableRow key={dayStr} className={isToday ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">
                        {format(day, "EEE, MMM d")}
                        {isToday && <Badge variant="outline" className="ml-2">Today</Badge>}
                      </TableCell>
                      <TableCell>
                        {record?.clockIn 
                          ? format(parseISO(record.clockIn), "h:mm a")
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {record?.clockOut 
                          ? format(parseISO(record.clockOut), "h:mm a")
                          : record?.clockIn 
                          ? <Badge variant="outline">In Progress</Badge>
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {record?.totalHours 
                          ? `${parseFloat(record.totalHours).toFixed(2)}h`
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {record ? (
                          <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                            {record.status}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Record</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="font-bold bg-muted">
                  <TableCell colSpan={3}>Total Hours</TableCell>
                  <TableCell>{weekHours.toFixed(2)}h</TableCell>
                  <TableCell>
                    {weekHours >= 40 ? (
                      <Badge className="bg-green-500">Complete</Badge>
                    ) : (
                      <Badge variant="outline">Incomplete</Badge>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {currentTimesheet && currentTimesheet.status === 'draft' && (
              <div className="mt-4 flex gap-2">
                <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                  <Send className="mr-2 h-4 w-4" />
                  {submitMutation.isPending ? "Submitting..." : "Submit Timesheet"}
                </Button>
              </div>
            )}

            {currentTimesheet && currentTimesheet.status === 'rejected' && currentTimesheet.rejectionReason && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                <p className="text-sm text-muted-foreground">{currentTimesheet.rejectionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Week Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium">Total Hours</span>
                </div>
                <span className="text-2xl font-bold">{weekHours.toFixed(2)}h</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Regular Hours</span>
                <span className="font-medium">
                  {currentTimesheet?.regularHours 
                    ? `${parseFloat(currentTimesheet.regularHours).toFixed(2)}h`
                    : `${Math.min(weekHours, 40).toFixed(2)}h`
                  }
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Overtime Hours</span>
                <span className="font-medium text-orange-600">
                  {currentTimesheet?.overtimeHours 
                    ? `${parseFloat(currentTimesheet.overtimeHours).toFixed(2)}h`
                    : `${Math.max(0, weekHours - 40).toFixed(2)}h`
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          {isManager && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {allTimesheets?.filter(ts => ts.status === 'submitted').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending timesheets
                  </p>
                ) : (
                  <div className="space-y-2">
                    {allTimesheets?.filter(ts => ts.status === 'submitted').slice(0, 5).map((ts) => (
                      <div key={ts.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            Week of {format(parseISO(ts.weekStartDate), "MMM d")}
                          </span>
                          <span className="text-sm font-bold">
                            {ts.totalHours ? `${parseFloat(ts.totalHours).toFixed(1)}h` : '-'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleApprove(ts.id)}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleReject(ts)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Timesheet</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this timesheet.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Timesheet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

