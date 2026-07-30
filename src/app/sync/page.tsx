'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/lib/DataContext';
import { 
  CheckCircle2, 
  XCircle,
  Play, 
  Pause, 
  RotateCcw,
  Timer,
  Save,
  Loader2,
  Zap,
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { addRealityLog } from '@/lib/firestore';
import { Intention } from '@/lib/schema';
import { format } from 'date-fns';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-config';

export interface PredictBehavioralOutcomeOutput {
  prediction: 'completed' | 'missed' | 'partially_completed';
  probability: number;
  reasoning: string;
  suggestedAction: string;
}

export default function FocusTimer() {
  const { toast } = useToast();
  const { intentions, logs, loading, refresh } = useData();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [activeIntention, setActiveIntention] = useState<Intention | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<PredictBehavioralOutcomeOutput | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [feedback, setFeedback] = useState({
    completed: true,
    actualEffort: 3,
    frictionNote: '',
    contextNote: '',
  });

  const todayIntentions = useMemo(() => {
    return intentions.filter(i => i.date === today);
  }, [intentions, today]);

  useEffect(() => {
    document.title = "GapLogic — Focus Session";
  }, []);

  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && activeIntention && !isPaused) {
      handleSessionEnd();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, timeLeft, activeIntention]);

  const runPrediction = async (intention: Intention) => {
    if (predicting) return;
    setPredicting(true);
    try {
      const res = await apiFetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: intention.title,
          category: intention.category,
          effortEstimate: intention.effortEstimate,
          scheduledTime: intention.scheduledTime,
          date: intention.date
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
      }
    } catch (e) {
      console.error('Error fetching prediction:', e);
    } finally {
      setPredicting(false);
    }
  };

  const startSession = (intention: Intention) => {
    setActiveIntention(intention);
    setTimeLeft((intention.estimatedDuration || 25) * 60);
    setIsPaused(false);
    setIsCompleted(false);
    setPrediction(null);
    setFeedback({ actualEffort: intention.effortEstimate, completed: true, frictionNote: '', contextNote: '' });
    runPrediction(intention);
    toast({ title: "Session Initialized", description: `Active Task: ${intention.title}` });
  };

  const handleSessionEnd = () => {
    setIsPaused(true);
    setIsCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);
    toast({ title: "Session Terminal", description: "Audit the outcome below." });
  };

  const handleSaveReality = async () => {
    if (!activeIntention) return;
    setSubmitting(true);
    try {
      await addRealityLog({
        intentionId: activeIntention.id,
        completed: feedback.completed,
        actualEffort: feedback.actualEffort,
        frictionNote: feedback.frictionNote,
        contextNote: feedback.contextNote,
        date: today,
      });
      await refresh();

      toast({ title: "Reality Synced", description: "Outcome recorded in behavioral history." });
      setActiveIntention(null);
      setIsCompleted(false);
      setPrediction(null);
    } catch (error) {
      // Handled centrally
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = activeIntention ? ((activeIntention.estimatedDuration * 60 - timeLeft) / (activeIntention.estimatedDuration * 60)) * 100 : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <Navigation />
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-12 pt-14 md:pt-12 pb-32 max-w-5xl mx-auto w-full">
        <header className="mb-6 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-1">Focus Session</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Run your daily stack and audit deviations.</p>
        </header>

        {activeIntention ? (
          <section className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="clean-card border-none bg-primary/5 overflow-hidden">
              <CardContent className="p-6 sm:p-8 md:p-12 text-center space-y-6 md:space-y-10">
                <div className="space-y-2 md:space-y-4">
                  <Badge variant="secondary" className="uppercase tracking-widest text-[9px] md:text-[10px] font-bold px-4 md:px-6 h-6 md:h-7">
                    {activeIntention.category}
                  </Badge>
                  <h2 className="text-2xl md:text-5xl font-bold tracking-tight break-words">{activeIntention.title}</h2>
                </div>

                <div className="text-6xl sm:text-8xl md:text-[140px] font-bold tracking-tighter tabular-nums leading-none text-primary">
                  {formatTime(timeLeft)}
                </div>

                <div className="space-y-2">
                  <Progress value={progress} className="h-1.5 md:h-2 bg-primary/10" />
                  <div className="flex justify-between text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span>Inception</span>
                    <span>Target: {activeIntention.estimatedDuration}m</span>
                  </div>
                </div>

                <div className="flex justify-center items-center gap-4 md:gap-8">
                  <Button 
                    variant="outline" 
                    className="h-12 w-12 md:h-16 md:w-16 rounded-full border-muted bg-card hover:bg-muted"
                    onClick={() => setTimeLeft(activeIntention.estimatedDuration * 60)}
                  >
                    <RotateCcw className="w-5 h-5 md:w-8 md:h-8" />
                  </Button>
                  <Button 
                    className="h-16 w-16 md:h-24 md:w-24 rounded-full shadow-2xl bg-primary text-primary-foreground hover:scale-105 transition-transform"
                    onClick={() => setIsPaused(!isPaused)}
                  >
                    {isPaused ? <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" /> : <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" />}
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="h-12 w-12 md:h-16 md:w-16 rounded-full shadow-xl hover:scale-105 transition-transform"
                    onClick={() => handleSessionEnd()}
                  >
                    <Zap className="w-5 h-5 md:w-8 md:h-8 fill-current" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Predictive Audit HUD */}
            {(predicting || prediction) && !isCompleted && (
              <Card className="clean-card border-primary/20 bg-primary/5">
                <CardHeader className="py-3 px-4 md:py-4 md:px-6 border-b border-primary/10">
                  <CardTitle className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 md:gap-3 text-primary">
                    <BrainCircuit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Predictive Behavioral Audit
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {predicting ? (
                    <div className="flex items-center gap-3 text-xs md:text-sm font-medium text-muted-foreground animate-pulse">
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                      Analyzing behavioral history...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                      <div className="space-y-1 md:space-y-2">
                        <p className="text-[8px] md:text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Confidence Model</p>
                        <div className="flex items-center gap-2 md:gap-3">
                          {prediction?.prediction === 'completed' ? <TrendingUp className="text-emerald-500 w-4 h-4 md:w-5 md:h-5" /> : <AlertTriangle className="text-destructive w-4 h-4 md:w-5 md:h-5" />}
                          <span className="text-sm md:text-lg font-bold capitalize">{prediction?.prediction}</span>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2 md:space-y-3">
                        <p className="text-[8px] md:text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Diagnostic Reasoning</p>
                        <p className="text-xs md:text-sm leading-relaxed font-medium">{prediction?.reasoning}</p>
                        <div className="inline-flex items-center gap-1.5 md:gap-2 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold">
                          <Zap className="w-2.5 h-2.5 md:w-3 md:h-3" />
                          Pivot: {prediction?.suggestedAction}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isCompleted && (
              <Card className="clean-card p-6 sm:p-8 md:p-10 space-y-6 md:space-y-10 animate-in slide-in-from-bottom-6 duration-700">
                <div className="text-center space-y-2 md:space-y-3 border-b pb-6 md:pb-8">
                  <h3 className="text-2xl md:text-3xl font-bold">Reality Audit</h3>
                  <p className="text-muted-foreground font-medium uppercase text-[8px] md:text-[10px] tracking-widest">Compare Intention vs. Behavioral Outcome</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  <div className="space-y-6 md:space-y-8">
                    <div className="space-y-3 md:space-y-4">
                      <Label className="font-bold text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground">Terminal Status</Label>
                      <div className="flex gap-3 md:gap-4">
                        <Button 
                          className={cn("flex-1 h-12 md:h-16 rounded-xl md:rounded-2xl font-bold text-sm md:text-lg", feedback.completed ? "bg-emerald-500 hover:bg-emerald-600" : "bg-muted text-muted-foreground")}
                          onClick={() => setFeedback({...feedback, completed: true})}
                        >
                          <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 mr-1.5 md:mr-2" />
                          Completed
                        </Button>
                        <Button 
                          className={cn("flex-1 h-12 md:h-16 rounded-xl md:rounded-2xl font-bold text-sm md:text-lg", !feedback.completed ? "bg-destructive hover:bg-destructive/90" : "bg-muted text-muted-foreground")}
                          onClick={() => setFeedback({...feedback, completed: false})}
                        >
                          <XCircle className="w-5 h-5 md:w-6 md:h-6 mr-1.5 md:mr-2" />
                          Missed
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      <div className="flex justify-between items-center">
                        <Label className="font-bold text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground">Actual Energy Expenditure</Label>
                        <Badge variant="outline" className="text-primary font-bold h-6 md:h-7 px-3 md:px-4 text-xs md:text-sm border-primary/20">{feedback.actualEffort}/5</Badge>
                      </div>
                      <Slider value={[feedback.actualEffort]} min={1} max={5} step={1} onValueChange={([v]) => setFeedback({...feedback, actualEffort: v})} />
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    <Label className="font-bold text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground">Friction Notes & Context</Label>
                    <Textarea 
                      placeholder="Identify what resisted your focus..."
                      className="min-h-[120px] md:min-h-[180px] rounded-xl md:rounded-2xl bg-muted/20 border-muted p-4 md:p-6 text-sm md:text-base leading-relaxed"
                      value={feedback.frictionNote}
                      onChange={(e) => setFeedback({...feedback, frictionNote: e.target.value})}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full h-14 md:h-18 rounded-xl md:rounded-2xl font-bold text-lg md:text-xl gap-2 md:gap-3 shadow-2xl"
                  onClick={handleSaveReality}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Save className="w-5 h-5 md:w-6 md:h-6" />}
                  Sync Reality
                </Button>
              </Card>
            )}
          </section>
        ) : (
          <div className="space-y-4 md:space-y-10">
            <div className="flex flex-row items-center justify-between gap-2">
              <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 md:gap-4">
                <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center">
                  <Timer className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                </div>
                Daily Cognitive Stack
              </h2>
              <Badge variant="outline" className="h-6 md:h-8 px-2 md:px-4 text-[7px] md:text-[10px] font-bold uppercase tracking-widest border-muted whitespace-nowrap">
                {todayIntentions.length} Sessions Remaining
              </Badge>
            </div>
            
            {loading ? (
              <div className="grid gap-4 md:gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-24 md:h-32 bg-card border rounded-xl md:rounded-2xl animate-pulse" />)}
              </div>
            ) : todayIntentions.length === 0 ? (
              <Card className="border-2 border-dashed border-muted rounded-2xl md:rounded-3xl bg-transparent">
                <CardContent className="py-12 md:py-20 text-center space-y-6 md:space-y-8">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                    <History className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <p className="text-lg md:text-xl font-bold">No tasks established for today.</p>
                    <p className="text-muted-foreground text-sm">Visit the Modeler to architect your session stack.</p>
                  </div>
                  <Link href="/modeler">
                    <Button variant="outline" className="h-10 md:h-12 px-8 md:px-10 rounded-lg md:rounded-xl font-bold uppercase tracking-widest text-[10px]">Establish First Intention</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-2 md:gap-4">
                {todayIntentions.map((item) => {
                  const log = logs.find(l => l.intentionId === item.id);
                  return (
                    <Card key={item.id} className="clean-card hover:border-primary/40 transition-all duration-300 overflow-hidden">
                      <div className="p-3 sm:p-6 md:p-8 flex flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3 md:gap-8 min-w-0">
                          <div className={cn(
                            "w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center transition-all flex-shrink-0",
                            log ? (log.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive") : "bg-primary/5 text-primary"
                          )}>
                            {log ? (log.completed ? <CheckCircle2 className="w-5 h-5 md:w-8 md:h-8" /> : <XCircle className="w-5 h-5 md:w-8 md:h-8" />) : <Play className="w-5 h-5 md:w-8 md:h-8" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <Badge variant="outline" className="text-[7px] md:text-[8px] uppercase font-bold py-0 h-3 border-none bg-secondary/50">{item.category}</Badge>
                              <span className="text-[7px] md:text-[8px] text-muted-foreground font-bold tracking-widest uppercase">{item.estimatedDuration}M Duration</span>
                            </div>
                            <h4 className="font-bold text-base md:text-2xl tracking-tight truncate">{item.title}</h4>
                          </div>
                        </div>
                        {!log ? (
                          <Button onClick={() => startSession(item)} className="h-9 md:h-14 px-4 md:px-10 font-bold text-xs md:text-lg rounded-lg md:rounded-xl flex-shrink-0">
                            Begin Session
                          </Button>
                        ) : (
                          <div className="flex-shrink-0">
                            <Badge className={cn(
                              "border-none px-3 md:px-6 h-8 md:h-10 font-bold uppercase text-[7px] md:text-[10px] tracking-widest rounded-lg md:rounded-xl",
                              log.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                            )}>
                              {log.completed ? 'Completed' : 'Missed'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
