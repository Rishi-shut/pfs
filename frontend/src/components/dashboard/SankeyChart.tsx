import { ResponsiveContainer, Sankey, Tooltip } from "recharts";
import type { SankeyData } from "../../types";
import { formatINR } from "../../lib/utils";

export default function SankeyChart({ data }: { data: SankeyData }) {
  if (!data?.nodes?.length) {
    return <div className="text-xs text-muted-foreground">No flow data yet.</div>;
  }
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          nodeWidth={10}
          nodePadding={18}
          linkCurvature={0.55}
          iterations={32}
          link={{ stroke: "hsl(var(--accent))", strokeOpacity: 0.18 }}
          node={{ fill: "hsl(var(--accent))", stroke: "none" } as never}
          margin={{ top: 8, right: 80, bottom: 8, left: 8 }}
        >
          <Tooltip
            formatter={(v: number) => formatINR(v)}
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 11,
            }}
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}
