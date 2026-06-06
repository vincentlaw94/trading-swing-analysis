/**
 * Bollinger Bands Analysis Module
 * Analyzes price position relative to bands and band squeeze/expansion
 */

export class BollingerAnalyzer {
  constructor(config) {
    this.length = config.length || 20;
    this.stdDev = config.stdDev || 2;
  }

  /**
   * Calculate Bollinger Bands from OHLCV data
   */
  calculate(bars) {
    if (bars.length < this.length) return null;

    const closes = bars.map(b => b.close);
    const results = [];

    for (let i = this.length - 1; i < closes.length; i++) {
      const slice = closes.slice(i - this.length + 1, i + 1);
      const sma = slice.reduce((a, b) => a + b, 0) / this.length;

      const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / this.length;
      const std = Math.sqrt(variance);

      results.push({
        time: bars[i].time,
        middle: sma,
        upper: sma + (std * this.stdDev),
        lower: sma - (std * this.stdDev),
        bandwidth: ((sma + std * this.stdDev) - (sma - std * this.stdDev)) / sma * 100,
        percentB: (bars[i].close - (sma - std * this.stdDev)) / ((sma + std * this.stdDev) - (sma - std * this.stdDev))
      });
    }

    return results;
  }

  /**
   * Analyze current market state based on Bollinger Bands
   */
  analyze(bars) {
    const bb = this.calculate(bars);
    if (!bb || bb.length < 20) return null;

    const current = bb[bb.length - 1];
    const recent = bb.slice(-20);
    const price = bars[bars.length - 1].close;

    // Bandwidth analysis (squeeze detection)
    const avgBandwidth = recent.reduce((s, b) => s + b.bandwidth, 0) / recent.length;
    const minBandwidth = Math.min(...recent.map(b => b.bandwidth));
    const isSqueeze = current.bandwidth <= minBandwidth * 1.1;
    const isExpanding = current.bandwidth > avgBandwidth * 1.2;

    // Price position
    const position = this.getPricePosition(price, current);

    // Band walk detection
    const bandWalk = this.detectBandWalk(bars.slice(-10), bb.slice(-10));

    // Mean reversion signals
    const meanReversion = this.detectMeanReversion(bars.slice(-5), bb.slice(-5));

    return {
      current: {
        price,
        upper: current.upper,
        middle: current.middle,
        lower: current.lower,
        bandwidth: current.bandwidth,
        percentB: current.percentB
      },
      signals: {
        squeeze: isSqueeze,
        expanding: isExpanding,
        position,
        bandWalk,
        meanReversion
      },
      interpretation: this.interpret(position, isSqueeze, isExpanding, bandWalk, meanReversion)
    };
  }

  getPricePosition(price, bb) {
    if (price > bb.upper) return 'ABOVE_UPPER';
    if (price < bb.lower) return 'BELOW_LOWER';
    if (price > bb.middle) return 'UPPER_HALF';
    return 'LOWER_HALF';
  }

  detectBandWalk(bars, bb) {
    let upperTouches = 0;
    let lowerTouches = 0;

    for (let i = 0; i < bars.length; i++) {
      if (bars[i].high >= bb[i].upper) upperTouches++;
      if (bars[i].low <= bb[i].lower) lowerTouches++;
    }

    if (upperTouches >= 4) return { direction: 'BULLISH', strength: upperTouches };
    if (lowerTouches >= 4) return { direction: 'BEARISH', strength: lowerTouches };
    return null;
  }

  detectMeanReversion(bars, bb) {
    const current = bars[bars.length - 1];
    const prev = bars[bars.length - 2];
    const currentBB = bb[bb.length - 1];
    const prevBB = bb[bb.length - 2];

    // Bullish reversal from lower band
    if (prev.close < prevBB.lower && current.close > currentBB.lower) {
      return { type: 'BULLISH_REVERSAL', confidence: 'HIGH' };
    }

    // Bearish reversal from upper band
    if (prev.close > prevBB.upper && current.close < currentBB.upper) {
      return { type: 'BEARISH_REVERSAL', confidence: 'HIGH' };
    }

    return null;
  }

  interpret(position, isSqueeze, isExpanding, bandWalk, meanReversion) {
    const insights = [];

    if (isSqueeze) {
      insights.push('VOLATILITY SQUEEZE: Bands contracting - expect breakout soon. Wait for direction confirmation.');
    }

    if (isExpanding) {
      insights.push('VOLATILITY EXPANSION: Strong momentum move in progress. Trail stops, do not fade.');
    }

    if (bandWalk) {
      insights.push(`BAND WALK ${bandWalk.direction}: Strong trend - ${bandWalk.strength}/10 bars touching ${bandWalk.direction === 'BULLISH' ? 'upper' : 'lower'} band.`);
    }

    if (meanReversion) {
      insights.push(`${meanReversion.type}: Price rejected from ${meanReversion.type.includes('BULLISH') ? 'lower' : 'upper'} band. Potential reversal entry.`);
    }

    if (position === 'ABOVE_UPPER') {
      insights.push('OVEREXTENDED LONG: Price above upper band - high risk for longs, watch for rejection.');
    } else if (position === 'BELOW_LOWER') {
      insights.push('OVEREXTENDED SHORT: Price below lower band - high risk for shorts, watch for bounce.');
    }

    return insights;
  }
}

export default BollingerAnalyzer;
