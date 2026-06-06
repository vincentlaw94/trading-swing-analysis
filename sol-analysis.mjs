const symbol = process.argv[2] || 'BTCUSDT';

async function analyze() {
  const [ticker, klines4h, klinesDaily] = await Promise.all([
    fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=' + symbol).then(r => r.json()),
    fetch('https://api.binance.com/api/v3/klines?symbol=' + symbol + '&interval=4h&limit=100').then(r => r.json()),
    fetch('https://api.binance.com/api/v3/klines?symbol=' + symbol + '&interval=1d&limit=30').then(r => r.json())
  ]);

  const parse = k => ({
    time: k[0],
    open: +k[1],
    high: +k[2],
    low: +k[3],
    close: +k[4],
    volume: +k[5]
  });

  const c4h = klines4h.map(parse);
  const cD = klinesDaily.map(parse);
  const price = +ticker.lastPrice;

  // Bollinger Bands
  function bb(closes, period = 20, mult = 2) {
    const slice = closes.slice(-period);
    const mean = slice.reduce((a,b) => a+b, 0) / period;
    const variance = slice.reduce((s,v) => s + Math.pow(v-mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    return {
      upper: mean + mult*std,
      middle: mean,
      lower: mean - mult*std,
      position: ((closes.at(-1) - (mean - mult*std)) / (mult*std*2)) * 100,
      bandwidth: (mult*std*2 / mean) * 100
    };
  }

  // RSI
  function rsi(closes, period = 14) {
    const gains = [], losses = [];
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i-1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    const avgGain = gains.slice(-period).reduce((a,b) => a+b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a,b) => a+b, 0) / period;
    if (avgLoss === 0) return 100;
    return 100 - (100 / (1 + avgGain / avgLoss));
  }

  // Standard Deviation Levels
  function stdLevels(closes, period = 20) {
    const slice = closes.slice(-period);
    const mean = slice.reduce((a,b) => a+b, 0) / slice.length;
    const variance = slice.reduce((s,v) => s + Math.pow(v-mean, 2), 0) / slice.length;
    const sd = Math.sqrt(variance);
    const zScore = (closes.at(-1) - mean) / sd;
    return { mean, sd, zScore };
  }

  // FVG Detection
  function detectFVGs(candles, currentPrice) {
    const fvgs = { bullish: [], bearish: [] };
    for (let i = 2; i < candles.length; i++) {
      const c1 = candles[i-2], c3 = candles[i];
      if (c3.low > c1.high && (c3.low - c1.high) / currentPrice > 0.002) {
        fvgs.bullish.push({ top: c3.low, bottom: c1.high, mid: (c3.low + c1.high) / 2 });
      }
      if (c3.high < c1.low && (c1.low - c3.high) / currentPrice > 0.002) {
        fvgs.bearish.push({ top: c1.low, bottom: c3.high, mid: (c1.low + c3.high) / 2 });
      }
    }
    return {
      bullish: fvgs.bullish.filter(f => f.top > currentPrice).sort((a,b) => Math.abs(a.mid - currentPrice) - Math.abs(b.mid - currentPrice)).slice(0, 3),
      bearish: fvgs.bearish.filter(f => f.bottom < currentPrice).sort((a,b) => Math.abs(a.mid - currentPrice) - Math.abs(b.mid - currentPrice)).slice(0, 3)
    };
  }

  // ERL Detection
  function detectERL(candles, currentPrice) {
    const swingHighs = [], swingLows = [];
    for (let i = 2; i < candles.length - 2; i++) {
      const curr = candles[i];
      const isHigh = curr.high > candles[i-1].high && curr.high > candles[i-2].high && curr.high > candles[i+1].high && curr.high > candles[i+2].high;
      const isLow = curr.low < candles[i-1].low && curr.low < candles[i-2].low && curr.low < candles[i+1].low && curr.low < candles[i+2].low;
      if (isHigh && curr.high > currentPrice) swingHighs.push(curr.high);
      if (isLow && curr.low < currentPrice) swingLows.push(curr.low);
    }
    return {
      buyStops: [...new Set(swingHighs)].sort((a,b) => a - b).slice(0, 3),
      sellStops: [...new Set(swingLows)].sort((a,b) => b - a).slice(0, 3)
    };
  }

  const closes4h = c4h.map(c => c.close);
  const closesD = cD.map(c => c.close);

  const bb4h = bb(closes4h);
  const bbD = bb(closesD);
  const rsi4h = rsi(closes4h);
  const rsiD = rsi(closesD);
  const std4h = stdLevels(closes4h);
  const stdD = stdLevels(closesD);
  const fvg = detectFVGs(c4h, price);
  const erl = detectERL(c4h, price);

  const fmt = n => n >= 1000 ? '$' + n.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0}) : '$' + n.toFixed(2);
  const pct = n => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
  const dist = (level) => ((level - price) / price * 100).toFixed(2);

  const name = symbol.replace('USDT', '').replace('USDC', '');
  console.log('═'.repeat(65));
  console.log('  ' + name + ' (' + symbol + ') ICT SWING ANALYSIS');
  console.log('  ' + new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC');
  console.log('═'.repeat(65));

  console.log();
  console.log('  CURRENT PRICE: ' + fmt(price));
  console.log('  24H Change:    ' + pct(+ticker.priceChangePercent));
  console.log('  24H Range:     ' + fmt(+ticker.lowPrice) + ' - ' + fmt(+ticker.highPrice));
  const vol = +ticker.quoteVolume;
  console.log('  24H Volume:    $' + (vol >= 1e9 ? (vol / 1e9).toFixed(2) + 'B' : (vol / 1e6).toFixed(1) + 'M'));

  console.log();
  console.log('─'.repeat(65));
  console.log('  BOLLINGER BANDS');
  console.log('─'.repeat(65));
  console.log('  4H:    Upper ' + fmt(bb4h.upper) + ' | Mid ' + fmt(bb4h.middle) + ' | Lower ' + fmt(bb4h.lower));
  console.log('         Position: ' + bb4h.position.toFixed(1) + '% | Bandwidth: ' + bb4h.bandwidth.toFixed(2) + '%');
  console.log('  Daily: Upper ' + fmt(bbD.upper) + ' | Mid ' + fmt(bbD.middle) + ' | Lower ' + fmt(bbD.lower));
  console.log('         Position: ' + bbD.position.toFixed(1) + '% | Bandwidth: ' + bbD.bandwidth.toFixed(2) + '%');

  console.log();
  console.log('─'.repeat(65));
  console.log('  RSI & Z-SCORE');
  console.log('─'.repeat(65));
  const rsi4hStatus = rsi4h < 30 ? ' OVERSOLD' : rsi4h > 70 ? ' OVERBOUGHT' : '';
  const rsiDStatus = rsiD < 30 ? ' OVERSOLD' : rsiD > 70 ? ' OVERBOUGHT' : '';
  console.log('  4H:    RSI ' + rsi4h.toFixed(1) + rsi4hStatus + ' | Z-Score: ' + std4h.zScore.toFixed(2) + 'σ');
  console.log('  Daily: RSI ' + rsiD.toFixed(1) + rsiDStatus + ' | Z-Score: ' + stdD.zScore.toFixed(2) + 'σ');

  console.log();
  console.log('─'.repeat(65));
  console.log('  FAIR VALUE GAPS (Entry Zones) [4H]');
  console.log('─'.repeat(65));
  console.log('  Bullish FVGs (buy zones below):');
  if (fvg.bullish.length === 0) console.log('    None nearby');
  else fvg.bullish.forEach(f => console.log('    ' + fmt(f.bottom) + ' - ' + fmt(f.top) + ' | Mid: ' + fmt(f.mid) + ' (' + dist(f.mid) + '%)'));
  console.log('  Bearish FVGs (sell zones above):');
  if (fvg.bearish.length === 0) console.log('    None nearby');
  else fvg.bearish.forEach(f => console.log('    ' + fmt(f.bottom) + ' - ' + fmt(f.top) + ' | Mid: ' + fmt(f.mid) + ' (+' + dist(f.mid) + '%)'));

  console.log();
  console.log('─'.repeat(65));
  console.log('  EXTERNAL RANGE LIQUIDITY (Targets) [4H]');
  console.log('─'.repeat(65));
  console.log('  Buy Stops (Long targets):');
  if (erl.buyStops.length === 0) console.log('    None detected');
  else erl.buyStops.forEach(p => console.log('    ' + fmt(p) + ' (+' + dist(p) + '%)'));
  console.log('  Sell Stops (Short targets):');
  if (erl.sellStops.length === 0) console.log('    None detected');
  else erl.sellStops.forEach(p => console.log('    ' + fmt(p) + ' (' + dist(p) + '%)'));

  console.log();
  console.log('─'.repeat(65));
  console.log('  STANDARD DEVIATION LEVELS (Daily)');
  console.log('─'.repeat(65));
  const sd = stdD.sd;
  const mean = stdD.mean;
  console.log('  +2.0 SD: ' + fmt(mean + 2*sd) + ' (+' + dist(mean + 2*sd) + '%)');
  console.log('  +1.5 SD: ' + fmt(mean + 1.5*sd) + ' (+' + dist(mean + 1.5*sd) + '%)');
  console.log('  +1.0 SD: ' + fmt(mean + sd) + ' (+' + dist(mean + sd) + '%)');
  console.log('  MEAN:    ' + fmt(mean) + ' (' + dist(mean) + '%)');
  console.log('  -1.0 SD: ' + fmt(mean - sd) + ' (' + dist(mean - sd) + '%)');
  console.log('  -1.5 SD: ' + fmt(mean - 1.5*sd) + ' (' + dist(mean - 1.5*sd) + '%)');
  console.log('  -2.0 SD: ' + fmt(mean - 2*sd) + ' (' + dist(mean - 2*sd) + '%)');

  // Bias calculation
  let bias = 0;
  if (rsiD < 30) bias += 2;
  else if (rsiD > 70) bias -= 2;
  if (bbD.position < 20) bias += 2;
  else if (bbD.position > 80) bias -= 2;
  if (stdD.zScore < -1.5) bias += 1;
  else if (stdD.zScore > 1.5) bias -= 1;
  if (price < mean) bias += 1;
  else bias -= 1;

  let biasLabel, emoji;
  if (bias >= 4) { biasLabel = 'STRONGLY BULLISH'; emoji = 'BULL++'; }
  else if (bias >= 2) { biasLabel = 'BULLISH'; emoji = 'BULL'; }
  else if (bias <= -4) { biasLabel = 'STRONGLY BEARISH'; emoji = 'BEAR++'; }
  else if (bias <= -2) { biasLabel = 'BEARISH'; emoji = 'BEAR'; }
  else { biasLabel = 'NEUTRAL'; emoji = 'FLAT'; }

  console.log();
  console.log('═'.repeat(65));
  console.log('  MARKET BIAS: [' + emoji + '] ' + biasLabel);
  console.log('═'.repeat(65));

  // Trade Setup
  console.log();
  console.log('  LONG SETUP:');
  console.log('    Entry: ' + (fvg.bullish[0] ? fmt(fvg.bullish[0].mid) + ' (FVG)' : fmt(bbD.lower) + ' (Lower BB)'));
  console.log('    Stop:  ' + (erl.sellStops[0] ? fmt(erl.sellStops[0] * 0.99) : fmt(bbD.lower * 0.97)));
  console.log('    TP1:   ' + (erl.buyStops[0] ? fmt(erl.buyStops[0]) : fmt(mean + sd)));
  console.log('    TP2:   ' + fmt(mean + 1.5*sd));

  console.log();
  console.log('  SHORT SETUP:');
  console.log('    Entry: ' + (fvg.bearish[0] ? fmt(fvg.bearish[0].mid) + ' (FVG)' : fmt(bbD.upper) + ' (Upper BB)'));
  console.log('    Stop:  ' + (erl.buyStops[0] ? fmt(erl.buyStops[0] * 1.01) : fmt(bbD.upper * 1.03)));
  console.log('    TP1:   ' + (erl.sellStops[0] ? fmt(erl.sellStops[0]) : fmt(mean - sd)));
  console.log('    TP2:   ' + fmt(mean - 1.5*sd));

  console.log();
  console.log('═'.repeat(65));
}

analyze().catch(e => console.error('Error:', e.message));
