import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, X, Building2, Users, Calendar, DollarSign, FileText, Briefcase, UserCheck } from "lucide-react";

interface Permission {
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface RolePermissions {
  role: string;
  description: string;
  permissions: Permission[];
}

const rolePermissions: RolePermissions[] = [
  {
    role: "Admin",
    description: "Full system access with all permissions",
    permissions: [
      { name: "User Management", description: "Create, edit, and delete users", icon: <Shield className="h-4 w-4" /> },
      { name: "Add Departments", description: "Create new departments", icon: <Building2 className="h-4 w-4" /> },
      { name: "Edit Departments", description: "Modify existing departments", icon: <Building2 className="h-4 w-4" /> },
      { name: "Delete Departments", description: "Remove departments", icon: <Building2 className="h-4 w-4" /> },
      { name: "Manage Employees", description: "Create, edit, and delete employee records", icon: <Users className="h-4 w-4" /> },
      { name: "Manage Positions", description: "Create and manage job positions", icon: <Briefcase className="h-4 w-4" /> },
      { name: "Manage Leave Types", description: "Configure leave types and policies", icon: <Calendar className="h-4 w-4" /> },
      { name: "Approve Leave Requests", description: "Approve or reject leave requests", icon: <UserCheck className="h-4 w-4" /> },
      { name: "Manage Payroll", description: "View and manage payroll records", icon: <DollarSign className="h-4 w-4" /> },
      { name: "Manage Documents", description: "Upload and manage company documents", icon: <FileText className="h-4 w-4" /> },
      { name: "Manage Job Postings", description: "Create and manage job postings", icon: <Briefcase className="h-4 w-4" /> },
      { name: "View Reports", description: "Access all system reports", icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    role: "HR",
    description: "Human Resources management with department and employee management",
    permissions: [
      { name: "Add Departments", description: "Create new departments", icon: <Building2 className="h-4 w-4" /> },
      { name: "Edit Departments", description: "Modify existing departments", icon: <Building2 className="h-4 w-4" /> },
      { name: "Manage Employees", description: "Create, edit, and delete employee records", icon: <Users className="h-4 w-4" /> },
      { name: "Manage Positions", description: "Create and manage job positions", icon: <Briefcase className="h-4 w-4" /> },
      { name: "Manage Leave Types", description: "Configure leave types and policies", icon: <Calendar className="h-4 w-4" /> },
      { name: "Approve Leave Requests", description: "Approve or reject leave requests", icon: <UserCheck className="h-4 w-4" /> },
      { name: "Manage Payroll", description: "View and manage payroll records", icon: <DollarSign className="h-4 w-4" /> },
      { name: "Manage Documents", description: "Upload and manage company documents", icon: <FileText className="h-4 w-4" /> },
      { name: "Manage Job Postings", description: "Create and manage job postings", icon: <Briefcase className="h-4 w-4" /> },
      { name: "View Reports", description: "Access HR-related reports", icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    role: "Manager",
    description: "Team management with approval capabilities",
    permissions: [
      { name: "View Departments", description: "View all departments", icon: <Building2 className="h-4 w-4" /> },
      { name: "View Employees", description: "View employee information", icon: <Users className="h-4 w-4" /> },
      { name: "Approve Leave Requests", description: "Approve or reject leave requests for team members", icon: <UserCheck className="h-4 w-4" /> },
      { name: "View Payroll", description: "View payroll records for team members", icon: <DollarSign className="h-4 w-4" /> },
      { name: "View Documents", description: "Access company documents", icon: <FileText className="h-4 w-4" /> },
      { name: "View Reports", description: "Access team-related reports", icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    role: "Employee",
    description: "Basic employee access with self-service capabilities",
    permissions: [
      { name: "View Departments", description: "View all departments", icon: <Building2 className="h-4 w-4" /> },
      { name: "View Own Profile", description: "View and edit own profile information", icon: <Users className="h-4 w-4" /> },
      { name: "Create Leave Requests", description: "Submit leave requests", icon: <Calendar className="h-4 w-4" /> },
      { name: "View Own Payroll", description: "View own payroll records", icon: <DollarSign className="h-4 w-4" /> },
      { name: "View Documents", description: "Access company documents", icon: <FileText className="h-4 w-4" /> },
    ],
  },
];

const getRoleBadgeColor = (role: string) => {
  switch (role.toLowerCase()) {
    case "admin":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    case "hr":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "manager":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
    case "employee":
      return "bg-green-500/10 text-green-700 dark:text-green-400";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  }
};

export default function Permissions() {
  return (
    <div className="p-6" data-testid="permissions-page">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Role Permissions</h1>
        </div>
        <p className="text-muted-foreground">
          View what each role can do in the system. To grant permissions, assign users the appropriate role in User Management.
        </p>
      </div>

      <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Building2 className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Adding Departments</h3>
            <p className="text-sm text-muted-foreground">
              To grant a user the right to add departments, assign them the <strong>HR</strong> or <strong>Admin</strong> role in the User Management page.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {rolePermissions.map((roleData) => (
          <Card key={roleData.role}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor(roleData.role)}>
                      {roleData.role}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {roleData.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roleData.permissions.map((permission, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="text-primary mt-0.5">{permission.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <h4 className="font-medium text-sm">{permission.name}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Grant Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Go to the <strong>User Management</strong> page (Admin only)</li>
            <li>Find the user you want to grant permissions to</li>
            <li>Click the <strong>Edit</strong> button for that user</li>
            <li>Change their <strong>Role</strong> to the appropriate role (HR, Manager, etc.)</li>
            <li>Click <strong>Save</strong> to apply the changes</li>
            <li>The user will need to log out and log back in for the changes to take effect</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

