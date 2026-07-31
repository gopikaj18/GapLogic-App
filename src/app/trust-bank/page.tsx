'use client';

import { useMemo, useEffect, useState } from 'react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/lib/DataContext';
import { apiFetch } from '@/lib/api-config';
import { format, parse, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { 
  Coins, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  HelpCircle,
  Calendar,
  Frown,
  LineChart as LucideLineChart
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrustBank() {
  const { trustTransactions, refresh } = useData();
  const [mounted, setMounted] = useState(false);
  const [statementFilter, setStatementFilter] = useState<'current' | 'previous'>('current');

  useEffect(() => {
    setMounted(true);
    document.title = "GapLogic | Trust Bank";
  }, []);

  // Running balance calculator
  const runningBalance = useMemo(() => {
    const credits = trustTransactions.filter(tx => tx.type === 'deposit').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    const debits = trustTransactions.filter(tx => tx.type === 'withdrawal').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    return 100 + credits - debits;
  }, [trustTransactions]);

  // Ledger stats
  const bankStats = useMemo(() => {
    const deposits = trustTransactions.filter(tx => tx.type === 'deposit').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    const withdrawals = trustTransactions.filter(tx => tx.type === 'withdrawal').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    return {
      deposits,
      withdrawals
    };
  }, [trustTransactions]);

  // Statement calculations
  const statementSummary = useMemo(() => {
    const now = new Date();
    const targetMonth = statementFilter === 'current' ? now : subDays(now, 30);
    const start = startOfMonth(targetMonth);
    const end = endOfMonth(targetMonth);

    const filterTx = trustTransactions.filter(tx => {
      const txDate = parse(tx.date, 'yyyy-MM-dd', new Date());
      return txDate >= start && txDate <= end;
    });

    const deposits = filterTx.filter(tx => tx.type === 'deposit').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);
    const withdrawals = filterTx.filter(tx => tx.type === 'withdrawal').reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

    return {
      monthLabel: format(targetMonth, 'MMMM yyyy'),
      transactionsCount: filterTx.length,
      deposits,
      withdrawals,
      netChange: deposits - withdrawals
    };
  }, [trustTransactions, statementFilter]);

  // Recharts Chart Data (Cumulative Self-Trust Growth)
  const chartData = useMemo(() => {
    // Collect last 10 days
    const days = [];
    
    // Calculate historic progression
    const sortedTx = [...trustTransactions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
    
    // Map dates to transactions
    const dateMap: Record<string, number> = {};
    sortedTx.forEach(tx => {
      const amount = tx.type === 'deposit' ? Math.abs(tx.amount) : -Math.abs(tx.amount);
      dateMap[tx.date] = (dateMap[tx.date] || 0) + amount;
    });

    const last10Days = Array.from({ length: 10 }, (_, i) => {
      const d = subDays(new Date(), 9 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        dateStr,
        label: format(d, 'MMM dd')
      };
    });

    // Compute cumulative balance
    const results: { name: string; Balance: number }[] = [];
    // We get starting balance prior to these 10 days
    const tenDaysAgoStr = last10Days[0].dateStr;
    let baseline = 100;
    sortedTx.forEach(tx => {
      if (tx.date < tenDaysAgoStr) {
        const amount = tx.type === 'deposit' ? Math.abs(tx.amount) : -Math.abs(tx.amount);
        baseline += amount;
      }
    });

    let currentBal = baseline;
    last10Days.forEach(day => {
      const change = dateMap[day.dateStr] || 0;
      currentBal += change;
      results.push({
        name: day.label,
        Balance: currentBal
      });
    });

    return results;
  }, [trustTransactions]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <Navigation />
      
      <main className="flex-1 md:ml-64 p-6 lg:p-10 pb-20 max-w-4xl mx-auto w-full space-y-8">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Trust Bank</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your self-trust credit account. Kept promises earn deposits; broken promises draft withdrawals.
            </p>
          </div>
        </header>

        {/* Top Cards: Bank Card + HUD stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Visual Credit Card */}
          <div className="md:col-span-1 bg-gradient-to-br from-primary via-indigo-600 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px] border border-white/10">
            <div className="absolute right-0 top-0 opacity-15 transform translate-x-4 -translate-y-4">
              <Coins className="w-40 h-40" />
            </div>
            
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-white/70">Self-Trust Credit Ledger</p>
                <h4 className="text-sm font-bold mt-0.5">GapLogic Premium</h4>
              </div>
              <Coins className="w-8 h-8 text-white/85" />
            </div>

            <div className="space-y-1 z-10">
              <p className="text-[9.5px] uppercase tracking-widest text-white/60">Available Balance</p>
              <h2 className="text-3xl font-black tracking-tight">{runningBalance} <span className="text-xs font-normal">Credits (CR)</span></h2>
            </div>

            <div className="flex justify-between items-center text-[10px] text-white/75 font-mono">
              <span>HOLDER: CHARACTER BUILDER</span>
              <span>VERIFIED CORES</span>
            </div>
          </div>

          {/* Quick Stats cards */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="clean-card p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Earned Deposits</p>
                <h3 className="text-2xl font-black text-emerald-500">+{bankStats.deposits} CR</h3>
                <p className="text-[11px] text-muted-foreground">Self-respect payouts</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </Card>

            <Card className="clean-card p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Draft Withdrawals</p>
                <h3 className="text-2xl font-black text-red-500">-{bankStats.withdrawals} CR</h3>
                <p className="text-[11px] text-muted-foreground">Broken promise penalty drafts</p>
              </div>
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </Card>
          </div>

        </div>

        {/* Recharts Area Chart displaying Self-Trust Growth */}
        <Card className="clean-card p-6">
          <h3 className="text-md font-bold flex items-center gap-2 mb-4">
            <LucideLineChart className="w-4 h-4 text-primary" />
            Self-Trust Growth Trend (Last 10 Days)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="Balance" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Two-Column Grid: Transaction Ledger & Monthly Statement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LEFT: Transaction ledger (2/3 width) */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              Transaction Ledger
            </h3>
            
            {trustTransactions.length === 0 ? (
              <div className="py-12 border border-dashed rounded-2xl text-center space-y-2 bg-muted/10">
                <Frown className="w-8 h-8 text-muted mx-auto" />
                <p className="text-xs text-muted-foreground italic">No bank statements logged.</p>
              </div>
            ) : (
              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
                {trustTransactions.map(tx => (
                  <div key={tx.id} className="p-3.5 border rounded-xl bg-card hover:bg-muted/10 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {tx.type === 'deposit' ? <ArrowUpRight className="w-4.5 h-4.5" /> : <ArrowDownRight className="w-4.5 h-4.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{format(parse(tx.date, 'yyyy-MM-dd', new Date()), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                    
                    <span className={`text-xs font-black ${
                      tx.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {tx.type === 'deposit' ? `+${tx.amount}` : tx.amount} CR
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Monthly statement (1/3 width) */}
          <Card className="clean-card p-6 md:col-span-1 space-y-4 self-start">
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Monthly Statement
              </h4>
              
              <select
                value={statementFilter}
                onChange={e => setStatementFilter(e.target.value as any)}
                className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-1 rounded-md cursor-pointer border-none focus:outline-none"
              >
                <option value="current">This Month</option>
                <option value="previous">Last Month</option>
              </select>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="text-center py-2 bg-muted/30 border border-dashed rounded-xl">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Statement Period</p>
                <p className="font-bold text-sm text-foreground/90 mt-0.5">{statementSummary.monthLabel}</p>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Transactions Logged</span>
                <span className="font-bold text-foreground">{statementSummary.transactionsCount}</span>
              </div>
              <div className="flex justify-between text-muted-foreground border-t pt-2">
                <span>Total Deposits</span>
                <span className="font-bold text-emerald-500">+{statementSummary.deposits} CR</span>
              </div>
              <div className="flex justify-between text-muted-foreground border-t pt-2">
                <span>Total Withdrawals</span>
                <span className="font-bold text-red-500">-{statementSummary.withdrawals} CR</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-extrabold">
                <span>Statement Net Change</span>
                <span className={statementSummary.netChange >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                  {statementSummary.netChange >= 0 ? `+${statementSummary.netChange}` : statementSummary.netChange} CR
                </span>
              </div>
            </div>
          </Card>

        </div>

      </main>
    </div>
  );
}
