import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Users, 
  Building2, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  FolderOpen,
  User,
  CalendarCheck,
  Receipt,
  BarChart3,
  X,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3, testId: 'link-dashboard' },
  { name: 'Employee Management', href: '/employees', icon: Users, testId: 'link-employees' },
  { name: 'Departments', href: '/departments', icon: Building2, testId: 'link-departments' },
  { name: 'Leave Management', href: '/leave', icon: Calendar, testId: 'link-leave' },
  { name: 'Payroll', href: '/payroll', icon: DollarSign, testId: 'link-payroll' },
  { name: 'Performance', href: '/performance', icon: TrendingUp, testId: 'link-performance' },
  { name: 'Reports & Analytics', href: '/reports', icon: FileText, testId: 'link-reports' },
  { name: 'Document Management', href: '/documents', icon: FolderOpen, testId: 'link-documents' },
];

const settingsNavigation = [
  { name: 'Leave Types', href: '/leave/types', icon: Settings, testId: 'link-leave-types' },
];

const selfServiceNavigation = [
  { name: 'My Profile', href: '/my-profile', icon: User, testId: 'link-profile' },
  { name: 'My Leave Requests', href: '/my-leave', icon: CalendarCheck, testId: 'link-my-leave' },
  { name: 'My Payslips', href: '/my-payslips', icon: Receipt, testId: 'link-payslips' },
];

export function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();

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
        <nav className="p-4 space-y-2">
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

          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <a 
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive 
                      ? "text-primary bg-primary/10 border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  onClick={isMobile ? onClose : undefined}
                  data-testid={item.testId}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </a>
              </Link>
            );
          })}
          
          {/* Settings Section */}
          <div className="pt-4 border-t border-border">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Settings
            </p>
            
            {settingsNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.name} href={item.href}>
                  <a 
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                      isActive 
                        ? "text-primary bg-primary/10 border border-primary/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={isMobile ? onClose : undefined}
                    data-testid={item.testId}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
          </div>
          
          {/* Self Service Section */}
          <div className="pt-4 border-t border-border">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Employee Self-Service
            </p>
            
            {selfServiceNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.name} href={item.href}>
                  <a 
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                      isActive 
                        ? "text-primary bg-primary/10 border border-primary/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                    onClick={isMobile ? onClose : undefined}
                    data-testid={item.testId}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
          </div>

          {/* Logout Section */}
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
