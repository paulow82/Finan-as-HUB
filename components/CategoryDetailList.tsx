import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Transaction, InvestmentBox } from '../types';
import { CalendarIcon } from './icons/CalendarIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { DragHandleIcon } from './icons/DragHandleIcon';
import { RepeatIcon } from './icons/RepeatIcon';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface CategoryDetailListProps {
  transactions: Transaction[];
  investmentBoxes?: InvestmentBox[];
  onTogglePaid?: (id: string, newStatus: boolean) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  onReorder?: (reorderedTransactions: Transaction[], listKey: string) => void;
  listKey: string;
}

const CategoryItem: React.FC<{
    transaction: Transaction;
    investmentBoxes?: InvestmentBox[];
    onTogglePaid?: (id: string, newStatus: boolean) => void;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
}> = ({ transaction, investmentBoxes, onTogglePaid, onEdit, onDelete }) => {
  
  const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = transaction.dueDate && !transaction.paid && new Date(transaction.dueDate + 'T12:00:00') < today;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique acione a edição
    if (onDelete) {
        onDelete(transaction);
    }
  }

  const handleEditClick = () => {
      if (onEdit) onEdit(transaction);
  }
  
  const InstallmentBadge = () => {
      if (transaction.installmentsCurrent && transaction.installmentsTotal) {
          return (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 ml-2" title={`Parcela ${transaction.installmentsCurrent} de ${transaction.installmentsTotal}`}>
                  {transaction.installmentsCurrent}/{transaction.installmentsTotal}
              </span>
          );
      }
      return null;
  };

  // Lógica específica para transações de investimento
  if (transaction.expenseType === 'investment' || transaction.incomeType === 'investment') {
    const isAporte = transaction.type === 'expense';
    const box = investmentBoxes?.find(b => b.id === transaction.investmentBoxId);
    const displayName = box ? box.name : (transaction.description || 'Investimento');
    const investmentCategory = transaction.category;
    const formattedDate = transaction.date.toLocaleDateString('pt-BR');

    return (
      <>
        <span className="p-1 cursor-grab text-gray-300 dark:text-gray-600 group-hover:text-gray-500">
            <DragHandleIcon className="w-5 h-5" />
        </span>
        <div
            onClick={onEdit ? handleEditClick : undefined}
            className={`w-full flex-grow flex items-center justify-between text-left py-1 sm:py-2 px-2 rounded-lg group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50 ${onEdit ? 'cursor-pointer' : 'cursor-default'}`}
        >
            <div className="flex items-center gap-1.5 min-w-0">
                <div className={`p-1.5 rounded-full flex-shrink-0 ${isAporte ? 'bg-success/10' : 'bg-danger/10'}`}>
                    {isAporte ? <ArrowUpIcon className="w-4 h-4 text-success" /> : <ArrowDownIcon className="w-4 h-4 text-danger" />}
                </div>
                <div className="flex-grow min-w-0">
                    <div className="flex items-center">
                        <p className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200 truncate" title={displayName}>{displayName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        <span>{investmentCategory}</span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="flex items-center gap-1" title="Data do registro">
                            <CalendarIcon className="w-3 h-3" />
                            {formattedDate}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <p className={`font-bold text-sm sm:text-base ${isAporte ? 'text-success' : 'text-danger'}`}>{isAporte ? '+' : '-'} {formattedAmount}</p>
                 {transaction.recurrenceId && !transaction.installmentsTotal && (
                    <span title="Transação Recorrente" className="flex items-center">
                        <RepeatIcon className="w-4 h-4 text-blue-500" />
                    </span>
                )}
                {onDelete && (
                    <button type="button" onClick={handleDeleteClick} className="p-1 text-gray-500 hover:text-danger z-10 relative rounded-full hover:bg-red-100 dark:hover:bg-red-900/40">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
      </>
    );
  }

  // Lógica padrão para outras transações
  const isIncome = transaction.type === 'income';

  return (
    <>
        <span className="p-1 cursor-grab text-gray-300 dark:text-gray-600 group-hover:text-gray-500">
            <DragHandleIcon className="w-5 h-5" />
        </span>
        <div
            onClick={onEdit ? handleEditClick : undefined}
            className={`w-full flex-grow flex items-center justify-between text-left py-1 sm:py-2.5 px-2 rounded-lg ${onEdit ? 'cursor-pointer' : 'cursor-default'} ${!isOverdue && 'group-hover:bg-gray-50 dark:group-hover:bg-gray-700/50'}`}
        >
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                {onTogglePaid && !isIncome && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onTogglePaid) onTogglePaid(transaction.id, !transaction.paid);
                        }}
                        className={`relative inline-flex flex-shrink-0 h-5 w-9 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-primary z-10 ${
                            transaction.paid ? 'bg-success' : 'bg-gray-200 dark:bg-gray-600'
                        }`}
                        aria-pressed={!!transaction.paid}
                        aria-label={transaction.paid ? 'Marcar como não pago' : 'Marcar como pago'}
                    >
                        <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transform ring-0 transition ease-in-out duration-200 ${ transaction.paid ? 'translate-x-4' : 'translate-x-0' }`} />
                    </button>
                )}
                {isIncome && (
                    <div className="p-2 rounded-full bg-success/10 flex-shrink-0">
                        <ArrowUpIcon className="w-4 h-4 text-success" />
                    </div>
                )}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200 truncate max-w-[150px] sm:max-w-[200px]" title={transaction.description}>{transaction.description}</p>
                      <InstallmentBadge />
                      {transaction.attachmentUrl && (
                          <a href={transaction.attachmentUrl} target="_blank" rel="noopener noreferrer" title="Ver anexo" onClick={e => e.stopPropagation()}>
                              <PaperclipIcon className="w-4 h-4 text-gray-400 hover:text-primary transition-colors" />
                          </a>
                      )}
                  </div>
                  {transaction.dueDate && (
                      <p className={`text-xs sm:text-sm flex items-center gap-1 ${isOverdue ? 'text-danger font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isOverdue && <AlertTriangleIcon className="w-3.5 h-3.5" />}
                        {isOverdue ? 'Venceu em:' : 'Vence em:'} {new Date(transaction.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                  )}
                </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <p className={`font-bold text-sm sm:text-base ${isIncome ? 'text-success' : (isOverdue ? 'text-danger' : 'text-gray-800 dark:text-gray-200')}`}>{formattedAmount}</p>
                {transaction.recurrenceId && !transaction.installmentsTotal && (
                    <span title="Transação Recorrente" className="flex items-center">
                        <RepeatIcon className="w-4 h-4 text-blue-500" />
                    </span>
                )}
                {onDelete && (
                    <button type="button" onClick={handleDeleteClick} className="p-1 text-gray-500 hover:text-danger z-10 relative rounded-full hover:bg-red-100 dark:hover:bg-red-900/40">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
          </div>
        </div>
    </>
  );
}

const CategoryDetailList: React.FC<CategoryDetailListProps> = ({ transactions, investmentBoxes, onTogglePaid, onEdit, onDelete, onReorder, listKey }) => {
  const [items, setItems] = useState(transactions);

  useEffect(() => {
    setItems(transactions);
  }, [transactions]);
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    setItems(reorderedItems); // Atualiza o estado local para feedback visual imediato

    if (onReorder) {
      onReorder(reorderedItems, listKey); // Propaga a mudança para o componente pai para persistência
    }
  };
  
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {items.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={listKey} ignoreContainerClipping={true}>
                {(provided) => (
                    <ul {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto flex-grow -mr-3 pr-2 custom-scrollbar min-h-0">
                        {items.map((t, index) => (
                            <Draggable key={t.id} draggableId={t.id} index={index}>
                                {(provided, snapshot) => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const isOverdue = t.dueDate && !t.paid && new Date(t.dueDate + 'T12:00:00') < today;
                                    const isInvestment = t.expenseType === 'investment' || t.incomeType === 'investment';
                                    const liClassName = `flex items-center group w-full ${!isInvestment && isOverdue ? 'bg-danger/10 dark:bg-danger/20 rounded-lg' : ''}`;

                                    const item = (
                                        <li
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={liClassName}
                                            style={provided.draggableProps.style}
                                        >
                                            <CategoryItem 
                                            transaction={t} 
                                            investmentBoxes={investmentBoxes} 
                                            onTogglePaid={onTogglePaid} 
                                            onEdit={onEdit} 
                                            onDelete={onDelete} 
                                            />
                                        </li>
                                    );
                                    
                                    if (snapshot.isDragging) {
                                        const isDarkMode = document.documentElement.classList.contains('dark');
                                        const style = {
                                            ...provided.draggableProps.style,
                                            background: isDarkMode ? '#1f2937' : '#ffffff',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                            borderRadius: '0.5rem',
                                            padding: '0 0.25rem', // Adiciona padding para o conteúdo não colar nas bordas
                                        };
                                        const portalItem = (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={liClassName}
                                                style={style}
                                            >
                                                <CategoryItem 
                                                    transaction={t} 
                                                    investmentBoxes={investmentBoxes} 
                                                    onTogglePaid={onTogglePaid} 
                                                    onEdit={onEdit} 
                                                    onDelete={onDelete} 
                                                />
                                            </li>
                                        );
                                        return createPortal(portalItem, document.body);
                                    }

                                    return item;
                                }}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </ul>
                )}
            </Droppable>
        </DragDropContext>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400 text-center text-sm py-4">Nenhuma transação nesta categoria para o mês.</p>
        </div>
      )}
    </div>
  );
};

export default CategoryDetailList;