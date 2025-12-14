import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={toggleSidebar} />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
          isMobile={isMobile}
        />
        
        <main 
          className={`flex-1 pt-16 transition-all duration-300 ${
            !isMobile ? 'lg:ml-64' : ''
          } ${!isMobile && sidebarOpen ? 'ml-64' : 'ml-0'}`}
          data-testid="main-content"
        >
          {children}
        </main>
      </div>
      
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={closeSidebar}
          data-testid="sidebar-overlay"
        />
      )}
    </div>
  );
}
