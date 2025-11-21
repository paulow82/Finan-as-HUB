import React from 'react';
import { Transaction } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface BillTrackerProps {
  bills: Transaction[];
  onTogglePaid: (id: string, newStatus: boolean) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string, recurrenceId?: string, applyToFuture?: boolean) => void;
}

const BillItem: React.FC<{ 
    bill: Transaction; 
    onTogglePaid: (id: string, newStatus: boolean) => void;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string, recurrenceId?: string, applyToFuture?: boolean) => void;
}> = ({ bill, onTogglePaid, onEdit, onDelete }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(bill.dueDate!);
  const isOverdue = dueDate < today;

  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount);
  const formattedDate = dueDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  const handleDelete = () => {
    if (bill.recurrenceId) {
        if (window.confirm("Esta é uma transação recorrente. Deseja excluir apenas esta ou esta e todas as futuras? \nOK para esta e futuras, Cancelar para apenas esta.")) {
            onDelete(bill.id, bill.recurrenceId, true);
        } else {
             onDelete(bill.id);
        }
    } else {
        onDelete(bill.id);
    }
  }

  return (
    <li className={`flex items-center justify-between py-3 px-2 rounded-lg group hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isOverdue ? 'bg-danger/10' : ''}`}>
      <div className="flex items-center gap-3">
        <input
            type="checkbox"
            checked={!!bill.paid}
            onChange={(e) => onTogglePaid(bill.id, e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
        />
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-200">{bill.description}</p>
          <p className={`text-sm flex items-center gap-1 ${isOverdue ? 'text-danger font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
            <CalendarIcon className="w-4 h-4" />
            Vence em: {formattedDate}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className={`font-bold ${isOverdue ? 'text-danger' : 'text-gray-800 dark:text-gray-200'}`}>{formattedAmount}</p>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button onClick={() => onEdit(bill)} className="text-gray-500 hover:text-primary"><PencilIcon className="w-5 h-5" /></button>
            <button onClick={handleDelete} className="text-gray-500 hover:text-danger"><TrashIcon className="w-5 h-5" /></button>
        </div>
      </div>
    </li>
  );
}

const BillTracker: React.FC<BillTrackerProps> = ({ bills, onTogglePaid, onEdit, onDelete }) => {
  return (
    <div className="h-full flex flex-col">
      {bills.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto flex-grow">
          {bills.map(bill => <BillItem key={bill.id} bill={bill} onTogglePaid={onTogglePaid} onEdit={onEdit} onDelete={onDelete} />)}
        </ul>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhuma conta pendente para este mês. Bom trabalho!</p>
        </div>
      )}
    </div>
  );
};

export default BillTracker;