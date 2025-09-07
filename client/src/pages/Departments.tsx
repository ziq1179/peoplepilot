import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertDepartmentSchema } from "@shared/schema";
import { Plus, Edit, Trash2, Building2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Department, Employee } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Departments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['/api/departments'],
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const form = useForm({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: "",
      budget: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Department created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
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
        description: "Failed to create department. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/departments/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Department updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsDialogOpen(false);
      setEditingDepartment(null);
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
        description: "Failed to update department. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Department deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
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
        description: "Failed to delete department. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    form.reset({
      name: department.name,
      description: department.description || "",
      managerId: department.managerId || "",
      budget: department.budget || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: any) => {
    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getEmployeeCount = (departmentId: string) => {
    return employees?.filter((emp: Employee) => emp.departmentId === departmentId)?.length || 0;
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return "No Manager";
    const manager = employees?.find((emp: Employee) => emp.id === managerId);
    return manager ? `${manager.firstName} ${manager.lastName}` : "Unknown";
  };

  if (departmentsLoading) {
    return (
      <div className="p-6" data-testid="departments-loading">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="departments-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Department Management</h2>
          <p className="text-muted-foreground">Manage organizational departments and their structure.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="mt-4 sm:mt-0" 
              onClick={() => {
                setEditingDepartment(null);
                form.reset();
              }}
              data-testid="button-add-department"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-department-form">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? "Edit Department" : "Add New Department"}
              </DialogTitle>
              <DialogDescription>
                {editingDepartment ? "Update department information" : "Create a new department"}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Engineering" {...field} data-testid="input-department-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Department description..." 
                          {...field} 
                          data-testid="textarea-department-description" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1000000" 
                          {...field} 
                          data-testid="input-department-budget" 
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
                    data-testid="button-cancel-department"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-department"
                  >
                    {editingDepartment ? "Update" : "Create"} Department
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {departments?.map((department: Department) => (
          <Card key={department.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg" data-testid={`text-department-name-${department.id}`}>
                      {department.name}
                    </CardTitle>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEdit(department)}
                    data-testid={`button-edit-department-${department.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(department.id)}
                    className="text-destructive hover:text-destructive/80"
                    data-testid={`button-delete-department-${department.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground" data-testid={`text-department-description-${department.id}`}>
                  {department.description || "No description provided"}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid={`text-department-employees-${department.id}`}>
                      {getEmployeeCount(department.id)} employees
                    </span>
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-muted-foreground">Manager: </span>
                  <span className="font-medium" data-testid={`text-department-manager-${department.id}`}>
                    {getManagerName(department.managerId)}
                  </span>
                </div>
                
                {department.budget && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Budget: </span>
                    <span className="font-medium" data-testid={`text-department-budget-${department.id}`}>
                      ${parseFloat(department.budget).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Department Table */}
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-departments-count">
            All Departments ({departments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments?.map((department: Department) => (
                <TableRow key={department.id} data-testid={`row-department-${department.id}`}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">
                        {department.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {department.description || "No description"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getManagerName(department.managerId)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getEmployeeCount(department.id)} employees
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {department.budget ? `$${parseFloat(department.budget).toLocaleString()}` : "N/A"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEdit(department)}
                        data-testid={`button-edit-table-${department.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(department.id)}
                        className="text-destructive hover:text-destructive/80"
                        data-testid={`button-delete-table-${department.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
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
