// AI Analysis logic - Interprets technical indicators to generate trading signals

import { TechnicalIndicators, HistoricalDataPoint, AnalysisSummary } from '@/types/stock';

interface Signal {
    indicator: string;
    signal: 'bullish' | 'bearish' | 'neutral';
    reason: string;
    weight: number;
}

/**
 * Analyze RSI for overbought/oversold conditions
 */
function analyzeRSI(rsi: number[]): Signal {
    const current = rsi[rsi.length - 1];

    if (isNaN(current)) {
        return { indicator: 'RSI', signal: 'neutral', reason: 'Insufficient data', weight: 0 };
    }

    if (current > 70) {
        return { indicator: 'RSI', signal: 'bearish', reason: `RSI at ${current.toFixed(1)} - Overbought territory`, weight: 2 };
    } else if (current < 30) {
        return { indicator: 'RSI', signal: 'bullish', reason: `RSI at ${current.toFixed(1)} - Oversold territory`, weight: 2 };
    } else if (current > 60) {
        return { indicator: 'RSI', signal: 'bullish', reason: `RSI at ${current.toFixed(1)} - Strong momentum`, weight: 1 };
    } else if (current < 40) {
        return { indicator: 'RSI', signal: 'bearish', reason: `RSI at ${current.toFixed(1)} - Weak momentum`, weight: 1 };
    }

    return { indicator: 'RSI', signal: 'neutral', reason: `RSI at ${current.toFixed(1)} - Neutral zone`, weight: 0 };
}

/**
 * Analyze MACD crossovers and momentum
 */
function analyzeMACD(macd: { macd: number[]; signal: number[]; histogram: number[] }): Signal {
    const currentMacd = macd.macd[macd.macd.length - 1];
    const currentSignal = macd.signal[macd.signal.length - 1];
    const currentHist = macd.histogram[macd.histogram.length - 1];
    const prevHist = macd.histogram[macd.histogram.length - 2];

    if (isNaN(currentMacd) || isNaN(currentSignal)) {
        return { indicator: 'MACD', signal: 'neutral', reason: 'Insufficient data', weight: 0 };
    }

    // Check for crossovers
    if (currentMacd > currentSignal && currentHist > 0 && prevHist <= 0) {
        return { indicator: 'MACD', signal: 'bullish', reason: 'MACD bullish crossover detected', weight: 3 };
    } else if (currentMacd < currentSignal && currentHist < 0 && prevHist >= 0) {
        return { indicator: 'MACD', signal: 'bearish', reason: 'MACD bearish crossover detected', weight: 3 };
    } else if (currentHist > 0 && currentHist > prevHist) {
        return { indicator: 'MACD', signal: 'bullish', reason: 'MACD histogram expanding bullishly', weight: 1.5 };
    } else if (currentHist < 0 && currentHist < prevHist) {
        return { indicator: 'MACD', signal: 'bearish', reason: 'MACD histogram expanding bearishly', weight: 1.5 };
    }

    return { indicator: 'MACD', signal: 'neutral', reason: 'MACD showing no clear trend', weight: 0 };
}

/**
 * Analyze Moving Average trends
 */
function analyzeSMA(
    prices: number[],
    sma20: number[],
    sma50: number[],
    sma200: number[]
): Signal {
    const currentPrice = prices[prices.length - 1];
    const current20 = sma20[sma20.length - 1];
    const current50 = sma50[sma50.length - 1];
    const current200 = sma200[sma200.length - 1];

    let bullishCount = 0;
    let bearishCount = 0;

    if (!isNaN(current20)) {
        if (currentPrice > current20) bullishCount++;
        else bearishCount++;
    }
    if (!isNaN(current50)) {
        if (currentPrice > current50) bullishCount++;
        else bearishCount++;
    }
    if (!isNaN(current200)) {
        if (currentPrice > current200) bullishCount++;
        else bearishCount++;
    }

    // Golden Cross / Death Cross detection
    if (!isNaN(current50) && !isNaN(current200)) {
        if (current50 > current200) {
            return { indicator: 'Moving Averages', signal: 'bullish', reason: 'Golden Cross pattern - 50 SMA above 200 SMA', weight: 2.5 };
        } else if (current50 < current200) {
            return { indicator: 'Moving Averages', signal: 'bearish', reason: 'Death Cross pattern - 50 SMA below 200 SMA', weight: 2.5 };
        }
    }

    if (bullishCount > bearishCount) {
        return { indicator: 'Moving Averages', signal: 'bullish', reason: `Price above ${bullishCount} of 3 moving averages`, weight: bullishCount * 0.5 };
    } else if (bearishCount > bullishCount) {
        return { indicator: 'Moving Averages', signal: 'bearish', reason: `Price below ${bearishCount} of 3 moving averages`, weight: bearishCount * 0.5 };
    }

    return { indicator: 'Moving Averages', signal: 'neutral', reason: 'Mixed signals from moving averages', weight: 0 };
}

/**
 * Analyze Bollinger Bands
 */
function analyzeBollingerBands(
    prices: number[],
    bands: { upper: number[]; middle: number[]; lower: number[] }
): Signal {
    const currentPrice = prices[prices.length - 1];
    const upper = bands.upper[bands.upper.length - 1];
    const lower = bands.lower[bands.lower.length - 1];
    const middle = bands.middle[bands.middle.length - 1];

    if (isNaN(upper) || isNaN(lower)) {
        return { indicator: 'Bollinger Bands', signal: 'neutral', reason: 'Insufficient data', weight: 0 };
    }

    const range = upper - lower;
    const position = (currentPrice - lower) / range;

    if (currentPrice > upper) {
        return { indicator: 'Bollinger Bands', signal: 'bearish', reason: 'Price above upper band - potential reversal', weight: 2 };
    } else if (currentPrice < lower) {
        return { indicator: 'Bollinger Bands', signal: 'bullish', reason: 'Price below lower band - potential bounce', weight: 2 };
    } else if (position > 0.8) {
        return { indicator: 'Bollinger Bands', signal: 'bearish', reason: 'Price near upper band', weight: 1 };
    } else if (position < 0.2) {
        return { indicator: 'Bollinger Bands', signal: 'bullish', reason: 'Price near lower band', weight: 1 };
    }

    return { indicator: 'Bollinger Bands', signal: 'neutral', reason: 'Price within normal range', weight: 0 };
}

/**
 * Analyze volume trends
 */
function analyzeVolume(volumes: number[], volumeSma: number[]): Signal {
    const currentVol = volumes[volumes.length - 1];
    const avgVol = volumeSma[volumeSma.length - 1];

    if (isNaN(avgVol)) {
        return { indicator: 'Volume', signal: 'neutral', reason: 'Insufficient data', weight: 0 };
    }

    const ratio = currentVol / avgVol;

    if (ratio > 1.5) {
        return { indicator: 'Volume', signal: 'bullish', reason: `Volume ${ratio.toFixed(1)}x above average - high interest`, weight: 1.5 };
    } else if (ratio < 0.5) {
        return { indicator: 'Volume', signal: 'neutral', reason: `Volume ${ratio.toFixed(1)}x below average - low interest`, weight: 0 };
    }

    return { indicator: 'Volume', signal: 'neutral', reason: 'Normal volume levels', weight: 0 };
}

/**
 * Generate complete AI analysis from all indicators
 */
export function generateAnalysis(
    historical: HistoricalDataPoint[],
    indicators: TechnicalIndicators
): AnalysisSummary {
    const prices = historical.map(d => d.close);
    const volumes = historical.map(d => d.volume);

    const signals: Signal[] = [
        analyzeRSI(indicators.rsi),
        analyzeMACD(indicators.macd),
        analyzeSMA(prices, indicators.sma20, indicators.sma50, indicators.sma200),
        analyzeBollingerBands(prices, indicators.bollingerBands),
        analyzeVolume(volumes, indicators.volumeSma),
    ];

    // Calculate weighted score
    let bullishWeight = 0;
    let bearishWeight = 0;
    let totalWeight = 0;

    signals.forEach(s => {
        if (s.signal === 'bullish') bullishWeight += s.weight;
        else if (s.signal === 'bearish') bearishWeight += s.weight;
        totalWeight += s.weight;
    });

    // Determine direction
    let direction: 'bullish' | 'bearish' | 'neutral';
    let confidence: number;

    if (totalWeight === 0) {
        direction = 'neutral';
        confidence = 50;
    } else {
        const netScore = (bullishWeight - bearishWeight) / totalWeight;

        if (netScore > 0.3) {
            direction = 'bullish';
            confidence = Math.min(85, 50 + netScore * 50);
        } else if (netScore < -0.3) {
            direction = 'bearish';
            confidence = Math.min(85, 50 + Math.abs(netScore) * 50);
        } else {
            direction = 'neutral';
            confidence = 50 - Math.abs(netScore) * 30;
        }
    }

    // Generate summary text
    const bullishSignals = signals.filter(s => s.signal === 'bullish');
    const bearishSignals = signals.filter(s => s.signal === 'bearish');

    let summary = '';
    if (direction === 'bullish') {
        summary = `Technical analysis suggests bullish momentum. ${bullishSignals.length} indicators are positive`;
        if (bearishSignals.length > 0) {
            summary += `, though ${bearishSignals.length} indicator(s) warrant caution`;
        }
        summary += '.';
    } else if (direction === 'bearish') {
        summary = `Technical analysis suggests bearish pressure. ${bearishSignals.length} indicators are negative`;
        if (bullishSignals.length > 0) {
            summary += `, with ${bullishSignals.length} potentially supportive signal(s)`;
        }
        summary += '.';
    } else {
        summary = `Technical indicators are mixed with no clear directional bias. Consider waiting for stronger signals before taking positions.`;
    }

    return {
        direction,
        confidence: Math.round(confidence),
        summary,
        signals: signals.map(s => ({
            indicator: s.indicator,
            signal: s.signal,
            reason: s.reason,
        })),
    };
}
