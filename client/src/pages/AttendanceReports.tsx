import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BarChart3, Download, Calendar, Users, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useDepartments } from "@/hooks/use-departments";
import type { AttendanceRecord, Employee } from "@shared/schema";

export default function AttendanceReports() {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
  const monthEnd = endOfMonth(parseISO(`${selectedMonth}-01`));
  const startDateStr = format(monthStart, "yyyy-MM-dd");
  const endDateStr = format(monthEnd, "yyyy-MM-dd");

  // Get all employees
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Get all attendance records for the selected period
  const { data: attendanceRecords, isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance', { startDate: startDateStr, endDate: endDateStr }],
  });

  // Get departments (only when logged in)
  const { data: departments } = useDepartments();

  // Filter employees by department
  const filteredEmployees = employees?.filter(emp => {
    if (selectedDepartment !== "all" && emp.departmentId !== selectedDepartment) {
      return false;
    }
    if (searchTerm && !`${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Calculate statistics
  const calculateStats = (employeeId: string) => {
    const records = attendanceRecords?.filter(r => r.employeeId === employeeId) || [];
    const totalHours = records.reduce((sum, r) => sum + (r.totalHours ? parseFloat(r.totalHours) : 0), 0);
    const presentDays = records.filter(r => r.status === 'present' && r.clockIn && r.clockOut).length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const halfDays = records.filter(r => r.status === 'half_day').length;
    const onLeaveDays = records.filter(r => r.status === 'on_leave').length;
    
    return {
      totalHours: totalHours.toFixed(2),
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      onLeaveDays,
      totalDays: records.length,
    };
  };

  // Overall statistics
  const overallStats = {
    totalEmployees: filteredEmployees?.length || 0,
    totalHours: attendanceRecords?.reduce((sum, r) => sum + (r.totalHours ? parseFloat(r.totalHours) : 0), 0) || 0,
    averageHours: filteredEmployees?.length 
      ? (attendanceRecords?.reduce((sum, r) => sum + (r.totalHours ? parseFloat(r.totalHours) : 0), 0) || 0) / filteredEmployees.length
      : 0,
    presentRate: attendanceRecords?.length
      ? ((attendanceRecords.filter(r => r.status === 'present' && r.clockIn && r.clockOut).length / attendanceRecords.length) * 100)
      : 0,
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees?.find(e => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return "No Department";
    return departments?.find(d => d.id === departmentId)?.name || "Unknown";
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
    <div className="p-6" data-testid="attendance-reports-page">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Attendance Reports</h1>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
        <p className="text-muted-foreground">
          View attendance analytics and reports
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Search Employee</label>
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-3xl font-bold">{overallStats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-3xl font-bold">{overallStats.totalHours.toFixed(0)}h</p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Hours</p>
                <p className="text-3xl font-bold">{overallStats.averageHours.toFixed(1)}h</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Rate</p>
                <p className="text-3xl font-bold">{overallStats.presentRate.toFixed(1)}%</p>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance Details</CardTitle>
          <CardDescription>
            {format(monthStart, "MMMM yyyy")} - {format(monthEnd, "MMMM yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Present Days</TableHead>
                <TableHead>Absent Days</TableHead>
                <TableHead>Late Days</TableHead>
                <TableHead>Half Days</TableHead>
                <TableHead>On Leave</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees && filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => {
                  const stats = calculateStats(employee.id);
                  const attendanceRate = stats.totalDays > 0 
                    ? (stats.presentDays / stats.totalDays) * 100 
                    : 0;
                  
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getDepartmentName(employee.departmentId)}
                        </Badge>
                      </TableCell>
                      <TableCell>{stats.totalHours}h</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">{stats.presentDays}</Badge>
                      </TableCell>
                      <TableCell>
                        {stats.absentDays > 0 && (
                          <Badge variant="destructive">{stats.absentDays}</Badge>
                        )}
                        {stats.absentDays === 0 && <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell>
                        {stats.lateDays > 0 && (
                          <Badge className="bg-orange-500">{stats.lateDays}</Badge>
                        )}
                        {stats.lateDays === 0 && <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell>
                        {stats.halfDays > 0 && (
                          <Badge variant="secondary">{stats.halfDays}</Badge>
                        )}
                        {stats.halfDays === 0 && <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell>
                        {stats.onLeaveDays > 0 && (
                          <Badge className="bg-blue-500">{stats.onLeaveDays}</Badge>
                        )}
                        {stats.onLeaveDays === 0 && <span className="text-muted-foreground">0</span>}
                      </TableCell>
                      <TableCell>
                        {attendanceRate >= 95 ? (
                          <Badge className="bg-green-500">Excellent</Badge>
                        ) : attendanceRate >= 85 ? (
                          <Badge className="bg-blue-500">Good</Badge>
                        ) : attendanceRate >= 75 ? (
                          <Badge className="bg-orange-500">Fair</Badge>
                        ) : (
                          <Badge variant="destructive">Poor</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

