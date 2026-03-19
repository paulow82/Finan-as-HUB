import React, { useMemo, useState, useEffect } from 'react';
import { Transaction } from '../types';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { DuplicateIcon } from './icons/DuplicateIcon';
import { CloseIcon } from './icons/CloseIcon';
import { ExpandIcon } from './icons/ExpandIcon';
import { CollapseIcon } from './icons/CollapseIcon';
import { DesktopIcon } from './icons/DesktopIcon'; // Using DesktopIcon as a generic "View" icon or similar if needed, or simply text

interface MonthlySummarySidebarProps {
  allTransactions: Transaction[];
  selectedMonth: Date;
  onSelectMonth: (date: Date) => void;
  onCloneMonth: () => void;
  hasTransactions: boolean;
  onClose: () => void;
}

interface MonthlySummary {
  date: Date;
  income: number;
  expense: number;
  balance: number;
}

const MonthCard: React.FC<{ 
    summary: MonthlySummary, 
    isSelected: boolean, 
    isExpanded: boolean, 
    onToggle: () => void,
    onSelect: () => void 
}> = ({ summary, isSelected, isExpanded, onToggle, onSelect }) => {
    const monthName = summary.date.toLocaleDateString('pt-BR', { month: 'long' });
    const year = summary.date.getFullYear();
    const formattedBalance = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.balance);
    const balanceColor = summary.balance >= 0 ? 'text-success' : 'text-danger';

    return (
        <div 
            className={`w-full text-left rounded-xl transition-all duration-200 border overflow-hidden ${isSelected ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white dark:bg-gray-800 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
        >
            {/* Header: Clicar aqui apenas EXPAND/RECOLHE */}
            <div 
                onClick={onToggle}
                className="flex justify-between items-center p-3 cursor-pointer"
            >
                <div>
                    <p className="font-bold text-lg capitalize text-gray-800 dark:text-gray-100">{monthName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{year}</p>
                </div>
                <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-gray-100 dark:bg-gray-700' : ''}`}>
                    <ArrowDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Detalhes: Expandido */}
            <div className={`transition-all duration-300 ease-in-out bg-gray-50/50 dark:bg-gray-900/30 ${isExpanded ? 'max-h-60' : 'max-h-0'}`}>
                <div className="px-3 pb-3 pt-1 text-sm space-y-2">
                    <div className="space-y-1 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <p className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Receita:</span> 
                            <span className="font-medium text-success">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.income)}</span>
                        </p>
                        <p className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Despesa:</span> 
                            <span className="font-medium text-danger">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.expense)}</span>
                        </p>
                        <p className={`flex justify-between font-bold mt-2 pt-2 border-t border-gray-200 dark:border-gray-700`}>
                            <span className="text-gray-700 dark:text-gray-300">Saldo:</span> 
                            <span className={balanceColor}>{formattedBalance}</span>
                        </p>
                    </div>
                    
                    {/* Botão de Seleção Explicito */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect();
                        }}
                        className={`w-full mt-3 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
                            isSelected 
                                ? 'bg-primary text-white shadow-md' 
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                    >
                        {isSelected ? 'Visualizando Atualmente' : 'Visualizar no Dashboard'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MonthlySummarySidebar: React.FC<MonthlySummarySidebarProps> = ({ allTransactions, selectedMonth, onSelectMonth, onCloneMonth, hasTransactions, onClose }) => {
  const [selectedYear, setSelectedYear] = useState<number>(selectedMonth.getFullYear());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // FIX: Sincroniza o estado do ano local com a prop global do mês selecionado.
  useEffect(() => {
    setSelectedYear(selectedMonth.getFullYear());
  }, [selectedMonth]);

  const availableYears = useMemo(() => {
    const validTransactions = allTransactions.filter(t => {
        const tDate = new Date(t.date);
        return !isNaN(tDate.getTime());
    });
    const years = new Set<number>(validTransactions.map(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear();
    }));
    if (years.size > 0) {
      years.add(new Date().getFullYear());
    }
    return Array.from(years).sort((a: number, b: number) => b - a);
  }, [allTransactions]);

  const monthlySummaries = useMemo(() => {
    const summaries: { [key: string]: MonthlySummary } = {};

    allTransactions
      .filter(t => {
          const tDate = new Date(t.date);
          return !isNaN(tDate.getTime()) && tDate.getFullYear() === selectedYear;
      })
      .forEach(t => {
        const tDate = new Date(t.date);
        const date = new Date(tDate.getFullYear(), tDate.getMonth(), 1);
        const key = date.toISOString();

        if (!summaries[key]) {
          summaries[key] = { date, income: 0, expense: 0, balance: 0 };
        }

        if (t.type === 'income') {
          if (t.incomeType !== 'investment') {
            summaries[key].income += t.amount;
          }
        } else {
          if (t.expenseType !== 'investment') {
            summaries[key].expense += t.amount;
          }
        }
        summaries[key].balance = summaries[key].income - summaries[key].expense;
      });

    return Object.values(summaries).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [allTransactions, selectedYear]);
  
  const annualSummary = useMemo(() => {
    const summary = { income: 0, expense: 0, investment: 0, balance: 0 };
    
    allTransactions
      .filter(t => {
          const tDate = new Date(t.date);
          return !isNaN(tDate.getTime()) && tDate.getFullYear() === selectedYear;
      })
      .forEach(t => {
        if (t.type === 'income') {
          if (t.incomeType === 'investment') {
            summary.investment -= t.amount;
          } else {
            summary.income += t.amount;
          }
        } else if (t.type === 'expense') {
          if (t.expenseType === 'investment') {
            summary.investment += t.amount;
          } else {
            summary.expense += t.amount;
          }
        }
      });

    summary.balance = summary.income - summary.expense - summary.investment;
    return summary;
  }, [allTransactions, selectedYear]);

  // Efeito para garantir que o mês selecionado esteja sempre expandido
  useEffect(() => {
    const selectedKey = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).toISOString();
    setExpandedMonths(prev => new Set(prev).add(selectedKey));
  }, [selectedMonth]);

  const handleToggleExpand = (monthKey: string) => {
    setExpandedMonths(prev => {
        const newSet = new Set(prev);
        if (newSet.has(monthKey)) {
            newSet.delete(monthKey);
        } else {
            newSet.add(monthKey);
        }
        return newSet;
    });
  };

  const expandAll = () => {
    const allKeys = monthlySummaries.map(s => s.date.toISOString());
    setExpandedMonths(new Set(allKeys));
  };
  
  const collapseAll = () => {
      // Mantém apenas o selecionado aberto
      const selectedKey = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).toISOString();
      setExpandedMonths(new Set([selectedKey]));
  };
  
  const handleYearChange = (year: number) => {
    if (isNaN(year)) return;
    setSelectedYear(year);

    const transactionsInNewYear = allTransactions
        .filter(t => {
            const tDate = new Date(t.date);
            return !isNaN(tDate.getTime()) && tDate.getFullYear() === year;
        })
        .sort((a, b) => {
            const aDate = new Date(a.date);
            const bDate = new Date(b.date);
            return aDate.getTime() - bDate.getTime();
        });
    
    let firstMonthDate: Date;
    if (transactionsInNewYear.length > 0) {
        const firstTransactionDate = new Date(transactionsInNewYear[0].date);
        firstMonthDate = new Date(year, firstTransactionDate.getMonth(), 1);
    } else {
        // Se não houver transações no ano selecionado, o padrão é janeiro.
        firstMonthDate = new Date(year, 0, 1);
    }

    onSelectMonth(firstMonthDate);
  };

  return (
    // Alterado: w-64 para w-full md:w-64 e removido border-r no mobile
    <aside className="w-full md:w-64 bg-white dark:bg-gray-800 p-4 h-full md:border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex-shrink-0 px-1 mb-4">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resumo Mensal</h2>
            <button onClick={onClose} className="md:hidden p-1 -mr-1 text-gray-500 dark:text-gray-400" aria-label="Fechar menu">
                <CloseIcon className="w-6 h-6" />
            </button>
        </div>
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
            <div className="my-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3 text-center uppercase tracking-wider">Resumo de {selectedYear}</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><ArrowUpIcon className="w-4 h-4 text-success"/> Receita</span>
                        <span className="font-bold text-success">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualSummary.income)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><ArrowDownIcon className="w-4 h-4 text-danger"/> Despesa</span>
                        <span className="font-bold text-danger">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualSummary.expense)}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><DollarSignIcon className="w-4 h-4 text-blue-500"/> Investido</span>
                        <span className="font-bold text-blue-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualSummary.investment)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center font-bold">
                         <span className="text-gray-700 dark:text-gray-200">Saldo Final</span>
                         <span className={annualSummary.balance >= 0 ? 'text-success' : 'text-danger'}>
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualSummary.balance)}
                         </span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={expandAll} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-xs transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">
                    <ExpandIcon className="w-4 h-4" /> Expandir
                </button>
                <button onClick={collapseAll} className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-xs transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">
                    <CollapseIcon className="w-4 h-4" /> Recolher
                </button>
            </div>
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
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {monthlySummaries.map(summary => {
          const monthKey = summary.date.toISOString();
          const isExpanded = expandedMonths.has(monthKey);
          return (
            <MonthCard
              key={monthKey}
              summary={summary}
              isExpanded={isExpanded}
              isSelected={
                  summary.date.getMonth() === selectedMonth.getMonth() &&
                  summary.date.getFullYear() === selectedMonth.getFullYear()
              }
              onToggle={() => handleToggleExpand(monthKey)}
              onSelect={() => onSelectMonth(summary.date)}
            />
          )
        })}
      </div>
    </aside>
  );
};

export default MonthlySummarySidebar;