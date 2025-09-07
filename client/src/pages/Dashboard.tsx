import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Calendar, 
  Star, 
  Building2,
  UserPlus,
  CalendarPlus,
  FileText,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  if (statsLoading) {
    return (
      <div className="p-6" data-testid="dashboard-loading">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

  const quickActions = [
    { icon: UserPlus, label: "Add New Employee", color: "text-primary" },
    { icon: CalendarPlus, label: "Process Leave Request", color: "text-accent" },
    { icon: FileText, label: "Run Payroll", color: "text-chart-1" },
    { icon: BarChart3, label: "Generate Report", color: "text-chart-2" },
  ];

  const pendingApprovals = [
    {
      id: 1,
      name: "Michael Brown",
      type: "Leave Request",
      details: "3 days",
      avatar: "/avatars/michael.jpg"
    },
    {
      id: 2,
      name: "Lisa Wang",
      type: "Expense Report",
      details: "$1,250",
      avatar: "/avatars/lisa.jpg"
    },
    {
      id: 3,
      name: "David Rodriguez",
      type: "Overtime Request",
      details: "10 hours",
      avatar: "/avatars/david.jpg"
    },
  ];

  const departmentData = [
    { name: "Engineering", count: 432, percentage: 65, color: "bg-primary" },
    { name: "Sales", count: 298, percentage: 45, color: "bg-accent" },
    { name: "Marketing", count: 156, percentage: 30, color: "bg-chart-1" },
    { name: "Operations", count: 124, percentage: 25, color: "bg-chart-2" },
    { name: "HR", count: 87, percentage: 15, color: "bg-chart-4" },
    { name: "Finance", count: 98, percentage: 20, color: "bg-chart-5" },
  ];

  return (
    <div className="p-6" data-testid="dashboard">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's what's happening in your organization.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-3xl font-bold text-foreground" data-testid="stat-total-employees">
                  {stats?.totalEmployees || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-accent font-medium">+12</span>
              <span className="text-muted-foreground ml-1">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Leave Requests</p>
                <p className="text-3xl font-bold text-foreground" data-testid="stat-leave-requests">
                  {stats?.activeLeaveRequests || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-destructive font-medium">3 urgent</span>
              <span className="text-muted-foreground ml-1">require attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Performance Reviews</p>
                <p className="text-3xl font-bold text-foreground" data-testid="stat-performance-reviews">
                  {stats?.pendingReviews || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-chart-1" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-muted-foreground">Due this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-3xl font-bold text-foreground" data-testid="stat-departments">
                  {stats?.totalDepartments || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-chart-2" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-muted-foreground">Across organization</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button 
                  key={index}
                  variant="outline" 
                  className="w-full justify-start h-12"
                  data-testid={`button-quick-action-${index}`}
                >
                  <Icon className={`w-4 h-4 mr-3 ${action.color}`} />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity - Placeholder for now */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">New employee onboarding process initiated</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Leave request processing completed</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-chart-1/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-4 h-4 text-chart-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Performance review cycle initiated</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-chart-2/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-chart-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">Monthly reports generated successfully</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals & Employee Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Approvals</CardTitle>
              <Badge variant="destructive" className="text-xs">3 urgent</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={approval.avatar} />
                    <AvatarFallback>{approval.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground" data-testid={`text-approval-name-${approval.id}`}>
                      {approval.name}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`text-approval-details-${approval.id}`}>
                      {approval.type} - {approval.details}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="w-8 h-8 bg-accent hover:bg-accent/90"
                    data-testid={`button-approve-${approval.id}`}
                  >
                    <CheckCircle className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="w-8 h-8"
                    data-testid={`button-reject-${approval.id}`}
                  >
                    <XCircle className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary/80">
              View All Approvals
            </Button>
          </CardContent>
        </Card>

        {/* Employee Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {departmentData.map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground" data-testid={`text-department-${index}`}>
                  {dept.name}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-muted rounded-full h-2">
                    <div 
                      className={`${dept.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${dept.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground w-12 text-right" data-testid={`text-department-count-${index}`}>
                    {dept.count}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
