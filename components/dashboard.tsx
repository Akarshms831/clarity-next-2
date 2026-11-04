"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowDownLeft, ArrowUpRight, CalendarDays, ChevronDown, CircleHelp, CreditCard, LayoutDashboard, Plus, Search, Settings2, Wallet } from "lucide-react";

type Transaction = { id: number; title: string; category: string; date: string; amount: number; kind: "income" | "expense" };
const initial: Transaction[] = [
  { id: 1, title: "Monthly salary", category: "Income", date: "Nov 01, 2026", amount: 68000, kind: "income" },
  { id: 2, title: "House rent", category: "Housing", date: "Nov 02, 2026", amount: 14500, kind: "expense" },
  { id: 3, title: "Groceries", category: "Food & dining", date: "Nov 03, 2026", amount: 3240, kind: "expense" },
  { id: 4, title: "Fuel", category: "Transport", date: "Nov 04, 2026", amount: 1800, kind: "expense" },
];
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const [transactions, setTransactions] = useState(initial);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const totals = useMemo(() => ({
    income: transactions.filter(t => t.kind === "income").reduce((s, t) => s + t.amount, 0),
    expense: transactions.filter(t => t.kind === "expense").reduce((s, t) => s + t.amount, 0),
  }), [transactions]);
  const filtered = transactions.filter(t => (t.title + t.category).toLowerCase().includes(query.toLowerCase()));
  function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!title.trim() || !Number.isFinite(value) || value <= 0) return;
    setTransactions(current => [{ id: Date.now(), title: title.trim(), category: kind === "income" ? "Income" : "General", date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), amount: value, kind }, ...current]);
    setTitle(""); setAmount(""); setShowForm(false);
  }
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[230px_1fr]">
        <aside className="glass hidden h-[calc(100vh-4rem)] rounded-3xl p-5 lg:flex lg:flex-col">
          <div className="mb-10 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-400/20 text-violet-200"><Wallet size={21}/></div><div><div className="font-semibold tracking-wide">clarity</div><div className="text-xs text-white/40">PERSONAL FINANCE</div></div></div>
          <div className="mb-3 px-3 text-[10px] font-semibold tracking-[.2em] text-white/35">WORKSPACE</div>
          <nav className="space-y-2"><div className="flex items-center gap-3 rounded-xl bg-violet-400/15 px-3 py-3 text-sm text-violet-200"><LayoutDashboard size={17}/> Overview</div><div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/55"><Activity size={17}/> Transactions</div><div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/55"><Wallet size={17}/> Budgets</div><div className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/55"><CalendarDays size={17}/> Reports</div></nav>
          <div className="mt-auto space-y-2 border-t border-white/10 pt-5"><div className="flex items-center gap-3 px-3 py-2 text-sm text-white/50"><Settings2 size={17}/> Settings</div><div className="flex items-center gap-3 px-3 py-2 text-sm text-white/50"><CircleHelp size={17}/> Help & support</div></div>
        </aside>
        <section className="min-w-0">
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="mb-1 text-sm text-white/40">Monday, November 5, 2026</p><h1 className="text-3xl font-semibold tracking-tight">Your overview</h1><p className="mt-1 text-sm text-white/45">Here’s what’s happening with your money.</p></div><button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-violet-300 px-4 py-3 text-sm font-semibold text-[#171326] transition hover:bg-violet-200"><Plus size={17}/> Add transaction</button></header>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Metric label="Total balance" value={money(totals.income - totals.expense)} icon={<Wallet size={19}/>} note="Income minus expenses"/>
            <Metric label="Total income" value={money(totals.income)} icon={<ArrowDownLeft size={19}/>} note="Money received" />
            <Metric label="Total expenses" value={money(totals.expense)} icon={<ArrowUpRight size={19}/>} note="Money spent" />
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="glass rounded-3xl p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Recent transactions</h2><p className="mt-1 text-xs text-white/40">Your latest money movements</p></div><button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60">This month <ChevronDown size={14}/></button></div>
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 px-3"><Search size={16} className="text-white/35"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search transactions..." className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-white/30"/></div>
              <div className="space-y-1">{filtered.map(t => <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-white/[.035]"><div className="flex min-w-0 items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.06] text-white/65">{t.kind === "income" ? <ArrowDownLeft size={18}/> : <CreditCard size={18}/>}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{t.title}</p><p className="mt-1 text-xs text-white/40">{t.category} · {t.date}</p></div></div><p className={t.kind === "income" ? "text-sm font-semibold text-emerald-300" : "text-sm font-semibold text-white/85"}>{t.kind === "income" ? "+" : "−"}{money(t.amount)}</p></div>)}</div>
              {filtered.length === 0 && <p className="py-8 text-center text-sm text-white/40">No matching transactions.</p>}
            </div>
            <div className="glass rounded-3xl p-5 md:p-6"><h2 className="font-semibold">Monthly spending</h2><p className="mt-1 text-xs text-white/40">A quick look at your outflow</p><div className="my-8"><div className="mb-2 flex items-end justify-between"><span className="text-3xl font-semibold">{money(totals.expense)}</span><span className="text-xs text-white/40">this month</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-300" style={{ width: "42%" }}/></div><p className="mt-3 text-xs text-white/40">Add budgets to track your spending limits.</p></div><div className="space-y-4 border-t border-white/10 pt-5"><div className="flex justify-between text-sm"><span className="text-white/55">Savings this month</span><span className="font-medium text-emerald-300">{money(totals.income - totals.expense)}</span></div><div className="flex justify-between text-sm"><span className="text-white/55">Savings rate</span><span className="font-medium">{totals.income ? Math.round((totals.income - totals.expense) / totals.income * 100) : 0}%</span></div></div></div>
          </div>
          <p className="mt-6 text-center text-xs text-white/25">Clarity · Your money, made clear.</p>
        </section>
      </div>
      {showForm && <div className="fixed inset-0 z-20 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"><form onSubmit={addTransaction} className="glass w-full max-w-md rounded-3xl p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold">New transaction</h2><button type="button" onClick={() => setShowForm(false)} className="text-sm text-white/45">Close</button></div><div className="mb-4 grid grid-cols-2 gap-2">{(["expense","income"] as const).map(k => <button key={k} type="button" onClick={() => setKind(k)} className={kind === k ? "rounded-xl bg-violet-300 py-3 text-sm font-semibold capitalize text-[#171326]" : "rounded-xl border border-white/10 py-3 text-sm capitalize text-white/60"}>{k}</button>)}</div><label className="mb-2 block text-xs text-white/55">Description</label><input required value={title} onChange={e => setTitle(e.target.value)} className="mb-4 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-violet-300/60" placeholder="e.g. Electricity bill"/><label className="mb-2 block text-xs text-white/55">Amount (₹)</label><input required min="1" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="mb-6 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-violet-300/60" placeholder="0"/><button className="w-full rounded-xl bg-violet-300 py-3 text-sm font-semibold text-[#171326]">Save transaction</button></form></div>}
    </main>
  );
}
function Metric({ label, value, icon, note }: { label: string; value: string; icon: React.ReactNode; note: string }) {
  return <div className="glass rounded-3xl p-5"><div className="mb-5 flex items-center justify-between"><span className="text-sm text-white/50">{label}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.06] text-violet-200">{icon}</span></div><div className="text-2xl font-semibold tracking-tight">{value}</div><p className="mt-2 text-xs text-white/35">{note}</p></div>;
}
