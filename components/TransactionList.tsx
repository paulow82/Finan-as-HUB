import React from 'react';
import { Transaction } from '../types';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-success' : 'text-danger';
  const Icon = isIncome ? ArrowUpIcon : ArrowDownIcon;
  const iconBg = isIncome ? 'bg-success/20' : 'bg-danger/20';

  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount);

  return (
    <li className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${iconBg}`}>
          <Icon className={`w-5 h-5 ${amountColor}`} />
        </div>
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-200">{transaction.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category}</p>
        </div>
      </div>
      <p className={`font-bold ${amountColor}`}>{formattedAmount}</p>
    </li>
  );
};

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  return (
    <div className="h-full flex flex-col">
      {transactions.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto flex-grow">
          {transactions.map(t => <TransactionItem key={t.id} transaction={t} />)}
        </ul>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma transação registrada ainda.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;