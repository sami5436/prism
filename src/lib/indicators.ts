// Technical indicators calculation library

import { HistoricalDataPoint, TechnicalIndicators } from '@/types/stock';

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(prices: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            result.push(NaN);
        } else {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
    }
    return result;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(prices: number[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);

    // Start with SMA for the first EMA value
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            result.push(NaN);
        } else if (i === period - 1) {
            result.push(ema);
        } else {
            ema = (prices[i] - ema) * multiplier + ema;
            result.push(ema);
        }
    }
    return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
    const result: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = 0; i < prices.length; i++) {
        if (i < period) {
            result.push(NaN);
        } else {
            const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
            const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;

            if (avgLoss === 0) {
                result.push(100);
            } else {
                const rs = avgGain / avgLoss;
                result.push(100 - (100 / (1 + rs)));
            }
        }
    }
    return result;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(prices: number[]): {
    macd: number[];
    signal: number[];
    histogram: number[];
} {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);

    // MACD Line = EMA12 - EMA26
    const macdLine: number[] = [];
    for (let i = 0; i < prices.length; i++) {
        if (isNaN(ema12[i]) || isNaN(ema26[i])) {
            macdLine.push(NaN);
        } else {
            macdLine.push(ema12[i] - ema26[i]);
        }
    }

    // Signal Line = 9-day EMA of MACD Line
    const validMacd = macdLine.filter(v => !isNaN(v));
    const signalEma = calculateEMA(validMacd, 9);

    // Pad signal line to match original length
    const signal: number[] = [];
    let signalIdx = 0;
    for (let i = 0; i < prices.length; i++) {
        if (isNaN(macdLine[i])) {
            signal.push(NaN);
        } else if (signalIdx < signalEma.length) {
            signal.push(signalEma[signalIdx]);
            signalIdx++;
        } else {
            signal.push(NaN);
        }
    }

    // Histogram = MACD Line - Signal Line
    const histogram: number[] = [];
    for (let i = 0; i < prices.length; i++) {
        if (isNaN(macdLine[i]) || isNaN(signal[i])) {
            histogram.push(NaN);
        } else {
            histogram.push(macdLine[i] - signal[i]);
        }
    }

    return { macd: macdLine, signal, histogram };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
    upper: number[];
    middle: number[];
    lower: number[];
} {
    const middle = calculateSMA(prices, period);
    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            upper.push(NaN);
            lower.push(NaN);
        } else {
            const slice = prices.slice(i - period + 1, i + 1);
            const mean = middle[i];
            const squaredDiffs = slice.map(p => Math.pow(p - mean, 2));
            const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
            const std = Math.sqrt(variance);

            upper.push(mean + (stdDev * std));
            lower.push(mean - (stdDev * std));
        }
    }

    return { upper, middle, lower };
}

/**
 * Calculate all technical indicators for historical data
 */
export function calculateAllIndicators(historical: HistoricalDataPoint[]): TechnicalIndicators {
    const closePrices = historical.map(d => d.close);
    const volumes = historical.map(d => d.volume);

    return {
        sma20: calculateSMA(closePrices, 20),
        sma50: calculateSMA(closePrices, 50),
        sma200: calculateSMA(closePrices, 200),
        ema12: calculateEMA(closePrices, 12),
        ema26: calculateEMA(closePrices, 26),
        rsi: calculateRSI(closePrices, 14),
        macd: calculateMACD(closePrices),
        bollingerBands: calculateBollingerBands(closePrices, 20, 2),
        volumeSma: calculateSMA(volumes, 20),
    };
}
