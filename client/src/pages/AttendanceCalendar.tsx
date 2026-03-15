import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { AttendanceRecord, Employee } from "@shared/schema";

export default function AttendanceCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDateStr = format(monthStart, "yyyy-MM-dd");
  const endDateStr = format(monthEnd, "yyyy-MM-dd");

  // Get all employees
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Get attendance records
  const { data: attendanceRecords, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance', { 
      employeeId: selectedEmployee !== "all" ? selectedEmployee : undefined,
      startDate: startDateStr, 
      endDate: endDateStr 
    }],
  });

  const getRecordForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendanceRecords?.find(r => r.date === dateStr);
  };

  const getStatusColor = (record: AttendanceRecord | undefined) => {
    if (!record) return "bg-gray-100";
    switch (record.status) {
      case 'present':
        return record.clockIn && record.clockOut ? "bg-green-100 border-green-300" : "bg-yellow-100 border-yellow-300";
      case 'absent':
        return "bg-red-100 border-red-300";
      case 'late':
        return "bg-orange-100 border-orange-300";
      case 'half_day':
        return "bg-blue-100 border-blue-300";
      case 'on_leave':
        return "bg-purple-100 border-purple-300";
      default:
        return "bg-gray-100";
    }
  };

  const getStatusIcon = (record: AttendanceRecord | undefined) => {
    if (!record) return null;
    if (record.status === 'present' && record.clockIn && record.clockOut) {
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
    if (record.status === 'absent') {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    return <Clock className="w-4 h-4 text-orange-600" />;
  };

  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfMonth = monthStart.getDay();
  const daysToAdd = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
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
    <div className="p-6" data-testid="attendance-calendar-page">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Attendance Calendar</h1>
          </div>
        </div>
        <p className="text-muted-foreground">
          Visual calendar view of attendance records
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <Button variant="outline" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employees?.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly View</CardTitle>
          <CardDescription>
            {format(monthStart, "MMMM yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: daysToAdd }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day) => {
              const record = getRecordForDate(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <div
                  key={format(day, "yyyy-MM-dd")}
                  className={`
                    aspect-square border-2 rounded-lg p-2 cursor-pointer transition-all
                    ${getStatusColor(record)}
                    ${isToday ? "ring-2 ring-primary ring-offset-2" : ""}
                    ${!isCurrentMonth ? "opacity-50" : ""}
                    hover:shadow-md
                  `}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${isToday ? "text-primary font-bold" : ""}`}>
                        {format(day, "d")}
                      </span>
                      {getStatusIcon(record)}
                    </div>
                    {record && (
                      <div className="mt-auto text-xs space-y-0.5">
                        {record.clockIn && (
                          <div className="text-green-700">
                            In: {format(parseISO(record.clockIn), "HH:mm")}
                          </div>
                        )}
                        {record.clockOut && (
                          <div className="text-blue-700">
                            Out: {format(parseISO(record.clockOut), "HH:mm")}
                          </div>
                        )}
                        {record.totalHours && (
                          <div className="font-semibold">
                            {parseFloat(record.totalHours).toFixed(1)}h
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
              <span className="text-sm">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded" />
              <span className="text-sm">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
              <span className="text-sm">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded" />
              <span className="text-sm">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
              <span className="text-sm">Half Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded" />
              <span className="text-sm">On Leave</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

