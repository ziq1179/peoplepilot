import { useState } from "react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Plus, Edit, Trash2, TrendingUp, Calendar } from "lucide-react";
import type { PerformanceGoal, Employee } from "@shared/schema";
import { format } from "date-fns";

const goalFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["individual", "team", "company"]),
  targetDate: z.string().min(1, "Target date is required"),
  progress: z.number().min(0).max(100).default(0),
});

type GoalFormData = z.infer<typeof goalFormSchema>;

const progressSchema = z.object({
  progress: z.number().min(0).max(100),
});

type ProgressFormData = z.infer<typeof progressSchema>;

export default function Goals() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);
  const [progressGoal, setProgressGoal] = useState<PerformanceGoal | null>(null);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const { data: employee } = useQuery<Employee>({
    queryKey: ["/api/employees/by-user", user?.id],
    enabled: !!user?.id,
  });

  const { data: goals = [], isLoading } = useQuery<PerformanceGoal[]>({
    queryKey: ["/api/performance/goals", employee?.id],
    enabled: !!employee?.id,
  });

  const createForm = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "individual",
      targetDate: "",
      progress: 0,
    },
  });

  const editForm = useForm<GoalFormData>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "individual",
      targetDate: "",
      progress: 0,
    },
  });

  const progressForm = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      progress: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: GoalFormData) => {
      if (!employee) throw new Error("Employee profile not found");
      return await apiRequest("POST", "/api/performance/goals", {
        ...data,
        employeeId: employee.id,
        createdBy: employee.id,
        status: "not_started",
      });
    },
    onSuccess: () => {
      toast({
        title: "Goal created",
        description: "Your performance goal has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/performance/goals"] });
      createForm.reset();
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create goal",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GoalFormData> }) => {
      return await apiRequest("PUT", `/api/performance/goals/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Goal updated",
        description: "Your performance goal has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/performance/goals"] });
      setEditingGoal(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update goal",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/performance/goals/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Goal deleted",
        description: "Your performance goal has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/performance/goals"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete goal",
        variant: "destructive",
      });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      let status = "not_started";
      if (progress > 0 && progress < 100) status = "in_progress";
      if (progress === 100) status = "completed";
      
      return await apiRequest("PUT", `/api/performance/goals/${id}`, { progress, status });
    },
    onSuccess: () => {
      toast({
        title: "Progress updated",
        description: "Goal progress has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/performance/goals"] });
      setProgressGoal(null);
      progressForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update progress",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (goal: PerformanceGoal) => {
    setEditingGoal(goal);
    editForm.reset({
      title: goal.title,
      description: goal.description || "",
      category: goal.category as "individual" | "team" | "company",
      targetDate: goal.targetDate ? format(new Date(goal.targetDate), "yyyy-MM-dd") : "",
      progress: goal.progress ?? 0,
    });
  };

  const handleUpdateProgress = (goal: PerformanceGoal) => {
    setProgressGoal(goal);
    progressForm.reset({
      progress: goal.progress ?? 0,
    });
  };

  const onCreateSubmit = (data: GoalFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: GoalFormData) => {
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data });
    }
  };

  const onProgressSubmit = (data: ProgressFormData) => {
    if (progressGoal) {
      updateProgressMutation.mutate({ id: progressGoal.id, progress: data.progress });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      not_started: "outline",
      in_progress: "default",
      completed: "secondary",
      missed: "destructive",
    };
    return (
      <Badge variant={variants[status]} data-testid={`badge-status-${status}`}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      individual: "bg-blue-100 text-blue-800",
      team: "bg-purple-100 text-purple-800",
      company: "bg-green-100 text-green-800",
    };
    return (
      <Badge className={colors[category]} data-testid={`badge-category-${category}`}>
        {category.toUpperCase()}
      </Badge>
    );
  };

  const filterByStatus = (status?: string) => {
    if (!status || status === "all") return goals;
    return goals.filter((g) => g.status === status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading goals...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Target className="h-10 w-10 text-primary" />
            Performance Goals
          </h1>
          <p className="text-muted-foreground mt-2">
            Set, track, and achieve your performance goals
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-goal">
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a new performance goal to track your progress
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goal Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="E.g., Improve customer satisfaction scores" data-testid="input-goal-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Describe your goal and success criteria..." 
                          rows={4}
                          data-testid="input-goal-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-goal-category">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="team">Team</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-goal-target-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create">
                    {createMutation.isPending ? "Creating..." : "Create Goal"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-5">
          <TabsTrigger value="all" data-testid="tab-all-goals">All</TabsTrigger>
          <TabsTrigger value="not_started" data-testid="tab-not-started">Not Started</TabsTrigger>
          <TabsTrigger value="in_progress" data-testid="tab-in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
          <TabsTrigger value="missed" data-testid="tab-missed">Missed</TabsTrigger>
        </TabsList>

        {["all", "not_started", "in_progress", "completed", "missed"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-6">
            {filterByStatus(status === "all" ? undefined : status).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No goals found in this category</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterByStatus(status === "all" ? undefined : status).map((goal) => (
                  <Card key={goal.id} data-testid={`card-goal-${goal.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl" data-testid={`text-goal-title-${goal.id}`}>{goal.title}</CardTitle>
                            {getCategoryBadge(goal.category)}
                            {getStatusBadge(goal.status)}
                          </div>
                          {goal.description && (
                            <CardDescription data-testid={`text-goal-description-${goal.id}`}>{goal.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(goal)}
                            data-testid={`button-edit-goal-${goal.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => deleteMutation.mutate(goal.id)}
                            data-testid={`button-delete-goal-${goal.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Target: {goal.targetDate ? format(new Date(goal.targetDate), "MMM dd, yyyy") : "No date set"}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" data-testid={`text-goal-progress-${goal.id}`}>{goal.progress ?? 0}%</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateProgress(goal)}
                            data-testid={`button-update-progress-${goal.id}`}
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Update Progress
                          </Button>
                        </div>
                      </div>
                      <Progress value={goal.progress ?? 0} className="w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>Update your performance goal details</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Title</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-goal-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} data-testid="input-edit-goal-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-goal-category">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="team">Team</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-edit-goal-target-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingGoal(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                  {updateMutation.isPending ? "Updating..." : "Update Goal"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Progress Update Dialog */}
      <Dialog open={!!progressGoal} onOpenChange={() => setProgressGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>Update the completion percentage for this goal</DialogDescription>
          </DialogHeader>
          <Form {...progressForm}>
            <form onSubmit={progressForm.handleSubmit(onProgressSubmit)} className="space-y-4">
              <FormField
                control={progressForm.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress ({field.value}%)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="0" 
                        max="100"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-progress-value"
                      />
                    </FormControl>
                    <Progress value={field.value} className="w-full mt-2" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setProgressGoal(null)}
                  data-testid="button-cancel-progress"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProgressMutation.isPending} data-testid="button-submit-progress">
                  {updateProgressMutation.isPending ? "Updating..." : "Update Progress"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
