import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertPerformanceReviewSchema } from "@shared/schema";
import { Plus, Star, TrendingUp, Award, Eye, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PerformanceReview, Employee } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Performance() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: performanceReviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['/api/performance/reviews', { status: statusFilter === "all" ? undefined : statusFilter }],
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const form = useForm({
    resolver: zodResolver(insertPerformanceReviewSchema),
    defaultValues: {
      employeeId: "",
      reviewerId: "",
      reviewPeriodStart: "",
      reviewPeriodEnd: "",
      overallRating: 3,
      technicalSkillsRating: 3,
      communicationRating: 3,
      leadershipRating: 3,
      teamworkRating: 3,
      problemSolvingRating: 3,
      goals: "",
      achievements: "",
      areasForImprovement: "",
      comments: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/performance/reviews", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Performance review created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/performance/reviews'] });
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
        description: "Failed to create performance review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/performance/reviews/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Performance review updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/performance/reviews'] });
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
        description: "Failed to update performance review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'submitted':
        return <Badge className="bg-chart-4/10 text-chart-4">Submitted</Badge>;
      case 'completed':
        return <Badge className="bg-accent/10 text-accent">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find((emp: Employee) => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown";
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-accent";
    if (rating >= 3) return "text-chart-4";
    return "text-destructive";
  };

  const getRatingLabel = (value: number): string => {
    const labels: Record<number, string> = {
      1: "Needs Improvement",
      2: "Below Expectations",
      3: "Meets Expectations",
      4: "Exceeds Expectations",
      5: "Outstanding",
    };
    return labels[value] || "Not Rated";
  };

  const handleSubmit = (id: string) => {
    updateMutation.mutate({
      id,
      data: { status: 'submitted', submittedAt: new Date().toISOString() }
    });
  };

  const handleComplete = (id: string) => {
    updateMutation.mutate({
      id,
      data: { status: 'completed', completedAt: new Date().toISOString() }
    });
  };

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  if (reviewsLoading) {
    return (
      <div className="p-6" data-testid="performance-loading">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    totalReviews: performanceReviews?.length || 0,
    completed: performanceReviews?.filter((review: PerformanceReview) => review.status === 'completed').length || 0,
    pending: performanceReviews?.filter((review: PerformanceReview) => review.status === 'draft').length || 0,
    averageRating: performanceReviews?.reduce((sum: number, review: PerformanceReview) => 
      sum + (review.overallRating || 0), 0) / (performanceReviews?.length || 1) || 0,
  };

  return (
    <div className="p-6" data-testid="performance-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Performance Management</h2>
          <p className="text-muted-foreground">Manage employee performance reviews, goals, and development plans.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0" data-testid="button-new-performance-review">
              <Plus className="w-4 h-4 mr-2" />
              New Review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="dialog-performance-form">
            <DialogHeader>
              <DialogTitle>New Performance Review</DialogTitle>
              <DialogDescription>Create a new performance review for an employee</DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-employee">
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees?.map((emp: Employee) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.firstName} {emp.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reviewerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reviewer</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-reviewer">
                              <SelectValue placeholder="Select reviewer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees?.map((emp: Employee) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.firstName} {emp.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reviewPeriodStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review Period Start</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-review-period-start" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reviewPeriodEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review Period End</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-review-period-end" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="overallRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overall Rating (1-5)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-overall-rating">
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Needs Improvement</SelectItem>
                          <SelectItem value="2">2 - Below Expectations</SelectItem>
                          <SelectItem value="3">3 - Meets Expectations</SelectItem>
                          <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                          <SelectItem value="5">5 - Outstanding</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-semibold">Competency Ratings</h3>
                  
                  <FormField
                    control={form.control}
                    name="technicalSkillsRating"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel>Technical Skills</FormLabel>
                          <span className="text-sm font-semibold text-primary">
                            {field.value} - {getRatingLabel(field.value)}
                          </span>
                        </div>
                        <FormControl>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[field.value ?? 3]}
                            onValueChange={([value]) => field.onChange(value ?? 3)}
                            data-testid="slider-technical-skills"
                          />
                        </FormControl>
                        <FormDescription>
                          Proficiency in technical skills required for the role
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="communicationRating"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel>Communication</FormLabel>
                          <span className="text-sm font-semibold text-primary">
                            {field.value} - {getRatingLabel(field.value)}
                          </span>
                        </div>
                        <FormControl>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[field.value ?? 3]}
                            onValueChange={([value]) => field.onChange(value ?? 3)}
                            data-testid="slider-communication"
                          />
                        </FormControl>
                        <FormDescription>
                          Ability to communicate effectively with team and stakeholders
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="leadershipRating"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel>Leadership</FormLabel>
                          <span className="text-sm font-semibold text-primary">
                            {field.value} - {getRatingLabel(field.value)}
                          </span>
                        </div>
                        <FormControl>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[field.value ?? 3]}
                            onValueChange={([value]) => field.onChange(value ?? 3)}
                            data-testid="slider-leadership"
                          />
                        </FormControl>
                        <FormDescription>
                          Ability to lead projects, mentor others, and take initiative
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="teamworkRating"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel>Teamwork</FormLabel>
                          <span className="text-sm font-semibold text-primary">
                            {field.value} - {getRatingLabel(field.value)}
                          </span>
                        </div>
                        <FormControl>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[field.value ?? 3]}
                            onValueChange={([value]) => field.onChange(value ?? 3)}
                            data-testid="slider-teamwork"
                          />
                        </FormControl>
                        <FormDescription>
                          Collaboration skills and contribution to team success
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="problemSolvingRating"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel>Problem Solving</FormLabel>
                          <span className="text-sm font-semibold text-primary">
                            {field.value} - {getRatingLabel(field.value)}
                          </span>
                        </div>
                        <FormControl>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={[field.value ?? 3]}
                            onValueChange={([value]) => field.onChange(value ?? 3)}
                            data-testid="slider-problem-solving"
                          />
                        </FormControl>
                        <FormDescription>
                          Ability to analyze issues and develop effective solutions
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goals</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Performance goals and objectives..." 
                          {...field} 
                          data-testid="textarea-goals" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="achievements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Achievements</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notable achievements and accomplishments..." 
                          {...field} 
                          data-testid="textarea-achievements" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="areasForImprovement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Areas for Improvement</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Areas where improvement is needed..." 
                          {...field} 
                          data-testid="textarea-areas-for-improvement" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Comments</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional feedback and comments..." 
                          {...field} 
                          data-testid="textarea-comments" 
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
                    data-testid="button-cancel-performance"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-save-performance"
                  >
                    Create Review
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-reviews">
                  {stats.totalReviews}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-completed-reviews">
                  {stats.completed}
                </p>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-pending-reviews">
                  {stats.pending}
                </p>
              </div>
              <div className="w-10 h-10 bg-chart-4/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-average-rating">
                  {stats.averageRating.toFixed(1)}
                </p>
              </div>
              <div className="w-10 h-10 bg-chart-1/10 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Reviews Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Performance Reviews</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Review Period</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performanceReviews?.map((review: PerformanceReview) => (
                <TableRow key={review.id} data-testid={`row-performance-review-${review.id}`}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {getEmployeeName(review.employeeId).split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium text-foreground" data-testid={`text-employee-name-${review.id}`}>
                        {getEmployeeName(review.employeeId)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-reviewer-name-${review.id}`}>
                    {getEmployeeName(review.reviewerId)}
                  </TableCell>
                  <TableCell data-testid={`text-review-period-${review.id}`}>
                    {new Date(review.reviewPeriodStart).toLocaleDateString()} - {new Date(review.reviewPeriodEnd).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className={`flex items-center space-x-1 ${getRatingColor(review.overallRating || 0)}`}>
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < (review.overallRating || 0) ? 'fill-current' : ''}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium" data-testid={`text-rating-${review.id}`}>
                        {review.overallRating || 0}/5
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(review.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {review.status === 'draft' && (
                        <Button 
                          size="sm"
                          onClick={() => handleSubmit(review.id)}
                          data-testid={`button-submit-${review.id}`}
                        >
                          Submit
                        </Button>
                      )}
                      {review.status === 'submitted' && (
                        <Button 
                          size="sm"
                          onClick={() => handleComplete(review.id)}
                          data-testid={`button-complete-${review.id}`}
                        >
                          Complete
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        data-testid={`button-view-${review.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        data-testid={`button-edit-${review.id}`}
                      >
                        <Edit className="w-4 h-4" />
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
