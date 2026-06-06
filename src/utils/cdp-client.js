/**
 * Chrome DevTools Protocol client for TradingView Desktop
 * Connects to TradingView running with --remote-debugging-port=9222
 */

import WebSocket from 'ws';

export class CDPClient {
  constructor(port = 9222) {
    this.port = port;
    this.ws = null;
    this.messageId = 0;
    this.pending = new Map();
  }

  async connect() {
    // Get WebSocket URL from CDP
    const response = await fetch(`http://127.0.0.1:${this.port}/json`);
    const targets = await response.json();

    const tvTarget = targets.find(t =>
      t.url?.includes('tradingview') || t.title?.toLowerCase().includes('tradingview')
    );

    if (!tvTarget) {
      throw new Error('TradingView Desktop not found. Ensure it is running with --remote-debugging-port=9222');
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(tvTarget.webSocketDebuggerUrl);

      this.ws.on('open', () => {
        console.log('[CDP] Connected to TradingView Desktop');
        resolve();
      });

      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      });

      this.ws.on('error', reject);
    });
  }

  async evaluate(expression) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      this.pending.set(id, { resolve, reject });

      this.ws.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: {
          expression,
          returnByValue: true,
          awaitPromise: true
        }
      }));
    });
  }

  async getChartData() {
    const result = await this.evaluate(`
      (function() {
        const widget = window.TradingViewApi || window.tvWidget;
        if (!widget) return { error: 'TradingView widget not found' };

        const chart = widget.activeChart();
        const series = chart.getSeries();
        const bars = series.data().bars().toArray().slice(-100);

        return {
          symbol: chart.symbol(),
          resolution: chart.resolution(),
          bars: bars.map(b => ({
            time: b.time,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
            volume: b.volume
          }))
        };
      })()
    `);

    return result.result?.value;
  }

  async getIndicatorValues(studyName) {
    const result = await this.evaluate(`
      (function() {
        const chart = (window.TradingViewApi || window.tvWidget).activeChart();
        const studies = chart.getAllStudies();
        const study = studies.find(s => s.name.toLowerCase().includes('${studyName.toLowerCase()}'));
        if (!study) return null;
        return chart.getStudyValues(study.id);
      })()
    `);

    return result.result?.value;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default CDPClient;
