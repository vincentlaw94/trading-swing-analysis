# Draw BTC Levels on TradingView

Draw key ICT levels on the TradingView chart.

## Instructions

1. First run the analysis to get current levels:
   ```bash
   node src/analyze-once.js 4H
   ```

2. Extract key levels from analysis:
   - FVG Long Entry (green)
   - FVG Short Zone (red)
   - ERL Resistance levels (orange)
   - ERL Support levels (green dashed)
   - BB Upper/Lower (blue dashed)
   - Stop Loss level (pink dashed)
   - Equal highs/lows liquidity pools

3. Clear existing drawings if requested:
   - Use `draw_clear` to remove all drawings

4. Draw horizontal lines at each level using `draw_shape`:
   - Green (#00ff00) for long entries/support
   - Red (#ff0000) for short zones/resistance
   - Orange (#ffaa00) for TP levels
   - Blue (#2196F3) for BB levels
   - Pink (#ff5555) for stop loss

5. Add text labels for each level using `draw_shape` with shape="text"

6. Take a screenshot and show the final chart with `capture_screenshot`
