/**
 * Standard Deviation Analysis Module
 * Measures volatility and identifies extreme price extensions
 */

export class StdDevAnalyzer {
  constructor(config) {
    this.periods = config.periods || [20, 50, 100];
    this.extremeThreshold = config.extremeThreshold || 2.5;
  }

  /**
   * Calculate standard deviation for given period
   */
  calculateStdDev(closes, period) {
    if (closes.length < period) return null;

    const slice = closes.slice(-period);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;

    return {
      stdDev: Math.sqrt(variance),
      mean,
      variance
    };
  }

  /**
   * Calculate Z-score (how many std devs from mean)
   */
  calculateZScore(price, mean, stdDev) {
    return (price - mean) / stdDev;
  }

  /**
   * Analyze volatility regime
   */
  analyzeVolatilityRegime(bars) {
    const closes = bars.map(b => b.close);

    // Calculate std dev for multiple lookback periods
    const regimes = {};

    for (const period of this.periods) {
      const stats = this.calculateStdDev(closes, period);
      if (!stats) continue;

      // Calculate historical std devs for comparison
      const historicalStdDevs = [];
      for (let i = period; i < closes.length; i++) {
        const slice = closes.slice(i - period, i);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
        historicalStdDevs.push(Math.sqrt(variance));
      }

      const avgHistorical = historicalStdDevs.reduce((a, b) => a + b, 0) / historicalStdDevs.length;
      const currentRelative = stats.stdDev / avgHistorical;

      regimes[period] = {
        current: stats.stdDev,
        historical: avgHistorical,
        relative: currentRelative,
        regime: currentRelative > 1.5 ? 'HIGH' : currentRelative < 0.7 ? 'LOW' : 'NORMAL'
      };
    }

    return regimes;
  }

  /**
   * Full standard deviation analysis
   */
  analyze(bars) {
    const closes = bars.map(b => b.close);
    const currentPrice = closes[closes.length - 1];

    // Multi-period analysis
    const periodAnalysis = {};

    for (const period of this.periods) {
      const stats = this.calculateStdDev(closes, period);
      if (!stats) continue;

      const zScore = this.calculateZScore(currentPrice, stats.mean, stats.stdDev);

      // Standard deviation bands
      const bands = {
        plus3: stats.mean + (stats.stdDev * 3),
        plus2: stats.mean + (stats.stdDev * 2),
        plus1: stats.mean + (stats.stdDev * 1),
        mean: stats.mean,
        minus1: stats.mean - (stats.stdDev * 1),
        minus2: stats.mean - (stats.stdDev * 2),
        minus3: stats.mean - (stats.stdDev * 3)
      };

      periodAnalysis[period] = {
        stdDev: stats.stdDev,
        mean: stats.mean,
        zScore,
        bands,
        isExtreme: Math.abs(zScore) >= this.extremeThreshold,
        position: this.getPricePosition(currentPrice, bands)
      };
    }

    // Volatility regime
    const volatilityRegime = this.analyzeVolatilityRegime(bars);

    // Daily range analysis
    const rangeAnalysis = this.analyzeRanges(bars);

    return {
      currentPrice,
      periodAnalysis,
      volatilityRegime,
      rangeAnalysis,
      interpretation: this.interpret(periodAnalysis, volatilityRegime, rangeAnalysis)
    };
  }

  getPricePosition(price, bands) {
    if (price >= bands.plus3) return '+3σ (EXTREME HIGH)';
    if (price >= bands.plus2) return '+2σ';
    if (price >= bands.plus1) return '+1σ';
    if (price >= bands.mean) return 'ABOVE MEAN';
    if (price >= bands.minus1) return 'BELOW MEAN';
    if (price >= bands.minus2) return '-1σ';
    if (price >= bands.minus3) return '-2σ';
    return '-3σ (EXTREME LOW)';
  }

  analyzeRanges(bars) {
    // ATR-like analysis
    const ranges = bars.slice(-20).map(b => b.high - b.low);
    const avgRange = ranges.reduce((a, b) => a + b, 0) / ranges.length;
    const currentRange = bars[bars.length - 1].high - bars[bars.length - 1].low;

    // Range expansion/contraction
    const rangeRatio = currentRange / avgRange;

    return {
      averageRange: avgRange,
      currentRange,
      rangeRatio,
      rangeState: rangeRatio > 1.5 ? 'EXPANDED' : rangeRatio < 0.5 ? 'CONTRACTED' : 'NORMAL'
    };
  }

  interpret(periodAnalysis, volatilityRegime, rangeAnalysis) {
    const insights = [];

    // Check for extreme readings
    for (const [period, data] of Object.entries(periodAnalysis)) {
      if (data.isExtreme) {
        const direction = data.zScore > 0 ? 'OVEREXTENDED LONG' : 'OVEREXTENDED SHORT';
        insights.push(`${direction} (${period}-period): Z-score ${data.zScore.toFixed(2)}σ. Mean reversion likely.`);
      }
    }

    // Volatility regime insights
    const shortRegime = volatilityRegime[this.periods[0]];
    const longRegime = volatilityRegime[this.periods[this.periods.length - 1]];

    if (shortRegime && longRegime) {
      if (shortRegime.regime === 'LOW' && longRegime.regime === 'NORMAL') {
        insights.push('VOLATILITY COMPRESSION: Short-term vol contracting. Breakout setup forming.');
      }
      if (shortRegime.regime === 'HIGH' && longRegime.regime === 'NORMAL') {
        insights.push('VOLATILITY SPIKE: Recent vol expansion. Trend move in progress or exhaustion near.');
      }
    }

    // Range analysis
    if (rangeAnalysis.rangeState === 'EXPANDED') {
      insights.push(`RANGE EXPANSION: Current bar ${(rangeAnalysis.rangeRatio * 100).toFixed(0)}% of avg. High activity - trail stops tight.`);
    } else if (rangeAnalysis.rangeState === 'CONTRACTED') {
      insights.push(`RANGE CONTRACTION: Current bar ${(rangeAnalysis.rangeRatio * 100).toFixed(0)}% of avg. Low activity - breakout pending.`);
    }

    // Mean reversion targets
    const primary = periodAnalysis[this.periods[1]] || periodAnalysis[this.periods[0]];
    if (primary) {
      if (primary.zScore > 1.5) {
        insights.push(`MEAN REVERSION TARGET (SHORT): $${primary.mean.toFixed(2)} (${primary.zScore.toFixed(1)}σ above mean)`);
      } else if (primary.zScore < -1.5) {
        insights.push(`MEAN REVERSION TARGET (LONG): $${primary.mean.toFixed(2)} (${Math.abs(primary.zScore).toFixed(1)}σ below mean)`);
      }
    }

    if (insights.length === 0) {
      insights.push('NEUTRAL VOLATILITY: Price within normal ranges. No extreme deviation signals.');
    }

    return insights;
  }
}

export default StdDevAnalyzer;
