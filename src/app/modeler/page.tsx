'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { addIntention } from '@/lib/firestore';
import { useData } from '@/lib/DataContext';
import { apiFetch } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Plus, Loader2, Layers, Clock, Calendar, Brain, Sparkles, TrendingUp, TrendingDown, Info, ChevronDown, ChevronUp, Zap, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


export default function Modeler() {
  const { toast } = useToast();
  const { intentions, loading, refresh } = useData();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'work' as const,
    effortEstimate: 3,
    estimatedDuration: 25,
    scheduledTime: format(new Date(), 'HH:mm'),
    date: today,
  });

  const [prediction, setPrediction] = useState<{
    prediction: 'completed' | 'missed' | 'partially_completed';
    probability: number;
    reasoning: string;
    suggestedAction: string;
    classifierPrediction?: {
      probability: number;
      prediction: 'completed' | 'missed';
      featuresUsed: {
        normalizedEffort: number;
        categoryCompletionRate: number;
        timeOfDayCompletionRate: number;
        previousTaskSuccess: number;
      };
    };
    modelInfo?: {
      weights: number[];
      bias: number;
      featureNames: string[];
    };
  } | null>(null);
  const [activePredictTab, setActivePredictTab] = useState<'llm' | 'ml'>('llm');
  const [checkingPrediction, setCheckingPrediction] = useState(false);
  const [showMathDetails, setShowMathDetails] = useState(false);

  useEffect(() => {
    document.title = "GapLogic — Modeler";
  }, []);

  const checkFeasibility = async () => {
    if (!formData.title || formData.title.trim().length < 3) {
      setPrediction(null);
      return;
    }
    setCheckingPrediction(true);
    try {
      const res = await apiFetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
      }
    } catch (err) {
      console.error('Error fetching prediction:', err);
    } finally {
      setCheckingPrediction(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      checkFeasibility();
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData.title, formData.category, formData.effortEstimate, formData.estimatedDuration, formData.scheduledTime, formData.date]);

  const filteredIntentions = useMemo(() => {
    return intentions.filter(i => i.date === selectedDate);
  }, [intentions, selectedDate]);


  const handleAdd = async () => {
    if (!formData.title) {
      toast({ variant: "destructive", title: "Missing Title", description: "Please name your intention." });
      return;
    }

    setSubmitting(true);
    try {
      await addIntention({
        title: formData.title,
        category: formData.category,
        effortEstimate: formData.effortEstimate,
        estimatedDuration: formData.estimatedDuration,
        scheduledTime: formData.scheduledTime,
        date: formData.date,
      });
      await refresh();
      toast({ title: "Intention Locked", description: "Added to your behavioral stack." });
      setFormData(prev => ({ ...prev, title: '', effortEstimate: 3, estimatedDuration: 25 }));
    } catch (error: any) {
      console.error('[handleAdd]', error);
      toast({
        variant: "destructive",
        title: "Failed to Create Intention",
        description: error?.message || "Could not save intention. Please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Math parameters for the Logistic Regression model display
  const w = prediction?.modelInfo?.weights ?? [-0.3, 0.6, 0.4, 0.3];
  const b = prediction?.modelInfo?.bias ?? -0.1;
  const f = [
    (formData.effortEstimate - 1) / 4,
    prediction?.classifierPrediction?.featuresUsed?.categoryCompletionRate ?? 0.5,
    prediction?.classifierPrediction?.featuresUsed?.timeOfDayCompletionRate ?? 0.5,
    prediction?.classifierPrediction?.featuresUsed?.previousTaskSuccess ?? 0.5
  ];
  const zVal = (f[0] * w[0]) + (f[1] * w[1]) + (f[2] * w[2]) + (f[3] * w[3]) + b;

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      <main className="flex-1 md:ml-64 p-6 lg:p-10 pb-24 md:pb-10 max-w-5xl mx-auto w-full space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Intention Modeler</h1>
            <p className="text-muted-foreground">Architect your behavioral session.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Selected Timeline</Label>
            <div className="flex items-center gap-2 bg-card border rounded-xl p-2 pr-4 shadow-sm">
              <Calendar className="w-5 h-5 text-primary ml-2" />
              <Input 
                type="date" value={selectedDate} 
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setFormData(prev => ({ ...prev, date: e.target.value }));
                }}
                className="w-40 border-none bg-transparent h-9 focus-visible:ring-0 text-sm font-bold"
              />
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-10">
          <Card className="clean-card shadow-sm border-primary/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                New Behavioral Intention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6 lg:col-span-1">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Task Definition</Label>
                    <Input 
                      placeholder="e.g. Strategic Planning Session" 
                      value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                      className="rounded-xl h-14 text-lg bg-background font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Domain</Label>
                      <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v as any})}>
                        <SelectTrigger className="rounded-xl h-12 bg-background font-bold capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="health">Health</SelectItem>
                          <SelectItem value="learning">Learning</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Time (Min)</Label>
                      <Input 
                        type="number" value={formData.estimatedDuration} 
                        onChange={e => setFormData({...formData, estimatedDuration: parseInt(e.target.value) || 25})} 
                        className="rounded-xl h-12 bg-background font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Scheduled Start Time</Label>
                    <Input 
                      type="time" value={formData.scheduledTime} 
                      onChange={e => setFormData({...formData, scheduledTime: e.target.value})} 
                      className="rounded-xl h-12 bg-background font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-8 flex flex-col justify-between lg:col-span-1">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Predicted Effort Required</Label>
                      <Badge variant="outline" className="border-primary/20 text-primary h-7 px-4 font-bold">{formData.effortEstimate}/5</Badge>
                    </div>
                    <Slider 
                      value={[formData.effortEstimate]} 
                      min={1} max={5} step={1} 
                      onValueChange={([v]) => setFormData({...formData, effortEstimate: v})} 
                      className="py-4"
                    />
                  </div>
                  <Button 
                    className="w-full h-14 text-lg font-bold gap-3 rounded-xl shadow-lg shadow-primary/10" 
                    onClick={handleAdd} 
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} 
                    Establish Intention
                  </Button>
                </div>
                <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l lg:pl-8 pt-6 lg:pt-0 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-primary font-bold text-sm uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        <span>AI Feasibility Check</span>
                      </div>
                    </div>

                    <div className="flex rounded-lg bg-muted p-1 border">
                      <button 
                        onClick={() => setActivePredictTab('llm')} 
                        className={cn("flex-1 text-[10px] uppercase tracking-wider py-1.5 rounded-md font-bold transition-all", activePredictTab === 'llm' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                      >
                        LLM Forecast
                      </button>
                      <button 
                        onClick={() => setActivePredictTab('ml')} 
                        className={cn("flex-1 text-[10px] uppercase tracking-wider py-1.5 rounded-md font-bold transition-all", activePredictTab === 'ml' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                      >
                        ML Math Audit
                      </button>
                    </div>
                    
                    {checkingPrediction ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-60" />
                        <p className="text-xs text-muted-foreground">Auditing intention feasibility...</p>
                      </div>
                    ) : prediction ? (
                      activePredictTab === 'llm' ? (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl border flex items-center justify-between bg-card shadow-sm">
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gemma Forecast</p>
                              <p className={cn("text-lg font-bold capitalize mt-0.5", 
                                prediction.prediction === 'completed' ? "text-emerald-500" : 
                                prediction.prediction === 'missed' ? "text-destructive" : "text-amber-500"
                              )}>
                                {prediction.prediction.replace('_', ' ')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Probability</p>
                              <p className="text-lg font-bold text-primary mt-0.5">{Math.round(prediction.probability * 100)}%</p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Contextual AI Analysis</p>
                            <p className="text-xs leading-relaxed text-foreground bg-muted/30 p-3 rounded-lg border">{prediction.reasoning}</p>
                          </div>

                          {prediction.suggestedAction && (
                            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Suggested Habit Tweak</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{prediction.suggestedAction}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {prediction.classifierPrediction ? (
                            <>
                              {/* Prediction Status & Confidence Meter */}
                              <div className="p-4 rounded-2xl border bg-card shadow-sm space-y-3">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Model Prediction</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <p className={cn("text-lg font-bold capitalize", 
                                        prediction.classifierPrediction.prediction === 'completed' ? "text-emerald-500" : "text-destructive"
                                      )}>
                                        {prediction.classifierPrediction.prediction}
                                      </p>
                                      <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider py-0.5",
                                        prediction.classifierPrediction.prediction === 'completed' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                                      )}>
                                        {prediction.classifierPrediction.prediction === 'completed' ? 'Favorable' : 'At Risk'}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Math Confidence</p>
                                    <p className="text-lg font-bold text-primary mt-0.5">
                                      {Math.round(prediction.classifierPrediction.probability * 100)}%
                                    </p>
                                  </div>
                                </div>

                                {/* Custom Visual Probability Meter */}
                                <div className="space-y-1">
                                  <div className="relative w-full h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 transition-all duration-700 rounded-full"
                                      style={{ width: `${Math.round(prediction.classifierPrediction.probability * 100)}%` }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground text-center">
                                    Model assesses a <span className="font-bold text-foreground">{Math.round(prediction.classifierPrediction.probability * 100)}% likelihood</span> of completing this task based on current patterns.
                                  </p>
                                </div>
                              </div>

                              {/* Features Explainer */}
                              <div className="space-y-3.5">
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Behavioral Drivers Breakdown</p>
                                  <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
                                    z = {zVal.toFixed(2)}
                                  </span>
                                </div>

                                <div className="space-y-3">
                                  {[
                                    {
                                      name: "Task Complexity (Effort)",
                                      icon: <Layers className="w-3.5 h-3.5" />,
                                      valText: `Level ${formData.effortEstimate}/5`,
                                      impact: f[0] * w[0],
                                      desc: "Task difficulty creates initial mental resistance and execution friction.",
                                    },
                                    {
                                      name: "Domain Habit Strength",
                                      icon: <Brain className="w-3.5 h-3.5" />,
                                      valText: `${(f[1] * 100).toFixed(0)}% completion rate`,
                                      impact: f[1] * w[1],
                                      desc: `Your historical consistency when working on "${formData.category}" intentions.`,
                                    },
                                    {
                                      name: "Schedule Alignment",
                                      icon: <Clock className="w-3.5 h-3.5" />,
                                      valText: `${(f[2] * 100).toFixed(0)}% completion rate`,
                                      impact: f[2] * w[2],
                                      desc: `Success rate in this scheduling slot (${formData.scheduledTime.split(':')[0]}:00).`,
                                    },
                                    {
                                      name: "Willpower Momentum",
                                      icon: <Zap className="w-3.5 h-3.5" />,
                                      valText: f[3] === 1 ? "Last Task Success" : f[3] === 0 ? "Last Task Missed" : "No recent task",
                                      impact: f[3] * w[3],
                                      desc: "Inertia carried over from the outcome of your immediate prior scheduled task.",
                                    },
                                    {
                                      name: "Baseline Starting Drive (Bias)",
                                      icon: <TrendingUp className="w-3.5 h-3.5" />,
                                      valText: `Constant factor`,
                                      impact: b,
                                      desc: "Your inherent starting baseline energy level before specific task attributes are weighed.",
                                    }
                                  ].map((feature, index) => {
                                    const isPositive = feature.impact >= 0;
                                    const absImpact = Math.abs(feature.impact);
                                    // Scale to show visual magnitude, typical max absolute impact is ~0.8
                                    const percent = Math.min((absImpact / 0.8) * 50, 50);

                                    return (
                                      <div key={index} className="p-3 rounded-xl border bg-card/50 hover:bg-card transition-all space-y-2">
                                        <div className="flex justify-between items-start">
                                          <div className="flex items-center gap-2">
                                            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center border", 
                                              isPositive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-destructive/10 border-destructive/20 text-destructive"
                                            )}>
                                              {feature.icon}
                                            </div>
                                            <div>
                                              <p className="text-xs font-bold">{feature.name}</p>
                                              <p className="text-[10px] text-muted-foreground font-medium">{feature.valText}</p>
                                            </div>
                                          </div>
                                          <Badge className={cn("text-[9px] font-mono font-bold tracking-wider py-0.5 border-none",
                                            isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
                                          )}>
                                            {isPositive ? "+" : ""}{feature.impact.toFixed(2)} {isPositive ? "Boost" : "Friction"}
                                          </Badge>
                                        </div>

                                        {/* Visual Diverging Bar */}
                                        <div className="space-y-0.5">
                                          <div className="relative w-full h-2.5 bg-muted/60 rounded-full flex items-center">
                                            {/* Center line */}
                                            <div className="absolute left-1/2 w-0.5 h-full bg-border z-10" />
                                            {isPositive ? (
                                              <div 
                                                className="absolute left-1/2 h-full bg-emerald-500 rounded-r-full transition-all duration-500"
                                                style={{ width: `${percent}%` }}
                                              />
                                            ) : (
                                              <div 
                                                className="absolute right-1/2 h-full bg-destructive rounded-l-full transition-all duration-500"
                                                style={{ width: `${percent}%` }}
                                              />
                                            )}
                                          </div>
                                          <div className="flex justify-between text-[8px] text-muted-foreground/80 px-0.5">
                                            <span>← Willpower Friction (Drag)</span>
                                            <span>Habit Boost (Help) →</span>
                                          </div>
                                        </div>

                                        <p className="text-[10px] text-muted-foreground leading-relaxed">{feature.desc}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Toggleable Equation Details (for advanced transparency) */}
                              <div className="border-t pt-3 mt-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setShowMathDetails(!showMathDetails)}
                                  className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground text-[10px] uppercase font-bold py-1 h-8 rounded-lg"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <Calculator className="w-3.5 h-3.5" />
                                    {showMathDetails ? "Hide Mathematical Formulas" : "View Raw Classifier Math"}
                                  </span>
                                  {showMathDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </Button>

                                {showMathDetails && (
                                  <div className="p-3.5 rounded-xl border border-primary/10 bg-muted/20 space-y-3.5 text-xs font-mono mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-1 border-b pb-2 border-border/60">
                                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 font-sans">Linear Combination (z)</p>
                                      <p className="text-[10.5px] leading-relaxed text-muted-foreground">
                                        z = (x₀ × w₀) + (x₁ × w₁) + (x₂ × w₂) + (x₃ × w₃) + b
                                      </p>
                                      <p className="text-[10.5px] leading-relaxed text-foreground mt-1">
                                        z = ({f[0].toFixed(2)} × {w[0].toFixed(2)}) + ({f[1].toFixed(2)} × {w[1].toFixed(2)}) + ({f[2].toFixed(2)} × {w[2].toFixed(2)}) + ({f[3].toFixed(2)} × {w[3].toFixed(2)}) + ({b.toFixed(2)})
                                      </p>
                                      <p className="text-[10.5px] font-bold text-foreground mt-1">
                                        z = {zVal.toFixed(4)}
                                      </p>
                                    </div>

                                    <div className="space-y-1.5">
                                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 font-sans">Sigmoid Squashing Function σ(z)</p>
                                      <p className="text-[10.5px] leading-relaxed text-muted-foreground">
                                        σ(z) = 1 / (1 + e^(-z))
                                      </p>
                                      <p className="text-[10.5px] leading-relaxed text-muted-foreground">
                                        P(completed) = 1 / (1 + e^(-{zVal.toFixed(4)}))
                                      </p>
                                      <p className="text-[10.5px] font-bold text-foreground">
                                        P = 1 / (1 + {Math.exp(-zVal).toFixed(4)}) = {prediction.classifierPrediction.probability.toFixed(4)} ({Math.round(prediction.classifierPrediction.probability * 100)}%)
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="py-8 border border-dashed rounded-xl flex flex-col items-center justify-center text-center p-5 space-y-2">
                              <Brain className="w-7 h-7 text-muted-foreground opacity-30 animate-pulse" />
                              <p className="text-xs font-bold">Unlocking Habit Analytics</p>
                              <p className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed">
                                Complete at least 3 scheduled tasks to train your local model and unlock mathematical coefficients.
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="py-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4">
                        <Sparkles className="w-8 h-8 text-muted-foreground opacity-40 mb-2" />
                        <p className="text-xs text-muted-foreground font-medium">Enter a title to forecast completion feasibility</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Layers className="w-6 h-6 text-primary" />
                Scheduled Intentions
              </h2>
              <Badge variant="secondary" className="px-4 h-7 text-[10px] font-bold uppercase tracking-widest">
                {filteredIntentions.length} Defined
              </Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-44 bg-card border rounded-2xl animate-pulse" />)}
              </div>
            ) : filteredIntentions.length === 0 ? (
              <div className="p-20 border-2 border-dashed border-border rounded-3xl text-center text-muted-foreground bg-card/20">
                <p className="font-medium">No intentions established for this date.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntentions.map((item) => (
                  <Card key={item.id} className="clean-card p-6 flex flex-col justify-between h-44 hover:border-primary/30 transition-all cursor-default group">
                    <div className="flex justify-between items-start">
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-bold tracking-widest px-3 h-6">
                        {item.category}
                      </Badge>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Effort</p>
                        <p className="text-sm font-bold text-primary">{item.effortEstimate}/5</p>
                      </div>
                    </div>
                    <p className="font-bold text-lg leading-tight line-clamp-2">{item.title}</p>
                    <div className="flex items-center gap-2 text-muted-foreground pt-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {Math.floor(item.estimatedDuration / 60)}m {item.estimatedDuration % 60}s
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
