'use client';

import { useState, useMemo } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/DataContext';
import { format, parse, subDays } from 'date-fns';
import { 
  ShieldCheck, 
  Target, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  Filter,
  BarChart,
  Frown,
  Activity
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function IntegritySystem() {
  const { intentions, logs, loading } = useData();
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'missed' | 'skipped'>('all');

  // Combined resolved task history helper
  const resolvedHistory = useMemo(() => {
    return intentions.map(intention => {
      const log = logs.find(l => l.intentionId === intention.id && (l.completed || l.date === intention.date));
      
      let status: 'completed' | 'missed' | 'skipped' | 'pending' | 'recovered' | 'rescheduled' = 'pending';
      if (intention.skipped || intention.status === 'skipped') status = 'skipped';
      else if (intention.status === 'recovered' || intention.recovered) status = 'recovered';
      else if (intention.status === 'rescheduled') status = 'rescheduled';
      else if (log) status = log.completed ? 'completed' : 'missed';
      else if (intention.status === 'missed') status = 'missed';
      else status = (intention.status as any) || 'pending';

      return {
        ...intention,
        log,
        status
      };
    });
  }, [intentions, logs]);

  const statistics = useMemo(() => {
    if (resolvedHistory.length === 0) {
      return { daily: 0, weekly: 0, monthly: 0, lifetime: 0, totalCount: 0, completedCount: 0, missedCount: 0, skippedCount: 0, pendingCount: 0 };
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    // Counts
    const completedCount = resolvedHistory.filter(i => i.status === 'completed').length;
    const recoveredCount = resolvedHistory.filter(i => i.status === 'recovered').length;
    const missedCount = resolvedHistory.filter(i => i.status === 'missed').length;
    const skippedCount = resolvedHistory.filter(i => i.status === 'skipped').length;
    const pendingCount = resolvedHistory.filter(i => i.status === 'pending' || i.status === 'rescheduled').length;
    
    // Total commitments
    const totalCount = resolvedHistory.length;

    // Lifetime (kept on-time + recovered count as success)
    const lifetime = totalCount > 0 ? Math.round(((completedCount + recoveredCount) / totalCount) * 100) : 0;

    // Today
    const todayIntentions = resolvedHistory.filter(i => i.date === todayStr);
    const todaySuccess = todayIntentions.filter(i => i.status === 'completed' || i.status === 'recovered').length;
    const daily = todayIntentions.length > 0 ? Math.round((todaySuccess / todayIntentions.length) * 100) : 0;

    // Weekly
    const weeklyIntentions = resolvedHistory.filter(i => i.date >= sevenDaysAgo);
    const weeklySuccess = weeklyIntentions.filter(i => i.status === 'completed' || i.status === 'recovered').length;
    const weekly = weeklyIntentions.length > 0 ? Math.round((weeklySuccess / weeklyIntentions.length) * 100) : 0;

    // Monthly
    const monthlyIntentions = resolvedHistory.filter(i => i.date >= thirtyDaysAgo);
    const monthlySuccess = monthlyIntentions.filter(i => i.status === 'completed' || i.status === 'recovered').length;
    const monthly = monthlyIntentions.length > 0 ? Math.round((monthlySuccess / monthlyIntentions.length) * 100) : 0;

    return {
      daily,
      weekly,
      monthly,
      lifetime,
      totalCount,
      completedCount: completedCount + recoveredCount,
      missedCount,
      skippedCount,
      pendingCount
    };
  }, [resolvedHistory]);

  // Combined promise history filtered by type
  const combinedHistory = useMemo(() => {
    return resolvedHistory
      .filter(item => {
        if (filterType === 'all') return true;
        if (filterType === 'completed') return item.status === 'completed' || item.status === 'recovered';
        if (filterType === 'missed') return item.status === 'missed';
        if (filterType === 'skipped') return item.status === 'skipped';
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.scheduledTime.localeCompare(a.scheduledTime));
  }, [resolvedHistory, filterType]);

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-6 lg:p-10 pb-20 max-w-5xl mx-auto w-full space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Integrity System</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Analyze self-trust coefficients and audit alignment statistics.
            </p>
          </div>
        </header>

        {/* 4-Range Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Daily Integrity', val: statistics.daily, color: 'from-blue-500 to-cyan-500' },
            { label: 'Weekly Integrity', val: statistics.weekly, color: 'from-indigo-500 to-blue-500' },
            { label: 'Monthly Integrity', val: statistics.monthly, color: 'from-purple-500 to-indigo-500' },
            { label: 'Lifetime Integrity', val: statistics.lifetime, color: 'from-emerald-500 to-teal-500' }
          ].map((metric) => (
            <Card key={metric.label} className="clean-card p-5 space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{metric.label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{metric.val}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${metric.color}`}
                  style={{ width: `${metric.val}%` }}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Summary Details Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="clean-card p-6 md:col-span-1 space-y-4">
            <h3 className="text-md font-bold flex items-center gap-2">
              <BarChart className="w-4 h-4 text-primary" />
              Commitment Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Total Promises Scheduled</span>
                <span className="font-bold">{statistics.totalCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t pt-2">
                <span className="text-emerald-500 font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Kept Promises</span>
                <span className="font-bold text-emerald-500">{statistics.completedCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t pt-2">
                <span className="text-red-500 font-semibold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Broken Commitments</span>
                <span className="font-bold text-red-500">{statistics.missedCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t pt-2">
                <span className="text-muted-foreground font-semibold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Explicit Skips</span>
                <span className="font-bold">{statistics.skippedCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t pt-2">
                <span className="text-muted-foreground font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending Promises</span>
                <span className="font-bold">{statistics.pendingCount}</span>
              </div>
            </div>
          </Card>

          {/* Core Shield description card */}
          <Card className="clean-card p-6 md:col-span-2 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-base">The Integrity Core Protocol</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Self-trust is the bedrock of productivity. Every kept promise deposits credits into your self-belief bank. 
                Every snoozed or skipped promise drafts a withdrawal. Treat scheduled blocks not as reminders, but as 
                sacred compacts with your future self.
              </p>
            </div>
          </Card>
        </div>

        {/* Promise History Header & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Promise History Feed
            </h3>
            
            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 border rounded-xl text-xs">
              {[
                { type: 'all', label: 'All' },
                { type: 'completed', label: 'Kept' },
                { type: 'missed', label: 'Broken' },
                { type: 'skipped', label: 'Skipped' }
              ].map(btn => (
                <button
                  key={btn.type}
                  onClick={() => setFilterType(btn.type as any)}
                  className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                    filterType === btn.type ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Promise Cards Grid */}
          {combinedHistory.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-muted rounded-2xl space-y-3">
              <Frown className="w-10 h-10 text-muted mx-auto" />
              <p className="text-sm text-muted-foreground italic">No historical promises match this query.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {combinedHistory.map((item) => (
                <Card key={item.id} className="clean-card p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="text-[8px] uppercase tracking-wider bg-secondary text-foreground">{item.category}</Badge>
                        <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {format(parse(item.date, 'yyyy-MM-dd', new Date()), 'MMM dd')} at {item.scheduledTime}
                        </span>
                        {item.priority && (
                          <Badge variant="outline" className={`text-[8px] uppercase ${
                            item.priority === 'high' ? 'text-red-500 border-red-500/20' : 'text-muted-foreground'
                          }`}>{item.priority}</Badge>
                        )}
                      </div>
                      <h4 className="font-extrabold text-base tracking-tight truncate max-w-[400px]">{item.title}</h4>
                      {item.why && (
                        <p className="text-xs text-muted-foreground italic border-l pl-2">"Why: {item.why}"</p>
                      )}

                      {/* Extended logs values (reality audit details) */}
                      {item.log && (
                        <div className="flex gap-4 flex-wrap pt-1 text-[10px] font-bold text-muted-foreground">
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Diff: {item.log.actualEffort}/5</span>
                          {item.log.actualEnergy && (
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Energy: {item.log.actualEnergy}/5</span>
                          )}
                          {item.log.moodBefore && (
                            <span>Mood: {item.log.moodBefore} &rarr; {item.log.moodAfter || 'Calm'}</span>
                          )}
                          {item.log.distractions && (
                            <span className="text-red-500 font-semibold bg-red-500/5 px-2 py-0.5 rounded">Distracted by {item.log.distractions}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 self-end sm:self-center">
                      <Badge className={`px-4 h-8 text-[9px] font-bold uppercase tracking-wider rounded-lg border-none ${
                        item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        item.status === 'recovered' ? 'bg-indigo-500/10 text-indigo-500' :
                        item.status === 'rescheduled' ? 'bg-indigo-500/5 text-indigo-500/80 border border-indigo-500/20' :
                        item.status === 'missed' ? 'bg-red-500/10 text-red-500' :
                        item.status === 'skipped' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {item.status === 'completed' ? 'Kept' : 
                         item.status === 'recovered' ? 'Recovered' :
                         item.status === 'rescheduled' ? 'Rescheduled' :
                         item.status === 'missed' ? 'Broken' : 
                         item.status === 'skipped' ? 'Skipped' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
