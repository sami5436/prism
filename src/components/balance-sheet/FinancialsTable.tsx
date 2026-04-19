'use client';

import { FinancialsPeriod } from '@/types/balanceSheet';

interface FinancialsTableProps {
  periods: FinancialsPeriod[];
}

type NumericIncomeKey =
  | 'revenue' | 'costOfRevenue' | 'grossProfit'
  | 'researchDevelopment' | 'sellingGeneralAdmin' | 'operatingExpenses'
  | 'operatingIncome' | 'interestExpense' | 'incomeTax' | 'netIncome';

type NumericCfKey =
  | 'operatingCashFlow' | 'investingCashFlow' | 'financingCashFlow'
  | 'capitalExpenditures' | 'depreciationAmortization' | 'stockBasedCompensation'
  | 'buybacks' | 'dividendsPaid' | 'debtIssued' | 'debtRepaid';

interface RowSpec {
  label: string;
  key: NumericIncomeKey | NumericCfKey;
  section: 'income' | 'cashFlow';
  indent?: boolean;
  isBold?: boolean;
}

const INCOME_ROWS: RowSpec[] = [
  { label: 'Revenue', key: 'revenue', section: 'income', isBold: true },
  { label: 'Cost of Revenue', key: 'costOfRevenue', section: 'income', indent: true },
  { label: 'Gross Profit', key: 'grossProfit', section: 'income', isBold: true },
  { label: 'R&D', key: 'researchDevelopment', section: 'income', indent: true },
  { label: 'SG&A', key: 'sellingGeneralAdmin', section: 'income', indent: true },
  { label: 'Total OpEx', key: 'operatingExpenses', section: 'income', indent: true },
  { label: 'Operating Income', key: 'operatingIncome', section: 'income', isBold: true },
  { label: 'Interest Expense', key: 'interestExpense', section: 'income', indent: true },
  { label: 'Income Tax', key: 'incomeTax', section: 'income', indent: true },
  { label: 'Net Income', key: 'netIncome', section: 'income', isBold: true },
];

const CF_ROWS: RowSpec[] = [
  { label: 'Operating Cash Flow', key: 'operatingCashFlow', section: 'cashFlow', isBold: true },
  { label: 'Investing Cash Flow', key: 'investingCashFlow', section: 'cashFlow' },
  { label: 'Financing Cash Flow', key: 'financingCashFlow', section: 'cashFlow' },
  { label: 'Capital Expenditures', key: 'capitalExpenditures', section: 'cashFlow', indent: true },
  { label: 'D&A', key: 'depreciationAmortization', section: 'cashFlow', indent: true },
  { label: 'Stock-Based Comp', key: 'stockBasedCompensation', section: 'cashFlow', indent: true },
  { label: 'Buybacks', key: 'buybacks', section: 'cashFlow', indent: true },
  { label: 'Dividends Paid', key: 'dividendsPaid', section: 'cashFlow', indent: true },
  { label: 'Debt Issued', key: 'debtIssued', section: 'cashFlow', indent: true },
  { label: 'Debt Repaid', key: 'debtRepaid', section: 'cashFlow', indent: true },
];

function fmtMillions(v: number | null): string {
  if (v === null) return '—';
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}T`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}B`;
  return `${sign}${abs.toFixed(1)}M`;
}

function getVal(p: FinancialsPeriod, row: RowSpec): number | null {
  if (row.section === 'income') return p.income[row.key as NumericIncomeKey];
  return p.cashFlow[row.key as NumericCfKey];
}

export default function FinancialsTable({ periods }: FinancialsTableProps) {
  if (!periods.length) return null;

  const displayPeriods = periods.slice(0, 4);

  const renderSection = (rows: RowSpec[], sectionLabel: string) => (
    <>
      <tr>
        <td
          colSpan={displayPeriods.length + 1}
          className="text-[10px] uppercase tracking-wider font-semibold pt-4 pb-2"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}
        >
          <div className="px-3">{sectionLabel}</div>
        </td>
      </tr>
      {rows.map(row => {
        const allNull = displayPeriods.every(p => getVal(p, row) === null);
        if (allNull) return null;
        return (
          <tr
            key={`${row.section}-${row.key}`}
            className="border-b"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <td
              className={`py-2 px-3 text-sm ${row.indent ? 'pl-7' : ''}`}
              style={{
                color: row.isBold ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: row.isBold ? 600 : 400,
              }}
            >
              {row.label}
            </td>
            {displayPeriods.map(p => {
              const v = getVal(p, row);
              return (
                <td
                  key={p.periodKey}
                  className="py-2 px-3 text-sm tabular-nums text-right"
                  style={{
                    color: row.isBold ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: row.isBold ? 600 : 400,
                  }}
                >
                  {fmtMillions(v)}
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );

  return (
    <div className="bs-card bs-fade-in" id="fin-table">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Income Statement & Cash Flow
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          $ in millions
        </span>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
              <th
                className="py-2 px-3 text-xs font-medium text-left uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Line Item
              </th>
              {displayPeriods.map(p => (
                <th
                  key={p.periodKey}
                  className="py-2 px-3 text-xs font-medium text-right uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderSection(INCOME_ROWS, 'Income Statement')}
            {renderSection(CF_ROWS, 'Cash Flow')}
          </tbody>
        </table>
      </div>
    </div>
  );
}
