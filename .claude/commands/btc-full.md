# BTC Full Multi-Timeframe Analysis

Run comprehensive BTC/USDC analysis across all timeframes with ICT methodology.

## Instructions

1. Run multi-timeframe analysis:
   ```bash
   node src/multi-timeframe.js
   ```

2. Run detailed 4H analysis:
   ```bash
   node src/analyze-once.js 4H
   ```

3. If TradingView MCP is connected, also get live data:
   - Use `chart_get_state` to verify connection
   - Use `quote_get` for real-time price
   - Use `data_get_study_values` for indicator readings

4. **Check CME Gap:**
   - Switch to CME:BTC1! on daily timeframe
   - Use `data_get_ohlcv` to get recent daily bars
   - Identify Friday close vs Monday open gaps
   - Calculate any unfilled gaps that could act as magnets
   - Note: Friday → Monday gaps are most significant

5. **Check Economic Events:**
   - Use WebSearch to find this week's economic calendar
   - Search query: "US economic calendar [current week] CPI FOMC PPI NFP"
   - Identify HIGH IMPACT events (CPI, PPI, FOMC, NFP)
   - Note dates/times and proximity to current day
   - Include volatility warning if events within 48 hours

7. Provide complete analysis including:
   - Multi-timeframe confluence table
   - Key levels (FVGs, ERLs, BBs, SDs)
   - **CME Gap status** (filled/unfilled, gap level, distance from current price)
   - **Economic Events** (upcoming high-impact events with dates)
   - Both LONG and SHORT trade setups with entries, stops, and targets
   - Current bias and confidence level
   - Squeeze/breakout status

8. Draw key levels on TradingView:
   - Use `draw_shape` for horizontal lines at key levels
   - Include CME gap levels if unfilled
   - Add text labels for each level

9. End with a clear "BOTTOM LINE" recommendation.
   - Include volatility warning if high-impact economic events are imminent

## CME Gap Analysis

To find CME gaps:
1. Get last 10-15 daily bars from CME:BTC1!
2. Look for Friday → Monday transitions (gaps in time)
3. Gap = Monday Open - Friday Close
4. If gap > $200, it's significant
5. Check if current price has filled the gap (traded through the level)
6. Unfilled gaps act as price magnets - include in analysis

## Economic Events Analysis

High-impact events that move BTC:

| Event | Impact | Typical Release |
|-------|--------|-----------------|
| CPI | HIGH | ~10th of month, 8:30 AM ET |
| PPI | HIGH | ~11th of month, 8:30 AM ET |
| FOMC | HIGH | 8x/year, 2:00 PM ET |
| NFP | HIGH | First Friday, 8:30 AM ET |

**Trading Rules:**
- No new entries 30 min before/after high-impact releases
- Reduce position size if event within 24-48 hours
- Watch for fakeouts - initial move often reverses
- Hot CPI/PPI = Bearish for BTC (risk-off)
- Dovish FOMC = Bullish for BTC (risk-on)
