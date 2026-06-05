import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DashboardData } from "../../types";

interface Props {
  benchmarks: NonNullable<DashboardData["benchmarks"]>;
}

export default function PeerBenchmarkChart({ benchmarks }: Props) {
  if (!benchmarks || benchmarks.length === 0) return null;

  const data = benchmarks.map((b) => ({
    name: b.category,
    "Your Spend": b.user_spend,
    "Peer Average": b.benchmark_spend,
  }));

  return (
    <div className="bg-background rounded-2xl border border-border p-5 flex flex-col w-full h-[350px]">
      <h3 className="text-base font-semibold mb-1">Peer Benchmarking</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Comparing your category spend to {benchmarks[0]?.demographic || "peers"}.
      </p>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              tickFormatter={(val) => `₹${val}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, undefined]}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
            <Bar dataKey="Your Spend" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="Peer Average" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} maxBarSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
