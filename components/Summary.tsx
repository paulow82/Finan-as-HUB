import React from 'react';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { Transaction } from '../types';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';

interface SummaryProps {
  totalIncome: number;
  totalExpenses: number;
  totalInvested: number;
  investmentContributions: number;
  investmentWithdrawals: number;
  balance: number;
  pendingExpenses: number;
  nextBill?: Transaction;
  overdueBills: Transaction[];
  isSticky?: boolean;
  mobileView?: boolean;
}

const SummaryCard: React.FC<{ 
    title: string; 
    amount: number; 
    icon: React.ReactNode; 
    colorClass: string;
    subtitle?: string;
    isSticky?: boolean;
    subtitleColorClass?: string;
    compact?: boolean;
    fullWidth?: boolean;
}> = ({ title, amount, icon, colorClass, subtitle, isSticky, subtitleColorClass, compact, fullWidth }) => {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  
  return (
    <div 
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex transition-all duration-300 ease-in-out overflow-hidden min-w-0
        ${isSticky 
            ? 'flex-row items-center justify-between h-14 px-3 py-1 gap-2' 
            : compact 
                ? `flex-col px-3 py-2.5 ${fullWidth ? 'h-20' : 'h-20'} justify-between` 
                : 'flex-col h-32 p-4 justify-between hover:shadow-md hover:scale-[1.02] transform'}`}
    >
        {/* Seção Superior */}
        <div className={`flex items-center transition-all duration-300 min-w-0 ${isSticky ? 'gap-2 order-1 flex-shrink overflow-hidden' : 'justify-between w-full order-1'}`}>
            <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-all duration-300 truncate ${isSticky ? 'text-[10px]' : compact ? 'text-[9px]' : 'text-xs'}`}>
                {title}
            </p>
            
            <div className={`rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${colorClass} ${isSticky ? 'w-6 h-6 p-1 order-first' : compact ? 'w-5 h-5 p-0.5' : 'w-8 h-8 p-2'} order-last`}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-full h-full' })}
            </div>
        </div>
        
        {/* Seção Inferior */}
        <div className={`flex flex-col transition-all duration-300 ${isSticky ? 'items-end order-2 flex-shrink-0 ml-1' : 'justify-end order-2 min-w-0'}`}>
            <p 
                className={`font-bold text-gray-900 dark:text-gray-100 truncate w-full ${isSticky ? 'text-right text-base' : compact ? (fullWidth ? 'text-xl' : 'text-lg') : 'text-2xl xl:text-3xl'}`} 
                title={formattedAmount}
            >
                {formattedAmount}
            </p>
            
            {!isSticky && (
                <div className={`${compact ? '-mt-0.5' : 'mt-0.5'} w-full`}>
                     {subtitle ? (
                        <p className={`font-medium truncate w-full ${compact ? 'text-[9px]' : 'text-xs'} ${subtitleColorClass || 'text-gray-500 dark:text-gray-400'}`}>
                            {subtitle}
                        </p>
                    ) : (
                        <p className={`${compact ? 'text-[9px]' : 'text-xs'} text-transparent select-none`}>&nbsp;</p>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

const NextBillCard: React.FC<{ bill?: Transaction; isSticky?: boolean; compact?: boolean }> = ({ bill, isSticky, compact }) => {
    const colorClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';

    return (
        <div 
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex transition-all duration-300 ease-in-out overflow-hidden min-w-0
            ${isSticky 
                ? 'flex-row items-center justify-between h-14 px-3 py-1 gap-2' 
                : compact
                    ? 'flex-col px-3 py-2.5 h-20 justify-between gap-0.5'
                    : 'flex-col h-32 p-4 justify-between hover:shadow-md hover:scale-[1.02] transform'}`}
        >
            <div className={`flex items-center transition-all duration-300 min-w-0 ${isSticky ? 'gap-2 order-1 flex-shrink overflow-hidden' : 'justify-between w-full order-1'}`}>
                <p className={`font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-all duration-300 truncate ${isSticky ? 'text-[10px]' : compact ? 'text-[9px]' : 'text-xs'}`}>
                    {/* No modo Sticky, encurtamos o texto para evitar corte e dar espaço ao valor */}
                    {isSticky ? 'Próximo' : 'Próximo Pagamento'}
                </p>
                <div className={`rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${colorClass} ${isSticky ? 'w-6 h-6 p-1 order-first' : compact ? 'w-5 h-5 p-0.5' : 'w-8 h-8 p-2'} order-last`}>
                    <CalendarIcon className="w-full h-full" />
                </div>
            </div>
            
            <div className={`flex flex-col transition-all duration-300 ${isSticky ? 'items-end order-2 flex-shrink-0 ml-1' : 'justify-end order-2 min-w-0'}`}>
                {bill ? (
                    <p className={`font-bold text-gray-900 dark:text-gray-100 truncate w-full ${isSticky ? 'text-right text-base' : compact ? 'text-lg' : 'text-2xl xl:text-3xl'}`} title={bill.description}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
                    </p>
                ) : (
                    <p className={`font-bold text-gray-900 dark:text-gray-100 truncate w-full ${isSticky ? 'text-right text-sm' : compact ? 'text-base' : 'text-lg'}`}>Tudo pago!</p>
                )}
                
                {!isSticky && (
                    <div className={`${compact ? '-mt-0.5' : 'mt-0.5'} w-full`}>
                         {bill ? (
                           <p className={`${compact ? 'text-[9px]' : 'text-xs'} font-medium text-amber-600 dark:text-amber-400 truncate w-full`} title={bill.description}>
                               {bill.description} • {new Date(bill.dueDate! + 'T12:00:00').getDate()}/{new Date(bill.dueDate! + 'T12:00:00').getMonth() + 1}
                           </p>
                        ) : (
                            <p className={`${compact ? 'text-[9px]' : 'text-xs'} text-gray-400 dark:text-gray-500 select-none`}>Sem pendências</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


const Summary: React.FC<SummaryProps> = ({ totalIncome, totalExpenses, totalInvested, investmentContributions, investmentWithdrawals, balance, nextBill, pendingExpenses, overdueBills, isSticky, mobileView }) => {
  const balanceColorClass = balance >= 0 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
  const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.amount, 0);
  const overdueCount = overdueBills.length;

  // --- MOBILE VIEW LOGIC ---
  if (mobileView) {
      if (isSticky) {
          // Barra Compacta Fixa (Apenas números essenciais)
          return (
              <div className="flex items-center justify-between px-1 py-1 w-full gap-2">
                 <div className="flex flex-col items-center flex-1 border-r border-gray-200 dark:border-gray-700 last:border-0 min-w-0">
                     <span className="text-[8px] uppercase text-gray-500 font-bold truncate w-full text-center">Saldo</span>
                     <span className={`text-xs font-bold truncate w-full text-center ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(balance)}
                     </span>
                 </div>
                 <div className="flex flex-col items-center flex-1 border-r border-gray-200 dark:border-gray-700 last:border-0 min-w-0">
                     <span className="text-[8px] uppercase text-gray-500 font-bold truncate w-full text-center">Receita</span>
                     <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate w-full text-center">
                        {new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(totalIncome)}
                     </span>
                 </div>
                 <div className="flex flex-col items-center flex-1 min-w-0">
                     <span className="text-[8px] uppercase text-gray-500 font-bold truncate w-full text-center">Despesa</span>
                     <span className="text-xs font-bold text-rose-600 dark:text-rose-400 truncate w-full text-center">
                        {new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(totalExpenses)}
                     </span>
                 </div>
              </div>
          );
      }

      // Grid Compacto (Visão Inicial)
      return (
          <div className="grid grid-cols-2 gap-2 pb-1 px-1">
              <div className="col-span-2">
                <SummaryCard 
                    title="Saldo Atual" 
                    amount={balance} 
                    subtitle="Disponível"
                    icon={<DollarSignIcon />} 
                    colorClass={balanceColorClass}
                    compact={true}
                    fullWidth={true}
                />
              </div>

              <SummaryCard 
                title="Receitas" 
                amount={totalIncome} 
                subtitle="Mês atual"
                icon={<ArrowUpIcon />}
                colorClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                subtitleColorClass="text-emerald-600 dark:text-emerald-400"
                compact={true}
              />

              <SummaryCard 
                title="Despesas" 
                amount={totalExpenses} 
                subtitle={`Pend.: ${new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(pendingExpenses)}`}
                icon={<ArrowDownIcon />}
                colorClass="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                subtitleColorClass="text-rose-600 dark:text-rose-400"
                compact={true}
              />

              <SummaryCard 
                title="Investido" 
                amount={totalInvested} 
                subtitle="Saldo Mês"
                icon={<TrendingUpIcon />}
                colorClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                compact={true}
              />

              {overdueCount > 0 ? (
                    <SummaryCard 
                        title="Vencidas" 
                        amount={totalOverdue} 
                        subtitle={`${overdueCount} contas!`}
                        icon={<AlertTriangleIcon />}
                        colorClass="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse"
                        subtitleColorClass="text-red-600 dark:text-red-400 font-bold"
                        compact={true}
                    />
              ) : (
                   <NextBillCard bill={nextBill} compact={true} />
              )}
          </div>
      )
  }

  // --- DESKTOP VIEW ---
  // Adjusted breakpoints for better responsiveness
  // md: 3 cols -> lg: 4 cols -> xl: 5 cols -> 2xl: 6 cols
  return (
    <div className={`grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 ${overdueCount > 0 ? '2xl:grid-cols-6' : '2xl:grid-cols-5'} transition-all duration-300 ${isSticky ? 'gap-2' : 'gap-4'}`}>
      {overdueCount > 0 && (
        <div className="col-span-2 md:col-span-1">
            <SummaryCard 
              title="Vencidas" 
              amount={totalOverdue} 
              subtitle={`${overdueCount} contas`}
              icon={<AlertTriangleIcon />}
              colorClass="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse"
              isSticky={isSticky}
              subtitleColorClass="text-red-600 dark:text-red-400 font-bold"
            />
        </div>
      )}
      <SummaryCard 
        title="Receitas" 
        amount={totalIncome} 
        subtitle="Total do mês"
        icon={<ArrowUpIcon />}
        colorClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        isSticky={isSticky}
        subtitleColorClass="text-emerald-600 dark:text-emerald-400"
      />
      <SummaryCard 
        title="Despesas" 
        amount={totalExpenses} 
        subtitle={`Restam: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingExpenses)}`}
        icon={<ArrowDownIcon />}
        colorClass="bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
        isSticky={isSticky}
        subtitleColorClass="text-rose-600 dark:text-rose-400"
      />
      <SummaryCard 
        title="Investido" 
        amount={totalInvested} 
        subtitle={`Aportes: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(investmentContributions)} | Resgates: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(investmentWithdrawals)}`}
        icon={<DollarSignIcon />}
        colorClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
        isSticky={isSticky}
      />
      <SummaryCard 
        title="Saldo" 
        amount={balance} 
        subtitle="Receitas - Gastos"
        icon={<DollarSignIcon />} 
        colorClass={balanceColorClass}
        isSticky={isSticky}
      />
      {/* If we have overdue bills, NextBill takes its own slot. If no overdue bills, NextBill wraps naturally if space permits, or takes a slot.
          Previously it had col-span logic that could be confusing. Now we rely on the grid flow.
      */}
      <div className={overdueCount === 0 ? 'col-span-2 md:col-span-1' : 'md:col-span-1'}>
        <NextBillCard bill={nextBill} isSticky={isSticky} />
      </div>
    </div>
  );
};

export default Summary;