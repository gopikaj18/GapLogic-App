'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/DataContext';
import { apiFetch } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Smile, 
  Sparkles, 
  Calendar,
  Frown,
  Activity,
  Award,
  Save,
  LineChart as LucideLineChart
} from 'lucide-react';
import { format, parse, subDays } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function ReflectionJournal() {
  const { journalEntries, refresh } = useData();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'history' | 'analytics'>('write');
  const [submitting, setSubmitting] = useState(false);
  
  
  // Form states
  const [form, setForm] = useState({
    content: '',
    gratitude: '',
    lessons: '',
    wins: '',
    mood: 3
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    setMounted(true);
    document.title = "GapLogic | Reflection Journal";
  }, []);

  // Streak counter
  const journalStreak = useMemo(() => {
    if (journalEntries.length === 0) return 0;
    
    // Sort descending by date
    const sorted = [...journalEntries].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    
    for (let i = 0; i < sorted.length; i++) {
      const d = parse(sorted[i].date, 'yyyy-MM-dd', new Date());
      const diffDays = Math.round(Math.abs((new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
      
      // If the entry is today or yesterday (to support continuous streak)
      if (diffDays <= streak + 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [journalEntries]);

  const handleSaveEntry = async () => {
    if (!form.content) {
      toast({ variant: 'destructive', title: 'Empty Content', description: 'Write down some reflections before syncing.' });
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          content: form.content,
          gratitude: form.gratitude,
          lessons: form.lessons,
          wins: form.wins,
          mood: Number(form.mood)
        })
      });

      // Award self trust coins (+8 CR for journal complete)
      await apiFetch('/api/trust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 8,
          type: 'deposit',
          description: 'Logged Daily Journal Entry',
          date: today
        })
      });

      toast({ title: 'Reflection Synced! (+8 Self-Trust)', description: 'Journal entry locked.' });
      setForm({ content: '', gratitude: '', lessons: '', wins: '', mood: 3 });
      refresh();
      setActiveTab('history');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Extract keywords for cloud
  const keywordCloud = useMemo(() => {
    if (journalEntries.length === 0) return [];
    const stopWords = new Set(['the', 'and', 'to', 'a', 'of', 'in', 'i', 'was', 'for', 'my', 'that', 'with', 'on', 'at', 'it', 'is']);
    const wordCounts: Record<string, number> = {};

    journalEntries.forEach(entry => {
      const text = `${entry.content} ${entry.lessons} ${entry.wins}`.toLowerCase();
      const words = text.match(/\b[a-z]{3,}\b/g) || [];
      words.forEach(word => {
        if (!stopWords.has(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([text, count]) => ({ text, size: Math.min(24, Math.max(12, 10 + count * 2)) }));
  }, [journalEntries]);

  // Mood trend data
  const moodTrendData = useMemo(() => {
    return [...journalEntries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
      .map(entry => ({
        date: format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'MMM dd'),
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
            <h1 className="text-3xl font-extrabold tracking-tight">Reflection Journal</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Separate from tasks. Formulate daily gratitude, log wins, and map emotional dynamics.
            </p>
          </div>
        </header>

        {/* Navigation tabs */}
        <div className="flex justify-between items-center bg-muted/30 p-1 border rounded-xl max-w-md">
          {[
            { type: 'write', label: 'Write Entry' },
            { type: 'history', label: 'Past Logs' },
            { type: 'analytics', label: 'Analytics' }
          ].map(tab => (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type as any)}
              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === tab.type ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab rendering */}
        {activeTab === 'write' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Input Form Column (2/3 width) */}
            <div className="md:col-span-2 space-y-5">
              <Card className="clean-card p-6 space-y-5 bg-card/60 backdrop-blur">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Daily Writing Prompts
                </h3>

                <div className="space-y-4">
                  {/* Daily thoughts */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">General Thoughts</label>
                    <textarea
                      className="w-full min-h-[100px] text-xs p-3.5 rounded-xl bg-background border focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                      placeholder="Write whatever is on your mind today..."
                      value={form.content}
                      onChange={e => setForm({...form, content: e.target.value})}
                    />
                  </div>

                  {/* Gratitude prompts */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gratitude Prompt</label>
                    <input
                      type="text"
                      className="w-full h-11 px-3.5 rounded-xl bg-background border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="What is 1 thing you are grateful for today?"
                      value={form.gratitude}
                      onChange={e => setForm({...form, gratitude: e.target.value})}
                    />
                  </div>

                  {/* Wins */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Biggest Win</label>
                    <input
                      type="text"
                      className="w-full h-11 px-3.5 rounded-xl bg-background border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Describe your primary success today"
                      value={form.wins}
                      onChange={e => setForm({...form, wins: e.target.value})}
                    />
                  </div>

                  {/* Lessons */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lessons Learned</label>
                    <input
                      type="text"
                      className="w-full h-11 px-3.5 rounded-xl bg-background border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="What did you learn from deviations or friction today?"
                      value={form.lessons}
                      onChange={e => setForm({...form, lessons: e.target.value})}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <Button onClick={handleSaveEntry} disabled={submitting} className="w-full h-12 text-xs font-bold gap-2 bg-primary hover:bg-primary/95 text-white rounded-xl">
                  <Save className="w-4 h-4" /> Save Reflection Log
                </Button>

              </Card>
            </div>

            {/* Sidebar Column: Photo/Voice Mock + Streak (1/3 width) */}
            <div className="md:col-span-1 space-y-6">
              
              {/* Streak info */}
              <Card className="clean-card p-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Journal Streak</p>
                  <h4 className="text-2xl font-black mt-0.5">{journalStreak} Days</h4>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Consecutive days writing</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                  <Smile className="w-6 h-6" />
                </div>
              </Card>

              {/* Mood picker card */}
              <Card className="clean-card p-6 space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">State Rating</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold">Today's Mood Rating</span>
                  <Badge variant="secondary" className="font-bold">{form.mood}/5</Badge>
                </div>
                <input
                  type="range" min="1" max="5" step="1"
                  value={form.mood}
                  onChange={e => setForm({...form, mood: Number(e.target.value)})}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                  <span>Low Energy / Stressed</span>
                  <span>Focused / Calm</span>
                </div>
              </Card>


            </div>
          </div>
        )}

        {/* Tab 2: Past Logs list */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {journalEntries.length === 0 ? (
              <div className="py-12 border border-dashed rounded-2xl text-center space-y-2 bg-muted/10">
                <Frown className="w-8 h-8 text-muted mx-auto" />
                <p className="text-xs text-muted-foreground italic">No journal entries logged.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {journalEntries.map(entry => (
                  <Card key={entry.id} className="clean-card p-6 space-y-4">
                    <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold">{format(parse(entry.date, 'yyyy-MM-dd', new Date()), 'eeee, MMM dd, yyyy')}</span>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">Mood: {entry.mood}/5</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="sm:col-span-2 space-y-3">
                        <div>
                          <p className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">Reflection Content</p>
                          <p className="text-xs leading-relaxed mt-1 text-foreground/90 whitespace-pre-wrap">{entry.content}</p>
                        </div>
                        {entry.lessons && (
                          <div className="p-3.5 bg-muted/20 border border-dashed rounded-xl">
                            <p className="text-[9.5px] font-bold uppercase tracking-widest text-primary">Lessons Extracted</p>
                            <p className="text-xs mt-1 leading-normal italic">"{entry.lessons}"</p>
                          </div>
                        )}
                      </div>

                      <div className="sm:col-span-1 space-y-3.5">
                        {entry.gratitude && (
                          <div>
                            <p className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">Grateful for</p>
                            <p className="text-xs mt-0.5 leading-normal">{entry.gratitude}</p>
                          </div>
                        )}
                        {entry.wins && (
                          <div>
                            <p className="text-[9.5px] font-bold uppercase tracking-widest text-emerald-500">Biggest Win</p>
                            <p className="text-xs mt-0.5 leading-normal font-semibold text-emerald-500">{entry.wins}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Analytics (Word Cloud + Mood graph) */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mood trend graph (2/3 width) */}
            <Card className="clean-card p-6 md:col-span-2 space-y-4">
              <h3 className="text-md font-bold flex items-center gap-2">
                <LucideLineChart className="w-4 h-4 text-primary" />
                Mood / Emotional Timeline (Last 7 Logs)
              </h3>
              {journalEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Add entries to generate emotional timeline chart.</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={moodTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[1, 5]} stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                      <Line type="monotone" dataKey="Mood" stroke="hsl(var(--primary))" strokeWidth={2.5} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Keyword tag cloud (1/3 width) */}
            <Card className="clean-card p-6 md:col-span-1 space-y-4">
              <h3 className="text-md font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Reflection Cloud
              </h3>
              {keywordCloud.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Write reflections to extract keyword clouds.</p>
              ) : (
                <div className="flex flex-wrap gap-2 py-4 justify-center items-center">
                  {keywordCloud.map((item) => (
                    <span
                      key={item.text}
                      className="font-extrabold text-primary hover:text-foreground cursor-default transition-colors bg-primary/5 px-2.5 py-1 rounded-lg"
                      style={{ fontSize: `${item.size}px` }}
                    >
                      {item.text}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

      </main>
    </div>
  );
}
