# Sample Datasets

Five engineered 30-day transaction CSVs (Apr 2026) for testing each detector
profile of the Fiserv Agent pipeline. Regenerate any time with:

```bash
cd backend && source venv/bin/activate
python -m app.sample_data            # all 5 + default
python -m app.sample_data typical    # one specific scenario
```

To use any of them in the app: open the upload page, drag the CSV onto the
drop zone (or click to browse). For the default flow, the "Use sample data"
button loads `01_typical.csv`.

| # | File                          | Tx  | Profile                                            | Top insights expected                                          |
|---|-------------------------------|-----|----------------------------------------------------|----------------------------------------------------------------|
| 1 | `01_typical.csv`              | 142 | Bangalore young pro, ₹85K salary                   | Cult.fit dormant · payday cliff · 2 drifts · ghost spend       |
| 2 | `02_subscription_heavy.csv`   |  31 | 9 active subs incl. 3 dormant (Cult.fit, Netflix, Audible) | 4 dormant_subscription rows                            |
| 3 | `03_payday_addict.csv`        |  30 | 60%+ of discretionary in days 1-3 after payday     | payday_cliff (~₹10K/mo impact) — stress test                   |
| 4 | `04_minimal.csv`              |  18 | Frugal user — bills, groceries, metro only         | Only 1-2 minor insights (good negative test)                   |
| 5 | `05_anomaly_heavy.csv`        |  41 | 3 Shopping outliers in second half + drift         | Shopping drift +76pp · multiple impulse anomalies              |

## What each scenario is testing

**01_typical** — End-to-end happy path. Engineered so every one of the 5 insight
rules has data to fire on. This is the demo dataset.

**02_subscription_heavy** — Stresses the subscription detector: 9 distinct subs
across different categories, including FX-drift variants (Spotify ₹118.82 vs
₹119), and 3 plants that should be flagged dormant via the `EXPECTED_USAGE`
map (Cult.fit → Fitness, Netflix → Entertainment, Audible → Books with no
activity in those categories).

**03_payday_addict** — Tests the payday-cliff threshold (1.6x). Front-loads
~₹35K of discretionary spend in days 1-3 vs a thin ~₹200/day baseline.
Should produce an outsized cliff insight with ~₹10K/mo proposed sweep impact.

**04_minimal** — Negative-control dataset. A user who mostly pays bills,
buys groceries, and rides the metro. Should produce few or no insights —
catches false-positive regressions where a detector fires on quiet data.

**05_anomaly_heavy** — Tests Modified Z-score + drift in combo. Three large
Shopping charges (₹6,200, ₹4,800, ₹9,100) all in the second half of the month
should: (a) fire impulse_anomaly via z-score > 4, and (b) drive Shopping
category share from ~5% → ~80% in the second half, producing a massive
category_drift_up insight.
