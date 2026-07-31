'use client';

import { useMemo, useEffect, useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/lib/DataContext';
import { apiFetch } from '@/lib/api-config';
import { addRealityLog } from '@/lib/firestore';
import { 
  Target, 
  AlertCircle, 
  Calendar,
  Activity,
  Flame,
  Plus,
  CheckCircle2,
  XCircle,
  Coins,
  ShieldCheck,
  TrendingDown,
  Timer,
  AlertTriangle,
  Zap,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight,
  UserCheck,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format, parse, addMinutes } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { intentions, logs, trustTransactions, recoveryState, loading, refresh } = useData();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  
  // Modals / audit states
  const [auditIntention, setAuditIntention] = useState<any | null>(null);
  const [skipIntention, setSkipIntention] = useState<any | null>(null);
  const [selectedDistraction, setSelectedDistraction] = useState('');
  const [skipExplanation, setSkipExplanation] = useState('');
  
  const [auditForm, setAuditForm] = useState({
    completed: true,
    actualEffort: 3,
    actualEnergy: 3,
    moodBefore: 'Focused',
    moodAfter: 'Calm',
    distractions: '',
    frictionNote: '',
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    setMounted(true);
    document.title = "GapLogic | Today Dashboard";
    const savedNote = localStorage.getItem(`gaplogic_note_${today}`);
    if (savedNote) setQuickNote(savedNote);
  }, [today]);

  const handleSaveNote = (text: string) => {
    setQuickNote(text);
    localStorage.setItem(`gaplogic_note_${today}`, text);
  };

  // 1. Today's Intentions
  const todayIntentions = useMemo(() => {
    return intentions.filter(i => i.date === today);
  }, [intentions, today]);

  // 2. Upcoming Intentions
  const upcomingIntentions = useMemo(() => {
    return intentions
      .filter(i => i.date > today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.scheduledTime.localeCompare(b.scheduledTime))
      .slice(0, 3);
  }, [intentions, today]);

  // 3. Stats for today
  const todayStats = useMemo(() => {
    const todayLogs = logs.filter(l => l.date === today);
    const completed = todayLogs.filter(l => l.completed).length;
    const total = todayIntentions.length;
    
    // Explicitly skipped intentions
    const skipped = todayIntentions.filter(i => i.skipped).length;
    
    const integrityRate = total > 0 
      ? Math.round((completed / (total)) * 100) 
      : 0;

    return {
      completed,
      skipped,
      total,
      integrityRate
    };
  }, [logs, todayIntentions, today]);

  // Streaks
  const streaksCount = useMemo(() => {
    if (intentions.length === 0) return 0;
    
    const dates = Array.from(new Set(intentions.map(i => i.date)))
      .sort((a, b) => b.localeCompare(a));
      
    let streak = 0;
    for (const date of dates) {
      if (date > today) continue;
      const dayIntentions = intentions.filter(i => i.date === date);
      const dayLogs = logs.filter(l => l.date === date && l.completed);
      
      // If user had intentions for that day and completed at least 70% of them
      if (dayIntentions.length > 0) {
        const rate = dayLogs.length / dayIntentions.length;
        if (rate >= 0.7) {
          streak++;
        } else {
          // If it's today and they haven't finished yet, don't break streak yet
          if (date === today) continue;
          break;
        }
      } else {
        // If no tasks scheduled, streak continues if they already have one, or just skip
        continue;
      }
    }
    return streak;
  }, [intentions, logs, today]);

  // Total running self-trust balance
  const trustBalance = useMemo(() => {
    const credits = trustTransactions.filter(tx => tx.type === 'deposit').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    const debits = trustTransactions.filter(tx => tx.type === 'withdrawal').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    return 100 + credits - debits;
  }, [trustTransactions]);

  // Projected Cost of Inaction
  const inactionMetrics = useMemo(() => {
    // Collect all missed and skipped intentions historically, excluding recovered ones
    const recoveredTaskIds = new Set(intentions.filter(i => i.status === 'recovered' || i.recovered).map(i => i.id));
    const missedLogsCount = logs.filter(l => !l.completed && !recoveredTaskIds.has(l.intentionId)).length;
    const skippedTasksCount = intentions.filter(i => i.skipped && !recoveredTaskIds.has(i.id)).length;
    
    const totalFriction = missedLogsCount + skippedTasksCount;
    
    // Calculate projected impact
    const hoursBehind = Math.round((totalFriction * 30) / 60); // assumes 30m average
    const workoutsMissedYear = Math.round((totalFriction / Math.max(1, logs.length)) * 52);
    const pagesNotRead = totalFriction * 20; // 20 pages average task length

    return {
      hoursBehind,
      workoutsMissedYear,
      pagesNotRead,
      totalFriction
    };
  }, [logs, intentions]);

  // Identity Builder Votes
  const identityVotes = useMemo(() => {
    const votes: Record<string, number> = {
      "Athlete": 0,
      "Scholar": 0,
      "Engineer": 0,
      "Strategist": 0
    };

    logs.filter(l => l.completed).forEach(log => {
      const intention = intentions.find(i => i.id === log.intentionId);
      if (intention) {
        // Map category to identity
        if (intention.category === 'health') votes['Athlete']++;
        else if (intention.category === 'learning') votes['Scholar']++;
        else if (intention.category === 'work') votes['Engineer']++;
        else votes['Strategist']++;
        
        // Also map custom identity if exists
        if (intention.identity && intention.identity.trim().length > 0) {
          const customId = intention.identity.trim();
          votes[customId] = (votes[customId] || 0) + 1;
        }
      }
    });

    return Object.entries(votes)
      .sort((a, b) => b[1] - a[1]);
  }, [logs, intentions]);

  // Smart Reminders logic based on history
  const smartReminder = useMemo(() => {
    if (logs.length === 0) {
      return "Establish your first intention in the Modeler to start tracking your self-trust loop.";
    }

    const missedCount = logs.filter(l => !l.completed).length;
    if (missedCount === 0) {
      return "Fantastic follow-through! You kept all promises. Protect this momentum.";
    }

    // Identify highest distraction source
    const distractionsList = logs.map(l => l.distractions).filter(Boolean) as string[];
    if (distractionsList.length > 0) {
      const counts: Record<string, number> = {};
      distractionsList.forEach(d => {
        counts[d] = (counts[d] || 0) + 1;
      });
      const topDistraction = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (topDistraction && topDistraction[1] > 0) {
        return `Willpower Leak Detected: ${Math.round((topDistraction[1] / logs.length) * 100)}% of deviations happen when pulled away by ${topDistraction[0]}. Consider keeping it out of sight.`;
      }
    }

    // Default recommendation based on category
    return "Estimation Bias Alert: Your high-difficulty tasks are 40% more likely to be missed. Suggest splitting high effort (4-5) items into micro-commitments.";
  }, [logs]);

  // Timeline Time Blocking Grid
  const timelineHours = useMemo(() => {
    const hours = [];
    for (let h = 7; h <= 22; h++) {
      const timeStr = `${h.toString().padStart(2, '0')}:00`;
      
      // Find tasks in this hour block
      const tasksInHour = todayIntentions.filter(i => {
        if (!i.scheduledTime) return false;
        const taskHour = parseInt(i.scheduledTime.split(':')[0]);
        return taskHour === h;
      });

      hours.push({
        hour: h,
        timeLabel: format(parse(`${h}:00`, 'H:mm', new Date()), 'hh:mm a'),
        tasks: tasksInHour
      });
    }
    return hours;
  }, [todayIntentions]);

  // Actions
  const handleOpenAudit = (intention: any) => {
    setAuditIntention(intention);
    setAuditForm({
      completed: true,
      actualEffort: intention.effortEstimate || 3,
      actualEnergy: 3,
      moodBefore: 'Focused',
      moodAfter: 'Calm',
      distractions: '',
      frictionNote: ''
    });
  };

  const handleSyncReality = async () => {
    if (!auditIntention) return;

    try {
      // 1. Create Log
      await addRealityLog({
        intentionId: auditIntention.id,
        completed: auditForm.completed,
        actualEffort: auditForm.actualEffort,
        frictionNote: auditForm.frictionNote,
        contextNote: `Mood Before: ${auditForm.moodBefore}, Mood After: ${auditForm.moodAfter}. ${auditForm.frictionNote}`,
        date: today,
        expectedEffort: auditIntention.effortEstimate || 3,
        actualEnergy: auditForm.actualEnergy,
        expectedEnergy: auditIntention.effortEstimate || 3,
        moodBefore: auditForm.moodBefore,
        moodAfter: auditForm.moodAfter,
        distractions: auditForm.distractions || ''
      });

      // 2. Update intention status based on the task status lifecycle
      if (auditIntention.status === 'rescheduled') {
        await apiFetch('/api/intentions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: auditIntention.id,
            status: auditForm.completed ? 'recovered' : 'missed',
            recovered: auditForm.completed ? true : undefined
          })
        });
      } else {
        await apiFetch('/api/intentions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: auditIntention.id,
            status: auditForm.completed ? 'completed' : 'missed'
          })
        });
      }

      // 3. Log Trust credits/debits based on outcome
      let trustReward = 0;
      let transactionType: 'deposit' | 'withdrawal' = 'deposit';
      let description = '';

      if (auditForm.completed) {
        if (auditIntention.status === 'rescheduled') {
          trustReward = 5;
          transactionType = 'deposit';
          description = `Completed Rescheduled Intention: ${auditIntention.title}`;
        } else {
          trustReward = 10;
          transactionType = 'deposit';
          description = `Completed Intention: ${auditIntention.title}`;
        }
      } else {
        if (auditIntention.status === 'rescheduled') {
          trustReward = -15;
          transactionType = 'withdrawal';
          description = `Missed Rescheduled Intention: ${auditIntention.title}`;
        } else {
          trustReward = -10;
          transactionType = 'withdrawal';
          description = `Missed Intention: ${auditIntention.title}`;
        }
      }

      await apiFetch('/api/trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: trustReward,
          type: transactionType,
          description: description,
          date: today
        })
      });

      // If recovery flow is ongoing, check recovery state
      if (recoveryState && recoveryState.recoveryStreak > 0) {
        await apiFetch('/api/recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recoveryStreak: recoveryState.recoveryStreak + 1,
            recoveryScore: Math.min(100, recoveryState.recoveryScore + 5)
          })
        });
      }

      const toastPrefix = trustReward >= 0 ? `+${trustReward}` : `${trustReward}`;
      toast({ title: `Reality Synced! (${toastPrefix} Self-Trust)`, description: "Activity outcome stored successfully." });
      setAuditIntention(null);
      refresh();
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to record reality log' });
    }
  };

  const handleSnooze = async (intention: any) => {
    try {
      const currentCount = intention.snoozeCount || 0;
      // parse scheduled time and add 15 minutes
      const [h, m] = intention.scheduledTime.split(':').map(Number);
      let dateObj = parse(intention.scheduledTime, 'HH:mm', new Date());
      let newDate = addMinutes(dateObj, 15);
      const newScheduledTime = format(newDate, 'HH:mm');

      // Update Intention
      await apiFetch('/api/intentions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: intention.id,
          scheduledTime: newScheduledTime,
          snoozeCount: currentCount + 1
        })
      });

      // Withdraw trust (snooze tax)
      await apiFetch('/api/trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: -2,
          type: 'withdrawal',
          description: `Snoozed: ${intention.title} (Snooze Tax)`,
          date: today
        })
      });

      toast({ title: 'Task Snoozed by 15m (-2 Self-Trust)', description: `Rescheduled to ${newScheduledTime}` });
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenSkip = (intention: any) => {
    setSkipIntention(intention);
    setSelectedDistraction('None');
    setSkipExplanation('');
  };

  const handleSkipConfirm = async () => {
    if (!skipIntention) return;

    try {
      // 1. Update intention as skipped
      await apiFetch('/api/intentions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: skipIntention.id,
          skipped: true,
          skipReason: skipExplanation || 'Skipped from dashboard',
          distraction: selectedDistraction
        })
      });

      // 2. Create reality log as missed
      await addRealityLog({
        intentionId: skipIntention.id,
        completed: false,
        actualEffort: 1,
        frictionNote: skipExplanation || 'Intention explicitly skipped.',
        contextNote: `Skipped because of distraction: ${selectedDistraction}`,
        date: today,
        expectedEffort: skipIntention.effortEstimate || 3,
        actualEnergy: 1,
        expectedEnergy: skipIntention.effortEstimate || 3,
        moodBefore: 'Calm',
        moodAfter: 'Stressed',
        distractions: selectedDistraction
      });

      // 3. Withdraw trust credits (severe penalty for skip)
      const penalty = skipIntention.status === 'rescheduled' ? -15 : -10;
      const description = skipIntention.status === 'rescheduled' 
        ? `Skipped Rescheduled Intention: ${skipIntention.title}`
        : `Skipped Intention: ${skipIntention.title}`;

      await apiFetch('/api/trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: penalty,
          type: 'withdrawal',
          description: description,
          date: today
        })
      });

      // Update recovery status
      if (recoveryState) {
        await apiFetch('/api/recovery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recoveryStreak: 0,
            recoveryScore: Math.max(0, recoveryState.recoveryScore - 10)
          })
        });
      }

      toast({ title: `Promise Skipped (${penalty} Self-Trust)`, description: 'Intention recorded as missed.' });
      setSkipIntention(null);
      refresh();
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Navigation />
        <main className="flex-1 md:ml-64 p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </main>
      </div>
    );
  }

  // Calculate coordinates for SVG Progress Ring
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (todayStats.integrityRate / 100) * circumference;

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-6 lg:p-10 pb-20 max-w-6xl mx-auto w-full space-y-8">
        
        {/* Welcome Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Today's Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {format(new Date(), 'EEEE, MMMM dd, yyyy')} • Integrity HUD
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/modeler">
              <Button className="h-11 px-5 gap-2 rounded-xl font-bold bg-primary hover:bg-primary/95 text-white">
                <Plus className="w-4 h-4" />
                Schedule Promise
              </Button>
            </Link>
          </div>
        </header>

        {/* Smart Reminders Notification Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3 animate-pulse">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
          <p className="text-xs md:text-sm font-semibold text-foreground/90">{smartReminder}</p>
        </div>

        {/* 4-Stat Core HUD Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Progress Ring Card */}
          <Card className="clean-card p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Today's Integrity</p>
              <h3 className="text-2xl font-black">{todayStats.integrityRate}%</h3>
              <p className="text-[11px] text-muted-foreground">{todayStats.completed} of {todayStats.total} kept</p>
            </div>
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r={radius} className="text-muted/20" strokeWidth="6" stroke="currentColor" fill="transparent" />
                <circle cx="40" cy="40" r={radius} className="text-primary" strokeWidth="6" stroke="currentColor" fill="transparent"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black">{todayStats.integrityRate}%</div>
            </div>
          </Card>

          {/* Current Streaks Card */}
          <Card className="clean-card p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Integrity Streak</p>
              <h3 className="text-2xl font-black">{streaksCount} Days</h3>
              <p className="text-[11px] text-muted-foreground">Keep daily integrity &gt;= 70%</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
              <Flame className="w-6 h-6 fill-current" />
            </div>
          </Card>

          {/* Trust Bank Balance Card */}
          <Card className="clean-card p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trust Balance</p>
              <h3 className="text-2xl font-black">{trustBalance} CR</h3>
              <p className="text-[11px] text-muted-foreground">Character deposits & drafts</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <Coins className="w-6 h-6" />
            </div>
          </Card>

          {/* Cost of Inaction Card */}
          <Card className="clean-card p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cost of Inaction</p>
              <h3 className="text-2xl font-black text-red-500">+{inactionMetrics.hoursBehind} Hrs Lost</h3>
              <p className="text-[11px] text-muted-foreground">{inactionMetrics.pagesNotRead} pages not read</p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
              <TrendingDown className="w-6 h-6" />
            </div>
          </Card>

        </div>

        {/* Two-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Intention Stack + Time-blocking Schedule */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Time Blocking Hourly Timeline */}
            <Card className="clean-card p-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                Hourly Schedule Blocking
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {timelineHours.map((block) => (
                  <div key={block.hour} className="flex gap-4 items-center group py-1.5 border-b border-muted/30">
                    <span className="text-[11px] font-bold text-muted-foreground w-16 flex-shrink-0">{block.timeLabel}</span>
                    <div className="flex-1 min-h-[36px] bg-muted/20 border border-dashed rounded-lg p-1.5 flex items-center gap-2">
                      {block.tasks.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground/60 italic pl-2">Unallocated Time Block</span>
                      ) : (
                        block.tasks.map(task => {
                          const isDone = logs.some(l => l.intentionId === task.id && l.completed);
                          const isMissed = logs.some(l => l.intentionId === task.id && !l.completed);
                          return (
                            <div key={task.id} className={cn(
                              "text-xs font-semibold px-3 py-1 rounded-md border flex items-center justify-between w-full",
                              isDone ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                              isMissed ? "bg-red-500/10 border-red-500/20 text-red-500" :
                              task.skipped ? "bg-muted border-muted-foreground/20 text-muted-foreground" :
                              "bg-primary/10 border-primary/20 text-primary"
                            )}>
                              <span>{task.title} ({task.estimatedDuration}m)</span>
                              <Badge className="text-[8px] uppercase">{task.category}</Badge>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Daily Intention Stack */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Today's Intention Stack
                </h3>
                <Badge variant="outline">{todayIntentions.length} promises</Badge>
              </div>

              {todayIntentions.length === 0 ? (
                <div className="py-16 text-center border border-dashed rounded-2xl bg-muted/10 space-y-4">
                  <Target className="w-12 h-12 text-muted mx-auto" />
                  <p className="text-sm font-semibold text-muted-foreground">No promises scheduled for today.</p>
                  <Link href="/modeler">
                    <Button variant="outline" size="sm">Go to Modeler</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3">
                  {todayIntentions.map((item) => {
                    const log = logs.find(l => l.intentionId === item.id && (l.completed || l.date === item.date));
                    return (
                      <Card key={item.id} className={cn(
                        "clean-card p-5 transition-all",
                        item.skipped ? "opacity-60 bg-muted/20" : ""
                      )}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-2 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className="text-[9px] uppercase tracking-widest bg-secondary/80 text-foreground">{item.category}</Badge>
                              <Badge variant="outline" className={cn(
                                "text-[9px] uppercase font-bold",
                                item.priority === 'high' ? "text-red-500 border-red-500/30" : 
                                item.priority === 'low' ? "text-blue-500 border-blue-500/30" : "text-muted-foreground"
                              )}>
                                {item.priority || 'medium'}
                              </Badge>
                              {item.status === 'rescheduled' && !log?.completed && (
                                <Badge className="text-[9px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 font-bold uppercase tracking-wider rounded-md animate-pulse">
                                  Rescheduled
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.scheduledTime} ({item.estimatedDuration}m)
                              </span>
                            </div>
                            <h4 className="font-extrabold text-lg tracking-tight break-words">{item.title}</h4>
                            {item.why && (
                              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-2">
                                Why: "{item.why}"
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                            {log ? (
                              <Badge className={cn(
                                "border-none px-4 h-9 font-bold uppercase text-[9px] tracking-wider rounded-lg",
                                log.completed 
                                  ? (item.status === 'recovered' || item.recovered 
                                      ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" 
                                      : "bg-emerald-500/10 text-emerald-500") 
                                  : "bg-destructive/10 text-destructive"
                              )}>
                                {log.completed 
                                  ? (item.status === 'recovered' || item.recovered ? 'Recovered ✅' : 'Completed') 
                                  : 'Missed'}
                              </Badge>
                            ) : item.skipped ? (
                              <Badge variant="outline" className="px-4 h-9 font-bold uppercase text-[9px] tracking-wider rounded-lg">
                                Skipped
                              </Badge>
                            ) : (
                              <>
                                <Button size="sm" onClick={() => handleOpenAudit(item)} className="bg-emerald-500 hover:bg-emerald-600 font-bold h-9 text-xs rounded-lg text-white">
                                  Complete
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleSnooze(item)} className="font-bold h-9 text-xs rounded-lg border-muted">
                                  Snooze
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleOpenSkip(item)} className="font-bold h-9 text-xs rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10">
                                  Skip
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: Identities + Notepad + Upcoming */}
          <div className="space-y-8">
            
            {/* Identity Builder Widget */}
            <Card className="clean-card p-6">
              <h3 className="text-md font-bold flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-primary" />
                Identities (Atomic Habits)
              </h3>
              <div className="space-y-4">
                {identityVotes.map(([name, count]) => (
                  <div key={name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span>{name}</span>
                      <span className="text-muted-foreground">{count} votes</span>
                    </div>
                    <Progress value={Math.min(100, (count / 20) * 100)} className="h-2" />
                    <p className="text-[9px] text-muted-foreground">Level {Math.floor(count / 5) + 1} (Next level: {5 - (count % 5)} votes)</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Quick Notes Card */}
            <Card className="clean-card p-6">
              <h3 className="text-md font-bold flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-primary" />
                Quick Focus Notes
              </h3>
              <textarea 
                className="w-full min-h-[100px] text-xs p-3 rounded-lg bg-muted/30 border border-muted focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed" 
                placeholder="Braindump any thoughts or distraction observations..."
                value={quickNote}
                onChange={(e) => handleSaveNote(e.target.value)}
              />
              <p className="text-[9.5px] text-muted-foreground text-right italic">Notes save automatically</p>
            </Card>

            {/* Upcoming Intentions list */}
            <Card className="clean-card p-6">
              <h3 className="text-md font-bold flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                Upcoming Promises
              </h3>
              {upcomingIntentions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No future promises defined.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingIntentions.map(i => (
                    <div key={i.id} className="p-3 border rounded-xl bg-card hover:bg-muted/10 transition-all flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold leading-tight truncate max-w-[150px]">{i.title}</p>
                        <p className="text-[10px] text-muted-foreground">{format(parse(i.date, 'yyyy-MM-dd', new Date()), 'MMM dd')} at {i.scheduledTime}</p>
                      </div>
                      <Badge className="text-[8px] uppercase">{i.category}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>

        </div>

      </main>

      {/* 1. REALITY AUDIT MODAL */}
      {auditIntention && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-xl clean-card bg-card shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="text-center space-y-2 border-b pb-4">
              <h3 className="text-xl font-bold">Reality Audit</h3>
              <p className="text-muted-foreground text-xs font-mono uppercase tracking-wider">{auditIntention.title}</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Expected Difficulty vs Actual Difficulty */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Actual Difficulty</span>
                    <span className="text-primary">{auditForm.actualEffort}/5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" 
                    value={auditForm.actualEffort} 
                    onChange={e => setAuditForm({...auditForm, actualEffort: Number(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-[10px] text-muted-foreground">Scheduled Estimate: {auditIntention.effortEstimate}/5</p>
                </div>

                {/* Expected Energy vs Actual Energy */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Actual Energy Level</span>
                    <span className="text-primary">{auditForm.actualEnergy}/5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" 
                    value={auditForm.actualEnergy} 
                    onChange={e => setAuditForm({...auditForm, actualEnergy: Number(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-[10px] text-muted-foreground">Estimated Level: 3/5</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Mood Before */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mood Before</label>
                  <select 
                    value={auditForm.moodBefore} 
                    onChange={e => setAuditForm({...auditForm, moodBefore: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border bg-muted/40 text-xs font-semibold focus:outline-none"
                  >
                    <option value="Focused">Focused</option>
                    <option value="Tired">Tired</option>
                    <option value="Anxious">Anxious</option>
                    <option value="Stressed">Stressed</option>
                    <option value="Calm">Calm</option>
                    <option value="Energetic">Energetic</option>
                  </select>
                </div>

                {/* Mood After */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mood After</label>
                  <select 
                    value={auditForm.moodAfter} 
                    onChange={e => setAuditForm({...auditForm, moodAfter: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border bg-muted/40 text-xs font-semibold focus:outline-none"
                  >
                    <option value="Calm">Calm</option>
                    <option value="Satisfied">Satisfied</option>
                    <option value="Exhausted">Exhausted</option>
                    <option value="Anxious">Anxious</option>
                    <option value="Frustrated">Frustrated</option>
                  </select>
                </div>
              </div>

              {/* Distractions Logging */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Primary Distraction Source (if any)</label>
                <select 
                  value={auditForm.distractions} 
                  onChange={e => setAuditForm({...auditForm, distractions: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border bg-muted/40 text-xs font-semibold focus:outline-none"
                >
                  <option value="">None</option>
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="WhatsApp/Chat">WhatsApp/Chat</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Sleep">Sleep</option>
                  <option value="Friends/Family">Friends/Family</option>
                  <option value="Other Work">Other Work</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Friction Notes</label>
                <textarea 
                  className="w-full min-h-[60px] p-3 text-xs rounded-lg bg-muted/20 border" 
                  placeholder="e.g. Started 10m late. Resistance was high initially."
                  value={auditForm.frictionNote}
                  onChange={e => setAuditForm({...auditForm, frictionNote: e.target.value})}
                />
              </div>

            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setAuditIntention(null)} className="font-bold text-xs h-10 rounded-lg">Cancel</Button>
              <Button onClick={handleSyncReality} className="bg-primary text-white font-bold text-xs h-10 rounded-lg">Sync Reality</Button>
            </div>

          </Card>
        </div>
      )}

      {/* 2. WHY VAULT / SKIP MODAL */}
      {skipIntention && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md clean-card bg-card shadow-2xl p-6 space-y-6">
            
            <div className="text-center space-y-2 border-b pb-4 text-red-500">
              <AlertTriangle className="w-10 h-10 mx-auto" />
              <h3 className="text-xl font-bold">Skip Commitment</h3>
            </div>

            {/* Why Vault Reminder */}
            {skipIntention.why ? (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-2 text-center">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Why Vault Reminder</p>
                <p className="text-sm italic font-semibold">"{skipIntention.why}"</p>
                <p className="text-[10px] text-muted-foreground">You wrote this when establishing this commitment. Are you sure you want to vote against this identity?</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">Skipping a promise directly drafts a withdrawal from your Self-Trust Bank account.</p>
            )}

            <div className="space-y-4">
              {/* Distraction Tracker */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">What pulled you away?</label>
                <select 
                  value={selectedDistraction} 
                  onChange={e => setSelectedDistraction(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border bg-muted/40 text-xs font-semibold focus:outline-none"
                >
                  <option value="None">Just didn't want to</option>
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="WhatsApp/Chat">WhatsApp/Chat</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Sleep/Fatigue">Sleep/Fatigue</option>
                  <option value="Socializing">Socializing</option>
                  <option value="Anxiety/Procrastination">Anxiety/Procrastination</option>
                </select>
              </div>

              {/* Friction description */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Provide explanation</label>
                <input 
                  type="text" 
                  className="w-full h-10 px-3 text-xs rounded-lg bg-muted/20 border" 
                  placeholder="e.g. Lost track of time browsing..."
                  value={skipExplanation}
                  onChange={e => setSkipExplanation(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setSkipIntention(null)} className="font-bold text-xs h-10 rounded-lg">Cancel</Button>
              <Button onClick={handleSkipConfirm} variant="destructive" className="font-bold text-xs h-10 rounded-lg">Confirm Skip</Button>
            </div>

          </Card>
        </div>
      )}

    </div>
  );
}

