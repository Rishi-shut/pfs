# Pulse Agent

**v2 of Fiserv's AllData PFM — a bank-embeddable insights engine.**

Drop a 30-day transaction CSV → get a ranked, audited, action-linked insight feed
in 30 seconds, plus a Gemini-powered chat agent that proposes (never executes)
real bank actions.

> *"Most PFM is accounting cosplaying as insight. We built advice — every insight
> has a verb, a ₹ amount, a confidence, and a downstream bank action."*

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│ Frontend  (Vite + React + Tailwind + Recharts)         │
│   /          Landing (Instrument Serif + Inter)        │
│   /try       Name → session                            │
│   /upload    CSV drop / sample                         │
│   /processing SSE pipeline reveal                      │
│   /dashboard Insights · Sankey · Heatmap · Agent       │
└─────────────────────┬──────────────────────────────────┘
                      │ REST + SSE
┌─────────────────────▼──────────────────────────────────┐
│ FastAPI Backend                                        │
│   /api/auth/session, /upload, /process/{sid} (SSE),    │
│   /insights, /dashboard, /simulate, /agent/chat        │
│                                                        │
│   pipeline/    ingest → enrich → detect → rank         │
│   detectors/   subscriptions · anomalies · drift ·     │
│                leakage · payday                        │
│   insights/    rules + ranking engine                  │
│   agent/       OpenRouter (Gemini 3.5 Flash) + tools   │
└─────────────────────┬──────────────────────────────────┘
                      │
                ┌─────▼─────┐
                │  SQLite   │  users · transactions ·
                └───────────┘  insights · audit_log ·
                               chat_turns · proposals
```

## What's inside the algorithms

| Detector       | Method                                                      |
|----------------|-------------------------------------------------------------|
| Subscriptions  | Jaro-Winkler clustering (>0.85) + CV of inter-tx deltas     |
| Anomalies      | Modified Z-score (Iglewicz-Hoaglin, MAD-based) bucketed by (category, day-of-week) |
| Drift          | First-half vs second-half category share, fires ≥8pp delta  |
| Leakage        | <₹100 micro-charges accumulated; fires when ≥3% of spend    |
| Payday cliff   | Days 1-3 vs baseline daily avg of discretionary spend       |

Each insight carries a `rule_id`, `audit` JSON, and ranked `score = impact × confidence × actionability`.

## AI discipline

LLM is the face, algorithms are the spine. Detectors are deterministic and auditable.
Gemini explains and *proposes* actions; the deterministic backend decides.
`propose_action` returns a proposal_id — never auto-executes.

## Setup

```bash
# Backend
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.sample_data            # write data/sample_transactions.csv
uvicorn app.main:app --reload --port 8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev                          # http://localhost:5173
```

`.env` lives in `backend/.env` and holds `OPENROUTER_API_KEY` +
`OPENROUTER_MODEL` (default `google/gemini-3.5-flash`).

## Tests

```bash
cd backend && source venv/bin/activate && pytest -v
# 14 tests covering all 5 detectors + sample-CSV insight pipeline
```

## Demo flow

`/` → "Try it" → name → "Use sample data" → watch SSE reveal stream 9 stages →
land on dashboard → top insight is **Cancel Cult.fit (dormant)** → expand
"Why?" to see the rule audit → open the agent → ask *"Where am I leaking money?"* →
Gemini calls `get_subscription_and_leakage_analysis` and answers with ₹ amounts
grounded in your data → open *"What if…"* simulator → drag Food slider to -30% →
see ₹553K projected savings over 5 years at 8%.

## Deliberate cuts (taste signals)

- **No forecasting** — 30 days is below the noise floor for SES/ARIMA
- **No pie charts** — Cleveland-McGill (1984) on perceptual hierarchy
- **No PDF export** — bulk without depth
- **No real auth** — single-flow demo, session token in localStorage
- **No mocked detectors** — every algorithm is real
- **No mobile responsive** — desktop demo only
