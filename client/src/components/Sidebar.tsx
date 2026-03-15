import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Building2, 
  Calendar, 
  CheckCircle,
  DollarSign, 
  TrendingUp, 
  FileText, 
  FolderOpen,
  User,
  CalendarCheck,
  Receipt,
  BarChart3,
  X,
  Settings,
  Target,
  Briefcase,
  UserPlus,
  Video,
  Shield,
  KeyRound,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Building,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

// Navigation sections with collapsible groups
const attendanceNavigation = [
  { name: 'Clock In/Out', href: '/attendance', icon: Clock, testId: 'link-attendance' },
  { name: 'Timesheets', href: '/timesheets', icon: FileText, testId: 'link-timesheets' },
  { name: 'Calendar View', href: '/attendance/calendar', icon: Calendar, testId: 'link-attendance-calendar' },
];

const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3, testId: 'link-dashboard' },
  { name: 'Employee Management', href: '/employees', icon: Users, testId: 'link-employees' },
  { name: 'Departments', href: '/departments', icon: Building2, testId: 'link-departments' },
  { name: 'Positions', href: '/positions', icon: Briefcase, testId: 'link-positions' },
];

const leaveNavigation = [
  { name: 'Request Leave', href: '/leave/request', icon: Calendar, testId: 'link-leave-request' },
  { name: 'Leave Approvals', href: '/leave/approvals', icon: CheckCircle, testId: 'link-leave-approvals' },
];

const financialNavigation = [
  { name: 'Payroll', href: '/payroll', icon: DollarSign, testId: 'link-payroll' },
];

const performanceNavigation = [
  { name: 'Performance', href: '/performance', icon: TrendingUp, testId: 'link-performance' },
  { name: 'Goals', href: '/performance/goals', icon: Target, testId: 'link-goals' },
];

const recruitmentNavigation = [
  { name: 'Job Postings', href: '/recruitment/jobs', icon: Briefcase, testId: 'link-job-postings' },
  { name: 'Applications', href: '/recruitment/applications', icon: UserPlus, testId: 'link-applications' },
  { name: 'Interviews', href: '/recruitment/interviews', icon: Video, testId: 'link-interviews' },
];

const reportsNavigation = [
  { name: 'Reports & Analytics', href: '/reports', icon: FileText, testId: 'link-reports' },
  { name: 'Document Management', href: '/documents', icon: FolderOpen, testId: 'link-documents' },
];

const settingsNavigation = [
  { name: 'Leave Types', href: '/leave/types', icon: Settings, testId: 'link-leave-types' },
];

const adminNavigation = [
  { name: 'Company Configuration', href: '/admin/company-config', icon: Building, testId: 'link-company-config' },
  { name: 'User Management', href: '/admin/users', icon: Shield, testId: 'link-user-management' },
  { name: 'Role Permissions', href: '/admin/permissions', icon: KeyRound, testId: 'link-permissions' },
];

const selfServiceNavigation = [
  { name: 'My Profile', href: '/my-profile', icon: User, testId: 'link-profile' },
  { name: 'My Performance', href: '/performance/my-performance', icon: TrendingUp, testId: 'link-my-performance' },
  { name: 'My Leave Requests', href: '/leave/my-requests', icon: CalendarCheck, testId: 'link-my-leave' },
  { name: 'My Payslips', href: '/my-payslips', icon: Receipt, testId: 'link-payslips' },
  { name: 'Self-Assessment', href: '/performance/self-assessment', icon: FileText, testId: 'link-self-assessment' },
];

interface NavSectionProps {
  title: string;
  items: Array<{ name: string; href: string; icon: any; testId: string }>;
  defaultOpen?: boolean;
  location: string;
  isMobile: boolean;
  onClose?: () => void;
}

function NavSection({ title, items, defaultOpen = true, location, isMobile, onClose }: NavSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasActiveItem = items.some(item => location === item.href);

  // Auto-expand if any item in this section is active
  useEffect(() => {
    if (hasActiveItem && !isOpen) {
      setIsOpen(true);
    }
  }, [hasActiveItem, isOpen]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors",
          "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
          "hover:text-foreground hover:bg-muted/50 cursor-pointer"
        )}>
          <span>{title}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 mt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ml-2",
                  isActive 
                    ? "text-primary bg-primary/10 border border-primary/20" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={isMobile ? onClose : undefined}
                data-testid={item.testId}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isHR = user?.role === 'hr' || isAdmin;
  const isManager = user?.role === 'manager' || isHR;
  
  // Debug: Log user role in development
  if (process.env.NODE_ENV === 'development' && user) {
    console.log('[Sidebar] Current user role:', user.role, 'isAdmin:', isAdmin);
  }

  return (
    <>
      <aside 
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border shadow-sm transition-transform duration-300 z-40",
          isOpen || !isMobile ? "translate-x-0" : "-translate-x-full",
          !isMobile && "lg:translate-x-0"
        )}
        data-testid="sidebar"
      >
        <nav className="p-4 space-y-4 overflow-y-auto h-full">
          {isMobile && (
            <div className="flex justify-end mb-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onClose}
                data-testid="button-close-sidebar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Main Navigation */}
          <NavSection
            title="Main"
            items={mainNavigation}
            defaultOpen={true}
            location={location}
            isMobile={isMobile}
            onClose={onClose}
          />

          {/* Attendance */}
          <NavSection
            title="Attendance"
            items={attendanceNavigation}
            defaultOpen={false}
            location={location}
            isMobile={isMobile}
            onClose={onClose}
          />

          {/* Leave Management */}
          {(isManager || isHR) && (
            <NavSection
              title="Leave Management"
              items={leaveNavigation}
              defaultOpen={false}
              location={location}
              isMobile={isMobile}
              onClose={onClose}
            />
          )}

          {/* Financial */}
          {isHR && (
            <NavSection
              title="Financial"
              items={financialNavigation}
              defaultOpen={false}
              location={location}
              isMobile={isMobile}
              onClose={onClose}
            />
          )}

          {/* Performance */}
          <NavSection
            title="Performance"
            items={performanceNavigation}
            defaultOpen={false}
            location={location}
            isMobile={isMobile}
            onClose={onClose}
          />

          {/* Recruitment */}
          {isHR && (
            <NavSection
              title="Recruitment"
              items={recruitmentNavigation}
              defaultOpen={false}
              location={location}
              isMobile={isMobile}
              onClose={onClose}
            />
          )}

          {/* Reports & Documents */}
          {isHR && (
            <NavSection
              title="Reports & Documents"
              items={[
                ...reportsNavigation,
                { name: 'Attendance Reports', href: '/attendance/reports', icon: BarChart3, testId: 'link-attendance-reports' },
              ]}
              defaultOpen={false}
              location={location}
              isMobile={isMobile}
              onClose={onClose}
            />
          )}

          {/* Administration */}
          {isAdmin && (
            <NavSection
              title="Administration"
              items={adminNavigation}
              defaultOpen={false}
              location={location}
              isMobile={isMobile}
              onClose={onClose}
            />
          )}

          {/* Settings */}
          {isHR && (
            <NavSection
              title="Settings"
              items={settingsNavigation}
              defaultOpen={false}
              location={location}
              isMobile={isMobile}
              onClose={onClose}
            />
          )}

          {/* Employee Self-Service */}
          <NavSection
            title="My Account"
            items={selfServiceNavigation}
            defaultOpen={false}
            location={location}
            isMobile={isMobile}
            onClose={onClose}
          />

          {/* Logout */}
          <div className="pt-4 border-t border-border">
            <a 
              href="/api/logout"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              data-testid="link-logout"
            >
              <span>Logout</span>
            </a>
          </div>
        </nav>
      </aside>
    </>
  );
}
