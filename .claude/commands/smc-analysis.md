# Smart Money Chart Analysis

Run complete Smart Money Concepts (SMC) chart analysis on any symbol.

**Arguments:** $ARGUMENTS (e.g., BTCUSDC, ETHUSDC, ES1!, NQ1!)

## Instructions

Perform a complete chart analysis using the framework from `.claude/skills/chart-analysis.md`.

### Step 1: Setup Chart

1. Parse symbol from `$ARGUMENTS` (default: BTCUSDC)
2. Use TradingView MCP to set up chart:
   ```
   chart_set_symbol → BINANCE:{symbol} or appropriate exchange
   chart_set_timeframe → 240 (4H for swing analysis)
   ```

### Step 2: Gather Data

Use TradingView tools:
- `data_get_ohlcv` with summary=true for price data
- `quote_get` for current price
- `chart_get_state` to see current indicators

### Step 3: Structure Analysis

Identify on the chart:
- [ ] Current trend (HH/HL = Bullish, LH/LL = Bearish)
- [ ] Last BOS (Break of Structure)
- [ ] Any CHoCH or MSS signals

### Step 4: Liquidity Mapping

Mark key levels:
- [ ] BSL (Buy-Side Liquidity) - above recent highs
- [ ] SSL (Sell-Side Liquidity) - below recent lows
- [ ] Equal highs/lows (liquidity clusters)

### Step 5: Dealing Range

Define the range:
- [ ] Swing High (range top)
- [ ] Swing Low (range bottom)
- [ ] Equilibrium (50% level)
- [ ] Current zone (Premium or Discount)

### Step 6: Bias Determination

Determine daily bias based on:
- HTF structure direction
- Premium/Discount position
- Liquidity targets
- Session timing

### Step 7: Entry Identification

Look for POIs:
- Order Blocks (last candle before displacement)
- Fair Value Gaps (3-candle gaps)
- Breaker Blocks (failed OBs after sweep)
- OTE Zone (0.62-0.79 fib)

### Step 8: Trade Setup

If setup exists, provide:
```
BIAS:     [BULLISH/BEARISH/NEUTRAL]
ENTRY:    [Price level and POI type]
STOP:     [Price level]
TARGET 1: [First liquidity target]
TARGET 2: [Extended target]
R:R:      [Risk to Reward ratio]
```

### Output Format

```
═══════════════════════════════════════════════════════════
           SMC ANALYSIS: {SYMBOL} | {TIMEFRAME}
═══════════════════════════════════════════════════════════

CURRENT PRICE: $XX,XXX

STRUCTURE
─────────
Trend:      [Bullish/Bearish/Ranging]
Last BOS:   [Level and direction]
Status:     [Continuation/Reversal warning/MSS confirmed]

LIQUIDITY
─────────
BSL Pools:  $XX,XXX (above)
SSL Pools:  $XX,XXX (below)
Next Target: [Which pool and why]

DEALING RANGE
─────────────
Range High:  $XX,XXX
Equilibrium: $XX,XXX
Range Low:   $XX,XXX
Current:     [Premium/Discount] zone

DAILY BIAS: [BULLISH/BEARISH/NEUTRAL]
──────────
Reason: [1-2 sentence explanation]

TRADE SETUP
───────────
[If valid setup exists, show entry/stop/targets]
[If no setup, explain what to wait for]

POIs TO WATCH
─────────────
1. [Level] - [OB/FVG/Breaker] - [Buy/Sell zone]
2. [Level] - [Type] - [Zone]

═══════════════════════════════════════════════════════════
Analysis based on Trader Mayne SMC Framework
═══════════════════════════════════════════════════════════
```

## Notes

- Always check for economic events before recommending entries
- Display times in Mountain Time (MT)
- Minimum 2:1 R:R required for any trade recommendation
- Reference `.claude/skills/chart-analysis.md` for detailed concept explanations
