# ICT Quick Reference

Display ICT trading concepts quick reference.

## Instructions

Read and display key concepts from `.claude/skills/ict-methodology.md`.

Focus on these sections based on user needs:
- **Market Structure**: BOS, CHoCH, MSS definitions
- **Entry Models**: OTE, FVG, Order Blocks, Unicorn Model
- **Kill Zones**: Trading session times (display in Mountain Time)
- **Silver Bullet**: 8-9 AM MT strategy for BTC

If no specific topic requested, show this quick cheat sheet:

```
ICT QUICK CHEAT SHEET
═════════════════════

ENTRY ZONES (Buy in Discount, Sell in Premium):
  Discount Zone: Below 50% fib (BUY)
  Premium Zone:  Above 50% fib (SELL)

OTE (Optimal Trade Entry):
  0.62 - 0.79 fib zone = Best entries

PD ARRAYS (Entry Confluences):
  FVG:      3-candle gap, price returns to fill
  OB:       Last candle before displacement
  Breaker:  Failed OB + liquidity sweep (HIGH prob)
  Unicorn:  Breaker + FVG overlap (HIGHEST prob)

KILL ZONES (Mountain Time):
  London:        12:00 AM - 3:00 AM MT
  NY AM:         5:00 AM - 8:00 AM MT
  Silver Bullet: 8:00 AM - 9:00 AM MT ← Best for BTC
  London Close:  8:00 AM - 10:00 AM MT

POWER OF 3 (AMD):
  A = Accumulation (Asian range building)
  M = Manipulation (Judas Swing - fake breakout)
  D = Distribution (True move)
  → Trade OPPOSITE to Judas Swing!

LIQUIDITY:
  BSL (Buy-side):  Above highs → Target for longs
  SSL (Sell-side): Below lows  → Target for shorts
```

For full details, reference: `.claude/skills/ict-methodology.md`
