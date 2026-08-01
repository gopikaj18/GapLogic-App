'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/SessionContext';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  PlusSquare,
  Timer,
  BarChart3,
  ShieldCheck,
  Coins,
  BookOpen,
  Activity,
  CalendarDays,
  LogOut,
  Newspaper,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';

const desktopNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Modeler', href: '/modeler', icon: PlusSquare },
  { name: 'Focus', href: '/sync', icon: Timer },
  { name: 'Recovery', href: '/recovery', icon: Activity },
  { name: 'Integrity', href: '/integrity', icon: ShieldCheck },
  { name: 'Trust Bank', href: '/trust-bank', icon: Coins },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Weekly Review', href: '/weekly-review', icon: CalendarDays },
  { name: 'Analysis', href: '/insights', icon: BarChart3 },
  { name: 'Content', href: '/content', icon: Newspaper },
];

const mobileNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Modeler', href: '/modeler', icon: PlusSquare },
  { name: 'Trust Bank', href: '/trust-bank', icon: Coins },
  { name: 'Focus', href: '/sync', icon: Timer },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');

    // Detect if we are in the mobile WebView wrapper
    const webViewDetected = typeof window !== 'undefined' && 
      (navigator.userAgent.includes('GapLogicAndroid') || 
       navigator.userAgent.includes('GapLogicMobile') || 
       (window as any).Android);
    setIsWebView(webViewDetected);
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gaplogic-theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('gaplogic-theme', 'dark');
      setTheme('dark');
    }
  };

  // 1. MOBILE WEBVIEW LAYOUT: Drawer & Header
  if (isWebView) {
    return (
      <>
        {/* Mobile Header (sits below status bar via safe area padding) */}
        <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b flex items-center justify-between px-4 pt-[env(safe-area-inset-top,0px)] h-[calc(env(safe-area-inset-top,0px)+60px)] shadow-md">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-secondary active:scale-95 duration-150 rounded-xl"
            aria-label="Open navigation drawer"
          >
            {/* Hamburger menu icon */}
            <span className="text-2xl font-normal select-none">☰</span>
          </button>

          <span className="text-base font-bold text-foreground tracking-wide truncate max-w-[200px]">
            {user ? user.name : 'GapLogic'}
          </span>

          <div className="w-10 h-10 flex items-center justify-center">
            <NotificationBell />
          </div>
        </header>

        {/* Left Drawer Overlay & Panel */}
        <div className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300",
          isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          {/* Dimmed Overlay */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className={cn(
            "absolute top-0 bottom-0 left-0 w-72 bg-card border-r border-border p-6 pt-[calc(env(safe-area-inset-top,0px)+20px)] flex flex-col transition-transform duration-300 ease-in-out shadow-2xl",
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            {/* Drawer Header */}
            <div className="flex items-center gap-3 mb-8 px-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">GapLogic</span>
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-98 duration-100",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Bottom Actions with Divider */}
            <div className="pt-4 border-t border-border mt-4 flex flex-col gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 py-3 h-auto text-sm font-semibold text-muted-foreground hover:bg-secondary rounded-xl"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Button>

              {user && (
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 py-3 h-auto text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-destructive rounded-xl"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    logout();
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  Sign out
                </Button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // 2. STANDARD WEB APPLICATION LAYOUT: Desktop Sidebar & Bottom Mobile Bar
  return (
    <>
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-card z-50 p-6 flex-col overflow-y-auto scrollbar-none">
        <div className="flex items-center gap-3 mb-8 px-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">GapLogic</span>
        </div>

        <div className="flex-1 space-y-1">
          {user && (
            <p className="px-3 mb-4 text-xs text-muted-foreground truncate">
              {user.name}
            </p>
          )}
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="pt-4 border-t border-border mt-4 flex flex-col gap-1.5 flex-shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:bg-secondary"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>

          {user && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:bg-secondary hover:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </Button>
          )}
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-card/85 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl z-50 flex items-center justify-around px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all active:scale-95 duration-150",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
            </Link>
          );
        })}
        
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all active:scale-95 duration-150 text-muted-foreground"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          <span className="text-[10px] font-bold uppercase tracking-wider">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {user && (
          <button
            onClick={() => logout()}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all active:scale-95 duration-150 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Logout</span>
          </button>
        )}
      </nav>
    </>
  );
}

