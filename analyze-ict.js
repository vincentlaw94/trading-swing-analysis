#!/usr/bin/env node
/**
 * ICT-Style BTC/USDC Swing Trading Analysis
 *
 * Features:
 * - Fair Value Gaps (FVG) for entries
 * - External Range Liquidity (ERL) sweeps
 * - Standard Deviation levels for exits
 * - Bollinger Bands & RSI
 */

const https = require('https');

const CONFIG = {
  symbol: process.argv[2] || 'BTCUSDC',
  lookback: 100,  // Candles to analyze for FVG/ERL
};

function fetchBinance(endpoint) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.binance.com${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Format price
function fmt(num, decimals = 2) {
  if (num >= 1000) {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  return '$' + num.toFixed(decimals);
}

// Calculate percentage distance from current price
function distPct(current, level) {
  return ((level - current) / current * 100).toFixed(2);
}

// ═══════════════════════════════════════════════════════════════
// FAIR VALUE GAPS (FVG)
// ═══════════════════════════════════════════════════════════════
function detectFVGs(candles, currentPrice) {
  const fvgs = { bullish: [], bearish: [] };

  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2]; // First candle
    const c2 = candles[i - 1]; // Middle candle (impulse)
    const c3 = candles[i];     // Third candle

    // Bullish FVG: Gap UP - Candle 3 low > Candle 1 high
    // This creates a gap that price may return to fill
    if (c3.low > c1.high) {
      const fvg = {
        top: c3.low,
        bottom: c1.high,
        midpoint: (c3.low + c1.high) / 2,
        size: c3.low - c1.high,
        time: new Date(c3.time).toISOString().slice(0, 16),
        filled: currentPrice <= c3.low && currentPrice >= c1.high,
        status: currentPrice < c1.high ? 'FILLED' :
                currentPrice <= c3.low ? 'IN ZONE' : 'UNFILLED'
      };
      // Only keep significant FVGs (> 0.1% of price)
      if (fvg.size / currentPrice > 0.001) {
        fvgs.bullish.push(fvg);
      }
    }

    // Bearish FVG: Gap DOWN - Candle 3 high < Candle 1 low
    if (c3.high < c1.low) {
      const fvg = {
        top: c1.low,
        bottom: c3.high,
        midpoint: (c1.low + c3.high) / 2,
        size: c1.low - c3.high,
        time: new Date(c3.time).toISOString().slice(0, 16),
        filled: currentPrice >= c3.high && currentPrice <= c1.low,
        status: currentPrice > c1.low ? 'FILLED' :
                currentPrice >= c3.high ? 'IN ZONE' : 'UNFILLED'
      };
      if (fvg.size / currentPrice > 0.001) {
        fvgs.bearish.push(fvg);
      }
    }
  }

  // Sort by proximity to current price and return recent unfilled ones
  const sortByProximity = (a, b) =>
    Math.abs(a.midpoint - currentPrice) - Math.abs(b.midpoint - currentPrice);

  return {
    bullish: fvgs.bullish
      .filter(f => f.status !== 'FILLED')
      .sort(sortByProximity)
      .slice(0, 5),
    bearish: fvgs.bearish
      .filter(f => f.status !== 'FILLED')
      .sort(sortByProximity)
      .slice(0, 5)
  };
}

// ═══════════════════════════════════════════════════════════════
// EXTERNAL RANGE LIQUIDITY (ERL)
// ═══════════════════════════════════════════════════════════════
function detectERL(candles, currentPrice) {
  const swingHighs = [];
  const swingLows = [];

  // Detect swing points (local maxima/minima)
  for (let i = 2; i < candles.length - 2; i++) {
    const prev2 = candles[i - 2];
    const prev1 = candles[i - 1];
    const curr = candles[i];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];

    // Swing High: Higher than 2 candles before and after
    if (curr.high > prev1.high && curr.high > prev2.high &&
        curr.high > next1.high && curr.high > next2.high) {
      swingHighs.push({
        price: curr.high,
        time: new Date(curr.time).toISOString().slice(0, 16),
        // ERL zone slightly above the high (where stops accumulate)
        erlZone: curr.high * 1.002, // 0.2% above
        swept: currentPrice > curr.high
      });
    }

    // Swing Low: Lower than 2 candles before and after
    if (curr.low < prev1.low && curr.low < prev2.low &&
        curr.low < next1.low && curr.low < next2.low) {
      swingLows.push({
        price: curr.low,
        time: new Date(curr.time).toISOString().slice(0, 16),
        // ERL zone slightly below the low (where stops accumulate)
        erlZone: curr.low * 0.998, // 0.2% below
        swept: currentPrice < curr.low
      });
    }
  }

  // Get nearest unswept liquidity levels
  const buyStops = swingHighs
    .filter(s => !s.swept && s.price > currentPrice)
    .sort((a, b) => a.price - b.price)
    .slice(0, 4);

  const sellStops = swingLows
    .filter(s => !s.swept && s.price < currentPrice)
    .sort((a, b) => b.price - a.price)
    .slice(0, 4);

  return { buyStops, sellStops };
}

// ═══════════════════════════════════════════════════════════════
// STANDARD DEVIATIONS FROM MEAN
// ═══════════════════════════════════════════════════════════════
function calculateStdDevLevels(candles, period = 20) {
  const closes = candles.slice(-period).map(c => c.close);
  const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
  const variance = closes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / closes.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    stdDev,
    levels: {
      '+2.5 SD': mean + (2.5 * stdDev),
      '+2.0 SD': mean + (2.0 * stdDev),
      '+1.5 SD': mean + (1.5 * stdDev),
      '+1.0 SD': mean + (1.0 * stdDev),
      'MEAN': mean,
      '-1.0 SD': mean - (1.0 * stdDev),
      '-1.5 SD': mean - (1.5 * stdDev),
      '-2.0 SD': mean - (2.0 * stdDev),
      '-2.5 SD': mean - (2.5 * stdDev),
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// RSI CALCULATION
// ═══════════════════════════════════════════════════════════════
function rsi(closes, period = 14) {
  const gains = [], losses = [];
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

// ═══════════════════════════════════════════════════════════════
// BOLLINGER BANDS
// ═══════════════════════════════════════════════════════════════
function bollingerBands(closes, period = 20, mult = 2) {
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: mean + (mult * std),
    middle: mean,
    lower: mean - (mult * std),
    position: ((closes[closes.length - 1] - (mean - mult * std)) / (mult * std * 2)) * 100
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS
// ═══════════════════════════════════════════════════════════════
async function analyze() {
  console.log(`\nFetching ${CONFIG.symbol} data from Binance...\n`);

  try {
    const [ticker, klines4h, klinesDaily] = await Promise.all([
      fetchBinance(`/api/v3/ticker/24hr?symbol=${CONFIG.symbol}`),
      fetchBinance(`/api/v3/klines?symbol=${CONFIG.symbol}&interval=4h&limit=${CONFIG.lookback}`),
      fetchBinance(`/api/v3/klines?symbol=${CONFIG.symbol}&interval=1d&limit=30`)
    ]);

    const parse = k => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    });

    const candles4h = klines4h.map(parse);
    const candlesDaily = klinesDaily.map(parse);
    const currentPrice = parseFloat(ticker.lastPrice);

    // Calculate all indicators
    const fvgs = detectFVGs(candles4h, currentPrice);
    const erl = detectERL(candles4h, currentPrice);
    const sdLevels4h = calculateStdDevLevels(candles4h, 20);
    const sdLevelsDaily = calculateStdDevLevels(candlesDaily, 20);
    const bb4h = bollingerBands(candles4h.map(c => c.close));
    const bbDaily = bollingerBands(candlesDaily.map(c => c.close));
    const rsi4h = rsi(candles4h.map(c => c.close));
    const rsiDaily = rsi(candlesDaily.map(c => c.close));

    // ═══════════════════════════════════════════════════════════
    // OUTPUT
    // ═══════════════════════════════════════════════════════════
    const line = '═'.repeat(70);
    const dash = '─'.repeat(70);

    console.log(line);
    console.log(`${CONFIG.symbol} ICT SWING ANALYSIS`);
    console.log(`${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`);
    console.log(line);

    console.log(`\nCURRENT PRICE: ${fmt(currentPrice)}`);
    console.log(`24H Change:    ${parseFloat(ticker.priceChangePercent) >= 0 ? '+' : ''}${parseFloat(ticker.priceChangePercent).toFixed(2)}%`);
    console.log(`24H Range:     ${fmt(parseFloat(ticker.lowPrice))} - ${fmt(parseFloat(ticker.highPrice))}`);

    // ─────────────────────────────────────────────────────────────
    // FAIR VALUE GAPS
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${dash}`);
    console.log('FAIR VALUE GAPS (FVG) - ENTRY ZONES [4H]');
    console.log(dash);

    console.log('\n🟢 BULLISH FVGs (Buy Zones - Price may drop to fill):');
    if (fvgs.bullish.length === 0) {
      console.log('   No unfilled bullish FVGs nearby');
    } else {
      fvgs.bullish.forEach(f => {
        const dist = distPct(currentPrice, f.midpoint);
        const arrow = f.status === 'IN ZONE' ? '  ◄── PRICE IN ZONE' : '';
        console.log(`   ${fmt(f.bottom)} - ${fmt(f.top)} | Mid: ${fmt(f.midpoint)} | ${dist}% away${arrow}`);
      });
    }

    console.log('\n🔴 BEARISH FVGs (Sell Zones - Price may rise to fill):');
    if (fvgs.bearish.length === 0) {
      console.log('   No unfilled bearish FVGs nearby');
    } else {
      fvgs.bearish.forEach(f => {
        const dist = distPct(currentPrice, f.midpoint);
        const arrow = f.status === 'IN ZONE' ? '  ◄── PRICE IN ZONE' : '';
        console.log(`   ${fmt(f.bottom)} - ${fmt(f.top)} | Mid: ${fmt(f.midpoint)} | +${dist}% away${arrow}`);
      });
    }

    // ─────────────────────────────────────────────────────────────
    // EXTERNAL RANGE LIQUIDITY
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${dash}`);
    console.log('EXTERNAL RANGE LIQUIDITY (ERL) - EXIT TARGETS [4H]');
    console.log(dash);

    console.log('\n📈 BUY STOPS (Liquidity above - Long targets):');
    if (erl.buyStops.length === 0) {
      console.log('   No unswept buy stops detected');
    } else {
      erl.buyStops.forEach((s, i) => {
        const dist = distPct(currentPrice, s.price);
        console.log(`   ${i + 1}. ${fmt(s.price)} | +${dist}% | Sweep zone: ${fmt(s.erlZone)}`);
      });
    }

    console.log('\n📉 SELL STOPS (Liquidity below - Short targets):');
    if (erl.sellStops.length === 0) {
      console.log('   No unswept sell stops detected');
    } else {
      erl.sellStops.forEach((s, i) => {
        const dist = distPct(currentPrice, s.price);
        console.log(`   ${i + 1}. ${fmt(s.price)} | ${dist}% | Sweep zone: ${fmt(s.erlZone)}`);
      });
    }

    // ─────────────────────────────────────────────────────────────
    // STANDARD DEVIATION LEVELS
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${dash}`);
    console.log('STANDARD DEVIATION LEVELS - PROFIT TARGETS');
    console.log(dash);

    console.log('\n4H TIMEFRAME:');
    Object.entries(sdLevels4h.levels).forEach(([label, price]) => {
      const dist = distPct(currentPrice, price);
      const marker = label === 'MEAN' ? ' ◄── MEAN' : '';
      const sign = parseFloat(dist) >= 0 ? '+' : '';
      console.log(`   ${label.padEnd(8)}: ${fmt(price).padStart(12)} | ${sign}${dist}%${marker}`);
    });

    console.log('\nDAILY TIMEFRAME:');
    Object.entries(sdLevelsDaily.levels).forEach(([label, price]) => {
      const dist = distPct(currentPrice, price);
      const marker = label === 'MEAN' ? ' ◄── MEAN' : '';
      const sign = parseFloat(dist) >= 0 ? '+' : '';
      console.log(`   ${label.padEnd(8)}: ${fmt(price).padStart(12)} | ${sign}${dist}%${marker}`);
    });

    // ─────────────────────────────────────────────────────────────
    // BOLLINGER BANDS & RSI
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${dash}`);
    console.log('BOLLINGER BANDS & RSI');
    console.log(dash);

    console.log('\n4H TIMEFRAME:');
    console.log(`   BB Upper:  ${fmt(bb4h.upper)}`);
    console.log(`   BB Middle: ${fmt(bb4h.middle)}`);
    console.log(`   BB Lower:  ${fmt(bb4h.lower)}`);
    console.log(`   Position:  ${bb4h.position.toFixed(1)}%`);
    console.log(`   RSI(14):   ${rsi4h.toFixed(1)} ${rsi4h < 30 ? '⚠️ OVERSOLD' : rsi4h > 70 ? '⚠️ OVERBOUGHT' : ''}`);

    console.log('\nDAILY TIMEFRAME:');
    console.log(`   BB Upper:  ${fmt(bbDaily.upper)}`);
    console.log(`   BB Middle: ${fmt(bbDaily.middle)}`);
    console.log(`   BB Lower:  ${fmt(bbDaily.lower)}`);
    console.log(`   Position:  ${bbDaily.position.toFixed(1)}%`);
    console.log(`   RSI(14):   ${rsiDaily.toFixed(1)} ${rsiDaily < 30 ? '⚠️ OVERSOLD' : rsiDaily > 70 ? '⚠️ OVERBOUGHT' : ''}`);

    // ─────────────────────────────────────────────────────────────
    // TRADE SETUP ANALYSIS
    // ─────────────────────────────────────────────────────────────
    console.log(`\n${line}`);
    console.log('TRADE SETUP ANALYSIS');
    console.log(line);

    // Find nearest entry/exit levels
    const nearestBullishFVG = fvgs.bullish[0];
    const nearestBearishFVG = fvgs.bearish[0];
    const nearestBuyStop = erl.buyStops[0];
    const nearestSellStop = erl.sellStops[0];

    // Long Setup Analysis
    console.log('\n🟢 LONG SETUP:');
    if (nearestBullishFVG) {
      console.log(`   Entry Zone (FVG):  ${fmt(nearestBullishFVG.bottom)} - ${fmt(nearestBullishFVG.top)}`);
      console.log(`   Optimal Entry:     ${fmt(nearestBullishFVG.midpoint)} (FVG midpoint)`);
    } else {
      console.log(`   Entry Zone:        ${fmt(bbDaily.lower)} (Lower BB)`);
    }
    console.log(`   Stop Loss:         ${fmt(nearestSellStop ? nearestSellStop.erlZone : bbDaily.lower * 0.98)} (below ERL/support)`);
    if (nearestBuyStop) {
      console.log(`   Target 1 (ERL):    ${fmt(nearestBuyStop.price)} (+${distPct(currentPrice, nearestBuyStop.price)}%)`);
    }
    console.log(`   Target 2 (+1.5SD): ${fmt(sdLevelsDaily.levels['+1.5 SD'])} (+${distPct(currentPrice, sdLevelsDaily.levels['+1.5 SD'])}%)`);
    console.log(`   Target 3 (+2.0SD): ${fmt(sdLevelsDaily.levels['+2.0 SD'])} (+${distPct(currentPrice, sdLevelsDaily.levels['+2.0 SD'])}%)`);

    // Short Setup Analysis
    console.log('\n🔴 SHORT SETUP:');
    if (nearestBearishFVG) {
      console.log(`   Entry Zone (FVG):  ${fmt(nearestBearishFVG.bottom)} - ${fmt(nearestBearishFVG.top)}`);
      console.log(`   Optimal Entry:     ${fmt(nearestBearishFVG.midpoint)} (FVG midpoint)`);
    } else {
      console.log(`   Entry Zone:        ${fmt(bbDaily.upper)} (Upper BB)`);
    }
    console.log(`   Stop Loss:         ${fmt(nearestBuyStop ? nearestBuyStop.erlZone : bbDaily.upper * 1.02)} (above ERL/resistance)`);
    if (nearestSellStop) {
      console.log(`   Target 1 (ERL):    ${fmt(nearestSellStop.price)} (${distPct(currentPrice, nearestSellStop.price)}%)`);
    }
    console.log(`   Target 2 (-1.5SD): ${fmt(sdLevelsDaily.levels['-1.5 SD'])} (${distPct(currentPrice, sdLevelsDaily.levels['-1.5 SD'])}%)`);
    console.log(`   Target 3 (-2.0SD): ${fmt(sdLevelsDaily.levels['-2.0 SD'])} (${distPct(currentPrice, sdLevelsDaily.levels['-2.0 SD'])}%)`);

    // Current Bias
    console.log(`\n${dash}`);
    console.log('CURRENT MARKET BIAS');
    console.log(dash);

    let biasPoints = 0;
    const biasReasons = [];

    if (rsiDaily < 30) { biasPoints += 2; biasReasons.push('RSI oversold'); }
    else if (rsiDaily > 70) { biasPoints -= 2; biasReasons.push('RSI overbought'); }

    if (bbDaily.position < 20) { biasPoints += 2; biasReasons.push('Near lower BB'); }
    else if (bbDaily.position > 80) { biasPoints -= 2; biasReasons.push('Near upper BB'); }

    if (currentPrice < sdLevelsDaily.mean) { biasPoints += 1; biasReasons.push('Below daily mean'); }
    else { biasPoints -= 1; biasReasons.push('Above daily mean'); }

    // Check if in FVG
    const inBullishFVG = fvgs.bullish.some(f => f.status === 'IN ZONE');
    const inBearishFVG = fvgs.bearish.some(f => f.status === 'IN ZONE');
    if (inBullishFVG) { biasPoints += 1; biasReasons.push('In bullish FVG'); }
    if (inBearishFVG) { biasPoints -= 1; biasReasons.push('In bearish FVG'); }

    let bias, emoji;
    if (biasPoints >= 3) { bias = 'STRONGLY BULLISH'; emoji = '🟢🟢'; }
    else if (biasPoints >= 1) { bias = 'BULLISH'; emoji = '🟢'; }
    else if (biasPoints <= -3) { bias = 'STRONGLY BEARISH'; emoji = '🔴🔴'; }
    else if (biasPoints <= -1) { bias = 'BEARISH'; emoji = '🔴'; }
    else { bias = 'NEUTRAL'; emoji = '⚪'; }

    console.log(`\n   ${emoji} ${bias}`);
    console.log(`\n   Factors:`);
    biasReasons.forEach(r => console.log(`   • ${r}`));

    console.log(`\n${line}`);
    console.log('RISK MANAGEMENT');
    console.log(line);
    console.log('\n   • Risk 1-2% of capital per trade');
    console.log('   • Set stops BELOW FVG zone for longs (not at bottom)');
    console.log('   • Set stops ABOVE FVG zone for shorts (not at top)');
    console.log('   • Take partial profits at first ERL target');
    console.log('   • Move stop to breakeven after first target');
    console.log('   • Let remainder ride to SD targets');
    console.log(`\n${line}\n`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

analyze();
