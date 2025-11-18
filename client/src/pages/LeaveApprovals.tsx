import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, Clock, FileText, Check, X, User } from "lucide-react";
import type { LeaveRequest, LeaveType, Employee } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

type LeaveRequestWithDetails = LeaveRequest & {
  leaveType?: LeaveType;
  employee?: Employee;
};

export default function LeaveApprovals() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithDetails | null>(null);
  const [comments, setComments] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave/requests", { status: "pending" }],
  });

  const { data: leaveTypes = [] } = useQuery<LeaveType[]>({
    queryKey: ["/api/leave/types"],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const requestsWithDetails: LeaveRequestWithDetails[] = requests.map((request) => ({
    ...request,
    leaveType: leaveTypes.find((t) => t.id === request.leaveTypeId),
    employee: employees.find((e) => e.id === request.employeeId),
  }));

  const approveMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments: string }) => {
      return await apiRequest(`/api/leave/requests/${id}/approve`, "PUT", { comments });
    },
    onSuccess: () => {
      toast({
        title: "Request approved",
        description: "The leave request has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leave/balances"] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve leave request",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments: string }) => {
      return await apiRequest(`/api/leave/requests/${id}/reject`, "PUT", { comments });
    },
    onSuccess: () => {
      toast({
        title: "Request rejected",
        description: "The leave request has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave/requests"] });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject leave request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: LeaveRequestWithDetails) => {
    setSelectedRequest(request);
    setActionType("approve");
    setComments("");
  };

  const handleReject = (request: LeaveRequestWithDetails) => {
    setSelectedRequest(request);
    setActionType("reject");
    setComments("");
  };

  const handleConfirmAction = () => {
    if (!selectedRequest) return;

    if (actionType === "approve") {
      approveMutation.mutate({ id: selectedRequest.id, comments });
    } else if (actionType === "reject") {
      rejectMutation.mutate({ id: selectedRequest.id, comments });
    }
  };

  const handleCloseDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setComments("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Leave Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve pending leave requests
        </p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading pending requests...</p>
            </CardContent>
          </Card>
        ) : requestsWithDetails.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No pending leave requests at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          requestsWithDetails.map((request) => (
            <Card key={request.id} data-testid={`card-pending-request-${request.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-lg">
                        {request.employee?.firstName} {request.employee?.lastName}
                      </CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: request.leaveType?.color || "#3b82f6" }}
                      />
                      {request.leaveType?.name} • {request.daysRequested} day{request.daysRequested !== 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    Pending Review
                  </Badge>
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

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Submitted on {format(new Date(request.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(request)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid={`button-approve-${request.id}`}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(request)}
                    variant="destructive"
                    className="flex-1"
                    data-testid={`button-reject-${request.id}`}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {actionType === "approve"
                    ? `Approving leave request for ${selectedRequest.employee?.firstName} ${selectedRequest.employee?.lastName}`
                    : `Rejecting leave request for ${selectedRequest.employee?.firstName} ${selectedRequest.employee?.lastName}`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Comments (Optional)</label>
              <Textarea
                placeholder="Add any comments or notes..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="mt-2"
                data-testid="input-review-comments"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConfirmAction}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className={actionType === "approve" ? "bg-green-600 hover:bg-green-700 flex-1" : "flex-1"}
                variant={actionType === "reject" ? "destructive" : "default"}
                data-testid="button-confirm-action"
              >
                {approveMutation.isPending || rejectMutation.isPending
                  ? "Processing..."
                  : actionType === "approve"
                  ? "Confirm Approval"
                  : "Confirm Rejection"}
              </Button>
              <Button onClick={handleCloseDialog} variant="outline" data-testid="button-cancel-action">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
