'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from '@/lib/SessionContext';
import {
  LayoutDashboard,
  PlusSquare,
  Timer,
  BarChart3,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Modeler', href: '/modeler', icon: PlusSquare },
  { name: 'Focus', href: '/sync', icon: Timer },
  { name: 'Analysis', href: '/insights', icon: BarChart3 },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useSession();

  return (
    <>
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-card z-50 p-6 flex-col overflow-y-auto scrollbar-none">
        <div className="flex items-center gap-3 mb-10 px-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">GapLogic</span>
        </div>

        <div className="flex-1 space-y-1">
          {user && (
            <p className="px-3 mb-4 text-xs text-muted-foreground truncate">
              {user.name}
            </p>
          )}
          {navItems.map((item) => {
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

        {user && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        )}
      </nav>

      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-card/85 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl z-50 flex items-center justify-around px-2">
        {navItems.map((item) => {
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
