/**
 * Multi-Timeframe Analysis
 * Analyzes BTC across multiple timeframes for confluence
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { BollingerAnalyzer } from './analysis/bollinger.js';
import { FVGDetector } from './analysis/fvg.js';
import { ERLAnalyzer } from './analysis/erl.js';
import { StdDevAnalyzer } from './analysis/stddev.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '..', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const bollinger = new BollingerAnalyzer(config.bollingerBands);
const fvgDetector = new FVGDetector(config.fvg);
const erlAnalyzer = new ERLAnalyzer(config.erl);
const stdDevAnalyzer = new StdDevAnalyzer(config.stdDeviation);

async function fetchBTCData(timeframe, limit = 150) {
  const intervalMap = {
    '15': '15m', '1H': '1h', '4H': '4h', '1D': '1d'
  };
  const interval = intervalMap[timeframe] || '4h';

  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`
  );
  const data = await response.json();

  return data.map(k => ({
    time: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5])
  }));
}

function getBias(results) {
  let bull = 0, bear = 0;

  if (results.bollinger.signals.position === 'BELOW_LOWER') bull++;
  if (results.bollinger.signals.position === 'ABOVE_UPPER') bear++;
  if (results.bollinger.signals.bandWalk?.direction === 'BULLISH') bull++;
  if (results.bollinger.signals.bandWalk?.direction === 'BEARISH') bear++;

  if (results.fvg.bullishZones > results.fvg.bearishZones) bull++;
  if (results.fvg.bearishZones > results.fvg.bullishZones) bear++;

  results.erl.recentSweeps.forEach(s => {
    if (s.type === 'LOW_SWEEP') bull += 2;
    if (s.type === 'HIGH_SWEEP') bear += 2;
  });

  const std = results.stdDev.periodAnalysis[50] || results.stdDev.periodAnalysis[20];
  if (std?.zScore < -2) bull++;
  if (std?.zScore > 2) bear++;

  if (bull > bear + 1) return 'BULLISH';
  if (bear > bull + 1) return 'BEARISH';
  return 'NEUTRAL';
}

async function analyzeTimeframe(tf) {
  const bars = await fetchBTCData(tf, 150);

  return {
    timeframe: tf,
    price: bars[bars.length - 1].close,
    bollinger: bollinger.analyze(bars),
    fvg: fvgDetector.analyze(bars),
    erl: erlAnalyzer.analyze(bars),
    stdDev: stdDevAnalyzer.analyze(bars)
  };
}

async function main() {
  const timeframes = config.timeframes;

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║          MULTI-TIMEFRAME BTC ANALYSIS                     ║');
  console.log(`║          ${new Date().toISOString()}            ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const results = [];

  for (const tf of timeframes) {
    console.log(`Analyzing ${tf}...`);
    const analysis = await analyzeTimeframe(tf);
    analysis.bias = getBias(analysis);
    results.push(analysis);

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  // Display summary table
  console.log('\n┌──────────┬──────────┬─────────────┬──────────┬──────────┐');
  console.log('│ Timeframe│ Price    │ BB Position │ FVGs     │ Bias     │');
  console.log('├──────────┼──────────┼─────────────┼──────────┼──────────┤');

  for (const r of results) {
    const pos = r.bollinger.signals.position.substring(0, 11);
    const fvgs = `${r.fvg.bullishZones}B/${r.fvg.bearishZones}S`;
    console.log(
      `│ ${r.timeframe.padEnd(8)} │ $${r.price.toFixed(0).padStart(6)} │ ${pos.padEnd(11)} │ ${fvgs.padEnd(8)} │ ${r.bias.padEnd(8)} │`
    );
  }
  console.log('└──────────┴──────────┴─────────────┴──────────┴──────────┘');

  // Confluence analysis
  const biases = results.map(r => r.bias);
  const bullishCount = biases.filter(b => b === 'BULLISH').length;
  const bearishCount = biases.filter(b => b === 'BEARISH').length;

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    CONFLUENCE                             ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');

  let overallBias, confidence;
  if (bullishCount >= 3) {
    overallBias = 'BULLISH';
    confidence = bullishCount === 4 ? 'HIGH' : 'MEDIUM';
  } else if (bearishCount >= 3) {
    overallBias = 'BEARISH';
    confidence = bearishCount === 4 ? 'HIGH' : 'MEDIUM';
  } else {
    overallBias = 'MIXED';
    confidence = 'LOW';
  }

  console.log(`║ Overall Bias: ${overallBias.padEnd(10)} Confidence: ${confidence.padEnd(10)}       ║`);
  console.log(`║ Bullish TFs: ${bullishCount}/4    Bearish TFs: ${bearishCount}/4                    ║`);
  console.log('╠═══════════════════════════════════════════════════════════╣');

  // Key levels across timeframes
  console.log('║ KEY LEVELS (Multi-TF):                                    ║');

  // Collect all FVG entries
  const allEntries = [];
  for (const r of results) {
    r.fvg.entries.forEach(e => {
      allEntries.push({ ...e, tf: r.timeframe });
    });
  }

  // Sort by distance
  allEntries.sort((a, b) => a.distanceFromCurrent - b.distanceFromCurrent);

  // Show top entries
  allEntries.slice(0, 4).forEach(e => {
    console.log(`║   [${e.tf}] ${e.direction} FVG: $${e.entryPrice.toFixed(2)} (${e.distanceFromCurrent.toFixed(1)}% away)`.padEnd(59) + '║');
  });

  // ERL levels
  const htfErl = results.find(r => r.timeframe === '4H' || r.timeframe === '1D');
  if (htfErl?.erl.nearestResistance) {
    console.log(`║   [HTF] Resistance: $${htfErl.erl.nearestResistance.price.toFixed(2)}`.padEnd(59) + '║');
  }
  if (htfErl?.erl.nearestSupport) {
    console.log(`║   [HTF] Support: $${htfErl.erl.nearestSupport.price.toFixed(2)}`.padEnd(59) + '║');
  }

  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Trading recommendation
  console.log('RECOMMENDATION:');
  if (confidence === 'HIGH') {
    console.log(`  Strong ${overallBias} confluence. Look for entries on pullbacks.`);
  } else if (confidence === 'MEDIUM') {
    console.log(`  Moderate ${overallBias} bias. Wait for HTF confirmation before entry.`);
  } else {
    console.log('  Mixed signals across timeframes. Wait for alignment or trade LTF only.');
  }
}

main().catch(console.error);
