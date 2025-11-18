import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Target, TrendingUp, Calendar, Star } from "lucide-react";
import type { PerformanceReview, PerformanceGoal, Employee } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function MyPerformance() {
  const [, setLocation] = useLocation();

  const { data: user } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  const { data: employee } = useQuery<Employee>({
    queryKey: ["/api/employees/by-user", user?.id],
    enabled: !!user?.id,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<PerformanceReview[]>({
    queryKey: ["/api/performance/reviews", employee?.id],
    enabled: !!employee?.id,
  });

  const { data: goals = [], isLoading: goalsLoading } = useQuery<PerformanceGoal[]>({
    queryKey: ["/api/performance/goals", employee?.id],
    enabled: !!employee?.id,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "outline",
      pending: "default",
      completed: "secondary",
      not_started: "outline",
      in_progress: "default",
      missed: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"} data-testid={`badge-status-${status}`}>
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

  const getRatingLabel = (value: number | null): string => {
    if (!value) return "Not Rated";
    const labels: Record<number, string> = {
      1: "Needs Improvement",
      2: "Below Expectations",
      3: "Meets Expectations",
      4: "Exceeds Expectations",
      5: "Outstanding",
    };
    return labels[value] || "Not Rated";
  };

  const calculateGoalStats = () => {
    const total = goals.length;
    const completed = goals.filter((g) => g.status === "completed").length;
    const inProgress = goals.filter((g) => g.status === "in_progress").length;
    const avgProgress = total > 0 
      ? Math.round(goals.reduce((sum, g) => sum + (g.progress ?? 0), 0) / total) 
      : 0;

    return { total, completed, inProgress, avgProgress };
  };

  const stats = calculateGoalStats();
  const latestReview = reviews[0];
  const activeGoals = goals.filter((g) => g.status !== "completed" && g.status !== "missed");

  if (reviewsLoading || goalsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading performance data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Award className="h-10 w-10 text-primary" />
          My Performance
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your performance reviews and goals
        </p>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card data-testid="card-goals-stats">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-goals-count">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} completed • {stats.inProgress} in progress
            </p>
            <Progress value={stats.avgProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.avgProgress}% average progress
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-latest-review">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Review</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestReview ? (
              <>
                <div className="text-2xl font-bold" data-testid="text-latest-review-rating">
                  {latestReview.overallRating ? `${latestReview.overallRating}/5` : "Pending"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(latestReview.reviewPeriodEnd), "MMM yyyy")}
                </p>
                <div className="mt-2">
                  {getStatusBadge(latestReview.status)}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No reviews yet</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-reviews">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-reviews-count">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">
              {reviews.filter((r) => r.status === "completed").length} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="reviews" data-testid="tab-reviews">Performance Reviews</TabsTrigger>
          <TabsTrigger value="goals" data-testid="tab-goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4 mt-6">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No performance reviews yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reviews.map((review) => (
                <Card key={review.id} data-testid={`card-review-${review.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">
                            Review Period: {format(new Date(review.reviewPeriodStart), "MMM dd, yyyy")} - {format(new Date(review.reviewPeriodEnd), "MMM dd, yyyy")}
                          </CardTitle>
                          {getStatusBadge(review.status)}
                        </div>
                        {review.overallRating && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Overall Rating:</span>
                            <span className="text-lg font-bold text-primary" data-testid={`text-review-rating-${review.id}`}>
                              {review.overallRating}/5
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ({getRatingLabel(review.overallRating)})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(review.technicalSkillsRating || review.communicationRating || review.leadershipRating || review.teamworkRating || review.problemSolvingRating) && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Competency Ratings</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {review.technicalSkillsRating && (
                            <div className="text-center p-2 bg-muted rounded-lg">
                              <div className="text-lg font-bold text-primary">{review.technicalSkillsRating}/5</div>
                              <div className="text-xs text-muted-foreground">Technical</div>
                            </div>
                          )}
                          {review.communicationRating && (
                            <div className="text-center p-2 bg-muted rounded-lg">
                              <div className="text-lg font-bold text-primary">{review.communicationRating}/5</div>
                              <div className="text-xs text-muted-foreground">Communication</div>
                            </div>
                          )}
                          {review.leadershipRating && (
                            <div className="text-center p-2 bg-muted rounded-lg">
                              <div className="text-lg font-bold text-primary">{review.leadershipRating}/5</div>
                              <div className="text-xs text-muted-foreground">Leadership</div>
                            </div>
                          )}
                          {review.teamworkRating && (
                            <div className="text-center p-2 bg-muted rounded-lg">
                              <div className="text-lg font-bold text-primary">{review.teamworkRating}/5</div>
                              <div className="text-xs text-muted-foreground">Teamwork</div>
                            </div>
                          )}
                          {review.problemSolvingRating && (
                            <div className="text-center p-2 bg-muted rounded-lg">
                              <div className="text-lg font-bold text-primary">{review.problemSolvingRating}/5</div>
                              <div className="text-xs text-muted-foreground">Problem Solving</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {review.selfAssessment && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">My Self-Assessment</h4>
                        <p className="text-sm text-muted-foreground" data-testid={`text-self-assessment-${review.id}`}>
                          {review.selfAssessment}
                        </p>
                      </div>
                    )}

                    {review.comments && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Manager Comments</h4>
                        <p className="text-sm text-muted-foreground" data-testid={`text-manager-comments-${review.id}`}>
                          {review.comments}
                        </p>
                      </div>
                    )}

                    {review.status === "draft" && (
                      <Button 
                        onClick={() => setLocation("/performance/self-assessment")}
                        data-testid={`button-complete-self-assessment-${review.id}`}
                      >
                        Complete Self-Assessment
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-4 mt-6">
          {goals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No performance goals yet</p>
                <Button onClick={() => setLocation("/performance/goals")} data-testid="button-create-first-goal">
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {goals.map((goal) => (
                <Card key={goal.id} data-testid={`card-goal-${goal.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg" data-testid={`text-goal-title-${goal.id}`}>{goal.title}</CardTitle>
                          {getCategoryBadge(goal.category)}
                          {getStatusBadge(goal.status)}
                        </div>
                        {goal.description && (
                          <CardDescription data-testid={`text-goal-description-${goal.id}`}>{goal.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Target: {goal.targetDate ? format(new Date(goal.targetDate), "MMM dd, yyyy") : "No date set"}
                      </div>
                      <span className="font-semibold" data-testid={`text-goal-progress-${goal.id}`}>
                        {goal.progress ?? 0}% Complete
                      </span>
                    </div>
                    <Progress value={goal.progress ?? 0} className="w-full" />
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-center pt-4">
                <Button onClick={() => setLocation("/performance/goals")} data-testid="button-manage-goals">
                  Manage All Goals
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
