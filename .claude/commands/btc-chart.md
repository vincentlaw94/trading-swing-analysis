# Setup BTC Chart in TradingView

Configure TradingView to show BTC/USDC with proper indicators for swing trading.

## Instructions

1. Check TradingView connection:
   - Use `tv_health_check` to verify CDP connection
   - If not connected, inform user to launch with `--remote-debugging-port=9222`

2. Set up the chart:
   - Use `chart_set_symbol` to set BINANCE:BTCUSDC
   - Use `chart_set_timeframe` to set 240 (4H)
   - Use `chart_set_type` to set Candles

3. Add indicators:
   - Bollinger Bands
   - Relative Strength Index
   - Volume (if not present)

4. Take a screenshot to confirm setup with `capture_screenshot`

5. Get current readings:
   - Use `quote_get` for price
   - Use `data_get_study_values` for indicator values
