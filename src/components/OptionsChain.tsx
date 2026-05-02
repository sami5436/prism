'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, LineChart, Line, ReferenceLine,
} from 'recharts';
import { OptionsData, OptionContract } from '@/types/stock';
import DocsLink from '@/components/shared/DocsLink';

interface OptionsChainProps {
    ticker: string;
}

interface StrikeRow {
    strike: number;
    callVolume: number;
    callOI: number;
    callIV: number;
    callITM: boolean;
    putVolume: number;
    putOI: number;
    putIV: number;
    putITM: boolean;
}

interface ExpectedMove {
    dollars: number;   // ATM straddle ≈ 1σ implied move
    pct: number;       // dollars / spot × 100
    strike: number;    // ATM strike used
    upper: number;     // spot + dollars
    lower: number;     // spot − dollars
}

// Market-implied 1σ move for the selected expiration, derived from the ATM
// straddle. Uses bid/ask mid when both sides are quoted; falls back to last.
function computeExpectedMove(
    calls: OptionContract[],
    puts: OptionContract[],
    spot: number,
): ExpectedMove | null {
    if (!spot || !calls.length || !puts.length) return null;

    const putStrikes = new Set(puts.map(p => p.strike));
    const common = calls.map(c => c.strike).filter(s => putStrikes.has(s));
    if (!common.length) return null;

    const atmStrike = common.reduce((best, s) =>
        Math.abs(s - spot) < Math.abs(best - spot) ? s : best,
    );

    const atmCall = calls.find(c => c.strike === atmStrike);
    const atmPut = puts.find(p => p.strike === atmStrike);
    if (!atmCall || !atmPut) return null;

    const mid = (c: OptionContract) =>
        c.bid > 0 && c.ask > 0 ? (c.bid + c.ask) / 2 : c.lastPrice;

    const callMid = mid(atmCall);
    const putMid = mid(atmPut);
    if (callMid <= 0 || putMid <= 0) return null;

    const dollars = callMid + putMid;
    return {
        dollars,
        pct: (dollars / spot) * 100,
        strike: atmStrike,
        upper: spot + dollars,
        lower: spot - dollars,
    };
}

interface DirectionalLean {
    callStrike: number;
    putStrike: number;
    callPremium: number;
    putPremium: number;
    callShare: number;  // callPremium / (call+put) × 100, neutral = 50
    skewPct: number;    // (call - put) / (call + put) × 100; >0 upside, <0 downside
}

// OTM premium comparison at roughly equidistant strikes (~5% from spot).
// Equidistant OTM cancels the put-call parity carry tilt, leaving the
// market's directional pricing skew.
function computeDirectionalLean(
    calls: OptionContract[],
    puts: OptionContract[],
    spot: number,
): DirectionalLean | null {
    if (!spot || !calls.length || !puts.length) return null;

    const otmCalls = calls.filter(c => c.strike > spot);
    const otmPuts = puts.filter(p => p.strike < spot);
    if (!otmCalls.length || !otmPuts.length) return null;

    const callTarget = spot * 1.05;
    const putTarget = spot * 0.95;

    const otmCall = otmCalls.reduce((best, c) =>
        Math.abs(c.strike - callTarget) < Math.abs(best.strike - callTarget) ? c : best,
    );
    const otmPut = otmPuts.reduce((best, p) =>
        Math.abs(p.strike - putTarget) < Math.abs(best.strike - putTarget) ? p : best,
    );

    const mid = (c: OptionContract) =>
        c.bid > 0 && c.ask > 0 ? (c.bid + c.ask) / 2 : c.lastPrice;

    const callPremium = mid(otmCall);
    const putPremium = mid(otmPut);
    if (callPremium <= 0 || putPremium <= 0) return null;

    const total = callPremium + putPremium;
    return {
        callStrike: otmCall.strike,
        putStrike: otmPut.strike,
        callPremium,
        putPremium,
        callShare: (callPremium / total) * 100,
        skewPct: ((callPremium - putPremium) / total) * 100,
    };
}

export default function OptionsChain({ ticker }: OptionsChainProps) {
    const [data, setData] = useState<OptionsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [viewMode, setViewMode] = useState<'chart' | 'skew' | 'detail'>('chart');
    const [sortField, setSortField] = useState<keyof StrikeRow>('strike');
    const [sortAsc, setSortAsc] = useState(true);
    const [bandPct, setBandPct] = useState<number>(15); // ±% of spot for chart band

    const fetchOptions = useCallback(async (date?: string) => {
        setLoading(true);
        setError(null);
        try {
            const url = date
                ? `/api/options/${ticker}?date=${date}`
                : `/api/options/${ticker}`;
            const res = await fetch(url);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to fetch');
            setData(json);
            if (!date && json.expirationDates?.length > 0) {
                setSelectedDate(json.expirationDates[0]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error loading options');
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [ticker]);

    useEffect(() => {
        if (ticker) fetchOptions();
    }, [ticker, fetchOptions]);

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        fetchOptions(date);
    };

    const handleSort = (field: keyof StrikeRow) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(true);
        }
    };

    if (loading) {
        return (
            <div className="rounded-xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--text-primary)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading options chain...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl p-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Options data unavailable for {ticker}</p>
            </div>
        );
    }

    if (!data) return null;

    // Build summary stats
    const totalCallVolume = data.calls.reduce((s, c) => s + c.volume, 0);
    const totalPutVolume = data.puts.reduce((s, c) => s + c.volume, 0);
    const totalCallOI = data.calls.reduce((s, c) => s + c.openInterest, 0);
    const totalPutOI = data.puts.reduce((s, c) => s + c.openInterest, 0);
    const pcRatio = totalCallVolume > 0 ? (totalPutVolume / totalCallVolume).toFixed(2) : 'N/A';

    const expectedMove = computeExpectedMove(data.calls, data.puts, data.underlyingPrice);
    const lean = computeDirectionalLean(data.calls, data.puts, data.underlyingPrice);

    // Build chart data — aggregate by strike
    const strikeMap = new Map<number, StrikeRow>();

    const ensureRow = (strike: number): StrikeRow => {
        if (!strikeMap.has(strike)) {
            strikeMap.set(strike, {
                strike, callVolume: 0, callOI: 0, callIV: 0, callITM: false,
                putVolume: 0, putOI: 0, putIV: 0, putITM: false,
            });
        }
        return strikeMap.get(strike)!;
    };

    data.calls.forEach((c: OptionContract) => {
        const row = ensureRow(c.strike);
        row.callVolume = c.volume;
        row.callOI = c.openInterest;
        row.callIV = c.impliedVolatility;
        row.callITM = c.inTheMoney;
    });

    data.puts.forEach((p: OptionContract) => {
        const row = ensureRow(p.strike);
        row.putVolume = p.volume;
        row.putOI = p.openInterest;
        row.putIV = p.impliedVolatility;
        row.putITM = p.inTheMoney;
    });

    const allRows = Array.from(strikeMap.values()).sort((a, b) => a.strike - b.strike);

    // Filter chart strikes to ±bandPct of spot. Falls back to all rows if spot
    // is missing or the band excludes everything.
    const spot = data.underlyingPrice || 0;
    const bandFrac = Math.max(0.5, Math.min(100, bandPct)) / 100;
    const chartRows = spot > 0
        ? allRows.filter(r => Math.abs(r.strike - spot) / spot <= bandFrac)
        : allRows;
    const effectiveRows = chartRows.length > 0 ? chartRows : allRows;

    // Sorted rows for detail table
    const sortedRows = [...allRows].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortAsc ? aVal - bVal : bVal - aVal;
        }
        return 0;
    });

    const fmt = (n: number) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? (n / 1_000).toFixed(1) + 'K' : n.toString();

    return (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            {/* Header */}
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div>
                    <h3 className="text-base font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        Single-Expiration Chain
                        <DocsLink to="chain-views" label="How the chain views work" />
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        OI &amp; Volume by strike for one expiration
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <select
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="text-xs px-3 py-1.5 rounded-md cursor-pointer"
                        style={{
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                        }}
                    >
                        {data.expirationDates.map(d => (
                            <option key={d} value={d}>
                                {new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </option>
                        ))}
                    </select>

                    {viewMode !== 'detail' && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Band ±</span>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                step={1}
                                value={bandPct}
                                onChange={(e) => setBandPct(Math.max(1, Math.min(100, Number(e.target.value) || 0)))}
                                className="w-14 text-xs tabular-nums rounded-md px-2 py-1 outline-none"
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                }}
                            />
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>%</span>
                        </div>
                    )}

                    <div className="flex gap-1">
                        {(['chart', 'skew', 'detail'] as const).map(mode => {
                            const active = viewMode === mode;
                            return (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className="text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer capitalize"
                                    style={{
                                        background: active ? 'var(--text-primary)' : 'var(--bg-tertiary)',
                                        color: active ? 'var(--bg-primary)' : 'var(--text-secondary)',
                                        border: '1px solid var(--border-color)',
                                    }}
                                >
                                    {mode}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Expected move + directional lean from selected-expiration options */}
            {expectedMove && (
                <div
                    className="px-5 py-3 flex flex-col gap-2.5"
                    style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <span className="text-[10px] uppercase tracking-wider inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                Expected Move
                                <DocsLink to="expected-move" label="How expected move is calculated" size={10} />
                            </span>
                            <span className="text-base font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                                ±${expectedMove.dollars.toFixed(2)}
                            </span>
                            <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                                ±{expectedMove.pct.toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex items-baseline gap-2 text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            <span>Range</span>
                            <span style={{ color: '#ef4444' }}>${expectedMove.lower.toFixed(2)}</span>
                            <span>–</span>
                            <span style={{ color: '#22c55e' }}>${expectedMove.upper.toFixed(2)}</span>
                            <span className="ml-2 opacity-70">via ${expectedMove.strike.toFixed(2)} straddle</span>
                        </div>
                    </div>

                    {lean && (() => {
                        const dominant: 'upside' | 'downside' | 'balanced' =
                            lean.skewPct >= 5 ? 'upside' : lean.skewPct <= -5 ? 'downside' : 'balanced';
                        const dominantLabel =
                            dominant === 'upside' ? 'Upside favored'
                            : dominant === 'downside' ? 'Downside favored'
                            : 'Balanced';
                        const dominantColor =
                            dominant === 'upside' ? '#22c55e'
                            : dominant === 'downside' ? '#ef4444'
                            : 'var(--text-secondary)';
                        return (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="text-[10px] uppercase tracking-wider whitespace-nowrap inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                        OTM Lean
                                        <DocsLink to="directional-lean" label="How OTM lean is computed" size={10} />
                                    </span>
                                    <div
                                        className="flex-1 max-w-[220px] h-1.5 rounded-full flex overflow-hidden"
                                        style={{ background: 'var(--bg-tertiary)' }}
                                        title={`${lean.callShare.toFixed(1)}% calls / ${(100 - lean.callShare).toFixed(1)}% puts`}
                                    >
                                        <div style={{ width: `${lean.callShare}%`, background: '#22c55e' }} />
                                        <div style={{ width: `${100 - lean.callShare}%`, background: '#ef4444' }} />
                                    </div>
                                    <span className="text-xs font-medium whitespace-nowrap" style={{ color: dominantColor }}>
                                        {dominantLabel}
                                        {dominant !== 'balanced' && (
                                            <span className="ml-1 tabular-nums opacity-80">
                                                {Math.abs(lean.skewPct).toFixed(0)}%
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2 text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                    <span style={{ color: '#22c55e' }}>${lean.callPremium.toFixed(2)}</span>
                                    <span>${lean.callStrike.toFixed(2)}c</span>
                                    <span className="opacity-50">vs</span>
                                    <span style={{ color: '#ef4444' }}>${lean.putPremium.toFixed(2)}</span>
                                    <span>${lean.putStrike.toFixed(2)}p</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Stats bar */}
            <div className="grid grid-cols-5 gap-px" style={{ background: 'var(--border-color)' }}>
                {[
                    { label: 'Call Vol', value: fmt(totalCallVolume), color: '#22c55e' },
                    { label: 'Put Vol', value: fmt(totalPutVolume), color: '#ef4444' },
                    { label: 'Call OI', value: fmt(totalCallOI), color: '#22c55e' },
                    { label: 'Put OI', value: fmt(totalPutOI), color: '#ef4444' },
                    { label: 'P/C Ratio', value: pcRatio, color: 'var(--text-primary)', docTo: 'pc-ratio', docLabel: 'How to read the P/C ratio' },
                ].map(stat => (
                    <div key={stat.label} className="py-3 px-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1 inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                            {stat.label}
                            {stat.docTo && <DocsLink to={stat.docTo} label={stat.docLabel!} size={10} />}
                        </p>
                        <p className="text-sm font-semibold" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Chart view */}
            {viewMode === 'chart' && (
                <div className="p-5">
                    <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                        OI + Volume by Strike · ±{bandPct}% of spot · solid base = OI, lighter top = Volume
                    </p>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={effectiveRows} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis
                                dataKey="strike"
                                tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                tickFormatter={(v) => `$${v}`}
                            />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={fmt} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 8,
                                    fontSize: 12,
                                    color: 'var(--text-primary)',
                                }}
                                formatter={((value: number | undefined, name: string) => [fmt(value ?? 0), name]) as any}
                                labelFormatter={(v) => `Strike $${v}`}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                            <Bar dataKey="callOI" name="Call OI" stackId="calls" fill="#22c55e" maxBarSize={22} />
                            <Bar dataKey="callVolume" name="Call Vol" stackId="calls" fill="#22c55e" fillOpacity={0.4} maxBarSize={22} radius={[2, 2, 0, 0]} />
                            <Bar dataKey="putOI" name="Put OI" stackId="puts" fill="#ef4444" maxBarSize={22} />
                            <Bar dataKey="putVolume" name="Put Vol" stackId="puts" fill="#ef4444" fillOpacity={0.4} maxBarSize={22} radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>

                    {data.underlyingPrice > 0 && (
                        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>
                            Underlying: ${data.underlyingPrice.toFixed(2)}
                        </p>
                    )}
                </div>
            )}

            {/* Skew view */}
            {viewMode === 'skew' && (
                <div className="p-5">
                    <p className="text-xs mb-3 inline-flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        Implied volatility by strike · ±{bandPct}% of spot · vertical line = ATM
                        <DocsLink to="iv-skew" label="How to read the volatility skew" size={11} />
                    </p>
                    {(() => {
                        const skewRows = effectiveRows.map(r => ({
                            strike: r.strike,
                            callIV: r.callIV > 0 ? r.callIV : null,
                            putIV: r.putIV > 0 ? r.putIV : null,
                        }));
                        const ivValues = skewRows.flatMap(r => [r.callIV, r.putIV]).filter((v): v is number => v != null);
                        const hasIV = ivValues.length > 0;
                        const minIV = hasIV ? Math.min(...ivValues) : 0;
                        const maxIV = hasIV ? Math.max(...ivValues) : 1;
                        const pad = (maxIV - minIV) * 0.1 || 0.05;
                        return hasIV ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={skewRows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis
                                        dataKey="strike"
                                        type="number"
                                        domain={['dataMin', 'dataMax']}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                        tickFormatter={(v) => `$${v}`}
                                    />
                                    <YAxis
                                        domain={[Math.max(0, minIV - pad), maxIV + pad]}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                                        width={40}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--bg-tertiary)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 8,
                                            fontSize: 12,
                                            color: 'var(--text-primary)',
                                        }}
                                        formatter={(value, name) => [
                                            typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '—',
                                            name,
                                        ]}
                                        labelFormatter={(v) => `Strike $${v}`}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                                    {data.underlyingPrice > 0 && (
                                        <ReferenceLine
                                            x={data.underlyingPrice}
                                            stroke="var(--text-muted)"
                                            strokeDasharray="3 3"
                                            label={{
                                                value: `ATM $${data.underlyingPrice.toFixed(2)}`,
                                                position: 'top',
                                                fill: 'var(--text-muted)',
                                                fontSize: 10,
                                            }}
                                        />
                                    )}
                                    <Line
                                        type="monotone"
                                        dataKey="callIV"
                                        name="Call IV"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        dot={{ r: 2.5, fill: '#22c55e' }}
                                        activeDot={{ r: 4 }}
                                        connectNulls
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="putIV"
                                        name="Put IV"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ r: 2.5, fill: '#ef4444' }}
                                        activeDot={{ r: 4 }}
                                        connectNulls
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
                                No IV data in this band.
                            </p>
                        );
                    })()}
                </div>
            )}

            {/* Detail table view */}
            {viewMode === 'detail' && (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                {[
                                    { key: 'callOI' as keyof StrikeRow, label: 'Call OI' },
                                    { key: 'callVolume' as keyof StrikeRow, label: 'Call Vol' },
                                    { key: 'callIV' as keyof StrikeRow, label: 'Call IV' },
                                    { key: 'strike' as keyof StrikeRow, label: 'Strike' },
                                    { key: 'putIV' as keyof StrikeRow, label: 'Put IV' },
                                    { key: 'putVolume' as keyof StrikeRow, label: 'Put Vol' },
                                    { key: 'putOI' as keyof StrikeRow, label: 'Put OI' },
                                ].map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        className="py-2.5 px-3 text-center font-medium cursor-pointer select-none hover:opacity-80 transition-opacity"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        {col.label}
                                        {sortField === col.key && (
                                            <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRows.map((row) => {
                                const isATM = Math.abs(row.strike - (data.underlyingPrice || 0)) ===
                                    Math.min(...allRows.map(r => Math.abs(r.strike - (data.underlyingPrice || 0))));
                                return (
                                    <tr
                                        key={row.strike}
                                        style={{
                                            borderBottom: '1px solid var(--border-color)',
                                            background: isATM ? 'var(--bg-tertiary)' : 'transparent',
                                        }}
                                    >
                                        <td className="py-2 px-3 text-center" style={{ color: '#22c55e' }}>
                                            {row.callOI > 0 ? fmt(row.callOI) : '—'}
                                        </td>
                                        <td className="py-2 px-3 text-center" style={{ color: '#22c55e' }}>
                                            {row.callVolume > 0 ? fmt(row.callVolume) : '—'}
                                        </td>
                                        <td className="py-2 px-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                                            {row.callIV > 0 ? (row.callIV * 100).toFixed(1) + '%' : '—'}
                                        </td>
                                        <td className="py-2 px-3 text-center font-semibold" style={{
                                            color: 'var(--text-primary)',
                                            borderLeft: '2px solid var(--border-color)',
                                            borderRight: '2px solid var(--border-color)',
                                        }}>
                                            ${row.strike.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                                            {row.putIV > 0 ? (row.putIV * 100).toFixed(1) + '%' : '—'}
                                        </td>
                                        <td className="py-2 px-3 text-center" style={{ color: '#ef4444' }}>
                                            {row.putVolume > 0 ? fmt(row.putVolume) : '—'}
                                        </td>
                                        <td className="py-2 px-3 text-center" style={{ color: '#ef4444' }}>
                                            {row.putOI > 0 ? fmt(row.putOI) : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
