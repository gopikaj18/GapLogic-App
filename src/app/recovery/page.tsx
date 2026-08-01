'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/DataContext';
import { apiFetch } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  RotateCcw, 
  CheckCircle, 
  Heart, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Flame,
  Zap,
  ChevronRight,
  Calendar,
  Trash2,
  Forward
} from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function RecoveryCenter() {
  const { recoveryState, intentions, logs, refresh } = useData();
  const { toast } = useToast();
  
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isTinyActionPicked, setIsTinyActionPicked] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Ready'>('Ready');
  const [breathSeconds, setBreathSeconds] = useState(0);
  const [selectedTinyTask, setSelectedTinyTask] = useState('');
  
  // Backlog recovery states
  const [missedTasks, setMissedTasks] = useState<any[]>([]);
  const [addressedTasks, setAddressedTasks] = useState<Record<string, 'rescheduled' | 'skipped' | 'discarded'>>({});
  const [rescheduleTimes, setRescheduleTimes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [earnedCredits, setEarnedCredits] = useState(8);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Trigger default recovery state if none exists
  useEffect(() => {
    const ensureState = async () => {
      if (!recoveryState) {
        try {
          await apiFetch('/api/recovery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentStreak: 0,
              recoveryScore: 100,
              recoveryStreak: 0
            })
          });
          refresh();
        } catch (e) {
          console.error(e);
        }
      }
    };
    ensureState();
  }, [recoveryState, refresh]);

  // Load missed tasks when entering Recover step (step 4)
  useEffect(() => {
    if (activeStep === 4) {
      const currentTime = format(new Date(), 'HH:mm');
      const pastTasks = intentions.filter(task => {
        const isCompleted = logs.some(l => l.intentionId === task.id && l.completed);
        const isSkipped = task.skipped === true || task.status === 'skipped';
        const isRescheduled = task.status === 'rescheduled';
        
        if (isCompleted || isSkipped || isRescheduled || task.status === 'completed') {
          return false;
        }

        const isPastDate = task.date < today;
        const isToday = task.date === today;
        const hasTimePassed = isToday && task.scheduledTime && task.scheduledTime < currentTime;

        return isPastDate || hasTimePassed || task.status === 'missed';
      });
      setMissedTasks(pastTasks);
    }
  }, [activeStep, intentions, logs, today]);

  // Actions for missed tasks
  const handleReschedule = async (taskId: string, day: 'today' | 'tomorrow') => {
    const newTime = rescheduleTimes[taskId];
    if (!newTime) return;

    const newDate = day === 'today' ? today : format(addDays(new Date(), 1), 'yyyy-MM-dd');
    
    // Check conflicts
    const clash = intentions.some(i => 
      i.date === newDate && 
      i.scheduledTime === newTime && 
      i.id !== taskId && 
      i.status !== 'skipped' && 
      i.status !== 'missed' &&
      !i.skipped
    );

    if (clash) {
      toast({ variant: 'destructive', title: 'Conflict', description: 'This time conflicts with another scheduled task.' });
      return;
    }

    if (day === 'today') {
      const currentTimeStr = format(new Date(), 'HH:mm');
      if (newTime < currentTimeStr) {
        toast({ variant: 'destructive', title: 'Time Passed', description: 'This time has already passed today. Choose a future time or select Tomorrow.' });
        return;
      }
    }

    const originalTask = intentions.find(i => i.id === taskId);
    const originalMissedAt = originalTask?.original_missed_at || (originalTask ? `${originalTask.date}T${originalTask.scheduledTime || '09:00'}:00Z` : new Date().toISOString());
    try {
      await apiFetch('/api/intentions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: taskId, 
          date: newDate, 
          scheduledTime: newTime,
          scheduled_start_time: newTime,
          status: 'rescheduled',
          was_recovered: true,
          original_missed_at: originalMissedAt
        })
      });
      setAddressedTasks(prev => ({ ...prev, [taskId]: 'rescheduled' }));
      toast({ title: 'Task Rescheduled', description: `Task moved to ${day} at ${newTime}.` });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to reschedule task.' });
    }
  };

  const handleSkipNoPenalty = async (taskId: string) => {
    try {
      await apiFetch('/api/intentions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: taskId, 
          skipped: true, 
          status: 'skipped', 
          skipReason: 'Recovered during protocol' 
        })
      });
      setAddressedTasks(prev => ({ ...prev, [taskId]: 'skipped' }));
      toast({ title: 'Task Skipped', description: 'Task marked as skipped (no penalty).' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to skip task.' });
    }
  };

  const handleDiscard = async (taskId: string) => {
    try {
      await apiFetch(`/api/intentions?id=${taskId}`, {
        method: 'DELETE'
      });
      setAddressedTasks(prev => ({ ...prev, [taskId]: 'discarded' }));
      toast({ title: 'Task Discarded', description: 'Task removed from backlog.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to discard task.' });
    }
  };

  const handleCompleteRecovery = async () => {
    setSubmitting(true);
    try {
      setEarnedCredits(25);

      // 1. Post Recovery Protocol completion transaction
      await apiFetch('/api/trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 25,
          type: 'deposit',
          description: 'Recovery process fully completed',
          date: today
        })
      });

      // 2. Update recovery score & streak
      const currentScore = recoveryState?.recoveryScore || 100;
      const currentRecStreak = recoveryState?.recoveryStreak || 0;
      await apiFetch('/api/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryScore: Math.min(100, currentScore + 10),
          recoveryStreak: currentRecStreak + 1
        })
      });

      toast({ title: 'Momentum Restored! (+25 CR)', description: 'Protocol completed successfully.' });
      setActiveStep(5);
      refresh();
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete recovery protocol.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipAllForNow = async () => {
    setSubmitting(true);
    try {
      setEarnedCredits(25);

      // 1. Post Recovery Protocol completion transaction
      await apiFetch('/api/trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 25,
          type: 'deposit',
          description: 'Recovery process fully completed',
          date: today
        })
      });

      // 2. Update recovery score & streak
      const currentScore = recoveryState?.recoveryScore || 100;
      const currentRecStreak = recoveryState?.recoveryStreak || 0;
      await apiFetch('/api/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryScore: Math.min(100, currentScore + 10),
          recoveryStreak: currentRecStreak + 1
        })
      });

      toast({ title: 'Momentum Restored! (+25 CR)', description: 'Protocol completed successfully.' });
      setActiveStep(5);
      refresh();
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete recovery protocol.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Breathing Guide loop (4s Inhale, 4s Hold, 4s Exhale, repeat 3 times)
  useEffect(() => {
    if (activeStep !== 2) return;
    setBreathPhase('Inhale');
    setBreathSeconds(4);
  }, [activeStep]);

  useEffect(() => {
    if (activeStep !== 2) return;
    if (breathSeconds <= 0) {
      if (breathPhase === 'Inhale') {
        setBreathPhase('Hold');
        setBreathSeconds(4);
      } else if (breathPhase === 'Hold') {
        setBreathPhase('Exhale');
        setBreathSeconds(4);
      } else if (breathPhase === 'Exhale') {
        setBreathPhase('Ready'); // Completed 1 round
      }
      return;
    }
    const timer = setTimeout(() => {
      setBreathSeconds(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [breathSeconds, breathPhase, activeStep]);

  // Suggested micro habits based on categories
  const tinyTaskSuggestions = [
    { text: "Do 5 jumping jacks or 2 pushups", category: "health", icon: "💪" },
    { text: "Open your current study book to page 1", category: "learning", icon: "📚" },
    { text: "Write 1 single line of clean code", category: "work", icon: "💻" },
    { text: "Express gratitude for 1 thing in your mind", category: "personal", icon: "❤️" },
    { text: "Drink 1 glass of cold water", category: "health", icon: "🥛" }
  ];

  // Complete tiny action
  const handleCompleteTinyAction = () => {
    setActiveStep(4);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-6 lg:p-10 pb-20 max-w-4xl mx-auto w-full space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Recovery Center</h1>
            <p className="text-muted-foreground text-sm mt-1">
              "Most apps stop after 'You failed.' Mine begins there." Guided momentum restore protocol.
            </p>
          </div>
        </header>

        {/* HUD Recovery stats widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="clean-card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recovery Score</p>
              <h3 className="text-2xl font-black text-primary mt-1">{recoveryState?.recoveryScore || 100}%</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Your rebound efficiency index</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Heart className="w-6 h-6" />
            </div>
          </Card>

          <Card className="clean-card p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recovery Streak</p>
              <h3 className="text-2xl font-black text-emerald-500 mt-1">{recoveryState?.recoveryStreak || 0} Runs</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Consecutive recoveries completed</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
              <Flame className="w-6 h-6" />
            </div>
          </Card>
        </div>

        {/* Multi-step guided wizard layout */}
        <Card className="clean-card p-8 bg-card/60 backdrop-blur border-primary/10 space-y-8 relative overflow-hidden">
          
          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5 md:gap-3 overflow-x-auto scrollbar-none pb-4 border-b text-[9px] md:text-[10px] font-bold uppercase tracking-wider md:tracking-widest text-muted-foreground justify-start md:justify-between whitespace-nowrap">
            <span className={`flex-shrink-0 ${activeStep >= 1 ? 'text-primary' : ''}`}>1. Acknowledge</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className={`flex-shrink-0 ${activeStep >= 2 ? 'text-primary' : ''}`}>2. Reset</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className={`flex-shrink-0 ${activeStep >= 3 ? 'text-primary' : ''}`}>3. Tiny Action</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className={`flex-shrink-0 ${activeStep >= 4 ? 'text-primary' : ''}`}>4. Recover</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className={`flex-shrink-0 ${activeStep >= 5 ? 'text-primary' : ''}`}>5. Momentum</span>
          </div>

          {/* STEP 1: ACKNOWLEDGE */}
          {activeStep === 1 && (
            <div className="space-y-6 max-w-xl mx-auto text-center">
              <ShieldAlert className="w-16 h-16 text-primary mx-auto animate-bounce" />
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold tracking-tight">It's Okay to Stumble.</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Consistency isn't about perfection; it is about the speed of your return. 
                  A broken commitment drafts from self-trust, but a quick recovery deposits right back. 
                  Let's strip away the guilt and focus on the immediate next vote.
                </p>
              </div>
              <Button onClick={() => setActiveStep(2)} className="h-12 px-8 font-bold bg-primary hover:bg-primary/95 text-white gap-2 rounded-xl">
                Initiate Reset <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: BREATH RESET */}
          {activeStep === 2 && (
            <div className="space-y-8 max-w-xl mx-auto text-center">
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold tracking-tight">Box Breathing Reset</h3>
                <p className="text-sm text-muted-foreground">Calm the nervous system down. Follow the expander bubble.</p>
              </div>

              {/* Expander Bubble */}
              <div className="flex flex-col items-center justify-center h-48 relative">
                <div className={`w-32 h-32 rounded-full border-2 border-primary/20 flex flex-col items-center justify-center transition-all duration-1000 ${
                  breathPhase === 'Inhale' ? 'scale-125 bg-primary/10 border-primary' :
                  breathPhase === 'Hold' ? 'scale-125 bg-primary/20 border-primary' :
                  breathPhase === 'Exhale' ? 'scale-90 bg-muted/30 border-muted' : 'scale-100 bg-muted/20'
                }`}>
                  <span className="text-sm font-black uppercase tracking-widest text-primary">{breathPhase}</span>
                  <span className="text-2xl font-black mt-1 font-mono">{breathSeconds}s</span>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                {breathPhase === 'Ready' ? (
                  <Button onClick={() => setActiveStep(3)} className="h-12 px-8 font-bold bg-primary hover:bg-primary/95 text-white gap-2 rounded-xl">
                    Proceed to Tiny Action <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => { setBreathPhase('Ready'); setBreathSeconds(0); }} className="text-xs font-bold text-muted-foreground">
                    Skip Breathing
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PICK TINY ACTION */}
          {activeStep === 3 && !isTinyActionPicked && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-extrabold tracking-tight">Pick Your Tiny Action</h3>
                <p className="text-sm text-muted-foreground">Rebuild self-trust by doing something so small it requires zero willpower to start.</p>
              </div>

              <div className="grid gap-2.5">
                {tinyTaskSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedTinyTask(item.text);
                      setIsTinyActionPicked(true);
                    }}
                    className="p-4 border rounded-2xl bg-card hover:bg-muted/10 transition-all flex items-center justify-between text-left group hover:border-primary/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-sm font-bold">{item.text}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.category}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4.5 h-4.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 EXECUTION: DO TINY ACTION */}
          {activeStep === 3 && isTinyActionPicked && (
            <div className="space-y-6 max-w-xl mx-auto text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto animate-pulse">
                <Zap className="w-8 h-8 fill-current" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold tracking-tight">Execute Tiny Commitment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Go complete this micro-action right now:
                </p>
                <div className="py-4 px-6 border bg-muted/20 border-dashed rounded-2xl inline-block max-w-sm">
                  <p className="font-extrabold text-base text-primary">"{selectedTinyTask}"</p>
                </div>
                <p className="text-xs text-muted-foreground leading-normal">
                  Completing this simple commitment tells your brain: <br />
                  <span className="font-semibold text-foreground">"I can trust myself to do what I plan."</span>
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <Button variant="ghost" onClick={() => setIsTinyActionPicked(false)} className="font-bold text-xs h-10 rounded-lg">Back</Button>
                <Button onClick={handleCompleteTinyAction} className="bg-emerald-500 hover:bg-emerald-600 font-bold text-xs h-10 rounded-lg text-white">
                  I Have Completed This Action!
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: RECOVER BACKLOG TASKS */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-2 max-w-xl mx-auto">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto animate-pulse">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight">Audit & Recover Missed Tasks</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Clear your backlog of incomplete intentions from past days. Reschedule them to commit, skip them intentionally, or discard them.
                </p>
              </div>

              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                  {missedTasks.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-muted rounded-2xl bg-card/25">
                      <p className="text-sm font-semibold text-foreground">No Missed Intentions in Backlog</p>
                      <p className="text-xs text-muted-foreground mt-1">You are fully caught up and consistent. Ready to restore momentum!</p>
                    </div>
                  ) : (
                    missedTasks.map((task) => {
                      const status = addressedTasks[task.id];
                      const enteredTime = rescheduleTimes[task.id] || '';
                      
                      const clashToday = enteredTime ? intentions.some(i => 
                        i.date === today && 
                        i.scheduledTime === enteredTime && 
                        i.id !== task.id && 
                        i.status !== 'skipped' && 
                        i.status !== 'missed' &&
                        !i.skipped
                      ) : false;

                      const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
                      const clashTomorrow = enteredTime ? intentions.some(i => 
                        i.date === tomorrowStr && 
                        i.scheduledTime === enteredTime && 
                        i.id !== task.id && 
                        i.status !== 'skipped' && 
                        i.status !== 'missed' &&
                        !i.skipped
                      ) : false;

                      const currentTimeStr = format(new Date(), 'HH:mm');
                      const isTimePassedToday = enteredTime ? enteredTime < currentTimeStr : false;

                      return (
                        <div key={task.id} className="p-4 border rounded-2xl bg-card/40 flex flex-col gap-2.5 text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-foreground">{task.title}</span>
                                <Badge className="text-[8px] uppercase">{task.category}</Badge>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                Missed on: {task.date} ({task.scheduledTime || '09:00'})
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:self-center">
                              {status ? (
                                <Badge className={`text-[10px] font-bold py-1 px-2.5 rounded-lg border uppercase tracking-wider ${
                                  status === 'rescheduled' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' :
                                  status === 'skipped' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                  'bg-red-500/10 border-red-500/20 text-red-500'
                                }`}>
                                  {status}
                                </Badge>
                              ) : (
                                <>
                                  <input
                                    type="time"
                                    value={enteredTime}
                                    onChange={(e) => setRescheduleTimes(prev => ({ ...prev, [task.id]: e.target.value }))}
                                    className="h-8 w-20 px-2 bg-background border rounded-xl text-xs font-bold text-foreground"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReschedule(task.id, 'today')}
                                    disabled={!enteredTime || clashToday || isTimePassedToday}
                                    className="text-[10px] h-8 px-2.5 font-bold gap-1 rounded-xl text-indigo-500 hover:text-indigo-600 disabled:opacity-50"
                                  >
                                    <Calendar className="w-3 h-3" /> Today
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleReschedule(task.id, 'tomorrow')}
                                    disabled={!enteredTime || clashTomorrow}
                                    className="text-[10px] h-8 px-2.5 font-bold gap-1 rounded-xl text-indigo-400 hover:text-indigo-500 disabled:opacity-50"
                                  >
                                    <Calendar className="w-3 h-3" /> Tomorrow
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSkipNoPenalty(task.id)}
                                    className="text-[10px] h-8 px-2.5 font-bold gap-1 rounded-xl text-amber-500 hover:text-amber-600"
                                  >
                                    <Forward className="w-3 h-3" /> Skip
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDiscard(task.id)}
                                    className="text-[10px] h-8 px-2.5 font-bold gap-1 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-500/5"
                                  >
                                    <Trash2 className="w-3 h-3" /> Discard
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {!status && (
                            <div className="text-[10px] mt-0.5 flex flex-col gap-0.5">
                              {!enteredTime && (
                                <span className="text-amber-500 font-semibold">⚠️ Please enter a reschedule time.</span>
                              )}
                              {enteredTime && isTimePassedToday && (
                                <span className="text-red-500 font-bold">❌ This time has already passed today. Choose a future time or select Tomorrow.</span>
                              )}
                              {enteredTime && (clashToday || clashTomorrow) && (
                                <span className="text-red-500 font-bold">❌ This time conflicts with another scheduled task.</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 gap-4">
                  <div className="text-xs text-muted-foreground">
                    Addressed: <span className="font-bold text-foreground">{Object.keys(addressedTasks).length} / {missedTasks.length}</span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <Button onClick={handleCompleteRecovery} disabled={submitting || !missedTasks.every(task => addressedTasks[task.id] !== undefined)} className="h-10 px-6 font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs gap-1">
                      {submitting ? 'Completing...' : 'Fulfill Protocol (+25 CR)'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SUCCESS & MOMENTUM RESTORED */}
          {activeStep === 5 && (
            <div className="space-y-6 max-w-xl mx-auto text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
                <CheckCircle className="w-8 h-8 fill-current" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold tracking-tight">Momentum Restored!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You successfully executed the recovery protocol. 
                  Your self-trust credit account has been deposited with <span className="font-bold text-foreground">+{earnedCredits} CR</span>. 
                  Your recovery score is recovering, and the loop is active again.
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                <Link href="/">
                  <Button className="h-11 px-6 font-bold bg-primary hover:bg-primary/95 text-white rounded-lg text-xs">
                    Return to Dashboard
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => { setActiveStep(1); setAddressedTasks({}); setRescheduleTimes({}); setIsTinyActionPicked(false); }} className="font-bold text-xs h-11 px-6 rounded-lg">
                  Run Protocol Again
                </Button>
              </div>
            </div>
          )}

        </Card>

      </main>
    </div>
  );
}
