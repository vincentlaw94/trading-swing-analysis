# Trading Swing Analysis

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

## ICT Trading Methodology

### Fair Value Gaps (FVG) - ENTRIES

FVGs are price inefficiencies created by impulsive moves:

| Type | Formation | Trading Use |
|------|-----------|-------------|
| **Bullish FVG** | Candle 3 low > Candle 1 high | Buy zone - price drops to fill |
| **Bearish FVG** | Candle 3 high < Candle 1 low | Sell zone - price rises to fill |

**Entry Strategy:**
- Wait for price to enter FVG zone
- Enter at FVG midpoint for optimal R:R
- Stop loss OUTSIDE the FVG (not at edge)

### External Range Liquidity (ERL) - EXITS

ERL = Liquidity pools where stop losses accumulate:

| Level | Liquidity Type | What Happens |
|-------|----------------|--------------|
| **Above Swing Highs** | Buy stops (short SLs) | Price sweeps to trigger stops |
| **Below Swing Lows** | Sell stops (long SLs) | Price sweeps to trigger stops |

**Exit Strategy:**
- Target 1: First ERL level (take partials)
- Move stop to breakeven after Target 1
- Let remainder ride to SD targets

### Standard Deviations - PROFIT TARGETS

Distance from 20-period mean:

| Level | Use Case |
|-------|----------|
| **±1.0 SD** | Conservative target |
| **±1.5 SD** | Standard target |
| **±2.0 SD** | Extended target |
| **±2.5 SD** | Maximum extension (rare) |

### Combined Entry/Exit Framework

**LONG SETUP:**
```
Entry:  Bullish FVG midpoint (or lower BB if no FVG)
Stop:   Below nearest sell stop ERL zone
TP1:    First buy stop ERL (take 50%)
TP2:    +1.5 SD level
TP3:    +2.0 SD level
```

**SHORT SETUP:**
```
Entry:  Bearish FVG midpoint (or upper BB if no FVG)
Stop:   Above nearest buy stop ERL zone
TP1:    First sell stop ERL (take 50%)
TP2:    -1.5 SD level
TP3:    -2.0 SD level
```

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
