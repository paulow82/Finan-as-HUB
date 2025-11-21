
import React from 'react';
import { Transaction, InvestmentBox } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

interface CategoryDetailListProps {
  transactions: Transaction[];
  investmentBoxes?: InvestmentBox[]; // Tornou-se opcional para os outros cards
  onTogglePaid?: (id: string, newStatus: boolean) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string, recurrenceId?: string) => void;
}

const CategoryItem: React.FC<{
    transaction: Transaction;
    investmentBoxes?: InvestmentBox[];
    onTogglePaid?: (id: string, newStatus: boolean) => void;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (id: string, recurrenceId?: string) => void;
}> = ({ transaction, investmentBoxes, onTogglePaid, onEdit, onDelete }) => {
  
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = transaction.dueDate && !transaction.paid && new Date(transaction.dueDate + 'T12:00:00') < today;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
        onDelete(transaction.id, transaction.recurrenceId);
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onEdit) onEdit(transaction);
  }

  // Lógica específica para transações de investimento
  if (transaction.expenseType === 'investment' || transaction.incomeType === 'investment') {
    const isAporte = transaction.type === 'expense';
    const box = investmentBoxes?.find(b => b.id === transaction.investmentBoxId);
    // Use the box name if available, otherwise fallback to description
    const displayName = box ? box.name : (transaction.description || 'Investimento');
    const investmentCategory = transaction.category;
    const amountColor = isAporte ? 'text-success' : 'text-danger';
    const formattedDate = transaction.date.toLocaleDateString('pt-BR');

    return (
      <li className="flex items-center justify-between py-2.5 px-2 rounded-lg group hover:bg-gray-50 dark:hover:bg-gray-700/50 animate-fade-in">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-full flex-shrink-0 ${isAporte ? 'bg-success/10' : 'bg-danger/10'}`}>
            {isAporte ? <ArrowUpIcon className="w-4 h-4 text-success" /> : <ArrowDownIcon className="w-4 h-4 text-danger" />}
          </div>
          <div className="flex-grow min-w-0">
            <p className="font-semibold text-gray-800 dark:text-gray-200 truncate" title={displayName}>{displayName}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{investmentCategory}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="flex items-center gap-1" title="Data do registro">
                    <CalendarIcon className="w-3 h-3" />
                    {formattedDate}
                </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <p className={`font-bold text-sm ${amountColor}`}>{isAporte ? '+' : '-'} {formattedAmount}</p>
          <div className="flex gap-2">
            <button type="button" onClick={handleEdit} className="text-gray-500 hover:text-primary"><PencilIcon className="w-4 h-4" /></button>
            <button type="button" onClick={handleDelete} className="text-gray-500 hover:text-danger"><TrashIcon className="w-4 h-4" /></button>
          </div>
        </div>
      </li>
    );
  }

  // Lógica padrão para outras transações
  const isIncome = transaction.type === 'income';

  return (
    <li className={`flex items-center justify-between py-2.5 px-2 rounded-lg group transition-colors duration-200 ${isOverdue ? 'bg-danger/10 dark:bg-danger/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} animate-fade-in`}>
        <div className="flex items-center gap-3 min-w-0">
            {onTogglePaid && !isIncome && (
                 <input
                    type="checkbox"
                    checked={!!transaction.paid}
                    onChange={(e) => onTogglePaid(transaction.id, e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer flex-shrink-0"
                />
            )}
            {isIncome && (
                <div className="p-2 rounded-full bg-success/10 flex-shrink-0">
                    <ArrowUpIcon className="w-4 h-4 text-success" />
                </div>
            )}
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 truncate" title={transaction.description}>{transaction.description}</p>
                  {transaction.attachmentUrl && (
                      <a href={transaction.attachmentUrl} target="_blank" rel="noopener noreferrer" title="Ver anexo">
                          <PaperclipIcon className="w-4 h-4 text-gray-400 hover:text-primary transition-colors" />
                      </a>
                  )}
              </div>
              {transaction.dueDate && (
                  <p className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-danger font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isOverdue && <AlertTriangleIcon className="w-3.5 h-3.5" />}
                    {isOverdue ? 'Venceu em:' : 'Vence em:'} {new Date(transaction.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
              )}
            </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
            <p className={`font-bold text-sm ${isIncome ? 'text-success' : (isOverdue ? 'text-danger' : 'text-gray-800 dark:text-gray-200')}`}>{formattedAmount}</p>
            <div className="flex gap-2">
                <button type="button" onClick={handleEdit} className="text-gray-500 hover:text-primary"><PencilIcon className="w-4 h-4" /></button>
                <button type="button" onClick={handleDelete} className="text-gray-500 hover:text-danger"><TrashIcon className="w-4 h-4" /></button>
            </div>
      </div>
    </li>
  );
}

const CategoryDetailList: React.FC<CategoryDetailListProps> = ({ transactions, investmentBoxes, onTogglePaid, onEdit, onDelete }) => {
  return (
    <div className="h-full flex flex-col">
      {transactions.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto flex-grow -mr-3 pr-2 custom-scrollbar">
          {transactions.map(t => <CategoryItem key={t.id} transaction={t} investmentBoxes={investmentBoxes} onTogglePaid={onTogglePaid} onEdit={onEdit} onDelete={onDelete} />)}
        </ul>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm py-4">Nenhuma transação nesta categoria para o mês.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryDetailList;
