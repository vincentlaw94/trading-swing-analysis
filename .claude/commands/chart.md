# Setup Chart for Any Symbol

Configure TradingView to display any symbol with swing trading setup.

**Arguments:** $ARGUMENTS (e.g., ETHUSDC 1H, NVDA D, ES1! 4H)

## Instructions

1. Parse arguments: `$ARGUMENTS`
   - First word: symbol (required)
   - Second word: timeframe (optional, default 4H)
   - Examples: "ETHUSDC", "NVDA D", "ES1! 1H"

2. Map timeframe shorthand:
   - 1m, 5m, 15m, 30m → 1, 5, 15, 30
   - 1H, 4H → 60, 240
   - D, 1D → D
   - W, 1W → W

3. Determine exchange prefix:
   - Crypto pairs ending in USDC/USDT/BTC → BINANCE:
   - Stock tickers (AAPL, TSLA, etc.) → NASDAQ: or NYSE:
   - Futures (ES1!, NQ1!, CL1!) → CME: or NYMEX:
   - Or let TradingView auto-resolve

4. Setup the chart:
   - Use `chart_set_symbol` with appropriate prefix
   - Use `chart_set_timeframe`
   - Use `chart_set_type` to Candles (1)

5. Add indicators:
   - Bollinger Bands
   - RSI (if pane space available)
   - Volume

6. Capture screenshot with `capture_screenshot`

7. Report current price and chart status
