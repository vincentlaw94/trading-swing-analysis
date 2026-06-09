# BTC Price Watch

Get a quick snapshot of current BTC price and key levels without full analysis.

## Instructions

1. If TradingView MCP is connected:
   - Use `quote_get` to get real-time BTCUSDC price
   - Use `data_get_ohlcv` with summary=true for recent range

2. Otherwise use the script:
   ```bash
   node -e "
   const https = require('https');
   https.get('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDC', res => {
     let data = '';
     res.on('data', chunk => data += chunk);
     res.on('end', () => {
       const t = JSON.parse(data);
       console.log('BTC/USDC: $' + parseFloat(t.lastPrice).toFixed(2));
       console.log('24h Change: ' + parseFloat(t.priceChangePercent).toFixed(2) + '%');
       console.log('24h High: $' + parseFloat(t.highPrice).toFixed(2));
       console.log('24h Low: $' + parseFloat(t.lowPrice).toFixed(2));
     });
   });
   "
   ```

3. Report:
   - Current price
   - 24h change percentage
   - 24h high/low range
   - Distance from key levels (if known from previous analysis)
