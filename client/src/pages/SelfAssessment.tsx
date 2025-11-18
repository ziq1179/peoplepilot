import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, FileText, Star } from "lucide-react";
import type { PerformanceReview, Employee } from "@shared/schema";
import { format } from "date-fns";

const selfAssessmentSchema = z.object({
  selfAssessment: z.string().optional(),
  technicalSkillsRating: z.number().min(1).max(5),
  communicationRating: z.number().min(1).max(5),
  leadershipRating: z.number().min(1).max(5),
  teamworkRating: z.number().min(1).max(5),
  problemSolvingRating: z.number().min(1).max(5),
});

type SelfAssessmentForm = z.infer<typeof selfAssessmentSchema>;

export default function SelfAssessment() {
  const { toast } = useToast();
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const { data: employee } = useQuery<Employee>({
    queryKey: ["/api/employees/by-user", user?.id],
    enabled: !!user?.id,
  });

  const { data: reviews = [], isLoading } = useQuery<PerformanceReview[]>({
    queryKey: ["/api/performance/reviews", employee?.id],
    enabled: !!employee?.id,
  });

  const form = useForm<SelfAssessmentForm>({
    resolver: zodResolver(selfAssessmentSchema),
    defaultValues: {
      selfAssessment: "",
      technicalSkillsRating: 3,
      communicationRating: 3,
      leadershipRating: 3,
      teamworkRating: 3,
      problemSolvingRating: 3,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SelfAssessmentForm) => {
      if (!selectedReview) throw new Error("No review selected");
      return await apiRequest("PUT", `/api/performance/reviews/${selectedReview.id}`, {
        selfAssessment: data.selfAssessment || null,
        technicalSkillsRating: data.technicalSkillsRating,
        communicationRating: data.communicationRating,
        leadershipRating: data.leadershipRating,
        teamworkRating: data.teamworkRating,
        problemSolvingRating: data.problemSolvingRating,
        status: "pending",
      });
    },
    onSuccess: () => {
      toast({
        title: "Self-assessment submitted",
        description: "Your self-assessment has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/performance/reviews"] });
      setSelectedReview(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit self-assessment",
        variant: "destructive",
      });
    },
  });

  const handleStartAssessment = (review: PerformanceReview) => {
    setSelectedReview(review);
    
    form.reset({
      selfAssessment: review.selfAssessment || "",
      technicalSkillsRating: review.technicalSkillsRating || 3,
      communicationRating: review.communicationRating || 3,
      leadershipRating: review.leadershipRating || 3,
      teamworkRating: review.teamworkRating || 3,
      problemSolvingRating: review.problemSolvingRating || 3,
    });
  };

  const onSubmit = (data: SelfAssessmentForm) => {
    updateMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "outline",
      pending: "default",
      completed: "secondary",
    };
    return (
      <Badge variant={variants[status] || "outline"} data-testid={`badge-status-${status}`}>
        {status.toUpperCase()}
      </Badge>
    );
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

  const filterReviewsByStatus = (status?: string) => {
    if (!status || status === "all") return reviews;
    return reviews.filter((r) => r.status === status);
  };

  const pendingReviews = reviews.filter((r) => r.status === "draft" || r.status === "pending");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading reviews...</p>
      </div>
    );
  }

  if (selectedReview) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => setSelectedReview(null)}
            data-testid="button-back-to-list"
          >
            ← Back to Reviews
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Self-Assessment
            </CardTitle>
            <CardDescription>
              Review Period: {format(new Date(selectedReview.reviewPeriodStart), "MMM dd, yyyy")} - {format(new Date(selectedReview.reviewPeriodEnd), "MMM dd, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Competency Ratings
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Rate yourself on the following competencies. Be honest and objective in your assessment.
                    </p>

                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="technicalSkillsRating"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex justify-between items-center mb-2">
                              <FormLabel className="text-base">Technical Skills</FormLabel>
                              <span className="text-sm font-semibold text-primary" data-testid="text-rating-technical">
                                {field.value} - {getRatingLabel(field.value)}
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                                data-testid="slider-technical-skills"
                              />
                            </FormControl>
                            <FormDescription>
                              Your proficiency in technical skills required for your role
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
                              <FormLabel className="text-base">Communication</FormLabel>
                              <span className="text-sm font-semibold text-primary" data-testid="text-rating-communication">
                                {field.value} - {getRatingLabel(field.value)}
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                                data-testid="slider-communication"
                              />
                            </FormControl>
                            <FormDescription>
                              Your ability to communicate effectively with team members and stakeholders
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
                              <FormLabel className="text-base">Leadership</FormLabel>
                              <span className="text-sm font-semibold text-primary" data-testid="text-rating-leadership">
                                {field.value} - {getRatingLabel(field.value)}
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                                data-testid="slider-leadership"
                              />
                            </FormControl>
                            <FormDescription>
                              Your ability to lead projects, mentor others, and take initiative
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
                              <FormLabel className="text-base">Teamwork</FormLabel>
                              <span className="text-sm font-semibold text-primary" data-testid="text-rating-teamwork">
                                {field.value} - {getRatingLabel(field.value)}
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                                data-testid="slider-teamwork"
                              />
                            </FormControl>
                            <FormDescription>
                              Your collaboration skills and contribution to team success
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
                              <FormLabel className="text-base">Problem Solving</FormLabel>
                              <span className="text-sm font-semibold text-primary" data-testid="text-rating-problem-solving">
                                {field.value} - {getRatingLabel(field.value)}
                              </span>
                            </div>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                                data-testid="slider-problem-solving"
                              />
                            </FormControl>
                            <FormDescription>
                              Your ability to analyze issues and develop effective solutions
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="selfAssessment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Self-Assessment Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Share your thoughts on your performance, achievements, challenges, and areas for improvement..."
                            rows={6}
                            data-testid="input-self-assessment-notes"
                          />
                        </FormControl>
                        <FormDescription>
                          Provide additional context about your performance during this review period
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedReview(null)}
                    data-testid="button-cancel-assessment"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-assessment">
                    {updateMutation.isPending ? "Submitting..." : "Submit Self-Assessment"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <FileText className="h-10 w-10 text-primary" />
          Self-Assessment
        </h1>
        <p className="text-muted-foreground mt-2">
          Complete your performance self-assessments
        </p>
      </div>

      {pendingReviews.length > 0 && (
        <Card className="mb-6 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Pending Self-Assessments
            </CardTitle>
            <CardDescription>
              You have {pendingReviews.length} review{pendingReviews.length !== 1 ? "s" : ""} awaiting your self-assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReviews.map((review) => (
              <Card key={review.id} data-testid={`card-pending-review-${review.id}`}>
                <CardContent className="flex justify-between items-center p-4">
                  <div>
                    <p className="font-medium">
                      Review Period: {format(new Date(review.reviewPeriodStart), "MMM dd, yyyy")} - {format(new Date(review.reviewPeriodEnd), "MMM dd, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Status: {getStatusBadge(review.status)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleStartAssessment(review)}
                    data-testid={`button-start-assessment-${review.id}`}
                  >
                    {review.selfAssessment ? "Continue Assessment" : "Start Assessment"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="all" data-testid="tab-all-reviews">All</TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft">Draft</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
        </TabsList>

        {["all", "draft", "pending", "completed"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-6">
            {filterReviewsByStatus(status === "all" ? undefined : status).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reviews found in this category</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterReviewsByStatus(status === "all" ? undefined : status).map((review) => (
                  <Card key={review.id} data-testid={`card-review-${review.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <CardTitle className="text-lg">
                            Review Period: {format(new Date(review.reviewPeriodStart), "MMM dd, yyyy")} - {format(new Date(review.reviewPeriodEnd), "MMM dd, yyyy")}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(review.status)}
                            {review.selfAssessment && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Self-Assessed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleStartAssessment(review)}
                          data-testid={`button-view-assessment-${review.id}`}
                        >
                          {review.selfAssessment ? "Edit Assessment" : "Start Assessment"}
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
