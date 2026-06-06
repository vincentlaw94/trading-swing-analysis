/**
 * BTC Swing Analysis Agent
 * Periodic analysis with token-conscious sleep intervals
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

// Analysis modules
const bollinger = new BollingerAnalyzer(config.bollingerBands);
const fvgDetector = new FVGDetector(config.fvg);
const erlAnalyzer = new ERLAnalyzer(config.erl);
const stdDevAnalyzer = new StdDevAnalyzer(config.stdDeviation);

/**
 * Fetch data from Binance API (no TradingView dependency for basic data)
 */
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

/**
 * Run full analysis
 */
async function runAnalysis(timeframe = config.primaryTimeframe) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`BTC SWING ANALYSIS - ${new Date().toISOString()}`);
  console.log(`Timeframe: ${timeframe}`);
  console.log('='.repeat(60));

  try {
    const bars = await fetchBTCData(timeframe, config.tokenOptimization.maxBarsPerRequest);
    const currentPrice = bars[bars.length - 1].close;

    console.log(`\nCurrent BTC Price: $${currentPrice.toLocaleString()}`);

    // Run all analysis modules
    const results = {
      timestamp: new Date().toISOString(),
      timeframe,
      price: currentPrice,
      bollinger: bollinger.analyze(bars),
      fvg: fvgDetector.analyze(bars),
      erl: erlAnalyzer.analyze(bars),
      stdDev: stdDevAnalyzer.analyze(bars)
    };

    // Display results
    displayResults(results);

    // Log to file if enabled
    if (config.alerts.logToFile) {
      logResults(results);
    }

    return results;

  } catch (error) {
    console.error('Analysis Error:', error.message);
    return null;
  }
}

/**
 * Display formatted results
 */
function displayResults(results) {
  console.log('\n--- BOLLINGER BANDS ---');
  if (results.bollinger) {
    console.log(`Upper: $${results.bollinger.current.upper.toFixed(2)}`);
    console.log(`Middle: $${results.bollinger.current.middle.toFixed(2)}`);
    console.log(`Lower: $${results.bollinger.current.lower.toFixed(2)}`);
    console.log(`%B: ${(results.bollinger.current.percentB * 100).toFixed(1)}%`);
    console.log(`Bandwidth: ${results.bollinger.current.bandwidth.toFixed(2)}%`);
    console.log('\nSignals:');
    results.bollinger.interpretation.forEach(i => console.log(`  • ${i}`));
  }

  console.log('\n--- FAIR VALUE GAPS ---');
  if (results.fvg) {
    console.log(`Unmitigated FVGs: ${results.fvg.unmitigatedCount} (${results.fvg.bullishZones} bullish, ${results.fvg.bearishZones} bearish)`);
    if (results.fvg.entries.length > 0) {
      console.log('\nEntry Zones:');
      results.fvg.entries.forEach(e => {
        console.log(`  ${e.direction}: Entry $${e.entryPrice.toFixed(2)} | SL $${e.stopLoss.toFixed(2)} | R:R ${e.riskReward} | ${e.distanceFromCurrent.toFixed(2)}% away`);
      });
    }
    console.log('\nSignals:');
    results.fvg.interpretation.forEach(i => console.log(`  • ${i}`));
  }

  console.log('\n--- ERL SWEEPS ---');
  if (results.erl) {
    console.log(`Untapped Liquidity: ${results.erl.untappedHighs} highs, ${results.erl.untappedLows} lows`);
    if (results.erl.nearestResistance) {
      console.log(`Nearest Resistance: $${results.erl.nearestResistance.price.toFixed(2)} (${results.erl.nearestResistance.distance})`);
    }
    if (results.erl.nearestSupport) {
      console.log(`Nearest Support: $${results.erl.nearestSupport.price.toFixed(2)} (${results.erl.nearestSupport.distance})`);
    }
    if (results.erl.recentSweeps.length > 0) {
      console.log('\nRecent Sweeps:');
      results.erl.recentSweeps.forEach(s => {
        console.log(`  ${s.type} at $${s.level.toFixed(2)}`);
      });
    }
    console.log('\nSignals:');
    results.erl.interpretation.forEach(i => console.log(`  • ${i}`));
  }

  console.log('\n--- STANDARD DEVIATION ---');
  if (results.stdDev) {
    const primary = results.stdDev.periodAnalysis[50] || results.stdDev.periodAnalysis[20];
    if (primary) {
      console.log(`50-period Z-Score: ${primary.zScore.toFixed(2)}σ`);
      console.log(`Position: ${primary.position}`);
      console.log(`Mean: $${primary.mean.toFixed(2)}`);
    }
    console.log(`Range State: ${results.stdDev.rangeAnalysis.rangeState}`);
    console.log('\nSignals:');
    results.stdDev.interpretation.forEach(i => console.log(`  • ${i}`));
  }

  // Consolidated trading bias
  console.log('\n' + '='.repeat(60));
  console.log('CONSOLIDATED BIAS');
  console.log('='.repeat(60));
  const bias = calculateBias(results);
  console.log(`Direction: ${bias.direction}`);
  console.log(`Confidence: ${bias.confidence}`);
  console.log(`\nKey Levels:`);
  bias.keyLevels.forEach(l => console.log(`  • ${l}`));
  console.log(`\nAction: ${bias.action}`);
}

/**
 * Calculate overall trading bias
 */
function calculateBias(results) {
  let bullishSignals = 0;
  let bearishSignals = 0;
  const keyLevels = [];

  // Bollinger signals
  if (results.bollinger) {
    if (results.bollinger.signals.meanReversion?.type === 'BULLISH_REVERSAL') bullishSignals += 2;
    if (results.bollinger.signals.meanReversion?.type === 'BEARISH_REVERSAL') bearishSignals += 2;
    if (results.bollinger.signals.bandWalk?.direction === 'BULLISH') bullishSignals++;
    if (results.bollinger.signals.bandWalk?.direction === 'BEARISH') bearishSignals++;
    if (results.bollinger.signals.position === 'BELOW_LOWER') bullishSignals++; // Oversold
    if (results.bollinger.signals.position === 'ABOVE_UPPER') bearishSignals++; // Overbought

    keyLevels.push(`BB Upper: $${results.bollinger.current.upper.toFixed(2)}`);
    keyLevels.push(`BB Lower: $${results.bollinger.current.lower.toFixed(2)}`);
  }

  // FVG signals
  if (results.fvg) {
    if (results.fvg.bullishZones > results.fvg.bearishZones) bullishSignals++;
    if (results.fvg.bearishZones > results.fvg.bullishZones) bearishSignals++;

    results.fvg.entries.forEach(e => {
      keyLevels.push(`FVG ${e.direction}: $${e.entryPrice.toFixed(2)}`);
    });
  }

  // ERL signals
  if (results.erl) {
    results.erl.recentSweeps.forEach(s => {
      if (s.type === 'LOW_SWEEP') bullishSignals += 2; // Bullish after low sweep
      if (s.type === 'HIGH_SWEEP') bearishSignals += 2; // Bearish after high sweep
    });

    if (results.erl.nearestResistance) {
      keyLevels.push(`ERL Resistance: $${results.erl.nearestResistance.price.toFixed(2)}`);
    }
    if (results.erl.nearestSupport) {
      keyLevels.push(`ERL Support: $${results.erl.nearestSupport.price.toFixed(2)}`);
    }
  }

  // StdDev signals
  if (results.stdDev) {
    const primary = results.stdDev.periodAnalysis[50] || results.stdDev.periodAnalysis[20];
    if (primary) {
      if (primary.zScore < -2) bullishSignals++; // Oversold
      if (primary.zScore > 2) bearishSignals++; // Overbought
      keyLevels.push(`StdDev Mean: $${primary.mean.toFixed(2)}`);
    }
  }

  // Calculate direction and confidence
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

/**
 * Log results to file
 */
function logResults(results) {
  const logsDir = path.join(__dirname, '..', config.alerts.logPath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `btc-analysis-${date}.json`);

  let logs = [];
  if (fs.existsSync(logFile)) {
    logs = JSON.parse(fs.readFileSync(logFile, 'utf-8'));
  }

  logs.push({
    ...results,
    bias: calculateBias(results)
  });

  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  console.log(`\n[Logged to ${logFile}]`);
}

/**
 * Determine sleep interval based on market conditions
 */
function getSleepInterval(results) {
  if (!results) return config.intervals.activeMarket;

  // Check for volatility expansion
  if (results.bollinger?.signals.expanding) {
    return config.intervals.volatileMarket; // Check more frequently
  }

  // Check for squeeze (potential breakout)
  if (results.bollinger?.signals.squeeze) {
    return config.intervals.volatileMarket;
  }

  // Check if price is at extreme levels
  const stdDev = results.stdDev?.periodAnalysis[50] || results.stdDev?.periodAnalysis[20];
  if (stdDev && Math.abs(stdDev.zScore) > 2) {
    return config.intervals.volatileMarket;
  }

  // Check for recent ERL sweeps
  if (results.erl?.recentSweeps.length > 0) {
    return config.intervals.volatileMarket;
  }

  // Default to active market interval
  return config.intervals.activeMarket;
}

/**
 * Main agent loop
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       BTC SWING ANALYSIS AGENT - Starting Up               ║');
  console.log('║  Bollinger Bands | FVGs | ERL Sweeps | Std Deviation       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  let running = true;

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\nShutting down agent...');
    running = false;
  });

  while (running) {
    const results = await runAnalysis();

    const sleepMs = getSleepInterval(results);
    const sleepMinutes = sleepMs / 60000;

    console.log(`\n[Next analysis in ${sleepMinutes} minutes - Press Ctrl+C to stop]`);

    // Sleep with interruptible check
    const sleepEnd = Date.now() + sleepMs;
    while (running && Date.now() < sleepEnd) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('Agent stopped.');
}

// Run if called directly
main().catch(console.error);
