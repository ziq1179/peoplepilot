import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, FileText } from "lucide-react";
import type { LeaveRequest, LeaveType, Employee } from "@shared/schema";
import { format } from "date-fns";

type LeaveRequestWithType = LeaveRequest & {
  leaveType?: LeaveType;
};

export default function MyLeaveRequests() {
  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const { data: employee } = useQuery<Employee>({
    queryKey: ["/api/employees/by-user", user?.id],
    enabled: !!user?.id,
  });

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave/requests", { employeeId: employee?.id }],
    enabled: !!employee?.id,
  });

  const { data: leaveTypes = [] } = useQuery<LeaveType[]>({
    queryKey: ["/api/leave/types"],
  });

  const requestsWithTypes: LeaveRequestWithType[] = requests.map((request) => ({
    ...request,
    leaveType: leaveTypes.find((t) => t.id === request.leaveTypeId),
  }));

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
      approved: { label: "Approved", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={config.className} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">My Leave Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View the status and history of your leave requests
        </p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading your leave requests...</p>
            </CardContent>
          </Card>
        ) : requestsWithTypes.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No leave requests found. Submit your first leave request!
              </p>
            </CardContent>
          </Card>
        ) : (
          requestsWithTypes.map((request) => (
            <Card key={request.id} data-testid={`card-request-${request.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: request.leaveType?.color || "#3b82f6" }}
                      />
                      {request.leaveType?.name || "Unknown Leave Type"}
                    </CardTitle>
                    <CardDescription>
                      {request.daysRequested} day{request.daysRequested !== 1 ? "s" : ""} requested
                    </CardDescription>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Start Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.startDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">End Date</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(request.endDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                </div>

                {request.reason && (
                  <div className="flex gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Reason</p>
                      <p className="text-sm text-muted-foreground">{request.reason}</p>
                    </div>
                  </div>
                )}

                {request.comments && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">Reviewer Comments</p>
                    <p className="text-sm text-muted-foreground">{request.comments}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Submitted on {format(new Date(request.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
