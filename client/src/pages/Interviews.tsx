import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertInterviewSchema } from "@shared/schema";
import { Plus, Calendar, Clock, Video, MapPin, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Interview, Application, Employee } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Interviews() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: interviews, isLoading } = useQuery<Interview[]>({
    queryKey: ['/api/recruitment/interviews', { status: statusFilter === "all" ? undefined : statusFilter }],
  });

  const { data: applications } = useQuery<Application[]>({
    queryKey: ['/api/recruitment/applications'],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  const form = useForm({
    resolver: zodResolver(insertInterviewSchema),
    defaultValues: {
      applicationId: "",
      interviewType: "technical",
      scheduledDate: "",
      duration: 60,
      location: "",
      interviewerId: "",
      additionalInterviewers: "",
      status: "scheduled",
      feedback: "",
      technicalRating: 3,
      communicationRating: 3,
      cultureFitRating: 3,
      overallRating: 3,
      recommendation: "",
      notes: "",
      completedAt: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/recruitment/interviews", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Interview scheduled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recruitment/interviews'] });
      setIsDialogOpen(false);
      form.reset();
      setEditingInterview(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to schedule interview.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/recruitment/interviews/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Interview updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recruitment/interviews'] });
      setIsDialogOpen(false);
      form.reset();
      setEditingInterview(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update interview.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (interview: Interview) => {
    setEditingInterview(interview);
    form.reset({
      applicationId: interview.applicationId,
      interviewType: interview.interviewType,
      scheduledDate: interview.scheduledDate ? new Date(interview.scheduledDate).toISOString().slice(0, 16) : "",
      duration: interview.duration || 60,
      location: interview.location || "",
      interviewerId: interview.interviewerId || "",
      additionalInterviewers: interview.additionalInterviewers || "",
      status: interview.status,
      feedback: interview.feedback || "",
      technicalRating: interview.technicalRating || 3,
      communicationRating: interview.communicationRating || 3,
      cultureFitRating: interview.cultureFitRating || 3,
      overallRating: interview.overallRating || 3,
      recommendation: interview.recommendation || "",
      notes: interview.notes || "",
      completedAt: interview.completedAt ? new Date(interview.completedAt).toISOString().slice(0, 16) : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (editingInterview) {
      updateMutation.mutate({ id: editingInterview.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: "secondary",
      completed: "default",
      cancelled: "destructive",
      "no-show": "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
          <p className="text-muted-foreground">Schedule and manage candidate interviews</p>
        </div>
        <Button
          onClick={() => {
            setEditingInterview(null);
            form.reset();
            setIsDialogOpen(true);
          }}
          data-testid="button-create-interview"
        >
          <Plus className="mr-2 h-4 w-4" />
          Schedule Interview
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Interviews</CardTitle>
              <CardDescription>View and manage scheduled interviews</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Overall Rating</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews && interviews.length > 0 ? (
                interviews.map((interview: Interview) => {
                  const application = applications?.find((a) => a.id === interview.applicationId);
                  return (
                    <TableRow key={interview.id} data-testid={`row-interview-${interview.id}`}>
                      <TableCell className="font-medium">
                        {application?.candidateName || "Unknown"}
                      </TableCell>
                      <TableCell>{interview.interviewType}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="mr-1 h-3 w-3" />
                          {interview.scheduledDate
                            ? new Date(interview.scheduledDate).toLocaleString()
                            : "Not scheduled"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {interview.duration || 60} min
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(interview.status)}</TableCell>
                      <TableCell>
                        {interview.overallRating ? (
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            {interview.overallRating}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(interview)}
                          data-testid={`button-edit-${interview.id}`}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No interviews scheduled yet. Create your first interview to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingInterview ? "Edit Interview" : "Schedule Interview"}</DialogTitle>
            <DialogDescription>
              {editingInterview ? "Update interview details" : "Schedule a new candidate interview"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="applicationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-application">
                          <SelectValue placeholder="Select candidate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {applications?.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.candidateName}
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
                name="interviewType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-interview-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-scheduled-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location / Meeting Link</FormLabel>
                    <FormControl>
                      <Input placeholder="Conference Room A or https://zoom.us/j/..." {...field} data-testid="input-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interviewerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interviewer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-interviewer">
                          <SelectValue placeholder="Select interviewer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.map((emp) => (
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no-show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editingInterview && (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="technicalRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Technical (1-5)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-technical-rating"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="communicationRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Communication (1-5)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-communication-rating"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cultureFitRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Culture Fit (1-5)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-culture-fit-rating"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="overallRating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Overall (1-5)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-overall-rating"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="feedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Feedback</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Interview feedback and notes..."
                            className="min-h-[100px]"
                            {...field}
                            data-testid="input-feedback"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recommendation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recommendation</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-recommendation">
                              <SelectValue placeholder="Select recommendation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="strong-hire">Strong Hire</SelectItem>
                            <SelectItem value="hire">Hire</SelectItem>
                            <SelectItem value="maybe">Maybe</SelectItem>
                            <SelectItem value="no-hire">No Hire</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-interview"
                >
                  {editingInterview ? "Update Interview" : "Schedule Interview"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
