# Take Chart Screenshot

Capture the current TradingView chart.

**Arguments:** $ARGUMENTS (optional: region - full, chart, strategy_tester)

## Instructions

1. Parse region from `$ARGUMENTS`:
   - "full" → entire TradingView window (default)
   - "chart" → just the chart area
   - "strategy" → strategy tester panel

2. Use `capture_screenshot` with specified region

3. Display the screenshot image

4. Optionally report:
   - Current symbol and timeframe
   - Timestamp
   - File path where screenshot was saved
