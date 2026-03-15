import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDepartments } from "@/hooks/use-departments";
import { insertPositionSchema } from "@shared/schema";
import { Plus, Edit, Trash2, Briefcase, Building2, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Position, Department } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Positions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ['/api/positions'],
  });

  const { data: departments } = useDepartments();

  const form = useForm({
    resolver: zodResolver(insertPositionSchema),
    defaultValues: {
      title: "",
      description: "",
      departmentId: "",
      minSalary: "",
      maxSalary: "",
      requirements: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/positions", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Position created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
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
        description: "Failed to create position. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/positions/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Position updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      setIsDialogOpen(false);
      setEditingPosition(null);
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
        description: "Failed to update position. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/positions/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Position deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to delete position";
      toast({
        title: "Error",
        description: errorMessage.includes("being used") 
          ? "Cannot delete position. It is being used by employees or job postings."
          : "Failed to delete position. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    form.reset({
      title: position.title,
      description: position.description || "",
      departmentId: position.departmentId || "",
      minSalary: position.minSalary || "",
      maxSalary: position.maxSalary || "",
      requirements: position.requirements || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this position?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: any) => {
    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      departmentId: data.departmentId && data.departmentId.trim() !== '' ? data.departmentId : null,
      description: data.description && data.description.trim() !== '' ? data.description : null,
      minSalary: data.minSalary && data.minSalary.trim() !== '' ? data.minSalary : null,
      maxSalary: data.maxSalary && data.maxSalary.trim() !== '' ? data.maxSalary : null,
      requirements: data.requirements && data.requirements.trim() !== '' ? data.requirements : null,
    };
    
    if (editingPosition) {
      updateMutation.mutate({ id: editingPosition.id, data: cleanedData });
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return "No Department";
    const department = departments?.find((dept: Department) => dept.id === departmentId);
    return department ? department.name : "Unknown";
  };

  const formatSalary = (amount: string | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const filteredPositions = positions?.filter((position: Position) => {
    if (departmentFilter === "all") return true;
    return position.departmentId === departmentFilter;
  }) || [];

  if (positionsLoading) {
    return (
      <div className="p-6" data-testid="positions-loading">
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
    <div className="p-6" data-testid="positions-page">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Positions / Designations</h1>
        </div>
        <p className="text-muted-foreground">
          Manage job positions and designations within your organization
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>All Positions</CardTitle>
          <div className="flex gap-4">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48" data-testid="select-department-filter">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments?.map((dept: Department) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => {
              setEditingPosition(null);
              form.reset();
              setIsDialogOpen(true);
            }} data-testid="button-create-position">
              <Plus className="mr-2 h-4 w-4" /> Create Position
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPositions.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No positions found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPositions.map((position: Position) => (
                    <TableRow key={position.id}>
                      <TableCell className="font-medium">{position.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Building2 className="h-3 w-3 mr-1" />
                          {getDepartmentName(position.departmentId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {position.minSalary || position.maxSalary ? (
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-3 w-3" />
                            {position.minSalary && position.maxSalary
                              ? `${formatSalary(position.minSalary)} - ${formatSalary(position.maxSalary)}`
                              : position.minSalary
                              ? `From ${formatSalary(position.minSalary)}`
                              : `Up to ${formatSalary(position.maxSalary)}`}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {position.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(position)}
                            data-testid={`edit-position-${position.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(position.id)}
                            data-testid={`delete-position-${position.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Position Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? "Edit Position" : "Create New Position"}
            </DialogTitle>
            <DialogDescription>
              {editingPosition 
                ? "Update position details and requirements"
                : "Add a new job position or designation to your organization"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} data-testid="input-position-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select
                      value={field.value || "all"}
                      onValueChange={(value) => field.onChange(value === "all" ? "" : value)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-position-department">
                          <SelectValue placeholder="Select department (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">No Department</SelectItem>
                        {departments?.map((dept: Department) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
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
                  name="minSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Salary</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50000" 
                          {...field} 
                          data-testid="input-min-salary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Salary</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="80000" 
                          {...field} 
                          data-testid="input-max-salary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the position..."
                        rows={3}
                        {...field} 
                        data-testid="input-position-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Required skills, qualifications, and experience..."
                        rows={4}
                        {...field} 
                        data-testid="input-position-requirements"
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
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingPosition(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingPosition
                    ? "Update Position"
                    : "Create Position"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

