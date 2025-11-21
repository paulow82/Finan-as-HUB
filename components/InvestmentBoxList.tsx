import React, { useMemo, useState } from 'react';
import { InvestmentBox, Transaction } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { PlusIcon } from './icons/PlusIcon';
import InvestmentBoxModal from './InvestmentBoxModal';

interface InvestmentBoxListProps {
    boxes: InvestmentBox[];
    transactions: Transaction[];
    onDeleteBox: (id: string) => void;
    onUpdateBox?: (box: InvestmentBox) => Promise<void>;
    onCreateBox?: (box: Omit<InvestmentBox, 'id'>) => Promise<InvestmentBox | null>;
}

const BoxCard: React.FC<{ box: InvestmentBox; patrimony: number; profit: number; onDelete: () => void; onEdit: () => void }> = ({ box, patrimony, profit, onDelete, onEdit }) => {
    const progress = box.targetAmount ? Math.min((patrimony / box.targetAmount) * 100, 100) : 0;
    const percentageDisplay = box.targetAmount ? ((patrimony / box.targetAmount) * 100).toFixed(0) : '0';
    
    const formattedPatrimony = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patrimony);
    const formattedTarget = box.targetAmount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(box.targetAmount) : null;

    const handleDeleteClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onDelete(); };
    const handleEditClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onEdit(); };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 relative group transition-all hover:shadow-lg hover:border-primary/30 flex flex-col justify-between h-full min-h-[150px] animate-fade-in">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                        <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0 ring-2 ring-white dark:ring-gray-700" style={{ backgroundColor: box.color || '#10b981' }}></div>
                        <h3 className="font-bold text-gray-800 dark:text-white truncate text-sm sm:text-base" title={box.name}>{box.name}</h3>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg -mr-1 -mt-1 p-0.5">
                        <button type="button" onClick={handleEditClick} className="p-1.5 text-gray-500 hover:text-primary transition-colors" title="Configurar"> <PencilIcon className="w-4 h-4" /> </button>
                        <button type="button" onClick={handleDeleteClick} className="p-1.5 text-gray-500 hover:text-danger transition-colors" title="Excluir"> <TrashIcon className="w-4 h-4" /> </button>
                    </div>
                </div>
                
                <div className="mb-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white truncate" title={formattedPatrimony}>{formattedPatrimony}</p>
                    <div className="flex flex-wrap gap-2 text-xs mt-1">
                        {(box.interestRate || profit > 0.005) && (
                            <div className="inline-flex items-center text-xs font-medium border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                                {box.interestRate && (
                                    <span className="px-2 py-0.5 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        +{box.interestRate}% a.a.
                                    </span>
                                )}
                                {profit > 0.005 && (
                                     <span className="px-2 py-0.5 text-gray-600 dark:text-gray-300">
                                        + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit)} (Juros)
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {box.targetAmount && box.targetAmount > 0 ? (
                <div className="mt-auto">
                    <div className="flex justify-between items-end text-xs mb-1.5">
                        <span className="text-gray-500 dark:text-gray-400">Meta: {formattedTarget}</span>
                        <span className="font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs border border-gray-200 dark:border-gray-600"> {percentageDisplay}% </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-900 rounded-full h-2.5 overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%`, backgroundColor: box.color || '#10b981' }} ></div>
                    </div>
                </div>
            ) : (
                 <div className="mt-auto pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                     <p className="text-xs text-gray-400 italic text-center">Sem meta definida</p>
                 </div>
            )}
        </div>
    );
};

const InvestmentBoxList: React.FC<InvestmentBoxListProps> = ({ boxes, transactions, onDeleteBox, onUpdateBox, onCreateBox }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [boxToEdit, setBoxToEdit] = useState<InvestmentBox | null>(null);

    const detailedBalances = useMemo(() => {
        const result: Record<string, { patrimony: number; profit: number }> = {};

        boxes.forEach(box => {
            const boxTransactions = transactions.filter(t => t.investmentBoxId === box.id);
            if (boxTransactions.length === 0) {
                result[box.id] = { patrimony: 0, profit: 0 };
                return;
            }

            const firstDate = boxTransactions.reduce((earliest, current) => 
                current.date < earliest ? current.date : earliest, 
                new Date()
            );

            const annualInterestRate = (box.interestRate || 0) / 100;
            const dailyInterestRate = Math.pow(1 + annualInterestRate, 1 / 365) - 1;

            const flowsByDate: Record<string, number> = {};
            boxTransactions.forEach(t => {
                const dateKey = new Date(t.date.getFullYear(), t.date.getMonth(), t.date.getDate()).toISOString().split('T')[0];
                const amount = t.type === 'expense' ? t.amount : -t.amount;
                flowsByDate[dateKey] = (flowsByDate[dateKey] || 0) + amount;
            });
            
            let cursorDate = new Date(firstDate);
            cursorDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let currentPatrimony = 0;
            let currentPrincipal = 0;

            while (cursorDate <= today) {
                if (currentPatrimony > 0) {
                    currentPatrimony *= (1 + dailyInterestRate);
                }

                const dateKey = cursorDate.toISOString().split('T')[0];
                const dailyFlow = flowsByDate[dateKey] || 0;

                currentPatrimony += dailyFlow;
                currentPrincipal += dailyFlow;

                cursorDate.setDate(cursorDate.getDate() + 1);
            }
            
            result[box.id] = {
                patrimony: currentPatrimony,
                profit: currentPatrimony - currentPrincipal
            };
        });

        return result;
    }, [boxes, transactions]);

    const handleEdit = (box: InvestmentBox) => { setBoxToEdit(box); setIsModalOpen(true); };
    const handleCreate = () => { setBoxToEdit(null); setIsModalOpen(true); };
    const handleSaveBox = async (boxData: InvestmentBox | Omit<InvestmentBox, 'id'>) => { if ('id' in boxData && onUpdateBox) { await onUpdateBox(boxData); } else if (onCreateBox) { await onCreateBox(boxData as Omit<InvestmentBox, 'id'>); } };

    return (
        <div className="h-full flex flex-col relative">
             <div className="mb-4 px-1 flex-shrink-0">
                <button type="button" onClick={handleCreate} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-semibold" >
                    <PlusIcon className="w-5 h-5" /> Nova Caixinha
                </button>
             </div>

             {boxes.length === 0 ? (
                 <div className="flex-grow flex flex-col items-center justify-center text-center p-4 opacity-60"> <p className="text-sm text-gray-500 dark:text-gray-400">Crie caixinhas para organizar seus investimentos.</p> </div>
             ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 overflow-y-auto pr-2 pb-2 custom-scrollbar w-full">
                    {boxes.map(box => {
                        const data = detailedBalances[box.id] || { patrimony: 0, profit: 0 };
                        return (
                            <BoxCard 
                                key={box.id} 
                                box={box} 
                                patrimony={data.patrimony} 
                                profit={data.profit}
                                onDelete={() => onDeleteBox(box.id)} 
                                onEdit={() => handleEdit(box)} 
                            />
                        )
                    })}
                </div>
             )}

             {isModalOpen && ( <InvestmentBoxModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveBox} boxToEdit={boxToEdit} /> )}
        </div>
    );
};

export default InvestmentBoxList;