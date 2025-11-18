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
import { insertApplicationSchema } from "@shared/schema";
import { Plus, Mail, Phone, FileText, Star, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Application, JobPosting } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Applications() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ['/api/recruitment/applications', { status: statusFilter === "all" ? undefined : statusFilter }],
  });

  const { data: jobPostings } = useQuery<JobPosting[]>({
    queryKey: ['/api/recruitment/jobs'],
  });

  const form = useForm({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      jobPostingId: "",
      candidateName: "",
      candidateEmail: "",
      candidatePhone: "",
      resumeUrl: "",
      coverLetter: "",
      linkedinUrl: "",
      portfolioUrl: "",
      yearsOfExperience: 0,
      currentCompany: "",
      currentPosition: "",
      expectedSalary: "",
      noticePeriod: "",
      status: "new",
      rating: 3,
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/recruitment/applications", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Application created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recruitment/applications'] });
      setIsDialogOpen(false);
      form.reset();
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
        description: "Failed to create application.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/recruitment/applications/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Application updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recruitment/applications'] });
      setViewingApplication(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    updateMutation.mutate({
      id: applicationId,
      data: { status: newStatus },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      new: "secondary",
      screening: "default",
      shortlisted: "default",
      interview: "default",
      offer: "default",
      hired: "default",
      rejected: "destructive",
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
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">Manage candidate applications and pipeline</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-application">
          <Plus className="mr-2 h-4 w-4" />
          Add Application
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Applications</CardTitle>
              <CardDescription>View and manage candidate applications</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job Position</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications && applications.length > 0 ? (
                applications.map((app: Application) => (
                  <TableRow key={app.id} data-testid={`row-application-${app.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{app.candidateName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {app.candidateEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {jobPostings?.find((j) => j.id === app.jobPostingId)?.title || "Unknown"}
                    </TableCell>
                    <TableCell>{app.yearsOfExperience || 0} years</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        {app.rating || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Select
                        value={app.status}
                        onValueChange={(value) => handleStatusChange(app.id, value)}
                      >
                        <SelectTrigger className="w-32" data-testid={`select-status-${app.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingApplication(app)}
                        data-testid={`button-view-${app.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No applications found. Applications will appear here as candidates apply.
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
            <DialogTitle>Create Application</DialogTitle>
            <DialogDescription>Add a candidate application manually</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="jobPostingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Position</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-job">
                          <SelectValue placeholder="Select job position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobPostings?.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title}
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
                  name="candidateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidate Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} data-testid="input-candidate-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="candidateEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="candidatePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearsOfExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-experience"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Letter</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Candidate's cover letter..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="input-cover-letter"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-application">
                  Create Application
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {viewingApplication && (
        <Dialog open={!!viewingApplication} onOpenChange={() => setViewingApplication(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>{viewingApplication.candidateName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <p className="text-sm">Email: {viewingApplication.candidateEmail}</p>
                <p className="text-sm">Phone: {viewingApplication.candidatePhone || "Not provided"}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Experience</h4>
                <p className="text-sm">Years: {viewingApplication.yearsOfExperience || 0}</p>
                <p className="text-sm">Current Company: {viewingApplication.currentCompany || "Not provided"}</p>
                <p className="text-sm">Current Position: {viewingApplication.currentPosition || "Not provided"}</p>
              </div>
              {viewingApplication.coverLetter && (
                <div>
                  <h4 className="font-semibold mb-2">Cover Letter</h4>
                  <p className="text-sm whitespace-pre-wrap">{viewingApplication.coverLetter}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
