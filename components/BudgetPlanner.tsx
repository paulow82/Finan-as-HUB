import React, { useMemo } from 'react';
import { Transaction, ExpenseType } from '../types';

interface BudgetPlannerProps {
  transactions: Transaction[];
  goals: {
    fixed: number;
    variable: number;
    leisure: number;
    investment: number;
  }
}

const budgetMetadata: Record<ExpenseType, { name: string; color: string }> = {
  fixed: { name: 'Fixos', color: 'bg-blue-500' },
  variable: { name: 'Variáveis', color: 'bg-purple-500' },
  leisure: { name: 'Lazer', color: 'bg-pink-500' },
  investment: { name: 'Investimentos', color: 'bg-emerald-500' },
};

const BudgetItem: React.FC<{
  label: string;
  percentage: number;
  value: number;
  goal: number;
  color: string;
}> = ({ label, percentage, value, goal, color }) => {
    const isOverBudget = percentage > goal;
    // A barra agora reflete a porcentagem do gasto em relação à meta.
    // Ex: Se a meta é 20% e você gastou 10%, a barra fica em 50%.
    const widthPercentage = Math.min((percentage / goal) * 100, 100);

    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
                <span className={`text-sm font-bold ${isOverBudget ? 'text-danger' : 'text-gray-500 dark:text-gray-400'}`}>
                    {percentage.toFixed(1)}% de {goal}%
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                    className={`${color} h-2.5 rounded-full`} 
                    style={{ width: `${widthPercentage}%` }}
                    title={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                ></div>
            </div>
        </div>
    )
}

const BudgetPlanner: React.FC<BudgetPlannerProps> = ({ transactions, goals }) => {
  const { totals, totalIncome, hasExpenses } = useMemo(() => {
    const totals: Record<ExpenseType, number> = { fixed: 0, variable: 0, leisure: 0, investment: 0 };
    
    const expenseTransactions = transactions.filter(t => t.type === 'expense' && t.expenseType);
    const hasExpenses = expenseTransactions.length > 0;

    // Calcula o total de receitas (ganhos) do mês
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    expenseTransactions.forEach(t => {
      if (t.expenseType) {
        totals[t.expenseType] += t.amount;
      }
    });

    return { totals, totalIncome, hasExpenses };
  }, [transactions]);
  
  if (!hasExpenses) {
      return (
        <div className="flex-1 min-h-0 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Adicione despesas para ver seu planejamento.</p>
        </div>
      )
  }

  return (
    <div className="space-y-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
      {(Object.keys(goals) as ExpenseType[]).map((key) => {
          const { name, color } = budgetMetadata[key];
          const goal = goals[key];
          const value = totals[key];
          // **CORREÇÃO APLICADA AQUI**
          // A base do cálculo agora é o total de receitas (totalIncome)
          const percentage = totalIncome > 0 ? (value / totalIncome) * 100 : 0;
          
          return (
              <BudgetItem 
                  key={key}
                  label={name}
                  value={value}
                  percentage={percentage}
                  goal={goal}
                  color={color}
              />
          );
      })}
    </div>
  );
};

export default BudgetPlanner;