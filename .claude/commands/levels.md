# Draw Levels on Any Chart

Draw key support/resistance levels on the current TradingView chart.

**Arguments:** $ARGUMENTS (optional: specific levels to draw)

## Instructions

1. Get current chart state:
   - Use `chart_get_state` to get current symbol and timeframe
   - Use `data_get_ohlcv` with summary=true to get price range

2. If specific levels provided in `$ARGUMENTS`:
   - Parse comma-separated prices (e.g., "73500, 74000, 75000")
   - Draw horizontal lines at each level

3. If no levels provided, auto-calculate:
   - Recent swing highs (resistance)
   - Recent swing lows (support)
   - Round number levels (psychological)
   - Current price ± 1%, 2%, 3% levels

4. Draw levels using `draw_shape`:
   - Green for support levels
   - Red for resistance levels
   - Blue dashed for current price reference
   - Orange for target levels

5. Add text labels for each level

6. Take screenshot with `capture_screenshot`

## Examples
- `/levels` → Auto-draw levels for current chart
- `/levels 73500, 74500, 75500` → Draw specific levels
