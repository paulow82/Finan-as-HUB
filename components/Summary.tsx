import React from 'react';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { Transaction } from '../types';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

interface SummaryProps {
  totalIncome: number;
  totalExpenses: number;
  totalInvested: number;
  balance: number;
  paidExpenses: number;
  nextBill?: Transaction;
  overdueBills: Transaction[];
  isSticky?: boolean;
}

const SummaryCard: React.FC<{ 
    title: string; 
    amount: number; 
    icon: React.ReactNode; 
    colorClass: string;
    subtitle?: string;
    subAmount?: number;
    isSticky?: boolean;
    subtitleColorClass?: string;
}> = ({ title, amount, icon, colorClass, subtitle, subAmount, isSticky, subtitleColorClass }) => {
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  
  if (isSticky) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 flex items-center justify-between h-20 animate-fade-in">
        <div className="flex flex-col justify-center min-w-0">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate" title={formattedAmount}>{formattedAmount}</p>
          <div className="h-5 mt-0.5">
            {subtitle ? (
              <p className={`text-xs font-medium truncate ${subtitleColorClass || 'text-gray-500 dark:text-gray-400'}`}>
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        <div className={`rounded-full flex items-center justify-center p-1.5 w-7 h-7 flex-shrink-0 ${colorClass}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col p-4 h-full transform hover:scale-105 transition-transform duration-300">
        <div className="flex items-start justify-between">
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
            <div className={`rounded-full flex items-center justify-center p-2 w-8 h-8 ${colorClass}`}>
                {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4' })}
            </div>
        </div>
        
        <div className="mt-auto">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formattedAmount}
            </p>
            
            {subtitle ? (
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <p className={`text-sm font-medium ${subtitleColorClass || 'text-gray-600 dark:text-gray-400'}`}>
                        {subtitle}
                    </p>
                </div>
            ) : (
                 <div className="mt-3 pt-2 border-t border-transparent">
                    <p className="text-sm text-transparent select-none">&nbsp;</p>
                </div>
            )}
        </div>
    </div>
  );
};

const NextBillCard: React.FC<{ bill?: Transaction; isSticky?: boolean }> = ({ bill, isSticky }) => {
    const colorClass = 'bg-amber-500/20';
    const iconColor = 'text-amber-500';

    if (isSticky) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 flex items-center justify-between h-20 animate-fade-in">
                <div className="flex flex-col justify-center min-w-0">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Próximo Vencimento</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate" title={bill ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount) : 'Tudo pago!'}>
                        {bill ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount) : 'Tudo pago!'}
                    </p>
                    <div className="h-5 mt-0.5">
                        {bill ? (
                           <p className="text-xs font-medium text-amber-600 dark:text-amber-400 truncate" title={`${bill.description} em ${new Date(bill.dueDate! + 'T12:00:00').toLocaleDateString('pt-BR')}`}>
                               {bill.description} em {new Date(bill.dueDate! + 'T12:00:00').toLocaleDateString('pt-BR')}
                           </p>
                        ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-500 select-none">Sem contas pendentes</p>
                        )}
                    </div>
                </div>
                 <div className={`rounded-full flex items-center justify-center p-1.5 w-7 h-7 flex-shrink-0 ${colorClass}`}>
                    <CalendarIcon className={`h-4 w-4 ${iconColor}`} />
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col p-4 h-full transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-start justify-between">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Próximo Vencimento</p>
                <div className={`rounded-full flex items-center justify-center p-2 w-8 h-8 ${colorClass}`}>
                    <CalendarIcon className={`h-4 w-4 ${iconColor}`} />
                </div>
            </div>
            
            <div className="mt-auto">
                {bill ? (
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate" title={bill.description}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount)}
                    </p>
                ) : (
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Tudo pago!</p>
                )}
                
                 {bill ? (
                     <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                       <p className="text-sm font-medium text-amber-600 dark:text-amber-400 truncate" title={bill.description}>
                           {bill.description} em {new Date(bill.dueDate! + 'T12:00:00').toLocaleDateString('pt-BR')}
                       </p>
                    </div>
                ) : (
                    <div className="mt-3 pt-2 border-t border-transparent">
                        <p className="text-sm text-gray-400 dark:text-gray-500 select-none">Sem contas pendentes</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const Summary: React.FC<SummaryProps> = ({ totalIncome, totalExpenses, totalInvested, balance, nextBill, paidExpenses, overdueBills, isSticky }) => {
  const balanceColorClass = balance >= 0 ? 'bg-primary/20' : 'bg-danger/20';
  const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.amount, 0);
  const overdueCount = overdueBills.length;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 ${overdueCount > 0 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} transition-all duration-300 ${isSticky ? 'gap-3' : 'gap-4'}`}>
      {overdueCount > 0 && (
        <SummaryCard 
          title="Contas Vencidas" 
          amount={totalOverdue} 
          subtitle={`${overdueCount} conta(s) vencida(s)`}
          icon={<AlertTriangleIcon className="text-danger" />}
          colorClass="bg-danger/20 animate-pulse"
          isSticky={isSticky}
          subtitleColorClass="text-danger font-semibold"
        />
      )}
      <SummaryCard 
        title="Receita Total" 
        amount={totalIncome} 
        subtitle={`Recebido: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}`}
        icon={<ArrowUpIcon className="text-success" />}
        colorClass="bg-success/20"
        isSticky={isSticky}
        subtitleColorClass="text-success"
      />
      <SummaryCard 
        title="Despesa Total" 
        amount={totalExpenses} 
        subtitle={`Pago: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paidExpenses)}`}
        icon={<ArrowDownIcon className="text-danger" />}
        colorClass="bg-danger/20"
        isSticky={isSticky}
        subtitleColorClass="text-danger"
      />
      <SummaryCard 
        title="Investido" 
        amount={totalInvested} 
        icon={<DollarSignIcon className="text-blue-500" />}
        colorClass="bg-blue-500/20"
        isSticky={isSticky}
      />
      <SummaryCard 
        title="Saldo Atual" 
        amount={balance} 
        icon={<DollarSignIcon className="text-gray-500" />} 
        colorClass={balanceColorClass}
        isSticky={isSticky}
      />
      <NextBillCard bill={nextBill} isSticky={isSticky} />
    </div>
  );
};

export default Summary;
