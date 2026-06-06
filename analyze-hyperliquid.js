#!/usr/bin/env node
/**
 * Hyperliquid Token ICT Analysis
 * Supports HYPE and other tokens on Hyperliquid DEX
 */

const https = require('https');

const CONFIG = {
  coin: process.argv[2] || 'HYPE',
  interval: process.argv[3] || '4h'
};

function fetchHyperliquid(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.hyperliquid.xyz',
      path: '/info',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Invalid JSON: ' + body.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function fmt(num, decimals = 2) {
  return '$' + parseFloat(num).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function distPct(current, level) {
  return ((level - current) / current * 100).toFixed(2);
}

// Detect FVGs
function detectFVGs(candles, currentPrice) {
  const fvgs = { bullish: [], bearish: [] };
  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2], c3 = candles[i];
    // Bullish FVG
    if (parseFloat(c3.l) > parseFloat(c1.h)) {
      const fvg = {
        top: parseFloat(c3.l), bottom: parseFloat(c1.h),
        midpoint: (parseFloat(c3.l) + parseFloat(c1.h)) / 2,
        status: currentPrice < parseFloat(c1.h) ? 'FILLED' :
                currentPrice <= parseFloat(c3.l) ? 'IN ZONE' : 'UNFILLED'
      };
      if ((fvg.top - fvg.bottom) / currentPrice > 0.003) fvgs.bullish.push(fvg);
    }
    // Bearish FVG
    if (parseFloat(c3.h) < parseFloat(c1.l)) {
      const fvg = {
        top: parseFloat(c1.l), bottom: parseFloat(c3.h),
        midpoint: (parseFloat(c1.l) + parseFloat(c3.h)) / 2,
        status: currentPrice > parseFloat(c1.l) ? 'FILLED' :
                currentPrice >= parseFloat(c3.h) ? 'IN ZONE' : 'UNFILLED'
      };
      if ((fvg.top - fvg.bottom) / currentPrice > 0.003) fvgs.bearish.push(fvg);
    }
  }
  const sortByProximity = (a, b) => Math.abs(a.midpoint - currentPrice) - Math.abs(b.midpoint - currentPrice);
  return {
    bullish: fvgs.bullish.filter(f => f.status !== 'FILLED').sort(sortByProximity).slice(0, 5),
    bearish: fvgs.bearish.filter(f => f.status !== 'FILLED').sort(sortByProximity).slice(0, 5)
  };
}

// Detect ERL (swing highs/lows)
function detectERL(candles, currentPrice) {
  const swingHighs = [], swingLows = [];
  for (let i = 2; i < candles.length - 2; i++) {
    const [p2, p1, curr, n1, n2] = [candles[i-2], candles[i-1], candles[i], candles[i+1], candles[i+2]];
    const h = parseFloat(curr.h), l = parseFloat(curr.l);
    if (h > parseFloat(p1.h) && h > parseFloat(p2.h) && h > parseFloat(n1.h) && h > parseFloat(n2.h)) {
      swingHighs.push({ price: h, erlZone: h * 1.003, swept: currentPrice > h });
    }
    if (l < parseFloat(p1.l) && l < parseFloat(p2.l) && l < parseFloat(n1.l) && l < parseFloat(n2.l)) {
      swingLows.push({ price: l, erlZone: l * 0.997, swept: currentPrice < l });
    }
  }
  return {
    buyStops: swingHighs.filter(s => !s.swept && s.price > currentPrice).sort((a,b) => a.price - b.price).slice(0, 4),
    sellStops: swingLows.filter(s => !s.swept && s.price < currentPrice).sort((a,b) => b.price - a.price).slice(0, 4)
  };
}

// Standard Deviation levels
function calcStdDev(candles, period = 20) {
  const closes = candles.slice(-period).map(c => parseFloat(c.c));
  const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
  const std = Math.sqrt(closes.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / closes.length);
  return {
    mean, std,
    levels: {
      '+2.5 SD': mean + 2.5 * std, '+2.0 SD': mean + 2.0 * std, '+1.5 SD': mean + 1.5 * std, '+1.0 SD': mean + 1.0 * std,
      'MEAN': mean,
      '-1.0 SD': mean - 1.0 * std, '-1.5 SD': mean - 1.5 * std, '-2.0 SD': mean - 2.0 * std, '-2.5 SD': mean - 2.5 * std
    }
  };
}

// RSI
function rsi(candles, period = 14) {
  const closes = candles.map(c => parseFloat(c.c));
  const gains = [], losses = [];
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  return avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
}

// Bollinger Bands
function bollingerBands(candles, period = 20) {
  const closes = candles.slice(-period).map(c => parseFloat(c.c));
  const mean = closes.reduce((a, b) => a + b, 0) / period;
  const std = Math.sqrt(closes.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period);
  const current = parseFloat(candles[candles.length - 1].c);
  return {
    upper: mean + 2 * std, middle: mean, lower: mean - 2 * std,
    position: ((current - (mean - 2 * std)) / (4 * std)) * 100
  };
}

async function analyze() {
  console.log(`\nFetching ${CONFIG.coin} data from Hyperliquid...\n`);

  try {
    // Fetch current price and candles
    const now = Date.now();
    const [mids, candles] = await Promise.all([
      fetchHyperliquid({ type: 'allMids' }),
      fetchHyperliquid({
        type: 'candleSnapshot',
        req: { coin: CONFIG.coin, interval: CONFIG.interval, startTime: now - 30 * 24 * 60 * 60 * 1000, endTime: now }
      })
    ]);

    if (!Array.isArray(candles) || candles.length < 20) {
      throw new Error('Insufficient candle data');
    }

    const currentPrice = parseFloat(mids[CONFIG.coin]);
    const fvgs = detectFVGs(candles, currentPrice);
    const erl = detectERL(candles, currentPrice);
    const sd = calcStdDev(candles);
    const bb = bollingerBands(candles);
    const rsiVal = rsi(candles);

    // 24h change calculation
    const candle24hAgo = candles.find(c => c.t <= now - 24 * 60 * 60 * 1000) || candles[0];
    const change24h = ((currentPrice - parseFloat(candle24hAgo.o)) / parseFloat(candle24hAgo.o) * 100);

    // Output
    const line = '═'.repeat(70);
    const dash = '─'.repeat(70);

    console.log(line);
    console.log(`${CONFIG.coin}/USDC ICT ANALYSIS | ${CONFIG.interval.toUpperCase()} TIMEFRAME`);
    console.log(`${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`);
    console.log(line);
    console.log(`\nCURRENT PRICE: ${fmt(currentPrice)}`);
    console.log(`24H CHANGE:    ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`);

    // FVGs
    console.log(`\n${dash}`);
    console.log('FAIR VALUE GAPS (FVG) - ENTRY ZONES');
    console.log(dash);
    console.log('\n🟢 BULLISH FVGs (Buy Zones):');
    if (fvgs.bullish.length === 0) console.log('   No unfilled bullish FVGs');
    else fvgs.bullish.forEach(f => {
      const dist = distPct(currentPrice, f.midpoint);
      console.log(`   ${fmt(f.bottom)} - ${fmt(f.top)} | Mid: ${fmt(f.midpoint)} | ${dist}%${f.status === 'IN ZONE' ? ' ◄── IN ZONE' : ''}`);
    });
    console.log('\n🔴 BEARISH FVGs (Sell Zones):');
    if (fvgs.bearish.length === 0) console.log('   No unfilled bearish FVGs');
    else fvgs.bearish.forEach(f => {
      const dist = distPct(currentPrice, f.midpoint);
      console.log(`   ${fmt(f.bottom)} - ${fmt(f.top)} | Mid: ${fmt(f.midpoint)} | +${dist}%${f.status === 'IN ZONE' ? ' ◄── IN ZONE' : ''}`);
    });

    // ERL
    console.log(`\n${dash}`);
    console.log('EXTERNAL RANGE LIQUIDITY (ERL) - EXIT TARGETS');
    console.log(dash);
    console.log('\n📈 BUY STOPS (Liquidity above - Long targets):');
    if (erl.buyStops.length === 0) console.log('   No unswept buy stops');
    else erl.buyStops.forEach((s, i) => console.log(`   ${i + 1}. ${fmt(s.price)} | +${distPct(currentPrice, s.price)}%`));
    console.log('\n📉 SELL STOPS (Liquidity below - Short targets):');
    if (erl.sellStops.length === 0) console.log('   No unswept sell stops');
    else erl.sellStops.forEach((s, i) => console.log(`   ${i + 1}. ${fmt(s.price)} | ${distPct(currentPrice, s.price)}%`));

    // Standard Deviations
    console.log(`\n${dash}`);
    console.log('STANDARD DEVIATION LEVELS - PROFIT TARGETS');
    console.log(dash);
    Object.entries(sd.levels).forEach(([label, price]) => {
      const dist = distPct(currentPrice, price);
      const sign = parseFloat(dist) >= 0 ? '+' : '';
      console.log(`   ${label.padEnd(8)}: ${fmt(price).padStart(12)} | ${sign}${dist}%${label === 'MEAN' ? ' ◄── MEAN' : ''}`);
    });

    // BB & RSI
    console.log(`\n${dash}`);
    console.log('BOLLINGER BANDS & RSI');
    console.log(dash);
    console.log(`\n   BB Upper:  ${fmt(bb.upper)}`);
    console.log(`   BB Middle: ${fmt(bb.middle)}`);
    console.log(`   BB Lower:  ${fmt(bb.lower)}`);
    console.log(`   Position:  ${bb.position.toFixed(1)}%`);
    console.log(`   RSI(14):   ${rsiVal.toFixed(1)} ${rsiVal < 30 ? '⚠️ OVERSOLD' : rsiVal > 70 ? '⚠️ OVERBOUGHT' : ''}`);

    // Trade Setup
    console.log(`\n${line}`);
    console.log('TRADE SETUP ANALYSIS');
    console.log(line);

    const nearestBullFVG = fvgs.bullish[0];
    const nearestBearFVG = fvgs.bearish[0];
    const nearestBuyStop = erl.buyStops[0];
    const nearestSellStop = erl.sellStops[0];

    console.log('\n🟢 LONG SETUP:');
    if (nearestBullFVG) {
      console.log(`   Entry Zone (FVG): ${fmt(nearestBullFVG.bottom)} - ${fmt(nearestBullFVG.top)}`);
      console.log(`   Optimal Entry:    ${fmt(nearestBullFVG.midpoint)}`);
    } else {
      console.log(`   Entry Zone:       ${fmt(bb.lower)} (Lower BB)`);
    }
    console.log(`   Stop Loss:        ${fmt(nearestSellStop ? nearestSellStop.erlZone : bb.lower * 0.97)}`);
    if (nearestBuyStop) console.log(`   Target 1 (ERL):   ${fmt(nearestBuyStop.price)} (+${distPct(currentPrice, nearestBuyStop.price)}%)`);
    console.log(`   Target 2 (+1.5SD): ${fmt(sd.levels['+1.5 SD'])} (+${distPct(currentPrice, sd.levels['+1.5 SD'])}%)`);
    console.log(`   Target 3 (+2.0SD): ${fmt(sd.levels['+2.0 SD'])} (+${distPct(currentPrice, sd.levels['+2.0 SD'])}%)`);

    console.log('\n🔴 SHORT SETUP:');
    if (nearestBearFVG) {
      console.log(`   Entry Zone (FVG): ${fmt(nearestBearFVG.bottom)} - ${fmt(nearestBearFVG.top)}`);
      console.log(`   Optimal Entry:    ${fmt(nearestBearFVG.midpoint)}`);
    } else {
      console.log(`   Entry Zone:       ${fmt(bb.upper)} (Upper BB)`);
    }
    console.log(`   Stop Loss:        ${fmt(nearestBuyStop ? nearestBuyStop.erlZone : bb.upper * 1.03)}`);
    if (nearestSellStop) console.log(`   Target 1 (ERL):   ${fmt(nearestSellStop.price)} (${distPct(currentPrice, nearestSellStop.price)}%)`);
    console.log(`   Target 2 (-1.5SD): ${fmt(sd.levels['-1.5 SD'])} (${distPct(currentPrice, sd.levels['-1.5 SD'])}%)`);
    console.log(`   Target 3 (-2.0SD): ${fmt(sd.levels['-2.0 SD'])} (${distPct(currentPrice, sd.levels['-2.0 SD'])}%)`);

    // Bias
    console.log(`\n${dash}`);
    console.log('CURRENT MARKET BIAS');
    console.log(dash);
    let biasPoints = 0;
    const reasons = [];
    if (rsiVal < 30) { biasPoints += 2; reasons.push('RSI oversold'); }
    else if (rsiVal > 70) { biasPoints -= 2; reasons.push('RSI overbought'); }
    if (bb.position < 20) { biasPoints += 2; reasons.push('Near lower BB'); }
    else if (bb.position > 80) { biasPoints -= 2; reasons.push('Near upper BB'); }
    if (currentPrice < sd.mean) { biasPoints += 1; reasons.push('Below mean'); }
    else { biasPoints -= 1; reasons.push('Above mean'); }
    if (fvgs.bullish.some(f => f.status === 'IN ZONE')) { biasPoints += 1; reasons.push('In bullish FVG'); }
    if (fvgs.bearish.some(f => f.status === 'IN ZONE')) { biasPoints -= 1; reasons.push('In bearish FVG'); }

    let bias, emoji;
    if (biasPoints >= 3) { bias = 'STRONGLY BULLISH'; emoji = '🟢🟢'; }
    else if (biasPoints >= 1) { bias = 'BULLISH'; emoji = '🟢'; }
    else if (biasPoints <= -3) { bias = 'STRONGLY BEARISH'; emoji = '🔴🔴'; }
    else if (biasPoints <= -1) { bias = 'BEARISH'; emoji = '🔴'; }
    else { bias = 'NEUTRAL'; emoji = '⚪'; }

    console.log(`\n   ${emoji} ${bias}`);
    console.log(`\n   Factors:`);
    reasons.forEach(r => console.log(`   • ${r}`));
    console.log(`\n${line}\n`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

analyze();
