import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDepartments } from "@/hooks/use-departments";
import { insertCompanySchema, insertDepartmentSchema, insertPositionSchema, insertTeamSchema, insertSubTeamSchema } from "@shared/schema";
import { 
  Settings, 
  Building2, 
  Briefcase, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  DollarSign,
  UserCheck
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Company, Department, Position, Team, SubTeam, Employee } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function CompanyConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("company");

  // Company form
  const companyForm = useForm({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      legalName: "",
      registrationNumber: "",
      taxId: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      phone: "",
      email: "",
      website: "",
      logoUrl: "",
    },
  });

  // Department form
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const deptForm = useForm({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: "",
      description: "",
      managerId: "",
      budget: "",
    },
  });

  // Position form
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const positionForm = useForm({
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

  // Team form
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const teamForm = useForm({
    resolver: zodResolver(insertTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      departmentId: "",
      teamLeadId: "",
    },
  });

  // Sub-team form
  const [isSubTeamDialogOpen, setIsSubTeamDialogOpen] = useState(false);
  const [editingSubTeam, setEditingSubTeam] = useState<SubTeam | null>(null);
  const subTeamForm = useForm({
    resolver: zodResolver(insertSubTeamSchema),
    defaultValues: {
      name: "",
      description: "",
      teamId: "",
      subTeamLeadId: "",
    },
  });

  // Data queries
  const { data: company, isLoading: companyLoading } = useQuery<Company | null>({
    queryKey: ['/api/company'],
  });

  const { data: departments } = useDepartments();

  const { data: positions } = useQuery<Position[]>({
    queryKey: ['/api/positions'],
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  const { data: subTeams } = useQuery<SubTeam[]>({
    queryKey: ['/api/sub-teams'],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
  });

  // Company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/company", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/company'] });
      toast({
        title: "Success",
        description: "Company information updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update company information.",
        variant: "destructive",
      });
    },
  });

  // Department mutations
  const createDeptMutation = useMutation({
    mutationFn: async (data: any) => {
      const cleanedData = {
        ...data,
        managerId: data.managerId && data.managerId.trim() !== '' ? data.managerId : null,
        description: data.description && data.description.trim() !== '' ? data.description : null,
        budget: data.budget && data.budget.trim() !== '' ? data.budget : null,
      };
      return await apiRequest("POST", "/api/departments", cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsDeptDialogOpen(false);
      deptForm.reset();
      toast({ title: "Success", description: "Department created successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create department.",
        variant: "destructive",
      });
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const cleanedData = {
        ...data,
        managerId: data.managerId && data.managerId.trim() !== '' ? data.managerId : null,
        description: data.description && data.description.trim() !== '' ? data.description : null,
        budget: data.budget && data.budget.trim() !== '' ? data.budget : null,
      };
      return await apiRequest("PUT", `/api/departments/${id}`, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      setIsDeptDialogOpen(false);
      setEditingDepartment(null);
      deptForm.reset();
      toast({ title: "Success", description: "Department updated successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update department.",
        variant: "destructive",
      });
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/departments/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments'] });
      toast({ title: "Success", description: "Department deleted successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete department.",
        variant: "destructive",
      });
    },
  });

  // Position mutations
  const createPositionMutation = useMutation({
    mutationFn: async (data: any) => {
      const cleanedData = {
        ...data,
        departmentId: data.departmentId && data.departmentId.trim() !== '' ? data.departmentId : null,
        description: data.description && data.description.trim() !== '' ? data.description : null,
        minSalary: data.minSalary && data.minSalary.trim() !== '' ? data.minSalary : null,
        maxSalary: data.maxSalary && data.maxSalary.trim() !== '' ? data.maxSalary : null,
        requirements: data.requirements && data.requirements.trim() !== '' ? data.requirements : null,
      };
      return await apiRequest("POST", "/api/positions", cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      setIsPositionDialogOpen(false);
      positionForm.reset();
      toast({ title: "Success", description: "Position created successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create position.",
        variant: "destructive",
      });
    },
  });

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const cleanedData = {
        ...data,
        departmentId: data.departmentId && data.departmentId.trim() !== '' ? data.departmentId : null,
        description: data.description && data.description.trim() !== '' ? data.description : null,
        minSalary: data.minSalary && data.minSalary.trim() !== '' ? data.minSalary : null,
        maxSalary: data.maxSalary && data.maxSalary.trim() !== '' ? data.maxSalary : null,
        requirements: data.requirements && data.requirements.trim() !== '' ? data.requirements : null,
      };
      return await apiRequest("PUT", `/api/positions/${id}`, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      setIsPositionDialogOpen(false);
      setEditingPosition(null);
      positionForm.reset();
      toast({ title: "Success", description: "Position updated successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update position.",
        variant: "destructive",
      });
    },
  });

  const deletePositionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/positions/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      toast({ title: "Success", description: "Position deleted successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete position.",
        variant: "destructive",
      });
    },
  });

  // Team mutations
  const createTeamMutation = useMutation({
    mutationFn: async (data: any) => {
      const cleanedData = {
        ...data,
        departmentId: data.departmentId && data.departmentId.trim() !== '' ? data.departmentId : null,
        description: data.description && data.description.trim() !== '' ? data.description : null,
        teamLeadId: data.teamLeadId && data.teamLeadId.trim() !== '' ? data.teamLeadId : null,
      };
      return await apiRequest("POST", "/api/teams", cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setIsTeamDialogOpen(false);
      teamForm.reset();
      toast({ title: "Success", description: "Team created successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team.",
        variant: "destructive",
      });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const cleanedData = {
        ...data,
        departmentId: data.departmentId && data.departmentId.trim() !== '' ? data.departmentId : null,
        description: data.description && data.description.trim() !== '' ? data.description : null,
        teamLeadId: data.teamLeadId && data.teamLeadId.trim() !== '' ? data.teamLeadId : null,
      };
      return await apiRequest("PUT", `/api/teams/${id}`, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      setIsTeamDialogOpen(false);
      setEditingTeam(null);
      teamForm.reset();
      toast({ title: "Success", description: "Team updated successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team.",
        variant: "destructive",
      });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/teams/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      toast({ title: "Success", description: "Team deleted successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team.",
        variant: "destructive",
      });
    },
  });

  // Sub-team mutations
  const createSubTeamMutation = useMutation({
    mutationFn: async (data: any) => {
      const cleanedData = {
        ...data,
        description: data.description && data.description.trim() !== '' ? data.description : null,
        subTeamLeadId: data.subTeamLeadId && data.subTeamLeadId.trim() !== '' ? data.subTeamLeadId : null,
      };
      return await apiRequest("POST", "/api/sub-teams", cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sub-teams'] });
      setIsSubTeamDialogOpen(false);
      subTeamForm.reset();
      toast({ title: "Success", description: "Sub-team created successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create sub-team.",
        variant: "destructive",
      });
    },
  });

  const updateSubTeamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const cleanedData = {
        ...data,
        description: data.description && data.description.trim() !== '' ? data.description : null,
        subTeamLeadId: data.subTeamLeadId && data.subTeamLeadId.trim() !== '' ? data.subTeamLeadId : null,
      };
      return await apiRequest("PUT", `/api/sub-teams/${id}`, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sub-teams'] });
      setIsSubTeamDialogOpen(false);
      setEditingSubTeam(null);
      subTeamForm.reset();
      toast({ title: "Success", description: "Sub-team updated successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sub-team.",
        variant: "destructive",
      });
    },
  });

  const deleteSubTeamMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/sub-teams/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sub-teams'] });
      toast({ title: "Success", description: "Sub-team deleted successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sub-team.",
        variant: "destructive",
      });
    },
  });

  // Load company data into form
  if (company && !companyForm.formState.isDirty) {
    companyForm.reset({
      name: company.name || "",
      legalName: company.legalName || "",
      registrationNumber: company.registrationNumber || "",
      taxId: company.taxId || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zipCode: company.zipCode || "",
      country: company.country || "",
      phone: company.phone || "",
      email: company.email || "",
      website: company.website || "",
      logoUrl: company.logoUrl || "",
    });
  }

  // Helper functions
  const getDepartmentName = (id: string | null) => {
    if (!id) return "No Department";
    return departments?.find(d => d.id === id)?.name || "Unknown";
  };

  const getTeamName = (id: string | null) => {
    if (!id) return "No Team";
    return teams?.find(t => t.id === id)?.name || "Unknown";
  };

  const getEmployeeName = (id: string | null) => {
    if (!id) return "None";
    const emp = employees?.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
  };

  const formatSalary = (amount: string | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  // Handlers
  const onCompanySubmit = (data: any) => {
    const cleanedData: any = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      cleanedData[key] = (typeof value === 'string' && value.trim() === '') ? null : value;
    });
    updateCompanyMutation.mutate(cleanedData);
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    deptForm.reset({
      name: dept.name,
      description: dept.description || "",
      managerId: dept.managerId || "",
      budget: dept.budget || "",
    });
    setIsDeptDialogOpen(true);
  };

  const handleEditPosition = (pos: Position) => {
    setEditingPosition(pos);
    positionForm.reset({
      title: pos.title,
      description: pos.description || "",
      departmentId: pos.departmentId || "",
      minSalary: pos.minSalary || "",
      maxSalary: pos.maxSalary || "",
      requirements: pos.requirements || "",
    });
    setIsPositionDialogOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    teamForm.reset({
      name: team.name,
      description: team.description || "",
      departmentId: team.departmentId || "",
      teamLeadId: team.teamLeadId || "",
    });
    setIsTeamDialogOpen(true);
  };

  const handleEditSubTeam = (subTeam: SubTeam) => {
    setEditingSubTeam(subTeam);
    subTeamForm.reset({
      name: subTeam.name,
      description: subTeam.description || "",
      teamId: subTeam.teamId,
      subTeamLeadId: subTeam.subTeamLeadId || "",
    });
    setIsSubTeamDialogOpen(true);
  };

  if (companyLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-9 w-64 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="company-config-page">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Company Configuration</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your company information, departments, positions, teams, and sub-teams
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="sub-teams">Sub-Teams</TabsTrigger>
        </TabsList>

        {/* Company Information Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(onCompanySubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corporation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="legalName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Corporation Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input placeholder="REG-123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID</FormLabel>
                          <FormControl>
                            <Input placeholder="TAX-123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={companyForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 Main Street" rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="USA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={companyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={companyForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={updateCompanyMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {updateCompanyMutation.isPending ? "Saving..." : "Save Company Information"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Departments</CardTitle>
                <CardDescription>Manage organizational departments</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingDepartment(null);
                deptForm.reset();
                setIsDeptDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Department
              </Button>
            </CardHeader>
            <CardContent>
              {departments && departments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="font-medium">{dept.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{dept.description || "-"}</TableCell>
                        <TableCell>{getEmployeeName(dept.managerId)}</TableCell>
                        <TableCell>{dept.budget ? formatSalary(dept.budget) : "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditDepartment(dept)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              if (confirm(`Delete ${dept.name}?`)) {
                                deleteDeptMutation.mutate(dept.id);
                              }
                            }}>
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
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No departments found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Positions Tab */}
        <TabsContent value="positions">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Positions / Titles</CardTitle>
                <CardDescription>Manage job positions and designations</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingPosition(null);
                positionForm.reset();
                setIsPositionDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Position
              </Button>
            </CardHeader>
            <CardContent>
              {positions && positions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Salary Range</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((pos) => (
                      <TableRow key={pos.id}>
                        <TableCell className="font-medium">{pos.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getDepartmentName(pos.departmentId)}</Badge>
                        </TableCell>
                        <TableCell>
                          {pos.minSalary || pos.maxSalary ? (
                            <div className="flex items-center gap-1 text-sm">
                              <DollarSign className="h-3 w-3" />
                              {pos.minSalary && pos.maxSalary
                                ? `${formatSalary(pos.minSalary)} - ${formatSalary(pos.maxSalary)}`
                                : pos.minSalary
                                ? `From ${formatSalary(pos.minSalary)}`
                                : `Up to ${formatSalary(pos.maxSalary)}`}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{pos.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditPosition(pos)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              if (confirm(`Delete ${pos.title}?`)) {
                                deletePositionMutation.mutate(pos.id);
                              }
                            }}>
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
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No positions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Teams</CardTitle>
                <CardDescription>Manage teams within departments</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingTeam(null);
                teamForm.reset();
                setIsTeamDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Team
              </Button>
            </CardHeader>
            <CardContent>
              {teams && teams.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Team Lead</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getDepartmentName(team.departmentId)}</Badge>
                        </TableCell>
                        <TableCell>{getEmployeeName(team.teamLeadId)}</TableCell>
                        <TableCell className="max-w-xs truncate">{team.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditTeam(team)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              if (confirm(`Delete ${team.name}?`)) {
                                deleteTeamMutation.mutate(team.id);
                              }
                            }}>
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
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No teams found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sub-Teams Tab */}
        <TabsContent value="sub-teams">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Sub-Teams</CardTitle>
                <CardDescription>Manage sub-teams within teams</CardDescription>
              </div>
              <Button onClick={() => {
                setEditingSubTeam(null);
                subTeamForm.reset();
                setIsSubTeamDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Add Sub-Team
              </Button>
            </CardHeader>
            <CardContent>
              {subTeams && subTeams.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sub-Team Name</TableHead>
                      <TableHead>Parent Team</TableHead>
                      <TableHead>Sub-Team Lead</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subTeams.map((subTeam) => (
                      <TableRow key={subTeam.id}>
                        <TableCell className="font-medium">{subTeam.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTeamName(subTeam.teamId)}</Badge>
                        </TableCell>
                        <TableCell>{getEmployeeName(subTeam.subTeamLeadId)}</TableCell>
                        <TableCell className="max-w-xs truncate">{subTeam.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditSubTeam(subTeam)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              if (confirm(`Delete ${subTeam.name}?`)) {
                                deleteSubTeamMutation.mutate(subTeam.id);
                              }
                            }}>
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
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No sub-teams found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Department Dialog */}
      <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "Edit Department" : "Create Department"}</DialogTitle>
          </DialogHeader>
          <Form {...deptForm}>
            <form onSubmit={deptForm.handleSubmit((data) => {
              if (editingDepartment) {
                updateDeptMutation.mutate({ id: editingDepartment.id, data });
              } else {
                createDeptMutation.mutate(data);
              }
            })} className="space-y-4">
              <FormField
                control={deptForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={deptForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={deptForm.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager</FormLabel>
                    <Select value={field.value || "all"} onValueChange={(v) => field.onChange(v === "all" ? "" : v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">No Manager</SelectItem>
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
                control={deptForm.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="2000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDeptDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createDeptMutation.isPending || updateDeptMutation.isPending}>
                  {editingDepartment ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Position Dialog */}
      <Dialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPosition ? "Edit Position" : "Create Position"}</DialogTitle>
          </DialogHeader>
          <Form {...positionForm}>
            <form onSubmit={positionForm.handleSubmit((data) => {
              if (editingPosition) {
                updatePositionMutation.mutate({ id: editingPosition.id, data });
              } else {
                createPositionMutation.mutate(data);
              }
            })} className="space-y-4">
              <FormField
                control={positionForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={positionForm.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select value={field.value || "all"} onValueChange={(v) => field.onChange(v === "all" ? "" : v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">No Department</SelectItem>
                        {departments?.map((dept) => (
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
                  control={positionForm.control}
                  name="minSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Salary</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="50000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={positionForm.control}
                  name="maxSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Salary</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="80000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={positionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={positionForm.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsPositionDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPositionMutation.isPending || updatePositionMutation.isPending}>
                  {editingPosition ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Team Dialog */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? "Edit Team" : "Create Team"}</DialogTitle>
          </DialogHeader>
          <Form {...teamForm}>
            <form onSubmit={teamForm.handleSubmit((data) => {
              if (editingTeam) {
                updateTeamMutation.mutate({ id: editingTeam.id, data });
              } else {
                createTeamMutation.mutate(data);
              }
            })} className="space-y-4">
              <FormField
                control={teamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Development Team" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={teamForm.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select value={field.value || "all"} onValueChange={(v) => field.onChange(v === "all" ? "" : v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">No Department</SelectItem>
                        {departments?.map((dept) => (
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
              <FormField
                control={teamForm.control}
                name="teamLeadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Lead</FormLabel>
                    <Select value={field.value || "all"} onValueChange={(v) => field.onChange(v === "all" ? "" : v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">No Team Lead</SelectItem>
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
                control={teamForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTeamDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createTeamMutation.isPending || updateTeamMutation.isPending}>
                  {editingTeam ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Sub-Team Dialog */}
      <Dialog open={isSubTeamDialogOpen} onOpenChange={setIsSubTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubTeam ? "Edit Sub-Team" : "Create Sub-Team"}</DialogTitle>
          </DialogHeader>
          <Form {...subTeamForm}>
            <form onSubmit={subTeamForm.handleSubmit((data) => {
              if (editingSubTeam) {
                updateSubTeamMutation.mutate({ id: editingSubTeam.id, data });
              } else {
                createSubTeamMutation.mutate(data);
              }
            })} className="space-y-4">
              <FormField
                control={subTeamForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-Team Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Frontend Team" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={subTeamForm.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Team *</FormLabel>
                    <Select value={field.value || "all"} onValueChange={(v) => field.onChange(v === "all" ? "" : v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent team" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teams?.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={subTeamForm.control}
                name="subTeamLeadId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sub-Team Lead</FormLabel>
                    <Select value={field.value || "all"} onValueChange={(v) => field.onChange(v === "all" ? "" : v)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sub-team lead" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">No Sub-Team Lead</SelectItem>
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
                control={subTeamForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSubTeamDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createSubTeamMutation.isPending || updateSubTeamMutation.isPending}>
                  {editingSubTeam ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

