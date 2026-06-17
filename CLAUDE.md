# Trading Swing Analysis

## User Preferences

- **Timezone**: Always display times in **Mountain Time (MT / UTC-07:00)**. Convert all UTC times to MT before displaying. Include both MT and UTC when relevant for trading sessions.
- **ETA**: Always include ETA when discussing upcoming events or session times. Use minutes if under 2 hours (e.g., "~40 min"), otherwise use hours (e.g., "~3h").

## Quick Commands

```bash
# Agentic Workflow (runs continuously with smart sleep intervals)
npm start                      # Starts periodic agent
node src/agent.js              # Same as above

# Single Analysis
npm run analyze                # One-shot 4H analysis
node src/analyze-once.js 4H    # Specify timeframe
node src/analyze-once.js 1D    # Daily analysis

# Multi-Timeframe Confluence
node src/multi-timeframe.js    # 15m, 1H, 4H, 1D combined

# Legacy ICT-Style Analysis
node analyze-ict.js BTCUSDC
ict.bat BTCUSDC

# Basic Bollinger Bands Analysis
node analyze.js BTCUSDC
btc.bat

# Multi-symbol scan
node analyze-multi.js
```

## Agentic Workflow (Token-Optimized)

The agent (`npm start`) runs continuously with **smart sleep intervals**:

| Market Condition | Check Interval |
|------------------|----------------|
| Volatility Squeeze | 2 minutes |
| BB Expansion | 2 minutes |
| ERL Sweep Detected | 2 minutes |
| Extreme Z-Score (>2σ) | 2 minutes |
| Normal Market | 5 minutes |
| Quiet Market | 15 minutes |

**Logs saved to:** `./logs/btc-analysis-YYYY-MM-DD.json`

## Analysis Tools

### analyze-ict.js - ICT-Style Analysis (Recommended)
Full ICT methodology analysis including:
- **Fair Value Gaps (FVG)** - Entry zones where price inefficiency exists
- **External Range Liquidity (ERL)** - Swing highs/lows where stops accumulate
- **Standard Deviation Levels** - Profit targets at 1.0, 1.5, 2.0, 2.5 SD
- Bollinger Bands & RSI
- Complete trade setup with entries, stops, and targets

### analyze.js - Full Single-Symbol Analysis
Provides comprehensive analysis including:
- Current price and 24h stats
- Bollinger Bands (4H and Daily timeframes)
- RSI (14-period)
- MACD trend
- Key support/resistance levels
- Fair Value Gap (FVG) detection
- Swing trade recommendations

### analyze-multi.js - Multi-Symbol Scanner
Quick comparison of multiple assets:
- BB position across all symbols
- RSI readings
- Signal detection (Long/Short/Watch)
- Highlights potential setups

## Trading Skills Reference

| Skill | File | Description |
|-------|------|-------------|
| **Trading Strategies** | `.claude/skills/trading-strategies.md` | ICT/SMC complete guide - Market Structure, Liquidity, FVG, Dealing Ranges, OB/Breakers, AMD, OTE, BPR, CISD, SD Targets |
| **ICT Methodology** | `.claude/skills/ict-methodology.md` | Complete ICT concepts reference with IFVG, kill zones, Silver Bullet |
| **Chart Analysis** | `.claude/skills/chart-analysis.md` | SMC analysis framework |

### Slash Commands

| Command | Description |
|---------|-------------|
| `/smc-analysis` | Full SMC chart analysis on any symbol |
| `/ict-ref` | Quick ICT concepts reference |
| `/btc` | Quick BTC analysis |
| `/btc-full` | Multi-timeframe BTC analysis |
| `/analyze` | Analyze any symbol |

## ICT Trading Methodology

**Full Reference:** See `.claude/skills/ict-methodology.md` for complete ICT concepts.
**Chart Analysis:** See `.claude/skills/chart-analysis.md` for Trader Mayne's SMC framework.

### Core Concepts Quick Reference

| Concept | Definition | Use |
|---------|------------|-----|
| **FVG** | 3-candle gap (inefficiency) | Entry zones |
| **Order Block** | Last candle before displacement | Entry zones |
| **Breaker Block** | Failed OB + liquidity sweep | High-prob entries |
| **OTE Zone** | Fib 0.62-0.79 retracement | Optimal entries |
| **Liquidity** | Stops above highs/below lows | Targets & sweeps |

### Kill Zones (Mountain Time)

| Session | MT Time | Best For |
|---------|---------|----------|
| **London** | 12:00 AM - 3:00 AM | Highest probability moves |
| **NY AM** | 5:00 AM - 8:00 AM | Session overlap, volume |
| **Silver Bullet** | 8:00 AM - 9:00 AM | Algorithmic sweeps |
| **London Close** | 8:00 AM - 10:00 AM | Reversals |

### Power of Three (AMD)

Daily price action phases:
1. **A**ccumulation (Asian) - Range building
2. **M**anipulation (London) - Judas Swing (fake move)
3. **D**istribution (NY) - True directional move

**Rule:** Enter OPPOSITE to the Judas Swing after confirmation.

### Optimal Trade Entry (OTE)

```
Fibonacci Levels:
0.50  → Equilibrium
0.62  → OTE zone start
0.705 → Sweet spot
0.79  → OTE zone end
1.00  → Invalidation
```

### Unicorn Model (High Probability)

Setup = **Breaker Block + FVG Overlap**
- Breaker: Failed OB after liquidity sweep
- Enter when price returns to overlap zone
- Stop: 10-20 pips beyond zone
- Target: 1:2+ R:R

### Combined Entry/Exit Framework

**LONG SETUP:**
```
Entry:  Bullish FVG/OB in discount zone (below 50%)
        OR OTE zone (0.62-0.79 fib)
Stop:   Below nearest sell stop liquidity
TP1:    First buy stop ERL (take 50%)
TP2:    +1.5 SD level
TP3:    +2.0 SD level
```

**SHORT SETUP:**
```
Entry:  Bearish FVG/OB in premium zone (above 50%)
        OR OTE zone (0.62-0.79 fib)
Stop:   Above nearest buy stop liquidity
TP1:    First sell stop ERL (take 50%)
TP2:    -1.5 SD level
TP3:    -2.0 SD level
```

### Silver Bullet Strategy (8-9 AM MT)

1. Determine HTF bias (4H/Daily)
2. Mark overnight highs/lows as liquidity
3. Wait for sweep within 8:00-9:00 AM MT
4. Enter on FVG retest (NOT displacement)
5. Target next liquidity (1:2+ R:R)

## Economic Events Consideration

**Always check upcoming economic events before making trade recommendations.**

### High Impact Events (Avoid new entries 30 min before/after)

| Event | Typical Release | Impact on BTC |
|-------|-----------------|---------------|
| **CPI** | ~10th of month, 8:30 AM ET | Hot = Bearish, Cool = Bullish |
| **PPI** | ~11th of month, 8:30 AM ET | Leading indicator for CPI |
| **FOMC** | 8x/year, 2:00 PM ET | Rate decisions move all risk assets |
| **NFP** | First Friday, 8:30 AM ET | Jobs data affects Fed policy outlook |
| **Jobless Claims** | Every Thursday, 8:30 AM ET | Weekly labor market pulse |

### How to Check Events

Use web search to find current week's economic calendar:
```
Search: "US economic calendar [current week] CPI FOMC PPI"
```

Reliable sources:
- [Trading Economics](https://tradingeconomics.com/united-states/calendar)
- [Forex Factory](https://www.forexfactory.com/calendar)
- [BLS Release Schedule](https://www.bls.gov/schedule/news_release/current_year.asp)
- [Federal Reserve FOMC Calendar](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm)

### Trading Rules Around Events

1. **Before CPI/FOMC:** Reduce position size or close positions
2. **During release:** No new entries - wait for dust to settle
3. **After release:** Wait 15-30 min for true direction to emerge
4. **Fakeout warning:** Initial move often reverses within first 5-15 minutes

### Event Impact Matrix

| Scenario | CPI/PPI | FOMC | Effect on BTC |
|----------|---------|------|---------------|
| **Bullish** | Below consensus | Dovish/Rate cut | Risk-on rally |
| **Neutral** | In-line | As expected | Minimal move |
| **Bearish** | Above consensus | Hawkish/Rate hike | Risk-off selloff |

### Crypto-Specific Events

Also monitor:
- **Bitcoin ETF flows** (daily) - Sustained outflows = bearish pressure
- **CME gaps** (weekend) - ~77% fill rate, act as price magnets
- **CME Reference Rate** - 9:00 AM MT daily (settlement price)
- **Options expiry** (monthly/quarterly) - Increased volatility
- **Halving cycle** (every ~4 years) - Next: April 2028

### CME Gap Trading

| Gap Type | Formation | Strategy |
|----------|-----------|----------|
| **Gap Up** | BTC rallies over weekend | Expect fill, fade rallies |
| **Gap Down** | BTC drops over weekend | Expect fill, fade dips |

**Note:** CME now trades 24/7 (as of 2026), with only 2-hour maintenance pause Saturday 9 PM - 11 PM MT.

## Signal Interpretation

| Signal | BB Position | RSI | Action |
|--------|-------------|-----|--------|
| 🟢 LONG | < 20% | < 30 | Strong buy signal |
| 🔴 SHORT | > 80% | > 70 | Strong sell signal |
| 🟡 WATCH LONG | < 30% | 30-40 | Approaching buy zone |
| 🟡 WATCH SHORT | > 70% | 60-70 | Approaching sell zone |
| NEUTRAL | 30-70% | 40-60 | No clear setup |

## Chart Analysis Rules

When performing chart analysis, use one of these methods:

### Method 1: TradingView via Microsoft Edge (Preferred for Visual Analysis)
```bash
# Launch Edge with TradingView and remote debugging enabled
start msedge --remote-debugging-port=9222 "https://www.tradingview.com/chart"
```
- Use TradingView MCP tools for full chart control
- Best for: Visual analysis, drawing levels, screenshots, indicator overlays
- Supports: Multiple timeframes, custom indicators, Pine Script

### Method 2: Binance API (Preferred for Data Analysis)
- Use Node.js scripts in this repo for programmatic analysis
- Best for: Quick price checks, multi-symbol scans, automated alerts
- No authentication required for public endpoints

**Always use one of these methods. Do not attempt to use TradingView Desktop unless explicitly installed.**

## Data Source

All data fetched from **Binance API** (free, no rate limits for public endpoints):
- Real-time prices
- OHLCV candlestick data
- 24-hour statistics

## Periodic Monitoring

For automated periodic checks, use the PowerShell monitor script:

```powershell
# Check every 60 minutes
.\monitor.ps1 -IntervalMinutes 60

# Quick mode (less detail, fewer tokens)
.\monitor.ps1 -IntervalMinutes 30 -QuickMode

# Run for 10 cycles then stop
.\monitor.ps1 -MaxCycles 10
```

## Risk Management

- Never risk more than 1-2% per trade
- Set stop loss below support (longs) or above resistance (shorts)
- Take partial profits at first target
- Move stop to breakeven after first target hit

**DISCLAIMER**: This is for educational purposes only. Not financial advice.
