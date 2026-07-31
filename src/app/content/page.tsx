'use client';

import { useState, useMemo, useEffect } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useData } from '@/lib/DataContext';
import { ARTICLES, Article } from '@/data/articles';
import { 
  BookOpen, 
  Bookmark, 
  BookmarkCheck, 
  Activity, 
  ShieldCheck, 
  Zap, 
  Timer, 
  Target, 
  X, 
  Search, 
  Sparkles,
  ArrowLeft,
  Check
} from 'lucide-react';

export default function ContentLibrary() {
  const { logs, trustTransactions } = useData();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  useEffect(() => {
    setMounted(true);
    document.title = "GapLogic | Library";
    
    // Load saved bookmarks from localStorage
    const saved = localStorage.getItem('gaplogic_saved_articles');
    if (saved) {
      try {
        setSavedIds(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved articles:', e);
      }
    }
  }, []);

  // Heuristic recommendation algorithm based on user's live database logs
  const suggestedArticleIds = useMemo(() => {
    const suggestions = new Set<string>();
    
    // 1. Calculate self-trust score
    const credits = trustTransactions.filter(tx => tx.type === 'deposit').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    const debits = trustTransactions.filter(tx => tx.type === 'withdrawal').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    const trustScore = 100 + credits - debits;

    if (trustScore < 90) {
      suggestions.add('decoding-trust-bank');
      suggestions.add('integrity-compacts');
    }

    // 2. Count missed logs
    const missedLogsCount = logs.filter(l => !l.completed).length;
    if (missedLogsCount > 2) {
      suggestions.add('rebuilding-momentum');
      suggestions.add('recovery-protocol');
    }

    // 3. Count distraction logs or low completion rate
    const totalLogs = logs.length;
    const completedLogs = logs.filter(l => l.completed).length;
    const completionRate = totalLogs > 0 ? completedLogs / totalLogs : 1;
    const distractionLogs = logs.filter(l => l.distractions).length;

    if (distractionLogs > 0 || completionRate < 0.75) {
      suggestions.add('environment-design');
      suggestions.add('friction-gap');
    }

    // Default fallbacks if user profile is perfect
    if (suggestions.size === 0) {
      suggestions.add('identity-vs-goals');
      suggestions.add('voting-future-self');
    }

    return suggestions;
  }, [logs, trustTransactions]);

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedIds.includes(id)
      ? savedIds.filter(item => item !== id)
      : [...savedIds, id];
    setSavedIds(updated);
    localStorage.setItem('gaplogic_saved_articles', JSON.stringify(updated));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Identity & Habits':
        return <Target className="w-5 h-5 text-indigo-400" />;
      case 'Routine & Consistency':
        return <Timer className="w-5 h-5 text-emerald-400" />;
      case 'Self-Trust & Integrity':
        return <ShieldCheck className="w-5 h-5 text-blue-400" />;
      case 'Recovery & Resilience':
        return <Activity className="w-5 h-5 text-rose-400" />;
      case 'Focus & Deep Work':
        return <Zap className="w-5 h-5 text-amber-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-primary" />;
    }
  };

  const categories = [
    'All',
    'Saved',
    'Routine & Consistency',
    'Identity & Habits',
    'Self-Trust & Integrity',
    'Recovery & Resilience',
    'Focus & Deep Work'
  ];

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter(article => {
      // 1. Filter by category tabs
      if (selectedCategory === 'Saved') {
        if (!savedIds.includes(article.id)) return false;
      } else if (selectedCategory !== 'All') {
        if (article.category !== selectedCategory) return false;
      }

      // 2. Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesExcerpt = article.excerpt.toLowerCase().includes(query);
        const matchesCategory = article.category.toLowerCase().includes(query);
        return matchesTitle || matchesExcerpt || matchesCategory;
      }

      return true;
    });
  }, [selectedCategory, searchQuery, savedIds]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />

      <main className="flex-1 md:ml-64 p-6 lg:p-10 pb-20 max-w-5xl mx-auto w-full space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Content Library</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Learn the science behind consistency, identity-based habits, and building self-trust.
            </p>
          </div>
        </header>

        {/* Toolbar: Search + Category Filters */}
        <div className="space-y-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles, keywords, topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground/60"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap pb-2 overflow-x-auto scrollbar-none">
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${
                    isActive
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {cat === 'Saved' ? `Saved (${savedIds.length})` : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl space-y-3">
            <BookOpen className="w-12 h-12 text-muted-foreground/45 mx-auto" />
            <h3 className="font-bold text-lg">No articles found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {selectedCategory === 'Saved' 
                ? "You haven't bookmarked any articles yet. Save some articles to view them here later!"
                : "Try adjusting your search filters or browse other categories."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.map(article => {
              const isSaved = savedIds.includes(article.id);
              const isSuggested = suggestedArticleIds.has(article.id);
              
              return (
                <Card 
                  key={article.id}
                  onClick={() => setActiveArticle(article)}
                  className="clean-card group cursor-pointer hover:border-primary/30 transition-all flex flex-col justify-between"
                >
                  <CardContent className="p-6 space-y-4">
                    {/* Top Row: Category Icon & Bookmark Toggle */}
                    <div className="flex justify-between items-center">
                      <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                        {getCategoryIcon(article.category)}
                      </div>
                      <button
                        onClick={(e) => toggleSave(article.id, e)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isSaved 
                            ? 'bg-primary/15 text-primary' 
                            : 'text-muted-foreground/60 hover:text-foreground hover:bg-secondary'
                        }`}
                      >
                        {isSaved ? <BookmarkCheck className="w-4.5 h-4.5" /> : <Bookmark className="w-4.5 h-4.5" />}
                      </button>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider py-0.5 border-border/50 bg-secondary/30">
                        {article.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {article.readTime}
                      </span>
                      {isSuggested && (
                        <Badge className="text-[9px] font-bold uppercase tracking-wider py-0.5 bg-gradient-to-r from-primary to-indigo-600 border-none text-white flex items-center gap-1 shadow-sm shadow-primary/10">
                          <Sparkles className="w-2.5 h-2.5" /> Suggested for You
                        </Badge>
                      )}
                    </div>

                    {/* Excerpt */}
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-lg tracking-tight group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {article.excerpt}
                      </p>
                    </div>

                    {/* Bottom Action Hint */}
                    <div className="text-[11px] font-bold uppercase tracking-wider text-primary group-hover:translate-x-1.5 transition-transform inline-flex items-center gap-1 mt-2">
                      Read Article &rarr;
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Article Reader Overlay Modal */}
        {activeArticle && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-10 flex justify-center animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-card border border-border/50 rounded-3xl shadow-2xl p-6 md:p-10 space-y-8 my-auto relative animate-in slide-in-from-bottom-6 duration-300">
              
              {/* Back to library & Bookmark */}
              <div className="flex justify-between items-center border-b pb-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveArticle(null)}
                  className="gap-2 text-muted-foreground hover:text-foreground text-xs"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Library
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => toggleSave(activeArticle.id, e)}
                    className={`h-9 px-3 gap-1.5 text-xs rounded-xl ${
                      savedIds.includes(activeArticle.id)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {savedIds.includes(activeArticle.id) ? (
                      <>
                        <BookmarkCheck className="w-4 h-4" /> Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" /> Save
                      </>
                    )}
                  </Button>

                  <button 
                    onClick={() => setActiveArticle(null)}
                    className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-3">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest py-0.5 bg-secondary/50">
                  {activeArticle.category}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                  {activeArticle.title}
                </h2>
                <div className="text-xs text-muted-foreground flex items-center gap-3 font-semibold pt-1">
                  <span>{activeArticle.readTime}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-primary">
                    {getCategoryIcon(activeArticle.category)} GapLogic Core Philosophy
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="space-y-6 text-sm md:text-base leading-relaxed text-foreground/90 max-w-none">
                {activeArticle.body.map((para, idx) => (
                  <p key={idx} className="font-normal">
                    {para}
                  </p>
                ))}
              </div>

              {/* Footer Completed trigger */}
              <div className="border-t pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs text-muted-foreground italic flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  "A vote for your future self."
                </div>
                <Button 
                  onClick={() => setActiveArticle(null)}
                  className="w-full sm:w-auto h-11 px-8 rounded-xl font-bold gap-2 text-sm shadow-lg shadow-primary/20"
                >
                  <Check className="w-4.5 h-4.5" /> Finish Reading
                </Button>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
