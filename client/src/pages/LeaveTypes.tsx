import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertLeaveTypeSchema } from "@shared/schema";
import { Plus, Edit, Trash2, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeaveType } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function LeaveTypes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leaveTypes, isLoading } = useQuery<LeaveType[]>({
    queryKey: ['/api/leave/types'],
  });

  const form = useForm({
    resolver: zodResolver(insertLeaveTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      daysAllowed: 0,
      carryForward: false,
      color: "#3b82f6",
    },
  });

  useEffect(() => {
    if (editingLeaveType) {
      form.reset({
        name: editingLeaveType.name,
        description: editingLeaveType.description || "",
        daysAllowed: editingLeaveType.daysAllowed,
        carryForward: editingLeaveType.carryForward || false,
        color: editingLeaveType.color || "#3b82f6",
      });
      setIsDialogOpen(true);
    }
  }, [editingLeaveType, form]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/leave/types", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave type created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leave/types'] });
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
        description: "Failed to create leave type. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/leave/types/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave type updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leave/types'] });
      setIsDialogOpen(false);
      setEditingLeaveType(null);
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
        description: "Failed to update leave type. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/leave/types/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave type deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/leave/types'] });
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
        description: "Failed to delete leave type. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      daysAllowed: parseInt(data.daysAllowed),
    };

    if (editingLeaveType) {
      updateMutation.mutate({ id: editingLeaveType.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this leave type? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLeaveType(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">Leave Types</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure leave policies and allowances for your organization
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-leave-type">
              <Plus className="mr-2 h-4 w-4" />
              Add Leave Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingLeaveType ? "Edit Leave Type" : "Add Leave Type"}</DialogTitle>
              <DialogDescription>
                {editingLeaveType
                  ? "Update the leave type details below."
                  : "Create a new leave type. Define the policy and allowances."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Annual Leave, Sick Leave" {...field} data-testid="input-leave-type-name" />
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
                          placeholder="Brief description of this leave type"
                          {...field}
                          data-testid="input-leave-type-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="daysAllowed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days Allowed Per Year *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g., 20"
                            {...field}
                            data-testid="input-days-allowed"
                          />
                        </FormControl>
                        <FormDescription>Annual allocation</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" {...field} className="w-20" data-testid="input-color" />
                            <Input type="text" value={field.value} readOnly className="flex-1" />
                          </div>
                        </FormControl>
                        <FormDescription>Calendar display color</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="carryForward"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Carry Forward</FormLabel>
                        <FormDescription>
                          Allow unused days to carry forward to next year
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-carry-forward"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-leave-type"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingLeaveType
                        ? "Update"
                        : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Types Configuration
          </CardTitle>
          <CardDescription>
            Manage leave policies, allowances, and carry-forward rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : leaveTypes && leaveTypes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Days Allowed</TableHead>
                  <TableHead className="text-center">Carry Forward</TableHead>
                  <TableHead className="text-center">Color</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypes.map((leaveType) => (
                  <TableRow key={leaveType.id} data-testid={`row-leave-type-${leaveType.id}`}>
                    <TableCell className="font-medium">{leaveType.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md">
                      {leaveType.description || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{leaveType.daysAllowed} days</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {leaveType.carryForward ? (
                        <CheckCircle className="h-5 w-5 text-green-600 inline" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground inline" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: leaveType.color || "#3b82f6" }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {leaveType.color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(leaveType)}
                          data-testid={`button-edit-${leaveType.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(leaveType.id)}
                          data-testid={`button-delete-${leaveType.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No leave types configured</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Get started by creating your first leave type policy.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Leave Type
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
