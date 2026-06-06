# BTC Swing Trading Analysis - Quick Start

## Initial Setup (One Time)

### 1. Launch TradingView with Debug Mode
```batch
C:\Users\vince\btc-swing-analysis\launch_tradingview.bat
```

### 2. Set Up Your Chart
- Open BTCUSD or BTCUSDT
- Set to 4H timeframe (or your preferred swing timeframe)
- Add indicators: FVG detector, liquidity levels, EMAs

### 3. Verify Connection (in a new Claude Code session)
```
cd C:\Users\vince\btc-swing-analysis
claude
```
Then ask: "Use tv_health_check to verify TradingView is connected"

---

## Usage Options

### Option A: Manual Analysis (On-Demand)
Run Claude Code from the project folder:
```
cd C:\Users\vince\btc-swing-analysis
claude
```

Then ask things like:
- "Analyze BTC for swing trade setups using FVG entries and ERL exits"
- "Quick BTC status check"
- "Check for unfilled FVG zones on the 4H chart"

### Option B: Automated Periodic Monitoring
Run the monitor script in PowerShell:

```powershell
# Standard monitoring (every 60 minutes)
.\monitor.ps1

# Quick mode with custom interval (every 30 minutes, minimal tokens)
.\monitor.ps1 -IntervalMinutes 30 -QuickMode

# Run for 10 cycles then stop
.\monitor.ps1 -MaxCycles 10

# High volatility mode (every 15 minutes)
.\monitor.ps1 -IntervalMinutes 15
```

Results are saved to: `C:\Users\vince\btc-swing-analysis\results\`

---

## Token Conservation Tips

1. **Use Quick Mode** for routine checks (-QuickMode flag)
2. **Increase intervals** during weekends/low volatility
3. **Set max cycles** to avoid runaway costs
4. Only do deep analysis when a setup is forming

## Interval Recommendations

| Situation | Interval | Command |
|-----------|----------|---------|
| Sleeping / AFK | 4-6 hours | `.\monitor.ps1 -IntervalMinutes 240 -QuickMode` |
| Normal monitoring | 1-2 hours | `.\monitor.ps1 -IntervalMinutes 60` |
| Active setup | 30 min | `.\monitor.ps1 -IntervalMinutes 30` |
| High volatility | 15 min | `.\monitor.ps1 -IntervalMinutes 15` |

---

## What to Look For

### Entry Signals (FVG)
- Unfilled bullish FVG below current price = potential long entry zone
- Unfilled bearish FVG above current price = potential short entry zone
- FVGs on higher timeframes (Daily, 4H) are more significant

### Exit Targets (ERL)
- Previous swing highs (for longs) - where short stops accumulate
- Previous swing lows (for shorts) - where long stops accumulate
- Standard deviation extensions from VWAP/mean

### Confluence Checklist
- [ ] FVG zone aligns with key support/resistance
- [ ] Higher timeframe trend supports direction
- [ ] Volume confirms the move
- [ ] RSI not diverging against trade direction
