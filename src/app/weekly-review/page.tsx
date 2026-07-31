'use client';

import { useMemo, useEffect, useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/DataContext';
import { format, parse, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { 
  Calendar, 
  Award, 
  Frown, 
  Activity, 
  Heart, 
  Mail, 
  Smile, 
  Sparkles,
  TrendingUp,
  Download,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function WeeklyReview() {
  const { intentions, logs, trustTransactions, journalEntries } = useData();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.title = "GapLogic | Weekly Review";
  }, []);

  // Filter values for the past 7 days (current week)
  const weeklyData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });

    const weekIntentions = intentions.filter(i => {
      const d = parse(i.date, 'yyyy-MM-dd', new Date());
      return d >= start && d <= end;
    });

    const weekLogs = logs.filter(l => {
      const d = parse(l.date, 'yyyy-MM-dd', new Date());
      return d >= start && d <= end;
    });

    const weekTx = trustTransactions.filter(t => {
      const d = parse(t.date, 'yyyy-MM-dd', new Date());
      return d >= start && d <= end;
    });

    // List of actual win intentions this week
    const winsList = weekIntentions.filter(i => {
      const isCompleted = weekLogs.some(l => l.intentionId === i.id && l.completed);
      return isCompleted || i.status === 'completed' || i.status === 'recovered' || i.recovered;
    });

    // List of actual missed or skipped intentions this week
    const missesList = weekIntentions.filter(i => {
      const isSkipped = i.skipped || i.status === 'skipped';
      const isMissed = weekLogs.some(l => l.intentionId === i.id && !l.completed) || i.status === 'missed';
      return isSkipped || isMissed;
    });

    const completedCount = winsList.length;
    const missedAndSkippedCount = missesList.length;
    const integrityRate = weekIntentions.length > 0 
      ? Math.round((completedCount / weekIntentions.length) * 100) 
      : 0;

    const netTrustEarned = weekTx.reduce((acc, t) => {
      const amount = t.type === 'deposit' ? Math.abs(t.amount) : -Math.abs(t.amount);
      return acc + amount;
    }, 0);

    return {
      integrityRate,
      completedCount,
      missedAndSkippedCount,
      netTrustEarned,
      wins: winsList,
      misses: missesList,
      weekIntentions,
      weekLogs
    };
  }, [intentions, logs, trustTransactions]);

  // Future You letter generation
  const futureYouLetter = useMemo(() => {
    // Pick the category they completed the most
    const categoryCounts: Record<string, number> = {};
    weeklyData.weekLogs.filter(l => l.completed).forEach(l => {
      const item = intentions.find(i => i.id === l.intentionId);
      if (item) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
    });

    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'work';

    let message = '';
    if (topCategory === 'work') {
      message = 'Because you protected your professional focus blocks and coded/worked consistently even when fatigue pulled at you, our project deliveries are entering deployment smoothly.';
    } else if (topCategory === 'health') {
      message = 'Because you showed up for your exercise intentions and treated movement as a non-negotiable priority, I am entering this next week feeling energetic, strong, and centered.';
    } else if (topCategory === 'learning') {
      message = 'Because you logged consistent study blocks and read through pages when procrastination set in, I am starting our placement preparation phase confidently.';
    } else {
      message = 'Because you kept your daily promises and logged reflections even on difficult friction days, I am living with higher self-trust and clarity.';
    }

    return {
      category: topCategory,
      text: message
    };
  }, [weeklyData, intentions]);

  // Recharts Mood timeline data
  const weeklyMoodData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });

    return journalEntries
      .filter(entry => {
        const d = parse(entry.date, 'yyyy-MM-dd', new Date());
        return d >= start && d <= end;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(entry => ({
        date: format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'EEE'),
        Mood: entry.mood
      }));
  }, [journalEntries]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-6 lg:p-10 pb-20 max-w-4xl mx-auto w-full space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Weekly Review</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Every Sunday (or anytime). Summarize kept promises, check mood graphs, and open correspondence from "Future You".
            </p>
          </div>
        </header>

        {/* 4-Stat HUD grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="clean-card p-5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Weekly Integrity</span>
            <h3 className="text-2xl font-black text-primary mt-1">{weeklyData.integrityRate}%</h3>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mt-2">
              <div className="h-full bg-primary" style={{ width: `${weeklyData.integrityRate}%` }} />
            </div>
          </Card>

          <Card className="clean-card p-5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Promises Kept</span>
            <h3 className="text-2xl font-black text-emerald-500 mt-1">+{weeklyData.completedCount}</h3>
            <p className="text-[9px] text-muted-foreground mt-1">Self-respect votes</p>
          </Card>

          <Card className="clean-card p-5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Draft Penalties</span>
            <h3 className="text-2xl font-black text-red-500 mt-1">-{weeklyData.missedAndSkippedCount}</h3>
            <p className="text-[9px] text-muted-foreground mt-1">Skips & missed runs</p>
          </Card>

          <Card className="clean-card p-5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Net Self-Trust</span>
            <h3 className={`text-2xl font-black mt-1 ${weeklyData.netTrustEarned >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {weeklyData.netTrustEarned >= 0 ? `+${weeklyData.netTrustEarned}` : weeklyData.netTrustEarned} CR
            </h3>
            <p className="text-[9px] text-muted-foreground mt-1">Trust Bank changes</p>
          </Card>
        </div>

        {/* Two-Column Review Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEFT: Wins & Misses recap (2/3 width) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Wins List */}
            <Card className="clean-card p-6 space-y-4">
              <h3 className="text-md font-bold flex items-center gap-2 text-emerald-500">
                <Award className="w-5 h-5" />
                Weekly Wins (Kept Promises)
              </h3>
              {weeklyData.wins.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No wins registered this week. Keep a promise to build self-respect.</p>
              ) : (
                <div className="space-y-2">
                  {weeklyData.wins.map((w, idx) => (
                    <div key={idx} className="p-3 border border-emerald-500/10 bg-emerald-500/5 rounded-xl text-xs font-semibold text-emerald-500">
                      ✓ Kept Commitment: "{w.title}"
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Skips/Misses List */}
            <Card className="clean-card p-6 space-y-4">
              <h3 className="text-md font-bold flex items-center gap-2 text-red-500">
                <Frown className="w-5 h-5" />
                Weekly Misses & Skips
              </h3>
              {weeklyData.misses.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Clean sheet! You had zero explicitly skipped commitments this week.</p>
              ) : (
                <div className="space-y-2">
                  {weeklyData.misses.map((m, idx) => (
                    <div key={idx} className="p-3 border border-red-500/10 bg-red-500/5 rounded-xl text-xs font-semibold text-red-500">
                      {m.skipped || m.status === 'skipped' ? '✗ Skipped Commitment: ' : '✗ Missed Commitment: '}"{m.title}"
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Weekly Mood Chart */}
            <Card className="clean-card p-6 space-y-4">
              <h3 className="text-md font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Weekly Mood Dynamics
              </h3>
              {weeklyMoodData.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Add daily journal entries to generate mood dynamics chart.</p>
              ) : (
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyMoodData}>
                      <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[1, 5]} stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="Mood" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

          </div>

          {/* RIGHT: Future You Letter (1/3 width) */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Future You Card */}
            <Card className="clean-card p-6 bg-gradient-to-br from-indigo-900/40 via-indigo-950/20 to-card border-primary/20 space-y-5 relative overflow-hidden">
              <div className="absolute right-2 top-2 opacity-5">
                <Mail className="w-32 h-32" />
              </div>

              <div className="flex items-center gap-2 border-b pb-3 text-primary">
                <Mail className="w-5 h-5" />
                <h4 className="text-xs font-bold uppercase tracking-widest">Future You Letter</h4>
              </div>

              <div className="space-y-4 text-xs leading-relaxed italic text-foreground/90">
                <p className="font-semibold text-primary/80">"Dear Self,"</p>
                <p>"{futureYouLetter.text}"</p>
                <p className="text-right font-bold text-primary/80">— Future You</p>
              </div>

              <p className="text-[9.5px] text-muted-foreground leading-normal mt-2 border-t pt-3">
                This letter is generated based on your completed commitments in the <span className="font-bold uppercase text-[8.5px]">{futureYouLetter.category}</span> category.
              </p>
            </Card>

          </div>

        </div>

      </main>
    </div>
  );
}
