import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Clock, MapPin, Calendar, LogIn, LogOut, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow, isToday, parseISO } from "date-fns";
import type { AttendanceRecord } from "@shared/schema";

export default function Attendance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<string>("office");

  const { data: todayRecord, isLoading } = useQuery<AttendanceRecord | null>({
    queryKey: ['/api/attendance/today'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  const clockInMutation = useMutation({
    mutationFn: async (data: { location?: string }) => {
      return await apiRequest("POST", "/api/attendance/clock-in", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      toast({
        title: "Success",
        description: "Clocked in successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clock in",
        variant: "destructive",
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/attendance/clock-out", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      toast({
        title: "Success",
        description: "Clocked out successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clock out",
        variant: "destructive",
      });
    },
  });

  const handleClockIn = () => {
    clockInMutation.mutate({ location });
  };

  const handleClockOut = () => {
    clockOutMutation.mutate();
  };

  const getStatusBadge = (record: AttendanceRecord | null) => {
    if (!record) return <Badge variant="outline">Not Clocked In</Badge>;
    if (record.clockIn && !record.clockOut) {
      return <Badge className="bg-green-500">Clocked In</Badge>;
    }
    if (record.clockIn && record.clockOut) {
      return <Badge variant="secondary">Clocked Out</Badge>;
    }
    return <Badge variant="outline">Not Clocked In</Badge>;
  };

  const calculateElapsedTime = (clockIn: string | null) => {
    if (!clockIn) return null;
    const start = parseISO(clockIn);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-9 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isClockedIn = todayRecord?.clockIn && !todayRecord?.clockOut;
  const isClockedOut = todayRecord?.clockIn && todayRecord?.clockOut;

  return (
    <div className="p-6" data-testid="attendance-page">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Attendance</h1>
        </div>
        <p className="text-muted-foreground">
          Clock in and out, track your working hours
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clock In/Out Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  isClockedIn ? 'bg-green-500' : isClockedOut ? 'bg-gray-400' : 'bg-gray-300'
                }`} />
                <div>
                  <p className="font-medium">Status</p>
                  <div className="text-sm text-muted-foreground">
                    {getStatusBadge(todayRecord)}
                  </div>
                </div>
              </div>
              {isClockedIn && todayRecord?.clockIn && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Elapsed Time</p>
                  <p className="text-lg font-bold text-primary">
                    {calculateElapsedTime(todayRecord.clockIn)}
                  </p>
                </div>
              )}
            </div>

            {/* Clock In Time */}
            {todayRecord?.clockIn && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Clock In</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(todayRecord.clockIn), "h:mm a")}
                    </p>
                  </div>
                </div>
                {todayRecord.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {todayRecord.location}
                  </div>
                )}
              </div>
            )}

            {/* Clock Out Time */}
            {todayRecord?.clockOut && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium">Clock Out</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(todayRecord.clockOut), "h:mm a")}
                    </p>
                  </div>
                </div>
                {todayRecord.totalHours && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="font-bold">{parseFloat(todayRecord.totalHours).toFixed(2)}h</p>
                  </div>
                )}
              </div>
            )}

            {/* Break Duration */}
            {isClockedIn && todayRecord && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Break Duration (minutes)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={todayRecord.breakDuration || 0}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value) || 0;
                      apiRequest("PUT", `/api/attendance/${todayRecord.id}/break`, { breakMinutes: minutes })
                        .then(() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
                          toast({
                            title: "Success",
                            description: "Break duration updated",
                          });
                        })
                        .catch((error: any) => {
                          toast({
                            title: "Error",
                            description: error.message || "Failed to update break duration",
                            variant: "destructive",
                          });
                        });
                    }}
                    className="flex-1"
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground self-center">min</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Update your break duration if you took a break during work hours
                </p>
              </div>
            )}

            {/* Location Selection */}
            {!isClockedOut && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isClockedIn}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="office">Office</option>
                  <option value="remote">Remote</option>
                  <option value="client-site">Client Site</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!todayRecord?.clockIn && (
                <Button
                  onClick={handleClockIn}
                  disabled={clockInMutation.isPending}
                  className="flex-1 h-12 text-lg"
                  size="lg"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  {clockInMutation.isPending ? "Clocking In..." : "Clock In"}
                </Button>
              )}
              {isClockedIn && (
                <Button
                  onClick={handleClockOut}
                  disabled={clockOutMutation.isPending}
                  variant="destructive"
                  className="flex-1 h-12 text-lg"
                  size="lg"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  {clockOutMutation.isPending ? "Clocking Out..." : "Clock Out"}
                </Button>
              )}
              {isClockedOut && (
                <div className="flex-1 p-4 bg-muted rounded-lg text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium">Attendance Complete</p>
                  <p className="text-sm text-muted-foreground">
                    You've completed your attendance for today
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">
                  {todayRecord?.totalHours 
                    ? parseFloat(todayRecord.totalHours).toFixed(1)
                    : isClockedIn && todayRecord?.clockIn
                    ? calculateElapsedTime(todayRecord.clockIn)?.split('h')[0] || '0'
                    : '0'
                  }h
                </p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">--h</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold">--h</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

