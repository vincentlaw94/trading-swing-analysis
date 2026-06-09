# Scan Watchlist

Scan multiple symbols for trading opportunities.

**Arguments:** $ARGUMENTS (optional: comma-separated symbols)

## Instructions

1. Get symbols to scan:
   - If `$ARGUMENTS` provided, parse comma-separated list
   - Otherwise use default crypto watchlist:
     BTCUSDC, ETHUSDC, SOLUSDC, BNBUSDC, XRPUSDC, ADAUSDC

2. If TradingView connected, get current watchlist:
   - Use `watchlist_get` to fetch symbols with prices

3. For each symbol, gather quick data:
   - Current price
   - 24h change %
   - Position in recent range (high/low %)

4. Create summary table:
   ```
   | Symbol   | Price    | 24h %  | Range Position | Signal |
   |----------|----------|--------|----------------|--------|
   | BTCUSDC  | $74,000  | +0.5%  | 65%            | WATCH  |
   | ETHUSDC  | $3,800   | -1.2%  | 30%            | LONG?  |
   ```

5. Highlight any symbols with:
   - Extreme range position (<20% or >80%)
   - Large 24h moves (>3%)
   - Near key round numbers

6. Recommend which symbols deserve deeper analysis
