/**
 * External Range Liquidity (ERL) Sweep Analyzer
 * Tracks liquidity pools at swing highs/lows and their sweeps
 */

export class ERLAnalyzer {
  constructor(config) {
    this.lookbackBars = config.lookbackBars || 100;
    this.sweepThreshold = config.sweepThreshold || 0.05; // % beyond level to confirm sweep
  }

  /**
   * Identify swing highs and lows (liquidity pools)
   */
  findSwingPoints(bars, leftBars = 5, rightBars = 5) {
    const swingHighs = [];
    const swingLows = [];

    for (let i = leftBars; i < bars.length - rightBars; i++) {
      const current = bars[i];

      // Check for swing high
      let isSwingHigh = true;
      let isSwingLow = true;

      for (let j = i - leftBars; j <= i + rightBars; j++) {
        if (j === i) continue;
        if (bars[j].high >= current.high) isSwingHigh = false;
        if (bars[j].low <= current.low) isSwingLow = false;
      }

      if (isSwingHigh) {
        swingHighs.push({
          price: current.high,
          barIndex: i,
          time: current.time,
          swept: false,
          sweepData: null
        });
      }

      if (isSwingLow) {
        swingLows.push({
          price: current.low,
          barIndex: i,
          time: current.time,
          swept: false,
          sweepData: null
        });
      }
    }

    return { swingHighs, swingLows };
  }

  /**
   * Detect liquidity sweeps
   */
  detectSweeps(bars, swingPoints) {
    const { swingHighs, swingLows } = swingPoints;

    // Check swing high sweeps (price goes above then rejects)
    for (const sh of swingHighs) {
      for (let i = sh.barIndex + 1; i < bars.length; i++) {
        const bar = bars[i];
        const sweepLevel = sh.price * (1 + this.sweepThreshold / 100);

        if (bar.high > sh.price && bar.close < sh.price) {
          // Sweep and rejection
          sh.swept = true;
          sh.sweepData = {
            barIndex: i,
            time: bar.time,
            sweepHigh: bar.high,
            closeBelow: bar.close,
            penetration: ((bar.high - sh.price) / sh.price) * 100,
            type: 'REJECTION'
          };
          break;
        } else if (bar.close > sweepLevel) {
          // Breakout, not a sweep
          sh.swept = true;
          sh.sweepData = {
            barIndex: i,
            time: bar.time,
            type: 'BREAKOUT'
          };
          break;
        }
      }
    }

    // Check swing low sweeps (price goes below then rejects)
    for (const sl of swingLows) {
      for (let i = sl.barIndex + 1; i < bars.length; i++) {
        const bar = bars[i];
        const sweepLevel = sl.price * (1 - this.sweepThreshold / 100);

        if (bar.low < sl.price && bar.close > sl.price) {
          // Sweep and rejection
          sl.swept = true;
          sl.sweepData = {
            barIndex: i,
            time: bar.time,
            sweepLow: bar.low,
            closeAbove: bar.close,
            penetration: ((sl.price - bar.low) / sl.price) * 100,
            type: 'REJECTION'
          };
          break;
        } else if (bar.close < sweepLevel) {
          // Breakdown, not a sweep
          sl.swept = true;
          sl.sweepData = {
            barIndex: i,
            time: bar.time,
            type: 'BREAKDOWN'
          };
          break;
        }
      }
    }

    return { swingHighs, swingLows };
  }

  /**
   * Find equal highs/lows (double tops/bottoms - major liquidity)
   */
  findEqualLevels(swingHighs, swingLows, tolerance = 0.1) {
    const equalHighs = [];
    const equalLows = [];

    // Find equal highs
    for (let i = 0; i < swingHighs.length; i++) {
      for (let j = i + 1; j < swingHighs.length; j++) {
        const diff = Math.abs(swingHighs[i].price - swingHighs[j].price);
        const avgPrice = (swingHighs[i].price + swingHighs[j].price) / 2;
        if ((diff / avgPrice) * 100 < tolerance) {
          equalHighs.push({
            level: avgPrice,
            points: [swingHighs[i], swingHighs[j]],
            liquidityStrength: 'HIGH'
          });
        }
      }
    }

    // Find equal lows
    for (let i = 0; i < swingLows.length; i++) {
      for (let j = i + 1; j < swingLows.length; j++) {
        const diff = Math.abs(swingLows[i].price - swingLows[j].price);
        const avgPrice = (swingLows[i].price + swingLows[j].price) / 2;
        if ((diff / avgPrice) * 100 < tolerance) {
          equalLows.push({
            level: avgPrice,
            points: [swingLows[i], swingLows[j]],
            liquidityStrength: 'HIGH'
          });
        }
      }
    }

    return { equalHighs, equalLows };
  }

  /**
   * Full ERL analysis
   */
  analyze(bars) {
    const currentPrice = bars[bars.length - 1].close;
    const recentBars = bars.slice(-this.lookbackBars);

    // Find swing points
    let swingPoints = this.findSwingPoints(recentBars);

    // Detect sweeps
    swingPoints = this.detectSweeps(recentBars, swingPoints);

    // Find equal levels (high liquidity)
    const equalLevels = this.findEqualLevels(swingPoints.swingHighs, swingPoints.swingLows);

    // Analyze recent sweeps (last 10 bars)
    const recentSweeps = this.findRecentSweeps(swingPoints, recentBars.length - 10);

    // Identify untapped liquidity pools
    const untappedHighs = swingPoints.swingHighs.filter(sh => !sh.swept);
    const untappedLows = swingPoints.swingLows.filter(sl => !sl.swept);

    // Nearest liquidity levels
    const nearestResistance = untappedHighs
      .filter(h => h.price > currentPrice)
      .sort((a, b) => a.price - b.price)[0];

    const nearestSupport = untappedLows
      .filter(l => l.price < currentPrice)
      .sort((a, b) => b.price - a.price)[0];

    return {
      currentPrice,
      totalSwingHighs: swingPoints.swingHighs.length,
      totalSwingLows: swingPoints.swingLows.length,
      untappedHighs: untappedHighs.length,
      untappedLows: untappedLows.length,
      equalHighs: equalLevels.equalHighs,
      equalLows: equalLevels.equalLows,
      recentSweeps,
      nearestResistance: nearestResistance ? {
        price: nearestResistance.price,
        distance: ((nearestResistance.price - currentPrice) / currentPrice * 100).toFixed(2) + '%'
      } : null,
      nearestSupport: nearestSupport ? {
        price: nearestSupport.price,
        distance: ((currentPrice - nearestSupport.price) / currentPrice * 100).toFixed(2) + '%'
      } : null,
      interpretation: this.interpret(recentSweeps, nearestResistance, nearestSupport, equalLevels, currentPrice)
    };
  }

  findRecentSweeps(swingPoints, minBarIndex) {
    const sweeps = [];

    for (const sh of swingPoints.swingHighs) {
      if (sh.swept && sh.sweepData?.type === 'REJECTION' && sh.sweepData.barIndex >= minBarIndex) {
        sweeps.push({
          ...sh.sweepData,
          sweepType: 'HIGH_SWEEP',
          type: 'HIGH_SWEEP',
          level: sh.price
        });
      }
    }

    for (const sl of swingPoints.swingLows) {
      if (sl.swept && sl.sweepData?.type === 'REJECTION' && sl.sweepData.barIndex >= minBarIndex) {
        sweeps.push({
          ...sl.sweepData,
          sweepType: 'LOW_SWEEP',
          type: 'LOW_SWEEP',
          level: sl.price
        });
      }
    }

    return sweeps;
  }

  interpret(recentSweeps, nearestResistance, nearestSupport, equalLevels, currentPrice) {
    const insights = [];

    // Recent sweep signals
    for (const sweep of recentSweeps) {
      if (sweep.type === 'HIGH_SWEEP') {
        insights.push(`BEARISH SWEEP: Liquidity grabbed above $${sweep.level.toFixed(2)}, rejected. Look for short entries.`);
      } else {
        insights.push(`BULLISH SWEEP: Liquidity grabbed below $${sweep.level.toFixed(2)}, rejected. Look for long entries.`);
      }
    }

    // Equal highs/lows as targets
    if (equalLevels.equalHighs.length > 0) {
      const nearest = equalLevels.equalHighs
        .filter(eh => eh.level > currentPrice)
        .sort((a, b) => a.level - b.level)[0];
      if (nearest) {
        insights.push(`EQUAL HIGHS TARGET: Major liquidity pool at $${nearest.level.toFixed(2)} (double top). High probability target.`);
      }
    }

    if (equalLevels.equalLows.length > 0) {
      const nearest = equalLevels.equalLows
        .filter(el => el.level < currentPrice)
        .sort((a, b) => b.level - a.level)[0];
      if (nearest) {
        insights.push(`EQUAL LOWS TARGET: Major liquidity pool at $${nearest.level.toFixed(2)} (double bottom). High probability target.`);
      }
    }

    // Nearby liquidity warnings
    if (nearestResistance && parseFloat(nearestResistance.distance) < 1) {
      insights.push(`RESISTANCE LIQUIDITY: Swing high at $${nearestResistance.price.toFixed(2)} just ${nearestResistance.distance} away. Watch for sweep.`);
    }

    if (nearestSupport && parseFloat(nearestSupport.distance) < 1) {
      insights.push(`SUPPORT LIQUIDITY: Swing low at $${nearestSupport.price.toFixed(2)} just ${nearestSupport.distance} away. Watch for sweep.`);
    }

    if (insights.length === 0) {
      insights.push('NO IMMEDIATE ERL SIGNALS: Price between liquidity pools. Wait for sweep or approach to key levels.');
    }

    return insights;
  }
}

export default ERLAnalyzer;
