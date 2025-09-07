import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { insertDocumentSchema } from "@shared/schema";
import { 
  Plus, 
  FolderOpen, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Upload,
  Search,
  Filter,
  Shield,
  File
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Document, Employee } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Documents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents', { category: categoryFilter }],
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/employees'],
  });

  const form = useForm({
    resolver: zodResolver(insertDocumentSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      isConfidential: false,
      filePath: "",
      fileType: "",
      fileSize: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/documents", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setIsDialogOpen(false);
      setSelectedFile(null);
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
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
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
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const documentCategories = [
    { value: "contract", label: "Contracts", icon: FileText, color: "bg-primary/10 text-primary" },
    { value: "policy", label: "Policies", icon: Shield, color: "bg-accent/10 text-accent" },
    { value: "personal", label: "Personal", icon: File, color: "bg-chart-1/10 text-chart-1" },
    { value: "payroll", label: "Payroll", icon: FileText, color: "bg-chart-2/10 text-chart-2" },
    { value: "performance", label: "Performance", icon: FileText, color: "bg-chart-4/10 text-chart-4" },
  ];

  const getCategoryBadge = (category: string) => {
    const categoryInfo = documentCategories.find(cat => cat.value === category);
    if (!categoryInfo) return <Badge variant="outline">{category}</Badge>;

    return (
      <Badge className={`${categoryInfo.color.replace('text-', 'text-').replace('bg-', 'bg-')}`}>
        {categoryInfo.label}
      </Badge>
    );
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "System";
    const employee = employees?.find((emp: Employee) => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue("name", file.name);
      form.setValue("fileType", file.type);
      form.setValue("fileSize", file.size);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: any) => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, you would upload the file to storage first
    // For now, we'll simulate with a placeholder path
    const documentData = {
      ...data,
      filePath: `/documents/${selectedFile.name}`,
      uploadedBy: user?.employee?.id || null,
    };

    createMutation.mutate(documentData);
  };

  const filteredDocuments = documents?.filter((doc: Document) => {
    const matchesCategory = !categoryFilter || doc.category === categoryFilter;
    const matchesSearch = !searchTerm || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (documentsLoading) {
    return (
      <div className="p-6" data-testid="documents-loading">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" data-testid="documents-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Document Management</h2>
          <p className="text-muted-foreground">Manage HR documents, policies, and employee files securely.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0" data-testid="button-upload-document">
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-document-form">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
              <DialogDescription>Upload a new document to the HR system</DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">File</label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedFile ? selectedFile.name : "Click to select a file or drag and drop"}
                    </p>
                    <Input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      data-testid="input-file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      data-testid="button-select-file"
                    >
                      Select File
                    </Button>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter document name" {...field} data-testid="input-document-name" />
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
                          placeholder="Document description..." 
                          {...field} 
                          data-testid="textarea-document-description" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-document-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documentCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
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
                  name="isConfidential"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Confidential Document</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Mark this document as confidential to restrict access
                        </p>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-border focus:ring-ring"
                          data-testid="checkbox-confidential"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-document"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-save-document"
                  >
                    Upload Document
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {documentCategories.map((category, index) => {
          const Icon = category.icon;
          const categoryCount = documents?.filter((doc: Document) => doc.category === category.value).length || 0;
          
          return (
            <Card 
              key={index} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setCategoryFilter(category.value)}
              data-testid={`card-category-${category.value}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{category.label}</h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-category-count-${category.value}`}>
                      {categoryCount} documents
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Search Documents</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  type="text" 
                  placeholder="Search by name or description..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-documents"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {documentCategories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("");
                }}
                data-testid="button-clear-filters"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle data-testid="text-documents-count">
              Documents ({filteredDocuments?.length || 0})
            </CardTitle>
            <Button variant="ghost" size="icon" data-testid="button-export-documents">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments?.map((document: Document) => (
                <TableRow key={document.id} data-testid={`row-document-${document.id}`}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground" data-testid={`text-document-name-${document.id}`}>
                          {document.name}
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-document-description-${document.id}`}>
                          {document.description || "No description"}
                        </div>
                      </div>
                      {document.isConfidential && (
                        <Badge variant="destructive" className="ml-2">
                          <Shield className="w-3 h-3 mr-1" />
                          Confidential
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getCategoryBadge(document.category)}
                  </TableCell>
                  <TableCell data-testid={`text-document-size-${document.id}`}>
                    {document.fileSize ? formatFileSize(document.fileSize) : "N/A"}
                  </TableCell>
                  <TableCell data-testid={`text-document-uploader-${document.id}`}>
                    {getEmployeeName(document.uploadedBy)}
                  </TableCell>
                  <TableCell data-testid={`text-document-date-${document.id}`}>
                    {new Date(document.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        data-testid={`button-view-${document.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        data-testid={`button-download-${document.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(document.id)}
                        className="text-destructive hover:text-destructive/80"
                        data-testid={`button-delete-${document.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredDocuments?.length === 0 && (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground" data-testid="text-no-documents">
                {searchTerm || categoryFilter ? "No documents match your filters" : "No documents uploaded yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
