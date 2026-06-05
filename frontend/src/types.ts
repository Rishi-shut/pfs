export type Confidence = "high" | "med" | "low";

export type ActionType = "cancel_sub" | "auto_sweep" | "set_cap" | "awareness";

export interface Insight {
  id: number;
  rule_id: string;
  title: string;
  detail: string;
  impact_monthly_inr: number;
  confidence: Confidence;
  actionability: number;
  action_type: ActionType | null;
  action_target: string | null;
  audit: Record<string, unknown>;
  score: number;
}

export interface SankeyData {
  nodes: { name: string }[];
  links: { source: number; target: number; value: number }[];
}

export interface HeatmapPoint {
  date: string;
  amount: number;
  events?: { type: 'payday' | 'subscription' | 'anomaly'; label: string }[];
}

export interface CategoryTotal {
  name: string;
  amount: number;
  pct: number;
}

export interface DashboardData {
  sankey: SankeyData;
  heatmap: HeatmapPoint[];
  categories: CategoryTotal[];
  total_spend: number;
  total_income: number;
  benchmarks?: {
    category: string;
    user_spend: number;
    benchmark_spend: number;
    percentage_above: number;
    demographic: string;
  }[];
}

export interface SimulateResult {
  monthly_savings_inr: number;
  annual_savings_inr: number;
  five_year_compounded_inr: number;
  per_category: Record<string, number>;
}

export interface ChatToolCall {
  name: string;
  args: Record<string, unknown>;
  result_preview: string;
}

export interface ChatResponse {
  reply: string;
  tool_calls: ChatToolCall[];
  proposal_ids: string[];
}

export interface Proposal {
  proposal_id: string;
  action_type: string;
  target: string;
  rationale: string;
  status: "PENDING" | "CONFIRMED" | "DISMISSED";
}

export interface ProcessStage {
  stage: string;
  detail: string;
}
