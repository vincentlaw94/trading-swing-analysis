# ICT Trading Methodology - Complete Reference

A comprehensive guide to Inner Circle Trader (ICT) concepts developed by Michael J. Huddleston.

---

## Table of Contents

1. [Market Structure](#market-structure)
2. [Liquidity Concepts](#liquidity-concepts)
3. [Price Delivery Arrays](#price-delivery-arrays-pd-arrays)
4. [Entry Models](#entry-models)
5. [Time-Based Trading](#time-based-trading)
6. [Advanced Models](#advanced-models)
7. [Crypto-Specific Concepts](#crypto-specific-concepts)
8. [Trade Management](#trade-management)

---

## Market Structure

### Break of Structure (BOS)
Confirms trend continuation when price breaks previous swing highs (bullish) or lows (bearish).

```
BULLISH BOS:          BEARISH BOS:
     HH                    LH
    /  \                  /  \
   /    \                /    \
  HL     \BOS           LL     \BOS
 /                     /
H                     H
```

### Change of Character (CHoCH)
Signals potential reversals when price shifts from making higher highs/lows to lower patterns (or vice versa).

| Pattern | Signal | Meaning |
|---------|--------|---------|
| HH → LH | Bearish CHoCH | Uptrend weakening |
| LL → HL | Bullish CHoCH | Downtrend weakening |

### Market Structure Shift (MSS)
A displacement candle that breaks internal structure and confirms bias change. More aggressive than CHoCH.

### Change in State of Delivery (CISD)
Reversal pattern that signals sudden shift in institutional order flow. Appears earlier than CHoCH.

| Aspect | CISD | CHoCH |
|--------|------|-------|
| **Timing** | Earlier | Later |
| **Signal** | More aggressive | Standard |
| **Best at** | HTF key levels, after sweep | Structure breaks |

### Swing Point Hierarchy

| Level | Name | Formation |
|-------|------|-----------|
| **STH/STL** | Short-Term High/Low | 3-candle swing |
| **ITH/ITL** | Intermediate-Term | STH/STL with same on both sides |
| **LTH/LTL** | Long-Term | ITH/ITL with same on both sides |

Hierarchy: STH → ITH → LTH (each requires same-tier neighbours)

---

## Liquidity Concepts

### Buy-Side Liquidity (BSL)
- Located **above** swing highs and equal highs
- Contains buy stop orders from short sellers' stop losses
- Price sweeps these levels to trigger stops before reversing

### Sell-Side Liquidity (SSL)
- Located **below** swing lows and equal lows
- Contains sell stop orders from long traders' stop losses
- Price sweeps these levels to trigger stops before reversing

### Liquidity Sweep
When institutions drive price through liquidity pools to fill large orders:

```
BULLISH SWEEP:                BEARISH SWEEP:
                HH  ← Swept
      /\       /                    \
     /  \     / Reversal             \
    /    \   /                        \  Reversal
   /      \_/                          \_/
  Equal Lows ← Swept                   LL
```

### External vs Internal Liquidity
| Type | Location | Use Case |
|------|----------|----------|
| **External** | Beyond range (swing H/L) | Major targets |
| **Internal** | Within range (FVGs, OBs) | Entry zones |

---

## Price Delivery Arrays (PD Arrays)

### Fair Value Gap (FVG)

Three-candle pattern where middle candle creates a gap:

**Bullish FVG:**
```
Candle 3: Low > Candle 1 High
    │█│
    │█│ Candle 3
    │█│
  ═══════ GAP (Buy Zone)
│█│
│█│ Candle 1
│█│
```

**Bearish FVG:**
```
│█│
│█│ Candle 1
│█│
  ═══════ GAP (Sell Zone)
    │█│
    │█│ Candle 3
    │█│
```

**Trading FVGs:**
- Entry: FVG midpoint (50%) or consequent encroachment
- Stop: Below/above FVG boundary
- Target: Next liquidity pool

### Order Block (OB)

Institutional footprint marking major buy/sell activity:

| Type | Definition | Location |
|------|------------|----------|
| **Bullish OB** | Last down candle before up move | Buy at this level |
| **Bearish OB** | Last up candle before down move | Sell at this level |

**Valid Order Block Criteria:**
1. Must have displacement (strong move away)
2. Should contain or precede an FVG
3. Higher timeframe alignment preferred

### Breaker Block

Forms when an order block **fails after sweeping liquidity**:

```
1. Original OB forms
2. Price sweeps liquidity beyond OB
3. OB breaks → becomes Breaker
4. Price returns → high probability reversal
```

**Breaker = Failed OB + Liquidity Sweep = Higher Probability**

### Mitigation Block

Forms when an order block **fails WITHOUT a liquidity sweep**:

```
1. Original OB forms
2. Lower high/higher low forms (no sweep)
3. OB breaks → becomes Mitigation Block
4. Valid but LOWER probability than Breaker
```

### Inversion Fair Value Gap (IFVG)

When an FVG gets broken through and holds from the opposite side:

| Original | After Break | Becomes |
|----------|-------------|---------|
| **Bearish FVG** | Price breaks UP through | **Bullish zone** (support) |
| **Bullish FVG** | Price breaks DOWN through | **Bearish zone** (resistance) |

```
IFVG FORMATION:
                     │ Price breaks up
│█│ Bearish FVG      │
│█│                  ↓
│█│ ═══════════════════ IFVG (now support)
                     │
                     │ Retest from above = entry
```

**IFVG Trading Rules:**
1. FVG must be clearly violated (closed through)
2. Wait for price to return to IFVG zone
3. Enter on retest from the new direction
4. Stop beyond the IFVG
5. Target next liquidity

### Balanced Price Range (BPR)

Highest probability zone: **Bullish FVG + Bearish FVG overlap**

```
         ┌─────────┐
Bearish  │  FVG    │
         │═════════│ ← BPR (Double Imbalance)
Bullish  │  FVG    │
         └─────────┘
```

**Trading BPR:**
- Enter on retest of BPR zone
- Stop beyond the zone
- Target: External liquidity
- Two opposing imbalances = magnetic zone

### Volume Imbalance (VI)

Gap between candle close and next candle open (body-to-body gap):

| Type | Formation |
|------|-----------|
| **Bullish VI** | Candle 2 opens ABOVE Candle 1 close |
| **Bearish VI** | Candle 2 opens BELOW Candle 1 close |

**VI vs FVG:** VI is body-to-body, FVG is wick-to-wick. VI indicates stronger urgency.

### Premium & Discount Zones

| Zone | Fib Level | Action |
|------|-----------|--------|
| **Premium** | Above 50% | Sell opportunities |
| **Equilibrium** | 50% | Decision point |
| **Discount** | Below 50% | Buy opportunities |

---

## Entry Models

### Optimal Trade Entry (OTE)

Fibonacci-based entry zone between 0.62 and 0.79 retracement:

```
Fib Settings for OTE:
─────────────────────
0.00  → First profit scale
0.50  → Equilibrium
0.62  → OTE zone start
0.705 → Sweet spot (optimal entry)
0.79  → OTE zone end
1.00  → Starting position / Invalidation
```

### Standard Deviation Targets

| Extension | Name | Action |
|-----------|------|--------|
| **-0.27** | First Target | Take 25%, internal liquidity |
| **-0.62** | Primary Target | Take 50%, older liquidity pools |
| **-1.0** | Symmetrical | 1× the leg, move SL to BE |
| **-2.0** | Full SD | Prior session highs/lows |
| **-2.5** | Extended | Likely retracement zone |
| **-4.0** | Maximum | Rare extreme expansion |

**Profit Taking Strategy:**
- TP1 at -0.27: Take 25%, move SL to breakeven
- TP2 at -0.62: Take 50%
- Trail remainder to -2.0 or beyond when HTF supports it

**OTE Process:**
1. Identify confirmed trend direction
2. Draw Fib from swing low to high (or vice versa)
3. Wait for retracement into 0.62-0.79 zone
4. Look for confluence (OB, FVG, Breaker in zone)
5. Enter at OTE with stop beyond swing point
6. Target next liquidity or -0.27/-0.62 extensions

### Unicorn Model (2022)

High-probability setup combining Breaker Block + FVG overlap:

**Components:**
1. **Breaker Block** - Failed OB with liquidity sweep
2. **Fair Value Gap** - Must overlap with Breaker
3. **Unicorn Zone** - The overlap area

```
BULLISH UNICORN:

      /\  HH (swept)
     /  \/
    /    │█│ FVG ══════╗
   /     │█│ ──────────╬── UNICORN ZONE
  /      │█│ Breaker ══╝
 /       │█│
/        │█│
```

**Entry Rules:**
- Wait for price to return to Unicorn Zone
- Enter on lower timeframe confirmation (CHoCH/FVG)
- Stop: 10-20 pips beyond zone
- Target: 1:2 R:R minimum, next liquidity

---

## Time-Based Trading

### Kill Zones (New York Time)

| Kill Zone | Time (EST) | Best Pairs | Characteristics |
|-----------|------------|------------|-----------------|
| **Asian** | 7:00 PM - 10:00 PM | AUD, JPY | Range building, low volatility |
| **London** | 2:00 AM - 5:00 AM | EUR, GBP | Highest probability moves |
| **New York AM** | 7:00 AM - 10:00 AM | USD, Indices | Session overlap, high volume |
| **London Close** | 10:00 AM - 12:00 PM | USD | Profit taking, reversals |

### Convert to Mountain Time (MT)

| Kill Zone | EST | MT (UTC-7) |
|-----------|-----|------------|
| Asian | 7:00 PM - 10:00 PM | 5:00 PM - 8:00 PM |
| London | 2:00 AM - 5:00 AM | 12:00 AM - 3:00 AM |
| New York AM | 7:00 AM - 10:00 AM | 5:00 AM - 8:00 AM |
| London Close | 10:00 AM - 12:00 PM | 8:00 AM - 10:00 AM |

### Silver Bullet Strategy

One-hour windows for high-probability algorithmic sweeps:

| Window | EST Time | MT Time |
|--------|----------|---------|
| **London SB** | 3:00 AM - 4:00 AM | 1:00 AM - 2:00 AM |
| **NY AM SB** | 10:00 AM - 11:00 AM | 8:00 AM - 9:00 AM |
| **NY PM SB** | 2:00 PM - 3:00 PM | 12:00 PM - 1:00 PM |

**Silver Bullet Process:**
1. Pre-determine bias from HTF (15m-4H)
2. Mark session highs/lows as liquidity
3. Wait for liquidity sweep within Silver Bullet window
4. Look for FVG formation after sweep
5. Enter on FVG retest (NOT on displacement)
6. Stop beyond the swept liquidity
7. Target next liquidity pool (1:2+ R:R)

### Power of Three (AMD)

Daily price action structured in three phases:

| Phase | Session | Action | Purpose |
|-------|---------|--------|---------|
| **A**ccumulation | Asian | Range building | Orders filled |
| **M**anipulation | London Open | Judas Swing | Trap traders |
| **D**istribution | NY Session | True move | Take profits |

### Judas Swing

The false opening move that traps early traders:

```
BULLISH DAY:
Asian Range ─────────────
           \
            \  Judas Swing (fake down)
             \/
              \
               ────────── True Move Up
                         /
                        /
```

**Judas Swing Time Windows (EST):**
| Phase | Time | Action |
|-------|------|--------|
| NY Midnight | 00:00 | Judas begins |
| London Open | 03:00 | Most Judas swings form |
| End Window | 05:00 | Real move should start |

**Process:**
1. Fake move sweeps liquidity
2. MSS on 5m/15m confirms trap
3. Price retraces to OTE (50-79%)
4. Enter on retracement

**Rule:** Enter OPPOSITE to the Judas Swing after confirmation.

---

## Advanced Models

### Market Maker Models

**MMPY (Market Maker Profile Yield)**
- Tracks accumulation zones
- Identifies manipulation near session opens
- Projects distribution at yield targets

**MMXL (Market Maker Exhaustion Levels)**
- Price points where institutional activity exhausts
- Confirmed through displacement slowdown
- Signals potential reversals

**MMXM (Market Maker Exhaustion Model)**
- Structured reversal framework
- Transition from expansion to consolidation
- Entry on retracement into OB/FVG

### IOFED (Institutional Order Flow Entry Drill)

Precision entry after liquidity grabs:
1. Higher timeframe bias confirmation
2. Liquidity sweep on lower timeframe
3. Displacement creating FVG
4. Enter on FVG retest
5. Tight stops beyond sweep

### Sniper Entry Model

Maximum precision entries combining:
- HTF bias + LTF confirmation
- Order block within OTE zone
- FVG overlap
- 1-2% max risk per trade

---

## Crypto-Specific Concepts

### CME Gaps

Price discrepancies when CME futures close while spot markets continue:

| Gap Type | Formation | Expectation |
|----------|-----------|-------------|
| **Gap Up** | BTC rallies over weekend | ~77% fill rate |
| **Gap Down** | BTC drops over weekend | Acts as price magnet |

**CME Bitcoin Futures Hours:**
- Traditional: Fri 4 PM CT close → Sun 5 PM CT open
- NEW (2026): 24/7 trading with 2-hour pause (3-5 AM UTC Saturday)

**CME Reference Rate:** 4:00 PM London (3:00 PM UTC) daily

### Bitcoin Session Mapping

| Traditional Session | BTC Equivalent | Character |
|--------------------|----------------|-----------|
| Asian | Crypto "night" (US) | Range, accumulation |
| London | Crypto "morning" (US) | First major move |
| New York | Crypto "afternoon" (US) | Volume spike |

### Crypto-Specific Kill Zone Adjustments

Crypto trades 24/7, but ICT concepts still apply:
- Watch CME futures open/close for institutional flow
- London/NY sessions still most volatile
- Weekend = Lower liquidity, wider spreads, manipulation risk

---

## Trade Management

### Position Sizing

```
Risk per trade:  0.5% - 2% of capital
Standard risk:   1% recommended
```

### Stop Loss Placement

| Setup | Stop Location |
|-------|---------------|
| OTE Entry | Beyond swing point (1.0 fib) |
| FVG Entry | Beyond FVG boundary |
| OB Entry | Beyond OB range |
| Unicorn Entry | 10-20 pips beyond zone |

### Take Profit Scaling

```
LONG EXAMPLE:
────────────────────────────────────
TP3: +2.0 SD or final liquidity (25%)
TP2: +1.5 SD or second target   (25%)
TP1: First liquidity pool       (50%) ← Move SL to BE
────────────────────────────────────
Entry: OTE / FVG / OB
Stop: Beyond swing low
```

### Risk-to-Reward Targets

| Strategy | Minimum R:R |
|----------|-------------|
| Silver Bullet | 1:2 |
| Unicorn | 1:2 |
| Standard OB/FVG | 1:3 |
| Sniper Entry | 1:5+ |

---

## PD Array Probability Ranking

| Rank | Setup | Probability |
|------|-------|-------------|
| 1 | **BPR** (Dual FVG overlap) | Highest |
| 2 | **Unicorn** (Breaker + FVG) | Very High |
| 3 | **OB + FVG overlap** | High |
| 4 | **FVG in OTE zone** | High |
| 5 | **OB in OTE zone** | Good |
| 6 | **Breaker Block** | Good |
| 7 | **Standalone FVG** | Moderate |
| 8 | **Standalone OB** | Moderate |

**Stacking Rule:** 2-3 overlapping PD arrays = highest probability entry.

---

## Quick Reference Checklist

### Pre-Trade

- [ ] HTF bias determined (Daily/4H)
- [ ] Premium or Discount zone identified
- [ ] Liquidity pools marked
- [ ] Kill zone active
- [ ] Economic calendar checked

### Entry Confirmation

- [ ] Liquidity swept
- [ ] Displacement occurred
- [ ] FVG or OB present
- [ ] Price in OTE zone (0.62-0.79)
- [ ] LTF structure shift confirmed

### Trade Execution

- [ ] Entry at PD array (FVG/OB)
- [ ] Stop beyond invalidation
- [ ] TP1 at first liquidity
- [ ] Risk within 1-2%
- [ ] R:R minimum 1:2

---

## Sources & Further Learning

- [ICT YouTube Channel](https://www.youtube.com/@InnerCircleTrader)
- [Inner Circle Trader Guide](https://innercircletrader.net/)
- [ICT Trading Concepts](https://www.xs.com/en/blog/ict-trading/)
- [ICT Kill Zones](https://ictkillzonetimes.com/)
- [Optimal Trade Entry](https://howtotrade.com/blog/optimal-trade-entry-ict/)

**DISCLAIMER**: This is for educational purposes only. Not financial advice. Practice on demo accounts for 6-12 months before risking real capital.
