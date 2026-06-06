#!/usr/bin/env node
/**
 * Multi-Symbol Analysis Script
 * Analyzes multiple crypto pairs for swing trading opportunities
 */

const https = require('https');

const SYMBOLS = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ['BTCUSDC', 'ETHUSDC', 'SOLUSDC', 'BNBUSDC'];

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

function sma(data, period) {
  if (data.length < period) return null;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function stdDev(data, period) {
  const mean = sma(data, period);
  const slice = data.slice(-period);
  return Math.sqrt(slice.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / period);
}

function rsi(closes, period = 14) {
  const gains = [], losses = [];
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  const avgGain = sma(gains.slice(-period), period);
  const avgLoss = sma(losses.slice(-period), period);
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

async function analyzeSymbol(symbol) {
  try {
    const [ticker, klines] = await Promise.all([
      fetchBinance(`/api/v3/ticker/24hr?symbol=${symbol}`),
      fetchBinance(`/api/v3/klines?symbol=${symbol}&interval=1d&limit=25`)
    ]);

    const closes = klines.map(k => parseFloat(k[4]));
    const current = parseFloat(ticker.lastPrice);
    const change24h = parseFloat(ticker.priceChangePercent);

    const middle = sma(closes, 20);
    const std = stdDev(closes, 20);
    const upper = middle + (2 * std);
    const lower = middle - (2 * std);
    const bbPosition = ((current - lower) / (upper - lower)) * 100;
    const rsiVal = rsi(closes, 14);

    let signal = 'NEUTRAL';
    if (rsiVal < 30 && bbPosition < 20) signal = '🟢 LONG';
    else if (rsiVal > 70 && bbPosition > 80) signal = '🔴 SHORT';
    else if (bbPosition < 30) signal = '🟡 WATCH LONG';
    else if (bbPosition > 70) signal = '🟡 WATCH SHORT';

    return {
      symbol,
      price: current,
      change24h,
      bbPosition,
      rsi: rsiVal,
      signal
    };
  } catch (e) {
    return { symbol, error: e.message };
  }
}

async function main() {
  console.log('Fetching data for', SYMBOLS.join(', '), '...\n');

  const results = await Promise.all(SYMBOLS.map(analyzeSymbol));

  const line = '═'.repeat(85);
  console.log(line);
  console.log('MULTI-SYMBOL SWING ANALYSIS | ' + new Date().toISOString().slice(0, 19) + ' UTC');
  console.log(line);
  console.log();
  console.log('┌─────────────┬───────────────┬──────────┬────────────┬─────────┬──────────────┐');
  console.log('│ Symbol      │ Price         │ 24H %    │ BB Pos (%) │ RSI(14) │ Signal       │');
  console.log('├─────────────┼───────────────┼──────────┼────────────┼─────────┼──────────────┤');

  results.forEach(r => {
    if (r.error) {
      console.log(`│ ${r.symbol.padEnd(11)} │ ERROR: ${r.error.slice(0, 40).padEnd(40)} │`);
    } else {
      const price = r.price > 1000 ? `$${(r.price/1000).toFixed(1)}K` : `$${r.price.toFixed(2)}`;
      const change = (r.change24h >= 0 ? '+' : '') + r.change24h.toFixed(2) + '%';
      const bb = r.bbPosition.toFixed(1) + '%';
      const rsiStr = r.rsi.toFixed(1);
      console.log(`│ ${r.symbol.padEnd(11)} │ ${price.padStart(13)} │ ${change.padStart(8)} │ ${bb.padStart(10)} │ ${rsiStr.padStart(7)} │ ${r.signal.padEnd(12)} │`);
    }
  });

  console.log('└─────────────┴───────────────┴──────────┴────────────┴─────────┴──────────────┘');
  console.log();
  console.log('Legend: BB Pos = Bollinger Band Position (0%=lower, 100%=upper)');
  console.log('        RSI < 30 = Oversold | RSI > 70 = Overbought');
  console.log(line);

  // Highlight opportunities
  const opportunities = results.filter(r => r.signal && r.signal.includes('LONG') || r.signal.includes('SHORT'));
  if (opportunities.length > 0) {
    console.log('\n⚡ POTENTIAL SETUPS:');
    opportunities.forEach(r => {
      if (r.signal.includes('🟢')) {
        console.log(`   ${r.symbol}: Oversold - potential bounce (RSI: ${r.rsi.toFixed(1)}, BB: ${r.bbPosition.toFixed(1)}%)`);
      } else if (r.signal.includes('🔴')) {
        console.log(`   ${r.symbol}: Overbought - potential pullback (RSI: ${r.rsi.toFixed(1)}, BB: ${r.bbPosition.toFixed(1)}%)`);
      } else if (r.signal.includes('🟡')) {
        console.log(`   ${r.symbol}: Approaching extreme - watch closely`);
      }
    });
  }
}

main().catch(console.error);
