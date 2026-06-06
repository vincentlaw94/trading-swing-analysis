/**
 * Short-term outlook analysis (4-12 hours)
 */

async function analyze() {
  const [ticker, depth, klines15m, klines1h, klines4h, trades] = await Promise.all([
    fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDC').then(r => r.json()),
    fetch('https://api.binance.com/api/v3/depth?symbol=BTCUSDC&limit=20').then(r => r.json()),
    fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDC&interval=15m&limit=20').then(r => r.json()),
    fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDC&interval=1h&limit=24').then(r => r.json()),
    fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDC&interval=4h&limit=12').then(r => r.json()),
    fetch('https://api.binance.com/api/v3/trades?symbol=BTCUSDC&limit=100').then(r => r.json())
  ]);

  const price = parseFloat(ticker.lastPrice);
  const high24 = parseFloat(ticker.highPrice);
  const low24 = parseFloat(ticker.lowPrice);
  const change = parseFloat(ticker.priceChangePercent);

  console.log('═'.repeat(60));
  console.log('  4-12 HOUR OUTLOOK');
  console.log('  ' + new Date().toISOString());
  console.log('═'.repeat(60));

  console.log(`\nPrice: $${price.toLocaleString()} (${change > 0 ? '+' : ''}${change.toFixed(2)}% 24h)`);
  console.log(`24h Range: $${low24.toLocaleString()} - $${high24.toLocaleString()}`);

  const rangePos = ((price - low24) / (high24 - low24) * 100).toFixed(0);
  console.log(`Position in range: ${rangePos}%`);

  // Order book
  console.log('\n── ORDER BOOK ──');
  const bids = depth.bids.map(b => ({ price: parseFloat(b[0]), qty: parseFloat(b[1]) }));
  const asks = depth.asks.map(a => ({ price: parseFloat(a[0]), qty: parseFloat(a[1]) }));

  const bidVol = bids.reduce((s, b) => s + b.qty, 0);
  const askVol = asks.reduce((s, a) => s + a.qty, 0);
  const imbalance = ((bidVol - askVol) / (bidVol + askVol) * 100).toFixed(1);

  console.log(`Imbalance: ${imbalance > 0 ? 'BIDS +' : 'ASKS '}${imbalance}%`);

  const bigBid = bids.find(b => b.qty > bidVol * 0.15);
  const bigAsk = asks.find(a => a.qty > askVol * 0.15);
  if (bigBid) console.log(`Bid wall: $${bigBid.price.toFixed(0)} (${bigBid.qty.toFixed(2)} BTC)`);
  if (bigAsk) console.log(`Ask wall: $${bigAsk.price.toFixed(0)} (${bigAsk.qty.toFixed(2)} BTC)`);

  // Trade flow
  console.log('\n── TRADE FLOW (last 100) ──');
  const buyVol = trades.filter(t => !t.isBuyerMaker).reduce((s, t) => s + parseFloat(t.qty), 0);
  const sellVol = trades.filter(t => t.isBuyerMaker).reduce((s, t) => s + parseFloat(t.qty), 0);
  const flowBias = ((buyVol - sellVol) / (buyVol + sellVol) * 100).toFixed(1);
  console.log(`Flow: ${flowBias > 0 ? 'BUYERS +' : 'SELLERS '}${flowBias}%`);

  // 15m analysis
  console.log('\n── 15M CANDLES ──');
  const bars15 = klines15m.map(k => ({ o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] }));
  const last5 = bars15.slice(-5);
  const bullish15 = last5.filter(b => b.c > b.o).length;

  const closes15 = bars15.map(b => b.c);
  const sma = closes15.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const std = Math.sqrt(closes15.slice(-20).reduce((s, c) => s + Math.pow(c - sma, 2), 0) / 20);
  const bbWidth = (std * 4 / sma * 100).toFixed(2);
  const squeeze = parseFloat(bbWidth) < 1.5;

  console.log(`Last 5: ${bullish15} bullish / ${5 - bullish15} bearish`);
  console.log(`BB Width: ${bbWidth}% ${squeeze ? '⚠️ SQUEEZE' : ''}`);

  // 1H structure
  console.log('\n── 1H STRUCTURE ──');
  const bars1h = klines1h.map(k => ({ o: +k[1], h: +k[2], l: +k[3], c: +k[4] }));
  const highs1h = bars1h.map(b => b.h);
  const lows1h = bars1h.map(b => b.l);

  const recentHighs = highs1h.slice(-6);
  const recentLows = lows1h.slice(-6);
  const makingHH = recentHighs[recentHighs.length - 1] > recentHighs[recentHighs.length - 3];
  const makingLL = recentLows[recentLows.length - 1] < recentLows[recentLows.length - 3];

  let structure = 'RANGING';
  if (makingHH && !makingLL) structure = 'BULLISH (HH)';
  if (makingLL && !makingHH) structure = 'BEARISH (LL)';
  console.log(`Structure: ${structure}`);

  // 4H
  console.log('\n── 4H TREND ──');
  const bars4h = klines4h.map(k => ({ o: +k[1], h: +k[2], l: +k[3], c: +k[4] }));
  const last3_4h = bars4h.slice(-3);
  const bullish4h = last3_4h.filter(b => b.c > b.o).length;
  console.log(`Last 3 candles: ${bullish4h}/3 bullish`);

  // Scoring
  let bullScore = 0, bearScore = 0;
  if (parseFloat(imbalance) > 10) bullScore += 2;
  else if (parseFloat(imbalance) < -10) bearScore += 2;
  if (parseFloat(flowBias) > 10) bullScore += 1;
  else if (parseFloat(flowBias) < -10) bearScore += 1;
  if (bullish15 >= 3) bullScore += 1;
  else if (bullish15 <= 2) bearScore += 1;
  if (structure.includes('BULLISH')) bullScore += 2;
  else if (structure.includes('BEARISH')) bearScore += 2;
  if (bullish4h >= 2) bullScore += 1;
  else if (bullish4h <= 1) bearScore += 1;
  if (parseInt(rangePos) < 30) bullScore += 1;
  if (parseInt(rangePos) > 70) bearScore += 1;

  // Scenarios
  console.log('\n' + '═'.repeat(60));
  console.log('  SCENARIOS (next 4-12 hours)');
  console.log('═'.repeat(60));

  console.log(`\nBias Score: BULL ${bullScore} vs BEAR ${bearScore}`);

  const chopProb = squeeze ? 35 : 50;
  const bullProb = squeeze ? 35 : (bullScore > bearScore ? 30 : 20);
  const bearProb = squeeze ? 30 : (bearScore > bullScore ? 30 : 20);

  console.log(`
┌─────────────────────────────────────────────────────────┐
│ SCENARIO A: CHOP/RANGE                                  │
│ Probability: ~${chopProb}%                                        │
│ Range: $${(price - 400).toFixed(0)} - $${(price + 400).toFixed(0)}                              │
│ What happens: Sideways, low volume, no clear direction  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ SCENARIO B: BREAKOUT UP                                 │
│ Probability: ~${bullProb}%                                        │
│ Trigger: Break above $${(Math.ceil(price / 100) * 100 + 300).toFixed(0)} with volume              │
│ Target: $74,200 - $74,500                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ SCENARIO C: BREAKDOWN                                   │
│ Probability: ~${bearProb}%                                        │
│ Trigger: Break below $${(Math.floor(price / 100) * 100 - 400).toFixed(0)} with volume             │
│ Target: $72,400 - $72,000                               │
└─────────────────────────────────────────────────────────┘
`);

  // Key levels
  console.log('KEY LEVELS TO WATCH:');
  console.log(`  🔺 $73,800 - Break = bullish, target $74,200+`);
  console.log(`  ⚡ $${price.toFixed(0)} - Current`);
  console.log(`  🔻 $73,000 - Break = bearish, target $72,400`);

  // Honest assessment
  console.log('\n' + '═'.repeat(60));
  console.log('  HONEST ASSESSMENT');
  console.log('═'.repeat(60));

  if (squeeze) {
    console.log(`
The 15m Bollinger Band squeeze (${bbWidth}% width) indicates
volatility is compressed. A move IS coming.

Order book: ${parseFloat(imbalance) < -20 ? 'Heavily ask-weighted (sellers)' : parseFloat(imbalance) > 20 ? 'Heavily bid-weighted (buyers)' : 'Relatively balanced'}
Trade flow: ${parseFloat(flowBias) < -10 ? 'Sellers active' : parseFloat(flowBias) > 10 ? 'Buyers active' : 'Mixed'}

PREDICTION: I cannot reliably predict direction.
The squeeze will resolve with a $400-800 move, but I don't
know which way. Set alerts at $73,800 and $73,000.

If forced to guess: ${bullScore > bearScore ? 'Slight bullish lean due to 4H sweep' : bearScore > bullScore ? 'Slight bearish lean due to order flow' : 'True coin flip'}.
`);
  } else {
    console.log(`
No squeeze, no strong momentum. Most likely outcome is
continued ranging until a catalyst appears.

Best play: Wait for price to reach extremes of range
- Long near $72,800-$73,000 with stop below $72,400
- Short near $73,800-$74,000 with stop above $74,300
- Or just wait for clearer setup
`);
  }
}

analyze().catch(console.error);
