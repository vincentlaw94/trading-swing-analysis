# Trading Swing Analysis

Crypto swing trading analysis toolkit with ICT/SMC methodology, Bollinger Bands, Fair Value Gaps (FVG), External Range Liquidity (ERL), and TradingView integration via Claude Code.

## Features

- **ICT/SMC Analysis** - Order Blocks, FVGs, Liquidity Sweeps, Unicorn Entries
- **Multi-Timeframe** - 15m, 1H, 4H, Daily confluence analysis
- **TradingView Integration** - Real-time chart control via MCP
- **Automated Monitoring** - Agentic workflow with smart intervals
- **Claude Code Skills** - Slash commands for quick analysis

## Quick Start

```bash
# Install dependencies
npm install

# Run single analysis
npm run analyze

# Start automated monitoring agent
npm start
```

## Analysis Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Continuous agent with smart sleep intervals |
| `npm run analyze` | One-shot 4H analysis |
| `node analyze-ict.js BTCUSDC` | ICT-style full analysis |
| `node src/multi-timeframe.js` | 15m, 1H, 4H, 1D combined |
| `node analyze-multi.js` | Multi-symbol scanner |

## Claude Code Slash Commands

| Command | Description |
|---------|-------------|
| `/btc` | Quick BTC analysis |
| `/btc-full` | Multi-timeframe BTC analysis |
| `/analyze SYMBOL` | Analyze any symbol |
| `/smc-analysis` | Full Smart Money Concepts analysis |
| `/ict-ref` | ICT quick reference guide |
| `/levels SYMBOL` | Draw key levels on chart |
| `/watchlist` | Scan watchlist symbols |

## ICT Methodology

### Core Concepts

| Concept | Definition | Use |
|---------|------------|-----|
| **FVG** | 3-candle gap (inefficiency) | Entry zones |
| **Order Block** | Last candle before displacement | Entry zones |
| **Breaker Block** | Failed OB + liquidity sweep | High-prob entries |
| **OTE Zone** | Fib 0.62-0.79 retracement | Optimal entries |
| **Liquidity** | Stops above highs/below lows | Targets & sweeps |
| **Unicorn** | OB + FVG overlap | Best entries |

### Kill Zones (UTC-7 Mountain Time)

| Session | MT Time | Best For |
|---------|---------|----------|
| **London** | 12:00 AM - 3:00 AM | Highest probability moves |
| **NY AM** | 5:00 AM - 8:00 AM | Session overlap, volume |
| **Silver Bullet** | 8:00 AM - 9:00 AM | Algorithmic sweeps |
| **London Close** | 8:00 AM - 10:00 AM | Reversals |

### Power of Three (AMD)

1. **A**ccumulation (Asian) - Range building
2. **M**anipulation (London) - Judas Swing (fake move)
3. **D**istribution (NY) - True directional move

## Signal Interpretation

| Signal | BB Position | RSI | Action |
|--------|-------------|-----|--------|
| LONG | < 20% | < 30 | Strong buy signal |
| SHORT | > 80% | > 70 | Strong sell signal |
| WATCH LONG | < 30% | 30-40 | Approaching buy zone |
| WATCH SHORT | > 70% | 60-70 | Approaching sell zone |
| NEUTRAL | 30-70% | 40-60 | No clear setup |

## TradingView Setup

### Method 1: TradingView Desktop (Recommended)

```bash
# Launch with remote debugging enabled
start msedge --remote-debugging-port=9222 "https://www.tradingview.com/chart"
```

### Method 2: Use Launch Script

```bash
.\launch_tradingview.bat
```

## Automated Monitoring

| Market Condition | Check Interval |
|------------------|----------------|
| Volatility Squeeze | 2 minutes |
| BB Expansion | 2 minutes |
| ERL Sweep Detected | 2 minutes |
| Extreme Z-Score (>2σ) | 2 minutes |
| Normal Market | 5 minutes |
| Quiet Market | 15 minutes |

```powershell
# Standard monitoring
.\monitor.ps1 -IntervalMinutes 60

# Quick mode
.\monitor.ps1 -IntervalMinutes 30 -QuickMode

# High volatility
.\monitor.ps1 -IntervalMinutes 15
```

## Project Structure

```
├── src/
│   ├── agent.js           # Continuous monitoring agent
│   ├── analyze-once.js    # Single analysis run
│   ├── multi-timeframe.js # MTF confluence
│   └── analysis/
│       ├── bollinger.js   # BB calculations
│       ├── fvg.js         # Fair Value Gap detection
│       ├── erl.js         # External Range Liquidity
│       └── stddev.js      # Standard deviation levels
├── analyze-ict.js         # ICT methodology analysis
├── analyze-multi.js       # Multi-symbol scanner
├── .claude/
│   ├── commands/          # Slash command definitions
│   └── skills/            # Trading methodology guides
└── logs/                  # Analysis output logs
```

## Data Sources

- **Binance API** - Real-time prices, OHLCV data, 24h stats
- **TradingView** - Chart visualization, indicators, drawings

## Risk Management

- Never risk more than 1-2% per trade
- Set stop loss below support (longs) or above resistance (shorts)
- Take partial profits at first target
- Move stop to breakeven after first target hit

## License

MIT

---

**DISCLAIMER**: This is for educational purposes only. Not financial advice. Trade at your own risk.
