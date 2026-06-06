/**
 * Single-run BTC analysis
 * Use: node src/analyze-once.js [timeframe]
 * Example: node src/analyze-once.js 4H
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

async function fetchBTCData(timeframe = '4h', limit = 150) {
  const intervalMap = {
    '1m': '1m', '5m': '5m', '15m': '15m', '15': '15m',
    '1h': '1h', '1H': '1h', '4h': '4h', '4H': '4h',
    '1d': '1d', '1D': '1d', 'D': '1d'
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

async function analyze() {
  const timeframe = process.argv[2] || config.primaryTimeframe;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  BTC SWING ANALYSIS - ${new Date().toISOString()}`);
  console.log(`  Timeframe: ${timeframe}`);
  console.log('═'.repeat(60));

  const bars = await fetchBTCData(timeframe, 150);
  const price = bars[bars.length - 1].close;

  console.log(`\n  Current Price: $${price.toLocaleString()}\n`);

  // Bollinger Bands
  const bb = bollinger.analyze(bars);
  console.log('┌─ BOLLINGER BANDS ─────────────────────────────────────────┐');
  console.log(`│ Upper: $${bb.current.upper.toFixed(2).padStart(12)} │ %B: ${(bb.current.percentB * 100).toFixed(1).padStart(6)}%          │`);
  console.log(`│ Middle: $${bb.current.middle.toFixed(2).padStart(11)} │ BW: ${bb.current.bandwidth.toFixed(2).padStart(6)}%          │`);
  console.log(`│ Lower: $${bb.current.lower.toFixed(2).padStart(12)} │ Squeeze: ${bb.signals.squeeze ? 'YES' : 'NO '}           │`);
  console.log('├───────────────────────────────────────────────────────────┤');
  bb.interpretation.forEach(i => console.log(`│ ${i.substring(0, 57).padEnd(57)} │`));
  console.log('└───────────────────────────────────────────────────────────┘\n');

  // Fair Value Gaps
  const fvg = fvgDetector.analyze(bars);
  console.log('┌─ FAIR VALUE GAPS ─────────────────────────────────────────┐');
  console.log(`│ Unmitigated: ${fvg.unmitigatedCount} (${fvg.bullishZones} bullish / ${fvg.bearishZones} bearish)`.padEnd(59) + '│');
  if (fvg.entries.length > 0) {
    console.log('├───────────────────────────────────────────────────────────┤');
    fvg.entries.forEach(e => {
      const line = `│ ${e.direction}: $${e.entryPrice.toFixed(2)} | SL: $${e.stopLoss.toFixed(2)} | R:R ${e.riskReward}`;
      console.log(line.padEnd(59) + '│');
    });
  }
  console.log('├───────────────────────────────────────────────────────────┤');
  fvg.interpretation.forEach(i => console.log(`│ ${i.substring(0, 57).padEnd(57)} │`));
  console.log('└───────────────────────────────────────────────────────────┘\n');

  // ERL Sweeps
  const erl = erlAnalyzer.analyze(bars);
  console.log('┌─ ERL SWEEPS ──────────────────────────────────────────────┐');
  console.log(`│ Liquidity Pools: ${erl.untappedHighs} highs / ${erl.untappedLows} lows untapped`.padEnd(59) + '│');
  if (erl.nearestResistance) {
    console.log(`│ Nearest Resistance: $${erl.nearestResistance.price.toFixed(2)} (${erl.nearestResistance.distance})`.padEnd(59) + '│');
  }
  if (erl.nearestSupport) {
    console.log(`│ Nearest Support: $${erl.nearestSupport.price.toFixed(2)} (${erl.nearestSupport.distance})`.padEnd(59) + '│');
  }
  if (erl.recentSweeps.length > 0) {
    console.log('├───────────────────────────────────────────────────────────┤');
    erl.recentSweeps.forEach(s => console.log(`│ SWEEP: ${s.type} at $${s.level.toFixed(2)}`.padEnd(59) + '│'));
  }
  console.log('├───────────────────────────────────────────────────────────┤');
  erl.interpretation.forEach(i => console.log(`│ ${i.substring(0, 57).padEnd(57)} │`));
  console.log('└───────────────────────────────────────────────────────────┘\n');

  // Standard Deviation
  const std = stdDevAnalyzer.analyze(bars);
  const primary = std.periodAnalysis[50] || std.periodAnalysis[20];
  console.log('┌─ STANDARD DEVIATION ──────────────────────────────────────┐');
  if (primary) {
    console.log(`│ Z-Score (50p): ${primary.zScore.toFixed(2)}σ | Position: ${primary.position}`.padEnd(59) + '│');
    console.log(`│ Mean: $${primary.mean.toFixed(2)} | Range: ${std.rangeAnalysis.rangeState}`.padEnd(59) + '│');
  }
  console.log('├───────────────────────────────────────────────────────────┤');
  std.interpretation.forEach(i => console.log(`│ ${i.substring(0, 57).padEnd(57)} │`));
  console.log('└───────────────────────────────────────────────────────────┘\n');

  // Consolidated Bias
  const bias = calculateBias({ bollinger: bb, fvg, erl, stdDev: std });
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    TRADING BIAS                           ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║ Direction: ${bias.direction.padEnd(10)} | Confidence: ${bias.confidence.padEnd(10)}      ║`);
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║ Key Levels:                                               ║');
  bias.keyLevels.forEach(l => console.log(`║   ${l.padEnd(55)} ║`));
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║ Action: ${bias.action.substring(0, 49).padEnd(49)} ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

function calculateBias(results) {
  let bullishSignals = 0;
  let bearishSignals = 0;
  const keyLevels = [];

  if (results.bollinger) {
    if (results.bollinger.signals.meanReversion?.type === 'BULLISH_REVERSAL') bullishSignals += 2;
    if (results.bollinger.signals.meanReversion?.type === 'BEARISH_REVERSAL') bearishSignals += 2;
    if (results.bollinger.signals.bandWalk?.direction === 'BULLISH') bullishSignals++;
    if (results.bollinger.signals.bandWalk?.direction === 'BEARISH') bearishSignals++;
    if (results.bollinger.signals.position === 'BELOW_LOWER') bullishSignals++;
    if (results.bollinger.signals.position === 'ABOVE_UPPER') bearishSignals++;
    keyLevels.push(`BB Upper: $${results.bollinger.current.upper.toFixed(2)}`);
    keyLevels.push(`BB Lower: $${results.bollinger.current.lower.toFixed(2)}`);
  }

  if (results.fvg) {
    if (results.fvg.bullishZones > results.fvg.bearishZones) bullishSignals++;
    if (results.fvg.bearishZones > results.fvg.bullishZones) bearishSignals++;
    results.fvg.entries.forEach(e => keyLevels.push(`FVG ${e.direction}: $${e.entryPrice.toFixed(2)}`));
  }

  if (results.erl) {
    results.erl.recentSweeps.forEach(s => {
      if (s.type === 'LOW_SWEEP') bullishSignals += 2;
      if (s.type === 'HIGH_SWEEP') bearishSignals += 2;
    });
    if (results.erl.nearestResistance) keyLevels.push(`ERL Res: $${results.erl.nearestResistance.price.toFixed(2)}`);
    if (results.erl.nearestSupport) keyLevels.push(`ERL Sup: $${results.erl.nearestSupport.price.toFixed(2)}`);
  }

  if (results.stdDev) {
    const primary = results.stdDev.periodAnalysis[50] || results.stdDev.periodAnalysis[20];
    if (primary) {
      if (primary.zScore < -2) bullishSignals++;
      if (primary.zScore > 2) bearishSignals++;
      keyLevels.push(`Mean: $${primary.mean.toFixed(2)}`);
    }
  }

  const total = bullishSignals + bearishSignals;
  let direction, confidence, action;

  if (total === 0) {
    direction = 'NEUTRAL';
    confidence = 'LOW';
    action = 'WAIT - No clear signals. Stay on sidelines.';
  } else {
    const bullishRatio = bullishSignals / total;
    if (bullishRatio > 0.65) {
      direction = 'BULLISH';
      confidence = bullishRatio > 0.8 ? 'HIGH' : 'MEDIUM';
      action = 'LOOK FOR LONG entries at FVG zones or BB lower band.';
    } else if (bullishRatio < 0.35) {
      direction = 'BEARISH';
      confidence = bullishRatio < 0.2 ? 'HIGH' : 'MEDIUM';
      action = 'LOOK FOR SHORT entries at FVG zones or BB upper band.';
    } else {
      direction = 'NEUTRAL';
      confidence = 'LOW';
      action = 'WAIT - Mixed signals. Let price develop structure.';
    }
  }

  return { direction, confidence, keyLevels: keyLevels.slice(0, 6), action };
}

analyze().catch(console.error);
