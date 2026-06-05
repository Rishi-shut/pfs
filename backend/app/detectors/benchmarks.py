from __future__ import annotations
from dataclasses import dataclass

@dataclass
class BenchmarkFlag:
    category: str
    user_spend: float
    benchmark_spend: float
    percentage_above: float
    demographic: str

def detect_benchmarks(rows: list[dict]) -> list[BenchmarkFlag]:
    """
    Compares user's category spend against a mock demographic benchmark.
    Returns flags for categories where the user spends significantly (>20%) more.
    """
    # Mock benchmarks for "Young Professionals in Metro Cities"
    MOCK_BENCHMARKS = {
        "Food": 12000.0,
        "Shopping": 8000.0,
        "Utilities": 4000.0,
        "Travel": 5000.0,
        "Entertainment": 3000.0,
        "Health": 2500.0
    }
    DEMOGRAPHIC = "Young Professionals in Metro Cities"

    # Calculate total spend per category
    category_totals = {}
    for r in rows:
        cat = r.get("category", "Uncategorized")
        if cat.lower() == "salary":
            continue
            
        amt = float(r["amount"])
        category_totals[cat] = category_totals.get(cat, 0.0) + abs(amt)

    flags = []
    for cat, spend in category_totals.items():
        if cat in MOCK_BENCHMARKS:
            benchmark = MOCK_BENCHMARKS[cat]
            if benchmark > 0:
                pct_diff = ((spend - benchmark) / benchmark) * 100
                if pct_diff >= 20.0:  # Threshold for insight generation
                    flags.append(
                        BenchmarkFlag(
                            category=cat,
                            user_spend=round(spend, 2),
                            benchmark_spend=round(benchmark, 2),
                            percentage_above=round(pct_diff, 1),
                            demographic=DEMOGRAPHIC
                        )
                    )
    
    return sorted(flags, key=lambda f: f.percentage_above, reverse=True)
