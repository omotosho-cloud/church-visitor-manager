'use client';

import { useAuth } from '@/components/auth-provider';
import ProtectedRoute from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Clock, 
  FileText,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useFollowUpProcessor } from '@/hooks/use-follow-up-processor';
import { getSettings } from '@/lib/db';
import { Settings as SettingsType } from '@/lib/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<SettingsType>({ church_name: 'RCCG Victory Center', theme_color: '#008800', sender_id: 'RCCGVC', automation_enabled: true });

  useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettingsData();
  }, []);

  // Initialize the background queue processor
  useFollowUpProcessor();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Visitors', href: '/dashboard/visitors', icon: Users },
    { name: 'Templates', href: '/dashboard/templates', icon: FileText },
    { name: 'History', href: '/dashboard/history', icon: Clock },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            <div className="p-6 flex items-center gap-3">
              {settings.logo && (
                <img src={settings.logo} alt="Logo" className="h-10 w-10 object-contain" />
              )}
              <div>
                <h1 className="text-xl font-extrabold text-primary tracking-tight">{settings.church_name}</h1>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">Admin Portal</p>
              </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t space-y-2">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase truncate">
                  {user?.email}
                </p>
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:ml-64 flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-background/80 backdrop-blur-md border-b lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex-1 ml-4 lg:ml-0">
               <h2 className="text-lg font-semibold tracking-tight">
                {navItems.find(i => i.href === pathname)?.name || 'Dashboard'}
               </h2>
            </div>
          </header>
          
          <main className="flex-1 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
