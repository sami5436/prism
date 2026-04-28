'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import { OptionsData, OptionContract } from '@/types/stock';

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

export default function OptionsChain({ ticker }: OptionsChainProps) {
    const [data, setData] = useState<OptionsData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [showDetail, setShowDetail] = useState(false);
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
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Single-Expiration Chain</h3>
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

                    {!showDetail && (
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

                    <button
                        onClick={() => setShowDetail(!showDetail)}
                        className="text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                        style={{
                            background: showDetail ? 'var(--text-primary)' : 'var(--bg-tertiary)',
                            color: showDetail ? 'var(--bg-primary)' : 'var(--text-secondary)',
                            border: '1px solid var(--border-color)',
                        }}
                    >
                        {showDetail ? 'Chart' : 'Detail'}
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-5 gap-px" style={{ background: 'var(--border-color)' }}>
                {[
                    { label: 'Call Vol', value: fmt(totalCallVolume), color: '#22c55e' },
                    { label: 'Put Vol', value: fmt(totalPutVolume), color: '#ef4444' },
                    { label: 'Call OI', value: fmt(totalCallOI), color: '#22c55e' },
                    { label: 'Put OI', value: fmt(totalPutOI), color: '#ef4444' },
                    { label: 'P/C Ratio', value: pcRatio, color: 'var(--text-primary)' },
                ].map(stat => (
                    <div key={stat.label} className="py-3 px-3 text-center" style={{ background: 'var(--bg-secondary)' }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                        <p className="text-sm font-semibold" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Chart view */}
            {!showDetail && (
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

            {/* Detail table view */}
            {showDetail && (
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
