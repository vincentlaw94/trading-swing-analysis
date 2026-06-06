/**
 * Fair Value Gap (FVG) Detection Module
 * Identifies imbalances in price action for high-probability entry zones
 */

export class FVGDetector {
  constructor(config) {
    this.minGapPercent = config.minGapPercent || 0.15;
    this.maxAge = config.maxAge || 50;
    this.respectOnlyUnmitigated = config.respectOnlyUnmitigated ?? true;
  }

  /**
   * Detect all FVGs in the given bars
   */
  detect(bars) {
    const fvgs = [];

    for (let i = 2; i < bars.length; i++) {
      const prev = bars[i - 2];
      const current = bars[i - 1];
      const next = bars[i];

      // Bullish FVG: Gap between bar1 high and bar3 low
      if (next.low > prev.high) {
        const gapSize = next.low - prev.high;
        const gapPercent = (gapSize / current.close) * 100;

        if (gapPercent >= this.minGapPercent) {
          fvgs.push({
            type: 'BULLISH',
            top: next.low,
            bottom: prev.high,
            midpoint: (next.low + prev.high) / 2,
            size: gapSize,
            sizePercent: gapPercent,
            barIndex: i - 1,
            time: current.time,
            mitigated: false,
            mitigation: null
          });
        }
      }

      // Bearish FVG: Gap between bar1 low and bar3 high
      if (next.high < prev.low) {
        const gapSize = prev.low - next.high;
        const gapPercent = (gapSize / current.close) * 100;

        if (gapPercent >= this.minGapPercent) {
          fvgs.push({
            type: 'BEARISH',
            top: prev.low,
            bottom: next.high,
            midpoint: (prev.low + next.high) / 2,
            size: gapSize,
            sizePercent: gapPercent,
            barIndex: i - 1,
            time: current.time,
            mitigated: false,
            mitigation: null
          });
        }
      }
    }

    return fvgs;
  }

  /**
   * Check which FVGs have been mitigated (price filled the gap)
   */
  checkMitigation(fvgs, bars, startIndex) {
    return fvgs.map(fvg => {
      if (fvg.mitigated) return fvg;

      for (let i = startIndex; i < bars.length; i++) {
        const bar = bars[i];

        if (fvg.type === 'BULLISH') {
          // Mitigated if price comes down into the gap
          if (bar.low <= fvg.midpoint) {
            return {
              ...fvg,
              mitigated: true,
              mitigation: { barIndex: i, price: bar.low, time: bar.time }
            };
          }
        } else {
          // Mitigated if price comes up into the gap
          if (bar.high >= fvg.midpoint) {
            return {
              ...fvg,
              mitigated: true,
              mitigation: { barIndex: i, price: bar.high, time: bar.time }
            };
          }
        }
      }

      return fvg;
    });
  }

  /**
   * Full analysis with entry recommendations
   */
  analyze(bars) {
    const currentPrice = bars[bars.length - 1].close;
    let fvgs = this.detect(bars);

    // Check mitigation for each FVG
    fvgs = fvgs.map((fvg, idx) => {
      const checked = this.checkMitigation([fvg], bars, fvg.barIndex + 2);
      return checked[0];
    });

    // Filter to recent FVGs
    const recentBars = bars.length;
    fvgs = fvgs.filter(fvg => (recentBars - fvg.barIndex) <= this.maxAge);

    // Separate by type and mitigation status
    const unmitigated = fvgs.filter(f => !f.mitigated);
    const bullishZones = unmitigated.filter(f => f.type === 'BULLISH');
    const bearishZones = unmitigated.filter(f => f.type === 'BEARISH');

    // Find nearest entry zones
    const nearestBullish = bullishZones
      .filter(f => f.top < currentPrice)
      .sort((a, b) => b.top - a.top)[0];

    const nearestBearish = bearishZones
      .filter(f => f.bottom > currentPrice)
      .sort((a, b) => a.bottom - b.bottom)[0];

    // Entry recommendations
    const entries = [];

    if (nearestBullish) {
      const distancePercent = ((currentPrice - nearestBullish.top) / currentPrice) * 100;
      entries.push({
        direction: 'LONG',
        zone: nearestBullish,
        entryPrice: nearestBullish.midpoint,
        stopLoss: nearestBullish.bottom * 0.998,
        distanceFromCurrent: distancePercent,
        riskReward: this.calculateRR(nearestBullish, currentPrice, 'LONG')
      });
    }

    if (nearestBearish) {
      const distancePercent = ((nearestBearish.bottom - currentPrice) / currentPrice) * 100;
      entries.push({
        direction: 'SHORT',
        zone: nearestBearish,
        entryPrice: nearestBearish.midpoint,
        stopLoss: nearestBearish.top * 1.002,
        distanceFromCurrent: distancePercent,
        riskReward: this.calculateRR(nearestBearish, currentPrice, 'SHORT')
      });
    }

    return {
      totalFVGs: fvgs.length,
      unmitigatedCount: unmitigated.length,
      bullishZones: bullishZones.length,
      bearishZones: bearishZones.length,
      nearestBullishEntry: nearestBullish,
      nearestBearishEntry: nearestBearish,
      entries,
      allUnmitigated: unmitigated.slice(-10), // Last 10 for context
      interpretation: this.interpret(entries, currentPrice, bullishZones, bearishZones)
    };
  }

  calculateRR(fvg, currentPrice, direction) {
    const entry = fvg.midpoint;
    const stop = direction === 'LONG' ? fvg.bottom * 0.998 : fvg.top * 1.002;
    const risk = Math.abs(entry - stop);

    // Target: 2x the FVG size from entry
    const target = direction === 'LONG'
      ? entry + (fvg.size * 2)
      : entry - (fvg.size * 2);

    const reward = Math.abs(target - entry);
    return (reward / risk).toFixed(2);
  }

  interpret(entries, currentPrice, bullishZones, bearishZones) {
    const insights = [];

    if (entries.length === 0) {
      insights.push('NO CLEAR FVG ENTRIES: Price is not near any unmitigated fair value gaps.');
      return insights;
    }

    for (const entry of entries) {
      if (entry.distanceFromCurrent < 0.5) {
        insights.push(`IMMINENT ${entry.direction} ZONE: Price ${entry.distanceFromCurrent.toFixed(2)}% from FVG at $${entry.entryPrice.toFixed(2)}. R:R = ${entry.riskReward}`);
      } else if (entry.distanceFromCurrent < 1.5) {
        insights.push(`NEARBY ${entry.direction} ZONE: FVG entry at $${entry.entryPrice.toFixed(2)} (${entry.distanceFromCurrent.toFixed(2)}% away). Set alerts.`);
      } else {
        insights.push(`DISTANT ${entry.direction} ZONE: FVG at $${entry.entryPrice.toFixed(2)} - ${entry.distanceFromCurrent.toFixed(2)}% away.`);
      }
    }

    // Market structure insight
    if (bullishZones.length > bearishZones.length * 2) {
      insights.push('FVG STRUCTURE BULLISH: More unfilled bullish gaps suggest upward pressure.');
    } else if (bearishZones.length > bullishZones.length * 2) {
      insights.push('FVG STRUCTURE BEARISH: More unfilled bearish gaps suggest downward pressure.');
    }

    return insights;
  }
}

export default FVGDetector;
