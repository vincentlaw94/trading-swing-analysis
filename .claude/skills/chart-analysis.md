# Smart Money Chart Analysis Framework

A complete chart analysis skill based on **Trader Mayne's Trading Bootcamp** and ICT Smart Money Concepts.

---

## Video Reference Map

| Video | Concept | Section |
|-------|---------|---------|
| 1. Everything You Need To Trade ICT SMC | Foundation | All sections |
| 2. How To Trade Market Structure Like a Pro | Market Structure | [Structure Analysis](#1-market-structure-analysis) |
| 3. The Real Reason Smart Money Uses Liquidity Sweeps | Liquidity | [Liquidity Mapping](#2-liquidity-mapping) |
| 4. Dealing Ranges Simplified | Price Targets | [Dealing Range](#3-dealing-range-framework) |
| 5. How Smart Money Finds Market Direction | Daily Bias | [Bias Determination](#4-daily-bias-determination) |
| 6. The Fair Value Gap Secret | FVG Entries | [Entry Models](#5-entry-models) |
| 7. Order Blocks & Breakers Blueprint | OB/Breaker | [Entry Models](#5-entry-models) |
| 8. Order Blocks or FVGs? | Concept Selection | [Entry Selection](#choosing-between-ob-and-fvg) |
| 9. OTE - Most Precise Entry | Fibonacci OTE | [OTE Entry](#optimal-trade-entry-ote) |
| 10. Power of 3 (AMD) | Session Structure | [Power of Three](#6-power-of-three-amd) |

---

## Chart Analysis Workflow

```
┌─────────────────────────────────────────────────────────┐
│                  CHART ANALYSIS FLOW                     │
├─────────────────────────────────────────────────────────┤
│  1. STRUCTURE  →  Identify trend & key swings           │
│  2. LIQUIDITY  →  Mark BSL/SSL pools                    │
│  3. RANGE      →  Define dealing range & EQ             │
│  4. BIAS       →  Determine daily direction             │
│  5. ENTRY      →  Locate POI (OB/FVG/Breaker)          │
│  6. EXECUTE    →  Wait for LTF confirmation            │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Market Structure Analysis

### Structure Types

| Pattern | Signal | Action |
|---------|--------|--------|
| **BOS** (Break of Structure) | Trend continuation | Trade with trend |
| **CHoCH** (Change of Character) | Potential reversal | Alert, wait for MSS |
| **MSS** (Market Structure Shift) | Confirmed reversal | Counter-trend entry |

### How to Identify

**Bullish Structure:**
```
        HH ← Higher High
       /
      /
    HL ← Higher Low (BOS when broken upward)
   /
  /
 H
```

**Bearish Structure:**
```
 H
  \
   \
    LH ← Lower High (BOS when broken downward)
     \
      \
       LL ← Lower Low
```

### Structure Rules

1. **Mark swing points** on HTF (Daily/4H for swing trades)
2. **Label each swing** as HH, HL, LH, or LL
3. **Identify breaks** - candle body must CLOSE beyond swing
4. **Displacement required for MSS** - strong momentum candle, not just wick

### Structure Checklist

- [ ] Current trend identified (bullish/bearish/ranging)
- [ ] Last BOS marked and direction noted
- [ ] Counter-trend swings identified (potential MSS points)
- [ ] No CHoCH warning present

---

## 2. Liquidity Mapping

### Liquidity Types

| Type | Location | Contains | Target For |
|------|----------|----------|------------|
| **BSL** (Buy-Side) | Above swing highs | Short stop losses | Bullish targets |
| **SSL** (Sell-Side) | Below swing lows | Long stop losses | Bearish targets |
| **Equal Highs** | Multiple touches | Heavy stop cluster | High-prob sweep |
| **Equal Lows** | Multiple touches | Heavy stop cluster | High-prob sweep |

### The Liquidity Sweep

Smart money drives price INTO liquidity pools to:
1. Trigger retail stop losses
2. Fill large institutional orders
3. Create the reversal setup

```
BULLISH SWEEP SETUP:

     Equal Lows
    ══════════════  ← SSL Pool
         │
         ▼ Sweep
         │
    ─────┴───────── ← Reversal point
              ↑
              │
         Rally begins
```

### Marking Liquidity

1. **Identify obvious highs/lows** on HTF
2. **Mark equal levels** (horizontal clusters)
3. **Note relative liquidity** - more touches = more stops
4. **Track swept vs unswept** - unswept = potential target

### Liquidity Checklist

- [ ] BSL pools marked above current price
- [ ] SSL pools marked below current price
- [ ] Equal highs/lows identified
- [ ] Nearest liquidity target noted

---

## 3. Dealing Range Framework

### What is a Dealing Range?

The price zone between a **significant swing high** and **swing low** that serves as your analysis framework.

### Components

```
┌────────────────────────────────────┐
│           SWING HIGH               │ ← External BSL
├────────────────────────────────────┤
│                                    │
│         PREMIUM ZONE               │ ← Sell zone (above 50%)
│         (Expensive)                │
│                                    │
├──────────── 0.50 EQ ───────────────┤ ← Equilibrium
│                                    │
│         DISCOUNT ZONE              │ ← Buy zone (below 50%)
│         (Cheap)                    │
│                                    │
├────────────────────────────────────┤
│           SWING LOW                │ ← External SSL
└────────────────────────────────────┘
```

### Key Levels

| Level | Fib | Use |
|-------|-----|-----|
| Swing High | 1.00 | BSL target |
| Premium | 0.79-0.62 | OTE sell zone |
| Equilibrium | 0.50 | Decision point |
| Discount | 0.38-0.21 | OTE buy zone |
| Swing Low | 0.00 | SSL target |

### Range Rules

1. **Buy in Discount** (below 0.50)
2. **Sell in Premium** (above 0.50)
3. **Target External Liquidity** (swing high/low)
4. **Use Internal Levels for Entry** (FVG, OB within range)

### Dealing Range Checklist

- [ ] Range high and low clearly defined
- [ ] Equilibrium (50%) marked
- [ ] Current price position identified (premium/discount)
- [ ] Internal POIs marked within range

---

## 4. Daily Bias Determination

### The Question

> "Is today a buying day or a selling day?"

### Bias Framework

**BULLISH Bias When:**
- HTF in uptrend (HH, HL structure)
- Price in discount zone of HTF range
- Unswept BSL above as target
- Recent SSL sweep with reversal

**BEARISH Bias When:**
- HTF in downtrend (LH, LL structure)
- Price in premium zone of HTF range
- Unswept SSL below as target
- Recent BSL sweep with reversal

### Bias Confirmation Signals

| Signal | Bullish | Bearish |
|--------|---------|---------|
| HTF Structure | HH/HL | LH/LL |
| Zone | Discount | Premium |
| Liquidity | SSL swept | BSL swept |
| Target | BSL above | SSL below |

### Time-Based Bias (Sessions)

| Session | MT Time | Typical Action |
|---------|---------|----------------|
| Asian | 5 PM - 8 PM | Range building |
| London | 12 AM - 3 AM | First directional move |
| NY AM | 5 AM - 8 AM | Continuation or reversal |
| NY PM | 10 AM - 1 PM | Distribution/profit-taking |

### Bias Checklist

- [ ] HTF trend direction confirmed
- [ ] Price position in dealing range noted
- [ ] Liquidity target identified
- [ ] Session timing considered

---

## 5. Entry Models

### Points of Interest (POI)

POIs are the zones where you wait for price to enter before looking for LTF confirmation.

### Order Block (OB)

**Definition:** The last candle before a displacement move.

```
BULLISH ORDER BLOCK:

    │█│ ← Displacement candles
    │█│    (strong up move)
    │█│
   ─┴─┴─
   │▓│ ← ORDER BLOCK (last down candle)
   └─┘
```

**Valid OB Criteria:**
1. Must have caused structure break
2. Displacement must follow immediately
3. Creates or contains FVG
4. First return = highest probability

### Fair Value Gap (FVG)

**Definition:** 3-candle pattern where candle 1 and 3 don't overlap.

```
BULLISH FVG:

    │█│ Candle 3
    │█│
    └─┘
    ═══ ← GAP (entry zone)
    ┌─┐
    │█│ Candle 1
```

**FVG Entry Rules:**
- Enter at 50% of gap (consequent encroachment)
- Stop below gap low (bullish) or above gap high (bearish)
- Target next liquidity pool

### Breaker Block

**Definition:** Failed order block that becomes support/resistance.

```
BREAKER FORMATION:

1. Order Block forms
2. Price sweeps liquidity BEYOND the OB
3. OB fails (price breaks through)
4. Former OB becomes BREAKER
5. Price returns = high-probability entry
```

**Why Breakers Work:**
- Failed OB = trapped traders
- Liquidity already swept
- Higher probability than standard OB

### Choosing Between OB and FVG

From Video 8: "Order Blocks or Fair Value Gaps?"

| Use OB When | Use FVG When |
|-------------|--------------|
| Clear displacement from zone | Rapid price movement |
| Zone caused structure break | OB is large/unclear |
| First return to zone | Need precise entry |
| Higher timeframe analysis | Lower timeframe execution |

**Best Practice:** Look for OB that CONTAINS an FVG = highest confluence.

### Optimal Trade Entry (OTE)

From Video 9: "OTE Is The Most Precise Entry"

**OTE Zone:** Fibonacci 0.62 - 0.79 retracement

```
OTE SETUP:

Swing High ─────────── 0.00 (measure from here)
                │
                │
         ═══════╪═══════ 0.62 ─┐
                │              │ OTE ZONE
         ═══════╪═══════ 0.705 │ (Sweet spot)
                │              │
         ═══════╪═══════ 0.79 ─┘
                │
Swing Low ──────────── 1.00 (to here)
```

**OTE Process:**
1. Identify clean swing (structure break)
2. Apply Fibonacci from swing points
3. Wait for price to enter 0.62-0.79 zone
4. Look for LTF confirmation within OTE
5. Enter with stop beyond 1.0 level

### Entry Model Selection

| Scenario | Best Entry |
|----------|------------|
| First pullback after BOS | OB at swing origin |
| Deep pullback | OTE zone |
| Fast market | FVG midpoint |
| After liquidity sweep | Breaker block |
| Maximum confluence | OB + FVG + OTE overlap |

---

## 6. Power of Three (AMD)

From Video 10: "Every Market Move Follows This Pattern"

### The Three Phases

```
BULLISH AMD:

         Distribution (Rally)
              ↗
             /
            /
   ────────┼──────── Daily Open
           │\
           │ \
           │  ↘ Manipulation (Fake breakdown)
    ═══════════════
     Accumulation
       (Range)
```

| Phase | Description | Time | Action |
|-------|-------------|------|--------|
| **A**ccumulation | Tight range near open | Asian/Early London | Mark range, wait |
| **M**anipulation | False move to sweep stops | London/Early NY | Identify as trap |
| **D**istribution | True directional move | NY Session | Execute trades |

### Trading AMD

**Step 1: Mark the Accumulation**
- Identify consolidation near daily open
- Mark range high and low
- Note where stops are building

**Step 2: Wait for Manipulation**
- Price breaks one side of range
- Sweeps obvious liquidity
- Creates "Judas Swing"

**Step 3: Trade the Distribution**
- Confirm reversal from manipulation
- Enter on LTF structure break
- Stop beyond manipulation extreme
- Target opposite side liquidity

### AMD Session Map (Mountain Time)

| Phase | Typical MT Time |
|-------|-----------------|
| Accumulation | 5 PM - 12 AM |
| Manipulation | 12 AM - 5 AM |
| Distribution | 5 AM - 12 PM |

---

## 7. Complete Analysis Checklist

### Pre-Analysis

- [ ] Clear HTF chart (Daily/4H)
- [ ] Remove unnecessary indicators
- [ ] Mark last 20+ candles of structure

### Structure Phase

- [ ] Trend direction identified
- [ ] Key swing points marked
- [ ] BOS/CHoCH/MSS labeled
- [ ] Current structure state noted

### Liquidity Phase

- [ ] BSL pools above price marked
- [ ] SSL pools below price marked
- [ ] Equal highs/lows highlighted
- [ ] Nearest targets identified

### Range Phase

- [ ] Dealing range defined
- [ ] Equilibrium (50%) marked
- [ ] Premium/discount zones clear
- [ ] Current zone identified

### Bias Phase

- [ ] Daily bias determined
- [ ] Supporting evidence listed
- [ ] Conflicting factors noted
- [ ] Go/no-go decision made

### Entry Phase

- [ ] POIs marked (OB/FVG/Breaker)
- [ ] OTE zone identified if applicable
- [ ] Entry price defined
- [ ] Stop loss level set
- [ ] Target(s) identified

### Execution Phase

- [ ] LTF confirmation received
- [ ] Risk calculated (1-2% max)
- [ ] R:R minimum 2:1 confirmed
- [ ] Trade logged

---

## 8. Trade Execution Framework

### Trader Mayne's Structure + OTE Playbook

**Timeframe Pairing:**
- HTF: Daily → LTF: H1
- HTF: H4 → LTF: M15
- HTF: H1 → LTF: M5

**Execution Steps:**

1. **HTF Analysis**
   - Identify structure break direction
   - Mark dealing range with premium/discount
   - Locate POI that caused structure break

2. **Wait for Pullback**
   - Price must return to POI
   - Enter when price is in correct zone (discount for longs)

3. **LTF Confirmation**
   - Drop to execution timeframe at POI
   - Wait for liquidity sweep within POI
   - Confirm with breaker/MSS

4. **Execute**
   - Entry: Breaker block or FVG after sweep
   - Stop: Beyond swept liquidity
   - Target: External liquidity (swing high/low)

### Risk Management Rules

| Rule | Requirement |
|------|-------------|
| Risk per trade | 1-2% maximum |
| Minimum R:R | 2:1 |
| Target R:R | 3:1 |
| Win rate needed | 35-40% (at 2:1 R:R) |

**Trader Mayne Note:** "I win in the high 30s to mid-40s percent of my trades and I'm consistently profitable because every trade targets 2:1 or 3:1."

---

## 9. Quick Reference Card

```
╔═══════════════════════════════════════════════════════════╗
║              SMART MONEY QUICK REFERENCE                   ║
╠═══════════════════════════════════════════════════════════╣
║                                                            ║
║  STRUCTURE:  BOS = Continue | CHoCH = Alert | MSS = Flip  ║
║                                                            ║
║  LIQUIDITY:  BSL = Above highs | SSL = Below lows         ║
║                                                            ║
║  ZONES:      Premium (>50%) = Sell | Discount (<50%) = Buy║
║                                                            ║
║  OTE:        0.62 - 0.705 - 0.79 (Sweet spot: 0.705)     ║
║                                                            ║
║  POIs:       Order Block → FVG → Breaker (best to good)  ║
║                                                            ║
║  AMD:        A=Range | M=Fake move | D=Real move          ║
║                                                            ║
║  RISK:       1-2% per trade | 2:1 minimum R:R             ║
║                                                            ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Sources

- [Trader Mayne Trading Bootcamp](https://www.youtube.com/playlist?list=PLKItFyoma4GeQSNjY7LM5qtEgTFUidxYI)
- [Structure + OTE Playbook](https://www.tradezella.com/strategies/structure-ote)
- [ICT Dealing Range Guide](https://arongroups.co/technical-analyze/ict-dealing-range/)
- [ICT Power of 3](https://innercircletrader.net/tutorials/ict-power-of-3/)
- [ICT Market Structure Shift](https://innercircletrader.net/tutorials/ict-market-structure-shift/)

**DISCLAIMER**: Educational purposes only. Not financial advice. Practice on demo before risking real capital.
