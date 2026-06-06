#!/usr/bin/env node
/**
 * BTC/USDC Swing Trading Analysis Script
 * Uses Binance API for real-time data
 * Calculates: Bollinger Bands, RSI, MACD, Support/Resistance
 */

const https = require('https');

// Configuration
const CONFIG = {
  symbol: process.argv[2] || 'BTCUSDC',
  bbPeriod: 20,
  bbStdDev: 2,
  rsiPeriod: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9
};

// Fetch data from Binance
function fetchBinance(endpoint) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.binance.com${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Calculate SMA
function sma(data, period) {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// Calculate EMA
function ema(data, period) {
  const k = 2 / (period + 1);
  let emaVal = data[0];
  for (let i = 1; i < data.length; i++) {
    emaVal = data[i] * k + emaVal * (1 - k);
  }
  return emaVal;
}

// Calculate Standard Deviation
function stdDev(data, period) {
  const mean = sma(data, period);
  const slice = data.slice(-period);
  const squaredDiffs = slice.map(x => Math.pow(x - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
}

// Calculate Bollinger Bands
function bollingerBands(closes, period = 20, stdDevMultiplier = 2) {
  const middle = sma(closes, period);
  const std = stdDev(closes, period);
  return {
    upper: middle + (stdDevMultiplier * std),
    middle: middle,
    lower: middle - (stdDevMultiplier * std),
    width: (stdDevMultiplier * std * 2),
    position: ((closes[closes.length - 1] - (middle - stdDevMultiplier * std)) /
               (stdDevMultiplier * std * 2)) * 100
  };
}

// Calculate RSI
function rsi(closes, period = 14) {
  const gains = [];
  const losses = [];

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  const avgGain = sma(gains.slice(-period), period);
  const avgLoss = sma(losses.slice(-period), period);

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate MACD
function macd(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = emaFast - emaSlow;

  // For signal line, we'd need historical MACD values
  // Simplified: use recent closes trend
  const recentTrend = closes[closes.length - 1] - closes[closes.length - 5];

  return {
    macd: macdLine,
    histogram: macdLine > 0 ? 'BULLISH' : 'BEARISH',
    trend: recentTrend > 0 ? 'UP' : 'DOWN'
  };
}

// Detect potential FVG (Fair Value Gaps)
function detectFVG(candles) {
  const fvgs = [];

  for (let i = 2; i < candles.length; i++) {
    const candle1High = candles[i - 2].high;
    const candle1Low = candles[i - 2].low;
    const candle3High = candles[i].high;
    const candle3Low = candles[i].low;

    // Bullish FVG: Gap between candle 1 high and candle 3 low
    if (candle3Low > candle1High) {
      fvgs.push({
        type: 'BULLISH',
        top: candle3Low,
        bottom: candle1High,
        index: i
      });
    }

    // Bearish FVG: Gap between candle 1 low and candle 3 high
    if (candle3High < candle1Low) {
      fvgs.push({
        type: 'BEARISH',
        top: candle1Low,
        bottom: candle3High,
        index: i
      });
    }
  }

  return fvgs.slice(-5); // Return last 5 FVGs
}

// Find Support/Resistance levels
function findLevels(candles) {
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  return {
    resistance: Math.max(...highs.slice(-20)),
    support: Math.min(...lows.slice(-20)),
    recentHigh: Math.max(...highs.slice(-5)),
    recentLow: Math.min(...lows.slice(-5))
  };
}

// Format number with commas
function fmt(num, decimals = 2) {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// Main analysis function
async function analyze() {
  console.log('Fetching data from Binance...\n');

  try {
    // Fetch data in parallel
    const [ticker, klines4h, klinesDaily] = await Promise.all([
      fetchBinance(`/api/v3/ticker/24hr?symbol=${CONFIG.symbol}`),
      fetchBinance(`/api/v3/klines?symbol=${CONFIG.symbol}&interval=4h&limit=50`),
      fetchBinance(`/api/v3/klines?symbol=${CONFIG.symbol}&interval=1d&limit=30`)
    ]);

    // Parse candle data
    const parse = (k) => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    });

    const candles4h = klines4h.map(parse);
    const candlesDaily = klinesDaily.map(parse);

    const closes4h = candles4h.map(c => c.close);
    const closesDaily = candlesDaily.map(c => c.close);

    const currentPrice = parseFloat(ticker.lastPrice);

    // Calculate indicators
    const bb4h = bollingerBands(closes4h, CONFIG.bbPeriod, CONFIG.bbStdDev);
    const bbDaily = bollingerBands(closesDaily, CONFIG.bbPeriod, CONFIG.bbStdDev);
    const rsi4h = rsi(closes4h, CONFIG.rsiPeriod);
    const rsiDaily = rsi(closesDaily, CONFIG.rsiPeriod);
    const macdResult = macd(closesDaily);
    const fvgs = detectFVG(candles4h);
    const levels = findLevels(candlesDaily);

    // Determine signals
    let signals = [];
    let bias = 'NEUTRAL';

    if (rsiDaily < 30) signals.push('RSI OVERSOLD');
    if (rsiDaily > 70) signals.push('RSI OVERBOUGHT');
    if (bbDaily.position < 20) signals.push('NEAR LOWER BB');
    if (bbDaily.position > 80) signals.push('NEAR UPPER BB');
    if (currentPrice > bbDaily.middle) signals.push('ABOVE SMA20');
    if (currentPrice < bbDaily.middle) signals.push('BELOW SMA20');

    // Determine overall bias
    let bullishCount = 0;
    let bearishCount = 0;

    if (rsiDaily < 30) bullishCount++; // Oversold = potential bounce
    if (rsiDaily > 70) bearishCount++; // Overbought = potential drop
    if (bbDaily.position < 20) bullishCount++;
    if (bbDaily.position > 80) bearishCount++;
    if (currentPrice > bbDaily.middle) bullishCount++;
    if (currentPrice < bbDaily.middle) bearishCount++;
    if (macdResult.histogram === 'BULLISH') bullishCount++;
    if (macdResult.histogram === 'BEARISH') bearishCount++;

    if (bullishCount > bearishCount + 1) bias = 'BULLISH';
    else if (bearishCount > bullishCount + 1) bias = 'BEARISH';

    // Output
    const line = '═'.repeat(65);
    const dash = '─'.repeat(65);

    console.log(line);
    console.log(`${CONFIG.symbol} SWING TRADING ANALYSIS`);
    console.log(`${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`);
    console.log(line);
    console.log();
    console.log(`CURRENT PRICE:  $${fmt(currentPrice)}`);
    console.log(`24H CHANGE:     ${parseFloat(ticker.priceChangePercent) >= 0 ? '+' : ''}${fmt(parseFloat(ticker.priceChangePercent))}%`);
    console.log(`24H RANGE:      $${fmt(parseFloat(ticker.lowPrice))} - $${fmt(parseFloat(ticker.highPrice))}`);
    console.log(`24H VOLUME:     $${fmt(parseFloat(ticker.quoteVolume) / 1e6, 1)}M`);
    console.log();
    console.log(dash);
    console.log('BOLLINGER BANDS');
    console.log(dash);
    console.log();
    console.log('4H TIMEFRAME:');
    console.log(`  Upper:    $${fmt(bb4h.upper)}`);
    console.log(`  Middle:   $${fmt(bb4h.middle)} (SMA${CONFIG.bbPeriod})`);
    console.log(`  Lower:    $${fmt(bb4h.lower)}`);
    console.log(`  Position: ${fmt(bb4h.position, 1)}%`);
    console.log();
    console.log('DAILY TIMEFRAME:');
    console.log(`  Upper:    $${fmt(bbDaily.upper)}`);
    console.log(`  Middle:   $${fmt(bbDaily.middle)} (SMA${CONFIG.bbPeriod})`);
    console.log(`  Lower:    $${fmt(bbDaily.lower)}`);
    console.log(`  Position: ${fmt(bbDaily.position, 1)}%`);
    console.log();
    console.log(dash);
    console.log('INDICATORS');
    console.log(dash);
    console.log();
    console.log(`RSI (${CONFIG.rsiPeriod}):`);
    console.log(`  4H:    ${fmt(rsi4h, 1)} ${rsi4h < 30 ? '⚠️ OVERSOLD' : rsi4h > 70 ? '⚠️ OVERBOUGHT' : ''}`);
    console.log(`  Daily: ${fmt(rsiDaily, 1)} ${rsiDaily < 30 ? '⚠️ OVERSOLD' : rsiDaily > 70 ? '⚠️ OVERBOUGHT' : ''}`);
    console.log();
    console.log(`MACD:    ${macdResult.histogram} (Trend: ${macdResult.trend})`);
    console.log();
    console.log(dash);
    console.log('KEY LEVELS');
    console.log(dash);
    console.log();
    console.log(`  Resistance (20D): $${fmt(levels.resistance)}`);
    console.log(`  Support (20D):    $${fmt(levels.support)}`);
    console.log(`  Recent High (5D): $${fmt(levels.recentHigh)}`);
    console.log(`  Recent Low (5D):  $${fmt(levels.recentLow)}`);
    console.log();

    if (fvgs.length > 0) {
      console.log(dash);
      console.log('FAIR VALUE GAPS (4H)');
      console.log(dash);
      console.log();
      fvgs.forEach(fvg => {
        const status = (currentPrice >= fvg.bottom && currentPrice <= fvg.top) ? 'IN ZONE' :
                       (currentPrice > fvg.top ? 'ABOVE' : 'BELOW');
        console.log(`  ${fvg.type}: $${fmt(fvg.bottom)} - $${fmt(fvg.top)} [${status}]`);
      });
      console.log();
    }

    console.log(line);
    console.log('SIGNAL SUMMARY');
    console.log(line);
    console.log();
    signals.forEach(s => console.log(`  • ${s}`));
    console.log();
    console.log(`  OVERALL BIAS: ${bias}`);
    console.log();
    console.log(line);

    // Trading suggestions based on analysis
    console.log('SWING TRADE CONSIDERATIONS');
    console.log(line);
    console.log();

    if (rsiDaily < 30 && bbDaily.position < 20) {
      console.log('  🟢 POTENTIAL LONG SETUP:');
      console.log('     - RSI oversold + Price at lower Bollinger Band');
      console.log('     - Wait for reversal candle confirmation');
      console.log(`     - Stop loss below: $${fmt(levels.support * 0.99)}`);
      console.log(`     - Target 1: $${fmt(bbDaily.middle)} (middle band)`);
      console.log(`     - Target 2: $${fmt(bbDaily.upper)} (upper band)`);
    } else if (rsiDaily > 70 && bbDaily.position > 80) {
      console.log('  🔴 POTENTIAL SHORT SETUP:');
      console.log('     - RSI overbought + Price at upper Bollinger Band');
      console.log('     - Wait for reversal candle confirmation');
      console.log(`     - Stop loss above: $${fmt(levels.resistance * 1.01)}`);
      console.log(`     - Target 1: $${fmt(bbDaily.middle)} (middle band)`);
      console.log(`     - Target 2: $${fmt(bbDaily.lower)} (lower band)`);
    } else {
      console.log('  ⚪ NO CLEAR SETUP:');
      console.log('     - Price in middle of range');
      console.log('     - Wait for price to reach extremes');
      console.log(`     - Watch for break above $${fmt(levels.resistance)} (bullish)`);
      console.log(`     - Watch for break below $${fmt(levels.support)} (bearish)`);
    }

    console.log();
    console.log(line);

  } catch (error) {
    console.error('Error fetching data:', error.message);
    process.exit(1);
  }
}

// Run analysis
analyze();
