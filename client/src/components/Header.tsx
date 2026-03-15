import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Menu, Search, Users, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = () => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <header className="bg-card border-b border-border fixed top-0 left-0 right-0 z-50 shadow-sm" data-testid="header">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={onMenuClick}
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">PeoplePilot</h1>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              type="text" 
              placeholder="Search employees, departments..." 
              className="w-full pl-10 bg-muted"
              data-testid="input-search"
            />
          </div>
        </div>
        
        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-3 cursor-pointer rounded-lg py-1.5 pr-2 pl-2 hover:bg-muted/80 transition-colors">
                <div className="hidden sm:block text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-sm font-medium text-foreground" data-testid="text-username">
                      {user ? `${user.firstName || user.username} ${user.lastName || ''}`.trim() || user.username : 'Loading...'}
                    </p>
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-medium text-[10px] uppercase tracking-wide px-1.5 py-0">
                      {user?.role === 'admin' ? 'Admin' : 
                       user?.role === 'hr' ? 'HR' :
                       user?.role === 'manager' ? 'Manager' : 'Employee'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground" data-testid="text-userrole">
                    {user?.role === 'admin' ? 'Administrator' : 
                     user?.role === 'hr' ? 'HR Manager' :
                     user?.role === 'manager' ? 'Manager' : 'Employee'}
                  </p>
                </div>
                
                <Avatar className="w-9 h-9 border border-border" data-testid="img-avatar">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt="User avatar" />
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm">{getUserInitials()}</AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
