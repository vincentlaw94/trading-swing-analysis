# Quick Quote for Any Symbol

Get real-time price quote for any symbol.

**Arguments:** $ARGUMENTS (symbol, e.g., ETHUSDC, AAPL, ES1!)

## Instructions

1. Parse symbol from: `$ARGUMENTS`
   - If empty, use current TradingView chart symbol

2. If TradingView MCP connected:
   - If symbol different from current chart, use `chart_set_symbol` first
   - Use `quote_get` to fetch real-time data
   - Return: last price, open, high, low, close, volume

3. For Binance crypto pairs, can also use direct API:
   ```bash
   curl -s "https://api.binance.com/api/v3/ticker/24hr?symbol=SYMBOL" | node -e "
     let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
       const t=JSON.parse(d);
       console.log('Price: $'+parseFloat(t.lastPrice).toFixed(2));
       console.log('24h: '+parseFloat(t.priceChangePercent).toFixed(2)+'%');
       console.log('High: $'+parseFloat(t.highPrice).toFixed(2));
       console.log('Low: $'+parseFloat(t.lowPrice).toFixed(2));
       console.log('Volume: '+parseFloat(t.volume).toFixed(0));
     });
   "
   ```

4. Display concise quote:
   ```
   SYMBOL: $PRICE (±X.XX%)
   24H Range: $LOW - $HIGH
   Volume: XXX
   ```
