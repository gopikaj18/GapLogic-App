'use client';

import { useMemo, useEffect, useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/DataContext';
import { 
  Target, 
  AlertCircle, 
  Calendar,
  Activity,
  Flame,
  Plus,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Dashboard() {
  const { intentions, logs, loading } = useData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.title = "GapLogic | Dashboard";
  }, []);

  const metrics = useMemo(() => {
    if (intentions.length === 0) return null;

    const completedLogs = logs.filter(l => l.completed).length;
    const rate = Math.round((completedLogs / intentions.length) * 100);

    const loggedIntentionIds = new Set(logs.map(l => l.intentionId));
    const deviations = intentions.filter(i => !loggedIntentionIds.has(i.id)).length;

    const dates = Array.from(new Set(intentions.map(i => i.date))).sort((a, b) => b.localeCompare(a));
    let currentStreak = 0;
    for (const date of dates) {
      const dayIntentions = intentions.filter(i => i.date === date);
      const dayLogs = logs.filter(l => l.date === date && l.completed);
      if (dayIntentions.length > 0 && dayLogs.length > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      intentionRate: rate,
      streak: currentStreak,
      criticalDeviations: deviations,
    };
  }, [intentions, logs]);

  const sortedIntentions = useMemo(() => {
    return [...intentions].sort((a, b) => {
      const aTime = new Date(a.createdAt as any).getTime() || 0;
      const bTime = new Date(b.createdAt as any).getTime() || 0;
      return bTime - aTime;
    });
  }, [intentions]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Navigation />
        <main className="flex-1 md:ml-64 p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-6 lg:p-10 pb-20 max-w-6xl mx-auto w-full">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
            <p className="text-muted-foreground text-sm mt-1">Local database audit & management.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/modeler">
              <Button variant="outline" className="h-11 px-6 gap-2 rounded-xl font-bold border-primary/20">
                <Plus className="w-4 h-4" />
                Add Intention
              </Button>
            </Link>
            <Link href="/sync">
              <Button className="h-11 px-6 gap-2 rounded-xl font-bold">
                <Calendar className="w-4 h-4" />
                Focus Session
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Stats Section */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="clean-card">
              <CardContent className="p-8">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Integrity Rate</p>
                <div className="flex items-end justify-between mb-4">
                  <h3 className="text-4xl font-bold">{metrics?.intentionRate || 0}%</h3>
                  <Target className="w-6 h-6 text-primary opacity-40" />
                </div>
                <Progress value={metrics?.intentionRate || 0} className="h-2" />
              </CardContent>
            </Card>
            
            <Card className="clean-card">
              <CardContent className="p-8">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Current Streak</p>
                <div className="flex items-end justify-between">
                  <h3 className="text-4xl font-bold">{metrics?.streak || 0} Days</h3>
                  <Flame className="w-6 h-6 text-primary opacity-40" />
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {intentions.length === 0 ? (
          <div className="py-24 text-center space-y-8 max-w-xl mx-auto border-2 border-dashed rounded-3xl bg-card/50">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
              <Target className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Ready for Modeler</h1>
              <p className="text-muted-foreground text-lg leading-relaxed px-6">
                Establish your first behavioral intention to begin identifying discrepancies.
              </p>
            </div>
            <div className="flex justify-center">
              <Link href="/modeler">
                <Button className="h-14 px-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/10">Go to Modeler</Button>
              </Link>
            </div>
          </div>
        ) : (
          <section className="space-y-12">
            {/* Completed Activities */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Activity className="w-6 h-6 text-emerald-500" />
                  Completed Activities
                </h2>
                <Badge variant="outline" className="text-[10px] font-bold uppercase border-emerald-500/30 text-emerald-500 h-7 px-4 bg-emerald-500/5">
                  {logs.filter(l => l.completed).length} Done
                </Badge>
              </div>
              
              <div className="grid gap-3">
                {sortedIntentions
                  .filter(item => logs.some(l => l.intentionId === item.id && l.completed))
                  .slice(0, 10)
                  .map((item) => {
                    const log = logs.find(l => l.intentionId === item.id && l.completed);
                    return (
                      <div key={item.id} className="clean-card p-5 flex items-center justify-between group hover:border-emerald-500/20 transition-all cursor-default">
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 flex-shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-lg truncate">{item.title}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                              {item.category} • {format(new Date(item.date), 'MMM dd')} {item.scheduledTime ? `at ${item.scheduledTime}` : ''}
                            </p>
                          </div>
                        </div>
                        <Badge className="text-[10px] uppercase font-bold tracking-widest px-4 h-8 rounded-lg border-none bg-emerald-500/20 text-emerald-500 flex-shrink-0 ml-4">
                          Completed
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Missed Activities */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-destructive" />
                  Missed Activities
                </h2>
                <Badge variant="outline" className="text-[10px] font-bold uppercase border-destructive/30 text-destructive h-7 px-4 bg-destructive/5">
                  {logs.filter(l => !l.completed).length} Missed
                </Badge>
              </div>
              
              <div className="grid gap-3">
                {sortedIntentions
                  .filter(item => logs.some(l => l.intentionId === item.id && !l.completed))
                  .slice(0, 10)
                  .map((item) => {
                    const log = logs.find(l => l.intentionId === item.id && !l.completed);
                    return (
                      <div key={item.id} className="clean-card p-5 flex items-center justify-between group hover:border-destructive/20 transition-all cursor-default">
                        <div className="flex items-center gap-5 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-destructive/10 text-destructive flex-shrink-0">
                            <XCircle className="w-6 h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-lg truncate">{item.title}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                              {item.category} • {format(new Date(item.date), 'MMM dd')} {item.scheduledTime ? `at ${item.scheduledTime}` : ''}
                            </p>
                          </div>
                        </div>
                        <Badge className="text-[10px] uppercase font-bold tracking-widest px-4 h-8 rounded-lg border-none bg-destructive/20 text-destructive flex-shrink-0 ml-4">
                          Missed
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
