# Analyze Any Symbol

Run ICT-style swing analysis on any trading pair.

**Arguments:** $ARGUMENTS (e.g., ETHUSDC, SOLUSDC, BNBUSDC)

## Instructions

1. Parse the symbol from arguments: `$ARGUMENTS`
   - If no symbol provided, ask user which symbol to analyze
   - Default to Binance pairs (add BINANCE: prefix for TradingView)

2. If TradingView MCP is connected:
   - Use `chart_set_symbol` to change to the requested symbol (e.g., BINANCE:ETHUSDC)
   - Use `chart_set_timeframe` to 240 (4H)
   - Use `quote_get` for real-time price
   - Use `data_get_ohlcv` with summary=true

3. Run analysis script if available:
   ```bash
   node src/analyze-once.js 4H $ARGUMENTS
   ```
   Note: Script may only support BTCUSDC - if so, use TradingView data directly

4. For TradingView-only analysis, calculate:
   - Price position relative to recent range
   - Trend direction from OHLCV data
   - Key support/resistance from recent highs/lows

5. Provide:
   - Current price and 24h stats
   - Trend bias (BULLISH/BEARISH/NEUTRAL)
   - Key levels (support/resistance)
   - Trade setup if clear signal exists

## Common Symbols
- Crypto: ETHUSDC, SOLUSDC, BNBUSDC, XRPUSDC, ADAUSDC, DOGEUSDC
- Stocks: AAPL, TSLA, NVDA, MSFT, GOOGL, AMZN
- Futures: ES1!, NQ1!, CL1!, GC1!
