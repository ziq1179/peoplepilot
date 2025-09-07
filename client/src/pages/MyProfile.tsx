import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { insertEmployeeSchema } from "@shared/schema";
import { Save, User, Calendar, FileText, Edit3, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Employee, Department, Position, LeaveRequest, PayrollRecord } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function MyProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ['/api/employees', user?.employee?.id],
    enabled: !!user?.employee?.id,
  });

  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });

  const { data: positions } = useQuery({
    queryKey: ['/api/positions'],
  });

  const { data: myLeaveRequests } = useQuery({
    queryKey: ['/api/leave/requests', { employeeId: user?.employee?.id }],
    enabled: !!user?.employee?.id,
  });

  const { data: myPayrollRecords } = useQuery({
    queryKey: ['/api/payroll', { employeeId: user?.employee?.id }],
    enabled: !!user?.employee?.id,
  });

  const form = useForm({
    resolver: zodResolver(insertEmployeeSchema.pick({
      phone: true,
      address: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
    })),
    defaultValues: {
      phone: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/employees/${user?.employee?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      setIsEditing(false);
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
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update form when employee data loads
  useEffect(() => {
    if (employee) {
      form.reset({
        phone: employee.phone || "",
        address: employee.address || "",
        emergencyContactName: employee.emergencyContactName || "",
        emergencyContactPhone: employee.emergencyContactPhone || "",
      });
    }
  }, [employee, form]);

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return "N/A";
    const department = departments?.find((dept: Department) => dept.id === departmentId);
    return department?.name || "Unknown";
  };

  const getPositionTitle = (positionId: string | null) => {
    if (!positionId) return "N/A";
    const position = positions?.find((pos: Position) => pos.id === positionId);
    return position?.title || "Unknown";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-accent/10 text-accent">Active</Badge>;
      case 'on_leave':
        return <Badge variant="secondary">On Leave</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeaveStatusBadge = (status: string) => {
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

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (employeeLoading) {
    return (
      <div className="p-6" data-testid="profile-loading">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6" data-testid="profile-not-found">
        <Card>
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Employee profile not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="my-profile-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">My Profile</h2>
          <p className="text-muted-foreground">View and manage your personal information and employment details.</p>
        </div>
        
        <Button 
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "outline" : "default"}
          data-testid="button-edit-profile"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={employee.profilePicture} />
                <AvatarFallback className="text-2xl">
                  {employee.firstName[0]}{employee.lastName[0]}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="text-xl font-semibold text-foreground mb-1" data-testid="text-employee-name">
                {employee.firstName} {employee.lastName}
              </h3>
              
              <p className="text-muted-foreground mb-2" data-testid="text-employee-id">
                Employee ID: {employee.employeeId}
              </p>
              
              <div className="mb-4">
                {getStatusBadge(employee.status)}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center space-x-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span data-testid="text-department">{getDepartmentName(employee.departmentId)}</span>
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span data-testid="text-position">{getPositionTitle(employee.positionId)}</span>
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span data-testid="text-hire-date">
                    Joined {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal" data-testid="tab-personal">Personal</TabsTrigger>
              <TabsTrigger value="contact" data-testid="tab-contact">Contact</TabsTrigger>
              <TabsTrigger value="leave" data-testid="tab-leave">Leave</TabsTrigger>
              <TabsTrigger value="payroll" data-testid="tab-payroll">Payroll</TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your basic personal and employment details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">First Name</label>
                      <p className="text-foreground" data-testid="text-first-name">{employee.firstName}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                      <p className="text-foreground" data-testid="text-last-name">{employee.lastName}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-foreground" data-testid="text-email">{employee.email}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                      <p className="text-foreground" data-testid="text-date-of-birth">
                        {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                      <p className="text-foreground" data-testid="text-hire-date-detail">
                        {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div data-testid="text-status-detail">{getStatusBadge(employee.status)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Information */}
            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    {isEditing ? "Update your contact details" : "Your contact details and emergency contacts"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="123 Main St, City, State, ZIP" 
                                  {...field} 
                                  data-testid="textarea-address" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emergencyContactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Jane Doe" {...field} data-testid="input-emergency-contact-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emergencyContactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Emergency Contact Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 987-6543" {...field} data-testid="input-emergency-contact-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsEditing(false)}
                            data-testid="button-cancel-edit"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateMutation.isPending}
                            data-testid="button-save-profile"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          </div>
                          <p className="text-foreground" data-testid="text-phone-display">
                            {employee.phone || "Not provided"}
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                          </div>
                          <p className="text-foreground" data-testid="text-email-display">{employee.email}</p>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <label className="text-sm font-medium text-muted-foreground">Address</label>
                        </div>
                        <p className="text-foreground" data-testid="text-address-display">
                          {employee.address || "Not provided"}
                        </p>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-foreground mb-3">Emergency Contact</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Name</label>
                            <p className="text-foreground" data-testid="text-emergency-contact-name-display">
                              {employee.emergencyContactName || "Not provided"}
                            </p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="text-foreground" data-testid="text-emergency-contact-phone-display">
                              {employee.emergencyContactPhone || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Leave History */}
            <TabsContent value="leave">
              <Card>
                <CardHeader>
                  <CardTitle>My Leave Requests</CardTitle>
                  <CardDescription>Your leave request history and current status</CardDescription>
                </CardHeader>
                <CardContent>
                  {myLeaveRequests?.length > 0 ? (
                    <div className="space-y-4">
                      {myLeaveRequests.slice(0, 5).map((request: LeaveRequest) => (
                        <div 
                          key={request.id} 
                          className="border rounded-lg p-4"
                          data-testid={`leave-request-${request.id}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground">Leave Request</h4>
                            {getLeaveStatusBadge(request.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Dates: </span>
                              <span data-testid={`text-leave-dates-${request.id}`}>
                                {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Days: </span>
                              <span data-testid={`text-leave-days-${request.id}`}>{request.daysRequested}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Requested: </span>
                              <span data-testid={`text-leave-created-${request.id}`}>
                                {new Date(request.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {request.reason && (
                            <p className="text-sm text-muted-foreground mt-2" data-testid={`text-leave-reason-${request.id}`}>
                              {request.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground" data-testid="text-no-leave-requests">
                        No leave requests found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payroll Information */}
            <TabsContent value="payroll">
              <Card>
                <CardHeader>
                  <CardTitle>My Payroll Records</CardTitle>
                  <CardDescription>Your recent payroll information and pay stubs</CardDescription>
                </CardHeader>
                <CardContent>
                  {myPayrollRecords?.length > 0 ? (
                    <div className="space-y-4">
                      {myPayrollRecords.slice(0, 5).map((record: PayrollRecord) => (
                        <div 
                          key={record.id} 
                          className="border rounded-lg p-4"
                          data-testid={`payroll-record-${record.id}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground">
                              Pay Period: {new Date(record.payPeriodStart).toLocaleDateString()} - {new Date(record.payPeriodEnd).toLocaleDateString()}
                            </h4>
                            <Badge variant="outline" data-testid={`text-payroll-status-${record.id}`}>
                              {record.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Base Salary: </span>
                              <span className="font-medium" data-testid={`text-base-salary-${record.id}`}>
                                ${parseFloat(record.baseSalary).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Overtime: </span>
                              <span data-testid={`text-overtime-${record.id}`}>
                                ${parseFloat(record.overtime).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Deductions: </span>
                              <span data-testid={`text-deductions-${record.id}`}>
                                ${parseFloat(record.deductions).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Net Pay: </span>
                              <span className="font-semibold text-accent" data-testid={`text-net-pay-${record.id}`}>
                                ${parseFloat(record.netPay).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground" data-testid="text-no-payroll-records">
                        No payroll records found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
