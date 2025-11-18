import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Plus, Clock } from "lucide-react";
import type { LeaveType, LeaveBalance, Employee } from "@shared/schema";
import { format, differenceInBusinessDays } from "date-fns";

const leaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1, "Please select a leave type"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
});

type LeaveRequestForm = z.infer<typeof leaveRequestSchema>;

export default function LeaveRequest() {
  const { toast } = useToast();
  const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null);
  const [daysRequested, setDaysRequested] = useState<number>(0);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const { data: employee } = useQuery<Employee>({
    queryKey: ["/api/employees/by-user", user?.id],
    enabled: !!user?.id,
  });

  const { data: leaveTypes = [] } = useQuery<LeaveType[]>({
    queryKey: ["/api/leave/types"],
  });

  const { data: balances = [] } = useQuery<LeaveBalance[]>({
    queryKey: ["/api/leave/balances", employee?.id],
    enabled: !!employee?.id,
  });

  const form = useForm<LeaveRequestForm>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");

  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const start = new Date(watchStartDate);
      const end = new Date(watchEndDate);
      const days = differenceInBusinessDays(end, start) + 1;
      setDaysRequested(Math.max(0, days));
    } else {
      setDaysRequested(0);
    }
  }, [watchStartDate, watchEndDate]);

  const currentBalance = balances.find(
    (b) => b.leaveTypeId === selectedLeaveType
  );

  const createMutation = useMutation({
    mutationFn: async (data: LeaveRequestForm) => {
      if (!employee) throw new Error("Employee profile not found");
      return await apiRequest("POST", "/api/leave/requests", {
        employeeId: employee.id,
        leaveTypeId: data.leaveTypeId,
        startDate: data.startDate,
        endDate: data.endDate,
        daysRequested,
        reason: data.reason || null,
        status: "pending",
      });
    },
    onSuccess: () => {
      toast({
        title: "Leave request submitted",
        description: "Your leave request has been submitted for approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave/requests"] });
      form.reset();
      setSelectedLeaveType(null);
      setDaysRequested(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LeaveRequestForm) => {
    if (daysRequested === 0) {
      toast({
        title: "Invalid dates",
        description: "Please select valid start and end dates",
        variant: "destructive",
      });
      return;
    }

    if (currentBalance && daysRequested > currentBalance.remaining) {
      toast({
        title: "Insufficient balance",
        description: `You only have ${currentBalance.remaining} days remaining for this leave type.`,
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Request Leave</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Submit a new leave request for approval
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Leave Request Form</CardTitle>
              <CardDescription>
                Fill in the details below to submit your leave request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="leaveTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Leave Type *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedLeaveType(value);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-leave-type">
                              <SelectValue placeholder="Select leave type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {leaveTypes.map((type) => (
                              <SelectItem
                                key={type.id}
                                value={type.id}
                                data-testid={`option-leave-type-${type.id}`}
                              >
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
                          <FormLabel>Start Date *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
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
                          <FormLabel>End Date *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-end-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {daysRequested > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          Days Requested: {daysRequested} business day{daysRequested !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the reason for your leave request"
                            className="resize-none"
                            rows={3}
                            {...field}
                            data-testid="input-reason"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={createMutation.isPending || daysRequested === 0}
                    data-testid="button-submit-request"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {createMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Leave Balance</CardTitle>
              <CardDescription>
                {selectedLeaveType
                  ? "Balance for selected leave type"
                  : "Select a leave type to view balance"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedLeaveType && currentBalance ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Allocated:</span>
                    <span className="font-semibold">{currentBalance.allocated} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Used:</span>
                    <span className="font-semibold">{currentBalance.used} days</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Remaining:</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {currentBalance.remaining} days
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No leave type selected
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Leave Balances</CardTitle>
              <CardDescription>All available leave balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {balances.map((balance) => {
                  const type = leaveTypes.find((t) => t.id === balance.leaveTypeId);
                  return (
                    <div
                      key={balance.id}
                      className="flex justify-between items-center py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type?.color || "#3b82f6" }}
                        />
                        <span className="text-sm font-medium">{type?.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{balance.remaining}/{balance.allocated}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
