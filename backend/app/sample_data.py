"""
Generate sample transaction CSVs for testing and demos. Five scenarios:

  1. typical            — Bangalore young pro; fires ALL 5 insights
  2. subscription_heavy — 8+ subs, 3 dormant; tests subscription clustering
  3. payday_addict      — extreme post-salary spike; tests cliff detector
  4. minimal            — frugal user; should NOT fire most insights
  5. anomaly_heavy      — multiple outliers + heavy category drift

Run:
    python -m app.sample_data            # write all 5 to data/samples/ + default
    python -m app.sample_data typical    # write a single scenario
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

Row = tuple[str, str, float, str]  # (date, merchant_raw, amount_inr, category)


# ─── SCENARIO 1: typical Bangalore young pro ─────────────────────────
ROWS_TYPICAL: list[Row] = [
    ("2026-04-01", "ACME CORP PAYROLL", 85000.00, "Salary"),

    # Payday cliff (days 1-3, front-loaded discretionary)
    ("2026-04-01", "UPI-ZOMATO-ORDER", 520.00, "Food"),
    ("2026-04-01", "UBER INDIA TRIP-ID-44211", 320.00, "Transport"),
    ("2026-04-01", "BLINKIT-GROCERY", 1180.00, "Groceries"),
    ("2026-04-02", "SWIGGY-INSTAMART", 880.00, "Groceries"),
    ("2026-04-02", "POS-STARBUCKS BLR", 540.00, "Food"),
    ("2026-04-02", "AMAZON RETAIL", 1899.00, "Shopping"),
    ("2026-04-02", "SPOTIFY*PREMIUM", 118.82, "Subscriptions"),
    ("2026-04-03", "MAGNUS POSP-ZOMATO", 720.00, "Food"),
    ("2026-04-03", "RAPIDO BIKE-TAXI", 165.00, "Transport"),
    ("2026-04-03", "POS-PVR CINEMAS", 880.00, "Entertainment"),
    ("2026-04-03", "FLIPKART RETAIL", 2200.00, "Shopping"),

    # Cult.fit DORMANT
    ("2026-04-05", "CULT.FIT*MEMBERSHIP", 2499.00, "Fitness"),

    ("2026-04-10", "ATD*UPI/AUTOPAY/OPENAI CHATGPT", 1650.00, "Subscriptions"),
    ("2026-04-10", "AIRTEL POSTPAID", 599.00, "Bills"),
    ("2026-04-15", "TATA POWER BLR", 1840.00, "Bills"),
    ("2026-04-15", "NETFLIX.COM", 199.00, "Subscriptions"),
    ("2026-04-20", "AMAZON PRIME MEMBERSHIP", 179.00, "Subscriptions"),

    # Food
    ("2026-04-04", "ZOMATO-WEEKEND", 480.00, "Food"),
    ("2026-04-04", "POS-SOCIAL OFFLINE BLR", 1450.00, "Food"),
    ("2026-04-05", "SWIGGY-SUNDAY", 420.00, "Food"),
    ("2026-04-06", "ZOMATO-LUNCH", 210.00, "Food"),
    ("2026-04-07", "SWIGGY-DINNER", 180.00, "Food"),
    ("2026-04-08", "ZOMATO-LUNCH", 195.00, "Food"),
    ("2026-04-09", "SWIGGY-LUNCH", 245.00, "Food"),
    ("2026-04-10", "ZOMATO-DINNER", 220.00, "Food"),
    ("2026-04-11", "POS-TOIT BREWERY", 1180.00, "Food"),
    ("2026-04-11", "SWIGGY-WEEKEND", 380.00, "Food"),
    ("2026-04-12", "MAGNUS POSP-ZOMATO", 1200.00, "Food"),
    ("2026-04-13", "ZOMATO-LUNCH", 240.00, "Food"),
    ("2026-04-14", "SWIGGY-DINNER", 175.00, "Food"),
    ("2026-04-15", "ZOMATO-LUNCH", 215.00, "Food"),
    ("2026-04-16", "SWIGGY-LUNCH", 190.00, "Food"),
    ("2026-04-17", "ZOMATO-DINNER", 230.00, "Food"),
    ("2026-04-18", "SWIGGY-WEEKEND", 410.00, "Food"),
    ("2026-04-18", "POS-MEGHANA FOODS", 890.00, "Food"),
    ("2026-04-19", "ZOMATO-SUNDAY", 460.00, "Food"),
    ("2026-04-20", "SWIGGY-LUNCH", 205.00, "Food"),
    ("2026-04-21", "ZOMATO-DINNER", 225.00, "Food"),
    ("2026-04-22", "SWIGGY-LUNCH", 190.00, "Food"),
    ("2026-04-23", "ZOMATO-LUNCH", 240.00, "Food"),
    ("2026-04-24", "SWIGGY-DINNER", 215.00, "Food"),
    ("2026-04-25", "POS-CHURCH STREET SOCIAL", 1320.00, "Food"),
    ("2026-04-25", "ZOMATO-LATE-NIGHT", 410.00, "Food"),
    ("2026-04-26", "SWIGGY-SUNDAY", 445.00, "Food"),
    ("2026-04-27", "ZOMATO-LUNCH", 220.00, "Food"),
    ("2026-04-28", "SWIGGY-DINNER", 195.00, "Food"),

    # Transport
    ("2026-04-04", "UBER INDIA TRIP-ID-44290", 280.00, "Transport"),
    ("2026-04-05", "RAPIDO BIKE-TAXI", 140.00, "Transport"),
    ("2026-04-06", "UBER INDIA TRIP-ID-44320", 195.00, "Transport"),
    ("2026-04-07", "BMRC METRO TOP-UP", 200.00, "Transport"),
    ("2026-04-08", "UBER INDIA TRIP-ID-44380", 210.00, "Transport"),
    ("2026-04-09", "RAPIDO BIKE-TAXI", 150.00, "Transport"),
    ("2026-04-10", "UBER INDIA TRIP-ID-44440", 180.00, "Transport"),
    ("2026-04-11", "UBER INDIA WEEKEND-650", 650.00, "Transport"),
    ("2026-04-12", "UBER INDIA TRIP-ID-44510", 220.00, "Transport"),
    ("2026-04-13", "BMRC METRO TOP-UP", 200.00, "Transport"),
    ("2026-04-14", "UBER INDIA TRIP-ID-44580", 170.00, "Transport"),
    ("2026-04-15", "RAPIDO BIKE-TAXI", 130.00, "Transport"),
    ("2026-04-16", "UBER INDIA TRIP-ID-44640", 200.00, "Transport"),
    ("2026-04-17", "UBER INDIA TRIP-ID-44700", 185.00, "Transport"),
    ("2026-04-19", "UBER INDIA WEEKEND-540", 540.00, "Transport"),
    ("2026-04-20", "BMRC METRO TOP-UP", 200.00, "Transport"),
    ("2026-04-21", "UBER INDIA TRIP-ID-44820", 215.00, "Transport"),
    ("2026-04-22", "RAPIDO BIKE-TAXI", 145.00, "Transport"),
    ("2026-04-23", "UBER INDIA TRIP-ID-44890", 195.00, "Transport"),
    ("2026-04-24", "UBER INDIA TRIP-ID-44950", 210.00, "Transport"),
    ("2026-04-27", "BMRC METRO TOP-UP", 200.00, "Transport"),
    ("2026-04-28", "UBER INDIA TRIP-ID-45100", 185.00, "Transport"),

    # Groceries
    ("2026-04-07", "BLINKIT-GROCERY", 420.00, "Groceries"),
    ("2026-04-14", "BIGBASKET", 1180.00, "Groceries"),
    ("2026-04-21", "BLINKIT-GROCERY", 690.00, "Groceries"),
    ("2026-04-28", "BIGBASKET WEEKLY", 950.00, "Groceries"),

    # Impulse anomaly
    ("2026-04-09", "MYNTRA RETAIL", 720.00, "Shopping"),
    ("2026-04-16", "MYNTRA RETAIL", 480.00, "Shopping"),
    ("2026-04-24", "MYNTRA RETAIL", 8900.00, "Shopping"),
    ("2026-04-26", "AMAZON RETAIL", 540.00, "Shopping"),

    # Category drift planted (Entertainment up in days 16-30)
    ("2026-04-04", "POS-PVR CINEMAS", 480.00, "Entertainment"),
    ("2026-04-18", "BOOK MY SHOW", 1800.00, "Entertainment"),
    ("2026-04-19", "POS-PVR CINEMAS", 920.00, "Entertainment"),
    ("2026-04-24", "BOOK MY SHOW IPL", 2400.00, "Entertainment"),
    ("2026-04-26", "BOOK MY SHOW", 1100.00, "Entertainment"),

    # Ghost spend / leakage (micro UPI)
    ("2026-04-02", "UPI-CHAI-TAPRI", 25.00, "Misc"),
    ("2026-04-03", "UPI-PARKING-MG-RD", 40.00, "Misc"),
    ("2026-04-04", "UPI-AUTO-RICKSHAW", 65.00, "Misc"),
    ("2026-04-05", "UPI-CHAI-TAPRI", 30.00, "Misc"),
    ("2026-04-06", "UPI-VENDING-OFFICE", 45.00, "Misc"),
    ("2026-04-07", "UPI-CHAI-TAPRI", 25.00, "Misc"),
    ("2026-04-08", "UPI-PARKING-INDIRANAGAR", 50.00, "Misc"),
    ("2026-04-09", "UPI-AUTO-RICKSHAW", 80.00, "Misc"),
    ("2026-04-10", "UPI-VENDING-OFFICE", 35.00, "Misc"),
    ("2026-04-11", "UPI-CHAI-TAPRI", 25.00, "Misc"),
    ("2026-04-12", "UPI-PARKING-MG-RD", 40.00, "Misc"),
    ("2026-04-13", "UPI-AUTO-RICKSHAW", 70.00, "Misc"),
    ("2026-04-14", "UPI-CHAI-TAPRI", 30.00, "Misc"),
    ("2026-04-15", "UPI-VENDING-OFFICE", 45.00, "Misc"),
    ("2026-04-16", "UPI-PARKING-KORAMANGALA", 60.00, "Misc"),
    ("2026-04-17", "UPI-CHAI-TAPRI", 25.00, "Misc"),
    ("2026-04-18", "UPI-AUTO-RICKSHAW", 85.00, "Misc"),
    ("2026-04-19", "UPI-PARKING-INDIRANAGAR", 50.00, "Misc"),
    ("2026-04-20", "UPI-CHAI-TAPRI", 30.00, "Misc"),
    ("2026-04-21", "UPI-VENDING-OFFICE", 35.00, "Misc"),
    ("2026-04-22", "UPI-AUTO-RICKSHAW", 75.00, "Misc"),
    ("2026-04-23", "UPI-CHAI-TAPRI", 25.00, "Misc"),
    ("2026-04-24", "UPI-PARKING-MG-RD", 40.00, "Misc"),
    ("2026-04-25", "UPI-AUTO-RICKSHAW", 90.00, "Misc"),
    ("2026-04-26", "UPI-CHAI-TAPRI", 30.00, "Misc"),
    ("2026-04-27", "UPI-VENDING-OFFICE", 45.00, "Misc"),
    ("2026-04-28", "UPI-AUTO-RICKSHAW", 70.00, "Misc"),
    ("2026-04-29", "UPI-CHAI-TAPRI", 25.00, "Misc"),
    ("2026-04-30", "UPI-PARKING-INDIRANAGAR", 55.00, "Misc"),
    ("2026-04-30", "UPI-AUTO-RICKSHAW", 95.00, "Misc"),

    # Extra micro-spend
    ("2026-04-02", "UPI-PARKING-MALL", 60.00, "Misc"),
    ("2026-04-03", "UPI-WATER-BOTTLE", 20.00, "Misc"),
    ("2026-04-04", "UPI-AUTO-RICKSHAW", 85.00, "Misc"),
    ("2026-04-05", "UPI-PAAN-SHOP", 30.00, "Misc"),
    ("2026-04-06", "UPI-CHAI-TAPRI", 25.00, "Misc"),
    ("2026-04-07", "UPI-XEROX-SHOP", 40.00, "Misc"),
    ("2026-04-08", "UPI-VENDING-MACHINE", 50.00, "Misc"),
    ("2026-04-09", "UPI-PARKING-MALL", 55.00, "Misc"),
    ("2026-04-10", "UPI-AUTO-RICKSHAW", 90.00, "Misc"),
    ("2026-04-11", "UPI-WATER-BOTTLE", 25.00, "Misc"),
    ("2026-04-12", "UPI-CHAI-TAPRI", 30.00, "Misc"),
    ("2026-04-13", "UPI-PARKING-MALL", 50.00, "Misc"),
    ("2026-04-14", "UPI-AUTO-RICKSHAW", 75.00, "Misc"),
    ("2026-04-15", "UPI-PAAN-SHOP", 35.00, "Misc"),
    ("2026-04-16", "UPI-VENDING-MACHINE", 45.00, "Misc"),
    ("2026-04-17", "UPI-PARKING-MALL", 60.00, "Misc"),
    ("2026-04-18", "UPI-CHAI-TAPRI", 30.00, "Misc"),
    ("2026-04-19", "UPI-WATER-BOTTLE", 25.00, "Misc"),
    ("2026-04-20", "UPI-AUTO-RICKSHAW", 80.00, "Misc"),
    ("2026-04-21", "UPI-PARKING-MALL", 55.00, "Misc"),
    ("2026-04-22", "UPI-VENDING-MACHINE", 50.00, "Misc"),
    ("2026-04-23", "UPI-CHAI-TAPRI", 25.00, "Misc"),
    ("2026-04-24", "UPI-PAAN-SHOP", 35.00, "Misc"),
    ("2026-04-25", "UPI-AUTO-RICKSHAW", 85.00, "Misc"),
    ("2026-04-26", "UPI-PARKING-MALL", 60.00, "Misc"),
    ("2026-04-27", "UPI-WATER-BOTTLE", 25.00, "Misc"),
    ("2026-04-28", "UPI-CHAI-TAPRI", 30.00, "Misc"),
    ("2026-04-29", "UPI-VENDING-MACHINE", 45.00, "Misc"),
    ("2026-04-30", "UPI-PAAN-SHOP", 35.00, "Misc"),
    ("2026-04-30", "UPI-PARKING-MALL", 55.00, "Misc"),
]


# ─── SCENARIO 2: subscription overload, 3 dormant ────────────────────
ROWS_SUBSCRIPTION_HEAVY: list[Row] = [
    ("2026-04-01", "ACME CORP PAYROLL", 95000.00, "Salary"),

    # 9 subscriptions, 3 dormant (Cult.fit, Audible, Netflix — no related activity)
    ("2026-04-02", "SPOTIFY*PREMIUM", 119.00, "Subscriptions"),
    ("2026-04-03", "NETFLIX.COM", 649.00, "Subscriptions"),       # dormant (no Entertainment activity)
    ("2026-04-04", "DISNEY HOTSTAR PREMIUM", 1499.00, "Subscriptions"),
    ("2026-04-05", "AMAZON PRIME MEMBERSHIP", 179.00, "Subscriptions"),
    ("2026-04-06", "ATD*UPI/AUTOPAY/OPENAI CHATGPT", 1650.00, "Subscriptions"),
    ("2026-04-07", "AUDIBLE PREMIUM PLUS", 199.00, "Books"),     # dormant (no Books activity)
    ("2026-04-08", "CULT.FIT*MEMBERSHIP", 2499.00, "Fitness"),    # dormant (no Fitness activity)
    ("2026-04-09", "ICLOUD STORAGE 200GB", 75.00, "Subscriptions"),
    ("2026-04-10", "ADOBE CREATIVE CLOUD", 1675.00, "Subscriptions"),

    # Some Bills
    ("2026-04-10", "AIRTEL POSTPAID", 799.00, "Bills"),
    ("2026-04-15", "TATA POWER BLR", 2100.00, "Bills"),
    ("2026-04-20", "ACT FIBERNET", 1199.00, "Bills"),

    # Basic groceries / food (light, no Entertainment / Books / Fitness)
    ("2026-04-03", "BLINKIT-GROCERY", 850.00, "Groceries"),
    ("2026-04-10", "BIGBASKET WEEKLY", 1450.00, "Groceries"),
    ("2026-04-17", "BLINKIT-GROCERY", 920.00, "Groceries"),
    ("2026-04-24", "BIGBASKET", 1280.00, "Groceries"),

    ("2026-04-02", "SWIGGY-LUNCH", 220.00, "Food"),
    ("2026-04-06", "ZOMATO-DINNER", 380.00, "Food"),
    ("2026-04-09", "SWIGGY-LUNCH", 195.00, "Food"),
    ("2026-04-13", "ZOMATO-DINNER", 410.00, "Food"),
    ("2026-04-16", "SWIGGY-LUNCH", 230.00, "Food"),
    ("2026-04-20", "ZOMATO-DINNER", 395.00, "Food"),
    ("2026-04-23", "SWIGGY-LUNCH", 215.00, "Food"),
    ("2026-04-27", "ZOMATO-DINNER", 360.00, "Food"),

    # Transport
    ("2026-04-04", "UBER INDIA TRIP-ID-A1", 280.00, "Transport"),
    ("2026-04-08", "UBER INDIA TRIP-ID-A2", 310.00, "Transport"),
    ("2026-04-12", "UBER INDIA TRIP-ID-A3", 195.00, "Transport"),
    ("2026-04-15", "BMRC METRO TOP-UP", 500.00, "Transport"),
    ("2026-04-22", "UBER INDIA TRIP-ID-A4", 240.00, "Transport"),
    ("2026-04-28", "UBER INDIA TRIP-ID-A5", 220.00, "Transport"),
]


# ─── SCENARIO 3: extreme payday cliff ────────────────────────────────
ROWS_PAYDAY_ADDICT: list[Row] = [
    ("2026-04-01", "ACME CORP PAYROLL", 75000.00, "Salary"),

    # MASSIVE post-payday spending days 1-3
    ("2026-04-01", "FLIPKART RETAIL", 8500.00, "Shopping"),
    ("2026-04-01", "AMAZON RETAIL", 4200.00, "Shopping"),
    ("2026-04-01", "POS-SOCIAL OFFLINE BLR", 2100.00, "Food"),
    ("2026-04-01", "UBER INDIA TRIP-ID-P1", 540.00, "Transport"),

    ("2026-04-02", "MYNTRA RETAIL", 5500.00, "Shopping"),
    ("2026-04-02", "POS-PVR CINEMAS", 1200.00, "Entertainment"),
    ("2026-04-02", "POS-TOIT BREWERY", 1850.00, "Food"),
    ("2026-04-02", "UBER INDIA TRIP-ID-P2", 480.00, "Transport"),

    ("2026-04-03", "POS-CHURCH STREET SOCIAL", 1900.00, "Food"),
    ("2026-04-03", "BOOK MY SHOW IPL", 3200.00, "Entertainment"),
    ("2026-04-03", "FLIPKART RETAIL", 3400.00, "Shopping"),
    ("2026-04-03", "UBER INDIA TRIP-ID-P3", 620.00, "Transport"),

    # Days 4-7 — tapering
    ("2026-04-04", "SWIGGY-LUNCH", 220.00, "Food"),
    ("2026-04-05", "ZOMATO-DINNER", 380.00, "Food"),
    ("2026-04-06", "UBER INDIA TRIP-ID-P4", 180.00, "Transport"),
    ("2026-04-07", "SWIGGY-LUNCH", 195.00, "Food"),

    # Days 8-30 — broke
    ("2026-04-09", "AIRTEL POSTPAID", 599.00, "Bills"),
    ("2026-04-10", "BLINKIT-GROCERY", 350.00, "Groceries"),
    ("2026-04-12", "SWIGGY-LUNCH", 180.00, "Food"),
    ("2026-04-15", "TATA POWER BLR", 1620.00, "Bills"),
    ("2026-04-15", "BMRC METRO TOP-UP", 200.00, "Transport"),
    ("2026-04-17", "ZOMATO-LUNCH", 160.00, "Food"),
    ("2026-04-19", "SWIGGY-DINNER", 195.00, "Food"),
    ("2026-04-21", "UBER INDIA TRIP-ID-P5", 150.00, "Transport"),
    ("2026-04-23", "ZOMATO-LUNCH", 175.00, "Food"),
    ("2026-04-25", "SWIGGY-DINNER", 220.00, "Food"),
    ("2026-04-27", "BMRC METRO TOP-UP", 200.00, "Transport"),
    ("2026-04-29", "ZOMATO-LUNCH", 190.00, "Food"),

    # Spotify (only 1 sub — keep it minimal)
    ("2026-04-05", "SPOTIFY*PREMIUM", 119.00, "Subscriptions"),
]


# ─── SCENARIO 4: minimal — frugal user, few insights ─────────────────
ROWS_MINIMAL: list[Row] = [
    ("2026-04-01", "STATE GOV PAYROLL", 55000.00, "Salary"),

    # Bills only
    ("2026-04-05", "AIRTEL POSTPAID", 399.00, "Bills"),
    ("2026-04-08", "TATA POWER BLR", 980.00, "Bills"),
    ("2026-04-10", "GAS-INDANE", 1100.00, "Bills"),
    ("2026-04-12", "BWSSB WATER", 320.00, "Bills"),

    # Modest groceries
    ("2026-04-03", "BIGBASKET WEEKLY", 1450.00, "Groceries"),
    ("2026-04-10", "BIGBASKET WEEKLY", 1380.00, "Groceries"),
    ("2026-04-17", "BIGBASKET WEEKLY", 1520.00, "Groceries"),
    ("2026-04-24", "BIGBASKET WEEKLY", 1410.00, "Groceries"),

    # Transport - mostly metro (cheap)
    ("2026-04-04", "BMRC METRO TOP-UP", 500.00, "Transport"),
    ("2026-04-11", "BMRC METRO TOP-UP", 500.00, "Transport"),
    ("2026-04-18", "BMRC METRO TOP-UP", 500.00, "Transport"),
    ("2026-04-25", "BMRC METRO TOP-UP", 500.00, "Transport"),

    # Light food
    ("2026-04-06", "SWIGGY-LUNCH", 180.00, "Food"),
    ("2026-04-13", "ZOMATO-LUNCH", 195.00, "Food"),
    ("2026-04-20", "SWIGGY-DINNER", 210.00, "Food"),
    ("2026-04-27", "ZOMATO-LUNCH", 175.00, "Food"),

    # One sub only - actively used
    ("2026-04-05", "SPOTIFY*PREMIUM", 119.00, "Subscriptions"),
]


# ─── SCENARIO 5: anomaly + drift heavy ───────────────────────────────
ROWS_ANOMALY_HEAVY: list[Row] = [
    ("2026-04-01", "TECH CORP PAYROLL", 120000.00, "Salary"),

    # Drift planted: Shopping low in first half, EXPLODES in second half
    # First half (days 1-15): mostly normal
    ("2026-04-02", "BLINKIT-GROCERY", 850.00, "Groceries"),
    ("2026-04-03", "AIRTEL POSTPAID", 999.00, "Bills"),
    ("2026-04-05", "TATA POWER BLR", 2400.00, "Bills"),
    ("2026-04-08", "BIGBASKET WEEKLY", 1450.00, "Groceries"),

    # Food (consistent weekday baseline)
    ("2026-04-02", "SWIGGY-LUNCH", 220.00, "Food"),
    ("2026-04-03", "ZOMATO-DINNER", 280.00, "Food"),
    ("2026-04-06", "SWIGGY-LUNCH", 235.00, "Food"),
    ("2026-04-08", "ZOMATO-DINNER", 295.00, "Food"),
    ("2026-04-09", "SWIGGY-LUNCH", 210.00, "Food"),
    ("2026-04-10", "ZOMATO-DINNER", 270.00, "Food"),
    ("2026-04-13", "SWIGGY-LUNCH", 240.00, "Food"),
    ("2026-04-15", "ZOMATO-DINNER", 285.00, "Food"),

    # Transport baseline
    ("2026-04-02", "UBER INDIA TRIP-ID-X1", 180.00, "Transport"),
    ("2026-04-04", "UBER INDIA TRIP-ID-X2", 215.00, "Transport"),
    ("2026-04-06", "UBER INDIA TRIP-ID-X3", 195.00, "Transport"),
    ("2026-04-08", "UBER INDIA TRIP-ID-X4", 220.00, "Transport"),
    ("2026-04-10", "UBER INDIA TRIP-ID-X5", 240.00, "Transport"),
    ("2026-04-12", "UBER INDIA TRIP-ID-X6", 185.00, "Transport"),
    ("2026-04-14", "UBER INDIA TRIP-ID-X7", 210.00, "Transport"),

    # Shopping anomalies (3 huge outliers, all in second half — drives drift up too)
    ("2026-04-05", "MYNTRA RETAIL", 480.00, "Shopping"),
    ("2026-04-09", "AMAZON RETAIL", 520.00, "Shopping"),
    ("2026-04-12", "FLIPKART RETAIL", 410.00, "Shopping"),

    # Second half (days 16-30) — Shopping EXPLODES (3 outliers)
    ("2026-04-17", "MYNTRA RETAIL", 6200.00, "Shopping"),     # outlier
    ("2026-04-20", "AMAZON RETAIL", 4800.00, "Shopping"),     # outlier
    ("2026-04-23", "FLIPKART RETAIL", 9100.00, "Shopping"),   # outlier
    ("2026-04-25", "MYNTRA RETAIL", 580.00, "Shopping"),
    ("2026-04-27", "AMAZON RETAIL", 620.00, "Shopping"),

    # Continued food / transport for baseline
    ("2026-04-17", "SWIGGY-LUNCH", 215.00, "Food"),
    ("2026-04-19", "ZOMATO-DINNER", 290.00, "Food"),
    ("2026-04-21", "SWIGGY-LUNCH", 225.00, "Food"),
    ("2026-04-23", "ZOMATO-DINNER", 280.00, "Food"),
    ("2026-04-25", "SWIGGY-LUNCH", 235.00, "Food"),
    ("2026-04-27", "ZOMATO-DINNER", 270.00, "Food"),

    ("2026-04-16", "UBER INDIA TRIP-ID-X8", 205.00, "Transport"),
    ("2026-04-19", "UBER INDIA TRIP-ID-X9", 195.00, "Transport"),
    ("2026-04-22", "UBER INDIA TRIP-ID-X10", 225.00, "Transport"),
    ("2026-04-25", "UBER INDIA TRIP-ID-X11", 210.00, "Transport"),
    ("2026-04-28", "UBER INDIA TRIP-ID-X12", 240.00, "Transport"),

    # Couple of subs
    ("2026-04-02", "SPOTIFY*PREMIUM", 119.00, "Subscriptions"),
    ("2026-04-15", "NETFLIX.COM", 199.00, "Subscriptions"),
]


SCENARIOS: dict[str, tuple[list[Row], str]] = {
    "typical":            (ROWS_TYPICAL,            "Bangalore young pro · fires ALL 5 insights"),
    "subscription_heavy": (ROWS_SUBSCRIPTION_HEAVY, "9 subs incl. 3 dormant · tests clustering"),
    "payday_addict":      (ROWS_PAYDAY_ADDICT,      "Extreme post-salary spike · cliff stress test"),
    "minimal":            (ROWS_MINIMAL,            "Frugal user · most rules should NOT fire"),
    "anomaly_heavy":      (ROWS_ANOMALY_HEAVY,      "Multiple Z-score outliers + Shopping drift"),
}


def write_csv(rows: list[Row], out_path: Path) -> int:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Date", "Merchant", "Amount", "Category"])
        for d, m, a, c in rows:
            writer.writerow([d, m, f"{a:.2f}", c])
    return len(rows)


def main() -> None:
    root = Path(__file__).resolve().parent.parent.parent
    samples_dir = root / "data" / "samples"
    default_path = root / "data" / "sample_transactions.csv"

    arg = sys.argv[1] if len(sys.argv) > 1 else None

    if arg and arg not in SCENARIOS:
        print(f"Unknown scenario '{arg}'. Available: {list(SCENARIOS)}")
        sys.exit(1)

    if arg:
        rows, desc = SCENARIOS[arg]
        n = write_csv(rows, samples_dir / f"{arg}.csv")
        print(f"Wrote {n} tx → samples/{arg}.csv  ·  {desc}")
        return

    print(f"Generating {len(SCENARIOS)} sample CSVs in {samples_dir}/")
    for i, (name, (rows, desc)) in enumerate(SCENARIOS.items(), 1):
        path = samples_dir / f"{i:02d}_{name}.csv"
        n = write_csv(rows, path)
        print(f"  [{i}/5] {path.name:32s} {n:>4d} tx  ·  {desc}")

    # Default sample (consumed by /api/upload/sample) = the typical scenario
    write_csv(ROWS_TYPICAL, default_path)
    print(f"\nDefault sample (typical) → {default_path}")


if __name__ == "__main__":
    main()
