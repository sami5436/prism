'use client';

import { ExtractionPeriod, NormalizedLineItems } from '@/types/balanceSheet';

interface BalanceSheetTableProps {
  periods: ExtractionPeriod[];
  currency?: string;
  unit?: string;
}

interface LineItemRow {
  key: keyof NormalizedLineItems;
  label: string;
  indent?: boolean;
  isBold?: boolean;
}

const ROWS: LineItemRow[] = [
  { key: 'cashAndEquivalents', label: 'Cash & Equivalents', indent: true },
  { key: 'shortTermInvestments', label: 'Short-term Investments', indent: true },
  { key: 'accountsReceivable', label: 'Accounts Receivable', indent: true },
  { key: 'inventory', label: 'Inventory', indent: true },
  { key: 'totalCurrentAssets', label: 'Total Current Assets', isBold: true },
  { key: 'propertyPlantEquipment', label: 'PP&E', indent: true },
  { key: 'goodwill', label: 'Goodwill', indent: true },
  { key: 'intangibleAssets', label: 'Intangible Assets', indent: true },
  { key: 'totalAssets', label: 'Total Assets', isBold: true },
  { key: 'accountsPayable', label: 'Accounts Payable', indent: true },
  { key: 'shortTermDebt', label: 'Short-term Debt', indent: true },
  { key: 'totalCurrentLiabilities', label: 'Total Current Liabilities', isBold: true },
  { key: 'longTermDebt', label: 'Long-term Debt', indent: true },
  { key: 'totalLiabilities', label: 'Total Liabilities', isBold: true },
  { key: 'retainedEarnings', label: 'Retained Earnings', indent: true },
  { key: 'totalEquity', label: 'Total Equity', isBold: true },
];

const UNIT_SCALE: Record<string, number> = {
  units: 1,
  thousands: 1e3,
  millions: 1e6,
  billions: 1e9,
};

function formatAmount(value: number | null, unit: string): string {
  if (value === null) return '—';
  const scale = UNIT_SCALE[unit] ?? 1;
  const absUsd = Math.abs(value) * scale;
  const sign = value < 0 ? '-' : '';

  if (absUsd >= 1e12) return `${sign}${(absUsd / 1e12).toFixed(2)}T`;
  if (absUsd >= 1e9) return `${sign}${(absUsd / 1e9).toFixed(2)}B`;
  if (absUsd >= 1e6) return `${sign}${(absUsd / 1e6).toFixed(1)}M`;
  if (absUsd >= 1e3) return `${sign}${(absUsd / 1e3).toFixed(0)}K`;
  return `${sign}${absUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function BalanceSheetTable({ periods, currency = '$', unit = 'units' }: BalanceSheetTableProps) {
  if (periods.length === 0) return null;

  return (
    <div className="bs-card bs-fade-in overflow-x-auto" id="bs-table">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          Balance Sheet Snapshot
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {currency} · auto-scaled
        </span>
      </div>

      <table className="w-full text-sm" style={{ minWidth: periods.length > 1 ? '500px' : 'auto' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--bs-card-border)' }}>
            <th className="text-left py-2 pr-4 font-medium text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Line Item
            </th>
            {periods.map(p => (
              <th key={p.label} className="text-right py-2 pl-4 font-medium text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {p.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(row => {
            const hasData = periods.some(p => p.lineItems[row.key] !== null);
            if (!hasData) return null;

            return (
              <tr
                key={row.key}
                style={{
                  borderBottom: row.isBold ? '1px solid var(--bs-card-border)' : undefined,
                }}
              >
                <td
                  className="py-2 pr-4"
                  style={{
                    paddingLeft: row.indent ? '16px' : '0',
                    fontWeight: row.isBold ? 600 : 400,
                    color: row.isBold ? 'var(--text-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {row.label}
                </td>
                {periods.map(p => (
                  <td
                    key={p.label}
                    className="text-right py-2 pl-4 tabular-nums"
                    style={{
                      fontWeight: row.isBold ? 600 : 400,
                      color: row.isBold ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {formatAmount(p.lineItems[row.key], unit)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
