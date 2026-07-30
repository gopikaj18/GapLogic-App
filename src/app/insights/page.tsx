'use client';

import { useEffect, useMemo, useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useData } from '@/lib/DataContext';
import { apiFetch } from '@/lib/api-config';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  TrendingUp, 
  Brain, 
  ShieldAlert, 
  Lightbulb, 
  Zap, 
  AlertCircle,
  ArrowRightCircle,
  Sparkles,
  Loader2,
  BarChart3
} from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';


export default function Analysis() {
  const { intentions, logs, loading } = useData();

  const [aiInsights, setAiInsights] = useState<{
    discrepancies: Array<{
      plannedItem: { id: string; description: string };
      actualOutcome?: { id: string; description: string; completionStatus: string };
      deviationExplanation: string;
      inconsistencyReason: string;
      suggestedInsight: string;
    }>;
    recommendations: Array<{
      title: string;
      description: string;
      category: string;
      rationale: string;
    }>;
    modelInfo?: {
      weights: number[];
      bias: number;
      featureNames: string[];
    };
  } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Decision Tree Classifier Model for Behavioral Persona
  const behaviorPersona = useMemo(() => {
    const total = intentions.length;
    if (total === 0) {
      return {
        name: "The Seed of Promise",
        emoji: "🌱",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/20",
        description: "You haven't planted any intentions yet!",
        kidAdvice: "Go to the Modeler and establish your first promise to start growing!",
      };
    }

    const completed = logs.filter(l => l.completed).length;
    const completionRate = completed / total;

    const lateTasks = intentions.filter(i => {
      const hour = parseInt(i.scheduledTime?.split(':')[0] || '12');
      return hour >= 19;
    }).length;
    const eveningRatio = lateTasks / total;

    // Decision Tree Rules:
    if (completionRate >= 0.75) {
      if (total >= 6) {
        return {
          name: "The Reliable Golden Retriever",
          emoji: "🐕",
          color: "text-amber-500",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/20",
          description: "Super loyal to your plans! You run fast and always bring back the ball.",
          kidAdvice: "Awesome job! You are super dependable. Keep playing and winning!",
        };
      } else {
        return {
          name: "The Slow & Steady Turtle",
          emoji: "🐢",
          color: "text-emerald-500",
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/20",
          description: "You walk slowly but always cross the finish line without stopping.",
          kidAdvice: "You don't take on too much at once, but you finish everything you start. That's a great habit!",
        };
      }
    } else if (completionRate < 0.40) {
      if (total >= 7) {
        return {
          name: "The Over-Enthusiastic Puppy",
          emoji: "🐶",
          color: "text-sky-500",
          bgColor: "bg-sky-500/10",
          borderColor: "border-sky-500/20",
          description: "You want to chase 10 balls at the same time, get super excited, and then get too tired to finish them.",
          kidAdvice: "Try picking only 1 or 2 tasks today. Finish them first before chasing another toy!",
        };
      } else {
        return {
          name: "The Sleepy Koala",
          emoji: "🐨",
          color: "text-indigo-500",
          bgColor: "bg-indigo-500/10",
          borderColor: "border-indigo-500/20",
          description: "Snuggled up for a cozy nap. You haven't finished many tasks recently.",
          kidAdvice: "Let's wake up your energy! Try scheduling just one super tiny, easy task tomorrow.",
        };
      }
    } else {
      if (eveningRatio >= 0.40) {
        return {
          name: "The Night Owl",
          emoji: "🦉",
          color: "text-fuchsia-500",
          bgColor: "bg-fuchsia-500/10",
          borderColor: "border-fuchsia-500/20",
          description: "You try to build block castles and study when the sun goes down and you are sleepy.",
          kidAdvice: "Do your hardest tasks in the morning when your brain is fresh, and rest in the evening!",
        };
      } else {
        return {
          name: "The Energetic Monkey",
          emoji: "🐒",
          color: "text-amber-600",
          bgColor: "bg-amber-600/10",
          borderColor: "border-amber-600/20",
          description: "Jumping from branch to branch! You complete some tasks but miss others.",
          kidAdvice: "Focus on one branch (task) at a time so you don't slip. You're doing well!",
        };
      }
    }
  }, [intentions, logs]);

  const fetchAiInsights = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await apiFetch('/api/ai/insights');
      if (res.ok) {
        const data = await res.json();
        setAiInsights(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setAiError(errData.error || 'Failed to generate behavioral insights. Make sure local Ollama is running.');
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setAiError('Failed to connect to backend insights service.');
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    document.title = "GapLogic — Analysis Portal";
  }, []);

  useEffect(() => {
    if (logs.length >= 5) {
      fetchAiInsights();
    }
  }, [logs.length]);


  // Chart Data Logic
  const dailyTrend = useMemo(() => {
    return eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() }).map(day => {
      const d = format(day, 'yyyy-MM-dd');
      const dayInt = intentions.filter(i => i.date === d);
      const dayDone = logs.filter(l => l.date === d && l.completed);
      const totalMinutes = logs
        .filter(l => l.date === d)
        .reduce((acc, log) => {
          const intention = intentions.find(i => i.id === log.intentionId);
          return acc + (intention?.estimatedDuration || 0);
        }, 0);
      return { 
        name: format(day, 'MMM dd'), 
        rate: dayInt.length > 0 ? Math.round((dayDone.length / dayInt.length) * 100) : 0,
        time: totalMinutes 
      };
    });
  }, [intentions, logs]);

  // Completion Status Data for Pie Chart
  const completionData = useMemo(() => {
    const completed = logs.filter(l => l.completed).length;
    const missed = logs.filter(l => !l.completed).length;
    return [
      { name: 'Completed', value: completed, fill: '#10b981' },
      { name: 'Missed', value: missed, fill: '#ef4444' }
    ];
  }, [logs]);

  // Diagnostic Pattern Logic
  const diagnostics = useMemo(() => {
    if (logs.length < 1) return null;

    const totalLogs = logs.length;
    const completionRate = totalLogs > 0 ? logs.filter(l => l.completed).length / totalLogs : 0;
    const score = Math.round(completionRate * 100);

    return { score, total: totalLogs };
  }, [logs]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <Navigation />
        <main className="flex-1 md:ml-64 p-6 lg:p-12 pb-24 md:pb-12"><Skeleton className="h-full w-full rounded-3xl" /></main>
      </div>
    );
  }

  const hasEnoughData = logs.length >= 5;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Navigation />
      <main className="flex-1 md:ml-64 p-6 lg:p-12 pb-24 md:pb-12">
        {!hasEnoughData ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <ShieldAlert className="w-16 h-16 text-primary mb-6" />
            <h2 className="text-3xl font-bold mb-4">Awaiting Behavioral Data</h2>
            <p className="text-muted-foreground mb-8">
              Analysis requires at least 5 focus sessions to identify patterns and generate insights. You currently have {logs.length}/5.
            </p>
            <Progress value={(logs.length / 5) * 100} className="w-full h-3 mb-10" />
            <Link href="/sync">
              <Button size="lg" className="rounded-xl px-12 h-14 font-bold">Start Focus Session</Button>
            </Link>
          </div>
        ) : (
          <>
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Behavioral Analysis</h1>
                <p className="text-muted-foreground text-lg">Integrated trends and diagnostic patterns.</p>
              </div>
              <div className="flex items-center gap-4">
                <Card className="clean-card px-6 py-3 flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Integrity Score</p>
                    <p className="text-2xl font-bold">{diagnostics?.score}%</p>
                  </div>
                  <Zap className="w-6 h-6 text-primary" />
                </Card>
              </div>
            </header>

            {/* Top Row: Spirit Animal & Integrity Meter */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in fade-in duration-500">
              {/* Spirit Animal Classifier Card */}
              <Card className={cn("clean-card border-2 p-8 flex flex-col sm:flex-row items-center gap-6 shadow-lg shadow-primary/5", behaviorPersona.borderColor, behaviorPersona.bgColor)}>
                <div className="text-8xl leading-none select-none flex-shrink-0 animate-bounce">
                  {behaviorPersona.emoji}
                </div>
                <div className="space-y-3 text-center sm:text-left flex-1">
                  <div className="space-y-1">
                    <Badge className="bg-primary/20 text-primary border-none uppercase tracking-widest text-[9px] font-bold px-2 py-0.5">
                      Behavior Classifier
                    </Badge>
                    <h2 className="text-2xl font-extrabold tracking-tight mt-0.5">
                      Your Spirit Animal: <span className={behaviorPersona.color}>{behaviorPersona.name}</span>
                    </h2>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed font-medium">
                    {behaviorPersona.description}
                  </p>
                  <div className="bg-card border p-4 rounded-xl space-y-1 border-border/50 shadow-sm text-left">
                    <p className="text-[9px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Fun Advice
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                      {behaviorPersona.kidAdvice}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Integrity Thermometer Card */}
              <Card className="clean-card p-8 space-y-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-2">
                  <Badge variant="outline" className="border-border text-muted-foreground text-[9px] uppercase tracking-widest font-bold px-2 py-0.5">
                    Integrity Meter
                  </Badge>
                  <h3 className="text-2xl font-bold tracking-tight">Your Promise Meter: <span className="text-primary">{diagnostics?.score}%</span></h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This bar shows how many of your promises you kept! A higher score means you did what you promised.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="relative w-full h-8 bg-muted rounded-full overflow-hidden border border-border shadow-inner flex items-center">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-4 font-bold text-[10px] text-white",
                        (diagnostics?.score || 0) >= 75 ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
                        (diagnostics?.score || 0) >= 40 ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                        "bg-gradient-to-r from-rose-500 to-red-500"
                      )}
                      style={{ width: `${diagnostics?.score || 0}%` }}
                    >
                      {(diagnostics?.score || 0) >= 20 && `${diagnostics?.score}%`}
                    </div>
                  </div>

                  <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                    <span className="text-rose-500">Need Practice 😢</span>
                    <span className="text-amber-500">Getting Better! 🙂</span>
                    <span className="text-emerald-500">Super Star! 🌟</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* ML Behavioral Drivers Section */}
            {aiInsights?.modelInfo && (
              <Card className="clean-card p-8 mb-12 shadow-sm border border-border/50 bg-card">
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Mathematical Behavioral Drivers</h3>
                    <p className="text-xs text-muted-foreground">Trained coefficients (weights) of your local Logistic Regression model.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Weight 0: Effort Sensitivity */}
                  <div className="border rounded-2xl p-5 bg-background flex flex-col justify-between space-y-4 shadow-sm hover:border-primary/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Effort Sensitivity</span>
                        <Badge variant="outline" className={cn("text-[10px] font-bold tracking-wider px-2", 
                          aiInsights.modelInfo.weights[0] < 0 ? "border-destructive/20 text-destructive bg-destructive/5" : "border-emerald-200 text-emerald-600 bg-emerald-50"
                        )}>
                          {aiInsights.modelInfo.weights[0].toFixed(2)}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-foreground pt-1">Scaling Resistance</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Measures how task size deters you. {aiInsights.modelInfo.weights[0] < 0 
                          ? "Higher effort estimates negatively impact your completion chance." 
                          : "You maintain completion rates even as task size increases."}
                      </p>
                    </div>
                  </div>

                  {/* Weight 1: Habit Consistency */}
                  <div className="border rounded-2xl p-5 bg-background flex flex-col justify-between space-y-4 shadow-sm hover:border-primary/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Habit Strength</span>
                        <Badge variant="outline" className={cn("text-[10px] font-bold tracking-wider px-2", 
                          aiInsights.modelInfo.weights[1] >= 0.3 ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-amber-200 text-amber-600 bg-amber-50"
                        )}>
                          {aiInsights.modelInfo.weights[1].toFixed(2)}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-foreground pt-1">Category Consistency</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        How much history guides current actions. {aiInsights.modelInfo.weights[1] >= 0.3
                          ? "Your category history heavily controls your performance."
                          : "Your performance is fluid across different domains."}
                      </p>
                    </div>
                  </div>

                  {/* Weight 2: Temporal Success Rate */}
                  <div className="border rounded-2xl p-5 bg-background flex flex-col justify-between space-y-4 shadow-sm hover:border-primary/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Temporal Bias</span>
                        <Badge variant="outline" className={cn("text-[10px] font-bold tracking-wider px-2", 
                          aiInsights.modelInfo.weights[2] >= 0.3 ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-amber-200 text-amber-600 bg-amber-50"
                        )}>
                          {aiInsights.modelInfo.weights[2].toFixed(2)}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-foreground pt-1">Time-of-Day Alignment</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Influence of scheduling hour. {aiInsights.modelInfo.weights[2] >= 0.3
                          ? "You are highly sensitive to scheduling at correct hours."
                          : "Schedule timing has minimal impact on your success."}
                      </p>
                    </div>
                  </div>

                  {/* Weight 3: Previous Task Success */}
                  <div className="border rounded-2xl p-5 bg-background flex flex-col justify-between space-y-4 shadow-sm hover:border-primary/20 transition-all">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Momentum Bias</span>
                        <Badge variant="outline" className={cn("text-[10px] font-bold tracking-wider px-2", 
                          aiInsights.modelInfo.weights[3] >= 0.2 ? "border-emerald-200 text-emerald-600 bg-emerald-50" : "border-amber-200 text-amber-600 bg-amber-50"
                        )}>
                          {aiInsights.modelInfo.weights[3].toFixed(2)}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-foreground pt-1">Sequential Momentum</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Boost from the previous task. {aiInsights.modelInfo.weights[3] >= 0.2
                          ? "A completed prior task strongly drives success on the next one."
                          : "Prior task outcomes do not carry over to your next tasks."}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <Card className="clean-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> 
                    Integrity Growth
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrend}>
                      <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fill="url(#colorRate)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="clean-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" /> 
                    Completion Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={completionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {completionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Time and Consistency Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <Card className="clean-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> 
                    Time Invested
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="time" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="clean-card">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" /> 
                    Consistency Volume
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Diagnostics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Behavioral Gaps */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-destructive">
                  <ShieldAlert className="w-6 h-6" /> Behavioral Gaps
                </h2>
                <div className="grid gap-4">
                  {loadingAi ? (
                    [1, 2].map(i => (
                      <Card key={i} className="clean-card p-5 space-y-3">
                        <Skeleton className="h-4 w-24 rounded-lg" />
                        <Skeleton className="h-6 w-full rounded" />
                        <Skeleton className="h-4 w-3/4 rounded" />
                      </Card>
                    ))
                  ) : aiError ? (
                    <div className="p-8 border-2 border-dashed border-destructive/20 rounded-2xl text-center bg-destructive/5 space-y-4">
                      <p className="text-xs text-destructive font-medium leading-relaxed">{aiError}</p>
                      <Button onClick={fetchAiInsights} variant="outline" size="sm" className="rounded-xl border-destructive/30 hover:bg-destructive/10 text-destructive font-bold">
                        Retry Audit
                      </Button>
                    </div>
                  ) : !aiInsights || aiInsights.discrepancies.length === 0 ? (
                    <div className="p-10 border-2 border-dashed rounded-2xl text-center text-muted-foreground bg-card/10">
                      No significant leaks detected.
                    </div>
                  ) : (
                    aiInsights.discrepancies.map((gap, i) => (
                      <Card key={i} className="clean-card border-l-4 border-l-destructive p-5 space-y-3 bg-card hover:border-l-destructive/80 transition-all cursor-default">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-destructive uppercase tracking-widest">
                            <AlertCircle className="w-4 h-4" />
                            <span>Audit Finding</span>
                          </div>
                          <Badge variant="outline" className="border-destructive/20 text-destructive text-[10px] uppercase font-bold tracking-widest px-3">
                            Discrepancy
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-bold text-foreground">
                            Planned Intention: <span className="underline decoration-destructive/30">{gap.plannedItem.description}</span>
                          </p>
                          <div className="text-xs space-y-1.5 text-muted-foreground bg-destructive/5 p-3 rounded-lg border border-destructive/10 leading-relaxed">
                            <p><strong className="text-foreground">Deviation:</strong> {gap.deviationExplanation}</p>
                            <p><strong className="text-foreground">Root Cause:</strong> {gap.inconsistencyReason}</p>
                            <p><strong className="text-foreground">Insight:</strong> {gap.suggestedInsight}</p>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Strategic Pivots */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-accent">
                  <Lightbulb className="w-6 h-6 animate-pulse" /> Strategic Pivots
                </h2>
                <div className="grid gap-4">
                  {loadingAi ? (
                    [1, 2].map(i => (
                      <Card key={i} className="clean-card p-5 space-y-3">
                        <Skeleton className="h-4 w-24 rounded-lg" />
                        <Skeleton className="h-6 w-full rounded" />
                        <Skeleton className="h-4 w-3/4 rounded" />
                      </Card>
                    ))
                  ) : aiError ? (
                    <div className="p-8 border-2 border-dashed border-destructive/20 rounded-2xl text-center bg-destructive/5 space-y-4">
                      <p className="text-xs text-destructive font-medium leading-relaxed">{aiError}</p>
                      <Button onClick={fetchAiInsights} variant="outline" size="sm" className="rounded-xl border-destructive/30 hover:bg-destructive/10 text-destructive font-bold">
                        Retry Audit
                      </Button>
                    </div>
                  ) : !aiInsights || aiInsights.recommendations.length === 0 ? (
                    <div className="p-10 border-2 border-dashed rounded-2xl text-center text-muted-foreground bg-card/10">
                      Keep logging to unlock pivots.
                    </div>
                  ) : (
                    aiInsights.recommendations.map((pivot, i) => (
                      <Card key={i} className="clean-card border-l-4 border-l-accent p-5 space-y-3 bg-card hover:border-l-accent/80 transition-all cursor-default">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest">
                            <Sparkles className="w-4 h-4 text-accent" />
                            <span>{pivot.category}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-bold text-foreground">{pivot.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{pivot.description}</p>
                          <div className="text-xs bg-accent/5 p-3 rounded-lg border border-accent/10 leading-relaxed text-muted-foreground">
                            <strong className="text-foreground">Why this works:</strong> {pivot.rationale}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
