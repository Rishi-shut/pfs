import { Bell, CheckCircle2, ChevronDown, ChevronRight, MoreHorizontal, Plus, Search } from "lucide-react";

export default function DashboardPreview() {
  return (
    <div className="w-full max-w-5xl">
      <div
        className="rounded-2xl overflow-hidden p-3 md:p-4"
        style={{
          background: "rgba(255, 255, 255, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          boxShadow: "var(--shadow-dashboard)",
        }}
      >
        <div className="rounded-xl bg-background overflow-hidden text-[11px] select-none pointer-events-none">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-background">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-md bg-foreground text-background grid place-items-center text-[10px] font-semibold">P</div>
              <span className="font-semibold text-foreground">Pulse PFS</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex-1 max-w-sm mx-auto flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1">
              <Search className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground text-[10px] flex-1">Search…</span>
              <kbd className="rounded bg-background px-1.5 py-0.5 text-[9px] text-muted-foreground border border-border">⌘K</kbd>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-full bg-foreground text-background px-2.5 py-1 text-[10px] font-medium">Insights</button>
              <Bell className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="h-5 w-5 rounded-full bg-accent text-accent-foreground grid place-items-center text-[9px] font-semibold">HJ</div>
            </div>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <aside className="w-40 shrink-0 p-3 border-r border-border bg-background space-y-0.5">
              {[
                { label: "Home", active: true },
                { label: "Insights", badge: "5" },
                { label: "Transactions" },
                { label: "Subscriptions", chevron: true },
                { label: "Cards" },
                { label: "Capital" },
                { label: "Accounts", chevron: true },
              ].map((i) => (
                <div
                  key={i.label}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${i.active ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
                >
                  <div className="h-3 w-3 rounded-sm bg-muted" />
                  <span className="text-[11px]">{i.label}</span>
                  {i.badge && <span className="ml-auto rounded-full bg-secondary text-foreground px-1.5 py-0.5 text-[9px]">{i.badge}</span>}
                  {i.chevron && <ChevronRight className="ml-auto h-3 w-3" />}
                </div>
              ))}
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-4 mb-1 px-2">Workflows</div>
              {["Auto-sweep", "Goal pots", "Notifications", "Settings"].map((l) => (
                <div key={l} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground">
                  <div className="h-3 w-3 rounded-sm bg-muted" />
                  <span className="text-[11px]">{l}</span>
                </div>
              ))}
            </aside>

            {/* Main */}
            <div className="flex-1 bg-secondary/30 p-4 space-y-4">
              <div className="text-sm font-semibold text-foreground">Welcome, Mrigank</div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {["Insights", "Move", "Transfer", "Sweep", "Pay Bill", "Goals"].map((label, i) => (
                  <button
                    key={label}
                    className={`rounded-full px-2.5 py-1 text-[10px] ${i === 0 ? "bg-accent text-accent-foreground" : "bg-background border border-border text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
                <span className="text-[10px] text-muted-foreground ml-1">Customize</span>
              </div>

              <div className="flex gap-3">
                {/* Balance card */}
                <div className="flex-1 basis-0 bg-background rounded-lg border border-border p-4">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                    <span>Cash Balance</span>
                    <CheckCircle2 className="h-3 w-3 text-accent" />
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-base font-semibold text-foreground">₹85,000</span>
                    <span className="text-xs text-muted-foreground">.00</span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <div className="text-muted-foreground">Last 30 Days</div>
                      <div className="text-emerald-600 font-medium">+₹85K</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">&nbsp;</div>
                      <div className="text-red-500 font-medium">-₹62K</div>
                    </div>
                  </div>
                  <svg viewBox="0 0 300 80" className="mt-2 h-20 w-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lpFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,60 C40,40 70,55 110,35 S180,20 220,30 S280,15 300,25 L300,80 L0,80 Z" fill="url(#lpFill)" />
                    <path d="M0,60 C40,40 70,55 110,35 S180,20 220,30 S280,15 300,25" stroke="hsl(var(--accent))" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>

                {/* Accounts card */}
                <div className="flex-1 basis-0 bg-background rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-foreground font-medium">Accounts</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Plus className="h-3 w-3" />
                      <MoreHorizontal className="h-3 w-3" />
                    </div>
                  </div>
                  {[
                    { name: "Savings", amount: "₹47,200.00" },
                    { name: "Goals Pot", amount: "₹15,800.00" },
                    { name: "Discretionary", amount: "₹22,000.00" },
                  ].map((row) => (
                    <div key={row.name} className="flex justify-between py-3 text-xs">
                      <span className="text-muted-foreground">{row.name}</span>
                      <span className="font-medium text-foreground">{row.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions */}
              <div className="bg-background rounded-lg border border-border p-4">
                <div className="text-[11px] text-foreground font-medium mb-2">Recent Transactions</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="text-left font-normal py-1.5">Date</th>
                      <th className="text-left font-normal py-1.5">Description</th>
                      <th className="text-right font-normal py-1.5">Amount</th>
                      <th className="text-right font-normal py-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { d: "Apr 05", m: "Cult.fit", a: "-₹2,499", pos: false, s: "Dormant", sc: "bg-amber-100 text-amber-700" },
                      { d: "Apr 01", m: "Salary", a: "+₹85,000", pos: true, s: "Credited", sc: "bg-emerald-100 text-emerald-700" },
                      { d: "Apr 12", m: "Zomato", a: "-₹450", pos: false, s: "Cleared", sc: "bg-emerald-100 text-emerald-700" },
                      { d: "Apr 02", m: "Spotify", a: "-₹119", pos: false, s: "Sub", sc: "bg-emerald-100 text-emerald-700" },
                    ].map((r) => (
                      <tr key={r.m} className="border-t border-border">
                        <td className="py-2 text-muted-foreground">{r.d}</td>
                        <td className="py-2 text-foreground">{r.m}</td>
                        <td className={`py-2 text-right font-medium ${r.pos ? "text-emerald-600" : "text-foreground"}`}>{r.a}</td>
                        <td className="py-2 text-right">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${r.sc}`}>{r.s}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
