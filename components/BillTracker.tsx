import React from 'react';
import { Transaction } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { RepeatIcon } from './icons/RepeatIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';

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
  const dueDate = new Date(bill.dueDate! + 'T00:00:00');
  const isOverdue = dueDate < today && !bill.paid;

  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amount);
  const formattedDate = dueDate.toLocaleDateString('pt-BR');

  const handleDelete = () => {
    if (bill.recurrenceId) {
        if (window.confirm("Esta é uma transação recorrente. Excluir todas as futuras também?")) {
            onDelete(bill.id, bill.recurrenceId, true);
        } else {
             onDelete(bill.id);
        }
    } else {
        onDelete(bill.id);
    }
  }

  return (
    <li className={`flex items-center justify-between py-3 px-3 rounded-lg group hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
      <div className="flex items-center gap-4">
         <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onTogglePaid(bill.id, !bill.paid);
            }}
            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-primary z-10 ${
                bill.paid ? 'bg-success' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            title={bill.paid ? 'Marcar como não pago' : 'Marcar como pago'}
        >
            <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform ring-0 transition ease-in-out duration-200 ${ bill.paid ? 'translate-x-5' : 'translate-x-0' }`} />
        </button>
        <div className="min-w-0">
          <p className={`font-semibold text-gray-800 dark:text-gray-200 truncate ${bill.paid ? 'line-through opacity-60' : ''}`}>{bill.description}</p>
          <p className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-danger font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
            {isOverdue ? <AlertTriangleIcon className="w-3 h-3"/> : <CalendarIcon className="w-3 h-3" />}
            {isOverdue ? 'Venceu em ' : 'Vence: '} {formattedDate}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
             <p className={`font-bold ${isOverdue ? 'text-danger' : 'text-gray-800 dark:text-gray-200'} ${bill.paid ? 'opacity-60' : ''}`}>{formattedAmount}</p>
             {bill.recurrenceId && !bill.installmentsTotal && (
                <div className="flex justify-end mt-0.5" title="Recorrente mensal">
                    <RepeatIcon className="w-3.5 h-3.5 text-blue-500" />
                </div>
             )}
             {bill.installmentsCurrent && (
                 <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 font-medium">
                     {bill.installmentsCurrent}/{bill.installmentsTotal}
                 </span>
             )}
        </div>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button onClick={() => onEdit(bill)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"><PencilIcon className="w-4 h-4" /></button>
            <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"><TrashIcon className="w-4 h-4" /></button>
        </div>
      </div>
    </li>
  );
}

const BillTracker: React.FC<BillTrackerProps> = ({ bills, onTogglePaid, onEdit, onDelete }) => {
  return (
    <div className="h-full flex flex-col">
      {bills.length > 0 ? (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700/50 overflow-y-auto flex-grow custom-scrollbar pr-1">
          {bills.map(bill => <BillItem key={bill.id} bill={bill} onTogglePaid={onTogglePaid} onEdit={onEdit} onDelete={onDelete} />)}
        </ul>
      ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
             <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                 <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
             </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Tudo pago!</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Nenhuma conta pendente para este mês.</p>
        </div>
      )}
    </div>
  );
};

export default BillTracker;