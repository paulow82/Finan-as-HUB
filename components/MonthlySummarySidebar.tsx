
import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { DuplicateIcon } from './icons/DuplicateIcon';

interface MonthlySummarySidebarProps {
  allTransactions: Transaction[];
  selectedMonth: Date;
  onSelectMonth: (date: Date) => void;
  onCloneMonth: () => void;
  hasTransactions: boolean;
}

interface MonthlySummary {
  date: Date;
  income: number;
  expense: number;
  balance: number;
}

const MonthCard: React.FC<{ summary: MonthlySummary, isSelected: boolean, onClick: () => void }> = ({ summary, isSelected, onClick }) => {
    const monthName = summary.date.toLocaleDateString('pt-BR', { month: 'long' });
    const year = summary.date.getFullYear();
    const formattedBalance = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.balance);
    const balanceColor = summary.balance >= 0 ? 'text-success' : 'text-danger';

    return (
        <button 
            onClick={onClick}
            className={`w-full text-left p-4 rounded-xl transition-all duration-200 border ${isSelected ? 'bg-primary/10 border-primary shadow-sm' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
        >
            <p className="font-bold text-lg capitalize text-gray-800 dark:text-gray-100">{monthName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{year}</p>
            <div className="mt-3 text-sm space-y-1">
                <p className="flex justify-between text-gray-600 dark:text-gray-400"><span>Receita:</span> <span className="font-medium text-success">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.income)}</span></p>
                <p className="flex justify-between text-gray-600 dark:text-gray-400"><span>Despesa:</span> <span className="font-medium text-danger">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.expense)}</span></p>
                <p className={`flex justify-between font-bold mt-2 pt-2 border-t border-gray-200 dark:border-gray-700`}>
                    <span className="text-gray-700 dark:text-gray-300">Saldo:</span> <span className={balanceColor}>{formattedBalance}</span>
                </p>
            </div>
        </button>
    );
};

const MonthlySummarySidebar: React.FC<MonthlySummarySidebarProps> = ({ allTransactions, selectedMonth, onSelectMonth, onCloneMonth, hasTransactions }) => {
  const [selectedYear, setSelectedYear] = useState<number>(selectedMonth.getFullYear());

  const availableYears = useMemo(() => {
    const validTransactions = allTransactions.filter(t => !isNaN(t.date.getTime()));
    const years = new Set<number>(validTransactions.map(t => t.date.getFullYear()));
    if (years.size > 0) {
      years.add(new Date().getFullYear());
    }
    return Array.from(years).sort((a: number, b: number) => b - a);
  }, [allTransactions]);

  const monthlySummaries = useMemo(() => {
    const summaries: { [key: string]: MonthlySummary } = {};

    allTransactions
      .filter(t => !isNaN(t.date.getTime()) && t.date.getFullYear() === selectedYear)
      .forEach(t => {
        const date = new Date(t.date.getFullYear(), t.date.getMonth(), 1);
        const key = date.toISOString();

        if (!summaries[key]) {
          summaries[key] = { date, income: 0, expense: 0, balance: 0 };
        }

        if (t.type === 'income') {
          summaries[key].income += t.amount;
        } else {
          summaries[key].expense += t.amount;
        }
        summaries[key].balance = summaries[key].income - summaries[key].expense;
      });

    return Object.values(summaries).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [allTransactions, selectedYear]);
  
  const handleYearChange = (year: number) => {
    if (isNaN(year)) return;
    setSelectedYear(year);
    // When changing year, select the first available month of that year or default to Jan
    const firstMonthOfNewYear = monthlySummaries.find(s => s.date.getFullYear() === year)?.date || new Date(year, 0, 5);
    onSelectMonth(firstMonthOfNewYear);
  };


  return (
    <aside className="w-64 bg-white dark:bg-gray-800 p-4 h-full border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex-shrink-0 px-2 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Resumo Mensal</h2>
        <div className="space-y-3">
            {availableYears.length > 0 && (
              <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(parseInt(e.target.value))}
                    className="block w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-primary focus:border-primary text-gray-900 dark:text-white py-3 pl-4 pr-10 rounded-xl leading-tight focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
                  >
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                      <ArrowDownIcon className="h-4 w-4" />
                  </div>
              </div>
            )}
            <button
                onClick={onCloneMonth}
                disabled={!hasTransactions}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold text-sm transition-colors hover:bg-indigo-200 dark:hover:bg-indigo-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Copia todas as transações do mês atual para o próximo mês"
            >
                <DuplicateIcon className="w-4 h-4" />
                Copiar para o Próximo Mês
            </button>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
        {monthlySummaries.map(summary => (
          <MonthCard
            key={summary.date.toISOString()}
            summary={summary}
            isSelected={
                summary.date.getMonth() === selectedMonth.getMonth() &&
                summary.date.getFullYear() === selectedMonth.getFullYear()
            }
            onClick={() => onSelectMonth(summary.date)}
          />
        ))}
      </div>
    </aside>
  );
};

export default MonthlySummarySidebar;
