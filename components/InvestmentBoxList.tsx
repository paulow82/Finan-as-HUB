import React, { useMemo, useState } from 'react';
import { InvestmentBox, Transaction } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { PlusIcon } from './icons/PlusIcon';
import InvestmentBoxModal from './InvestmentBoxModal';

interface InvestmentBoxListProps {
    boxes: InvestmentBox[];
    onDeleteBox: (id: string) => void;
    onUpdateBox?: (box: InvestmentBox) => Promise<void>;
    onCreateBox?: (box: Omit<InvestmentBox, 'id'>) => Promise<InvestmentBox | null>;
    detailedBalances: Record<string, { patrimony: number; profit: number }>;
}

const BoxCard: React.FC<{ box: InvestmentBox; patrimony: number; profit: number; onDelete: () => void; onEdit: () => void }> = ({ box, patrimony, profit, onDelete, onEdit }) => {
    const progress = box.targetAmount ? Math.min((patrimony / box.targetAmount) * 100, 100) : 0;
    const percentageDisplay = box.targetAmount ? ((patrimony / box.targetAmount) * 100).toFixed(0) : '0';
    
    const formattedPatrimony = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patrimony);
    const formattedTarget = box.targetAmount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(box.targetAmount) : null;

    const handleDeleteClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onDelete(); };
    const handleEditClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onEdit(); };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 relative group transition-all hover:shadow-lg hover:border-primary/30 flex flex-col justify-between min-h-[160px] animate-fade-in">
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
                    <div className="flex flex-wrap gap-1.5 text-xs mt-1.5">
                        {box.interestRate ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded border font-medium text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
                                +{box.interestRate}% a.a.
                            </span>
                        ) : null}
                        {profit > 0.005 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded border font-medium text-gray-600 bg-gray-100 border-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600">
                                + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit)} (Juros)
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            {box.targetAmount && box.targetAmount > 0 ? (
                <div className="mt-auto">
                    <div className="flex justify-between items-end text-xs mb-1.5 gap-2">
                        <span className="text-gray-500 dark:text-gray-400 truncate" title={`Meta: ${formattedTarget}`}>Meta: {formattedTarget}</span>
                        <span className="font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs border border-gray-200 dark:border-gray-600 flex-shrink-0"> {percentageDisplay}% </span>
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

const InvestmentBoxList: React.FC<InvestmentBoxListProps> = ({ boxes, onDeleteBox, onUpdateBox, onCreateBox, detailedBalances }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [boxToEdit, setBoxToEdit] = useState<InvestmentBox | null>(null);

    const handleEdit = (box: InvestmentBox) => { setBoxToEdit(box); setIsModalOpen(true); };
    const handleCreate = () => { setBoxToEdit(null); setIsModalOpen(true); };
    const handleSaveBox = async (boxData: InvestmentBox | Omit<InvestmentBox, 'id'>) => { if ('id' in boxData && onUpdateBox) { await onUpdateBox(boxData); } else if (onCreateBox) { await onCreateBox(boxData as Omit<InvestmentBox, 'id'>); } };

    return (
        <div className="flex-1 flex flex-col relative min-h-0">
             <div className="mb-4 px-1 flex-shrink-0">
                <button type="button" onClick={handleCreate} className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-semibold" >
                    <PlusIcon className="w-5 h-5" /> Nova Caixinha
                </button>
             </div>

             {boxes.length === 0 ? (
                 <div className="flex-grow flex flex-col items-center justify-center text-center p-4 opacity-60"> <p className="text-sm text-gray-500 dark:text-gray-400">Crie caixinhas para organizar seus investimentos.</p> </div>
             ) : (
                <div className="flex-1 min-h-0 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] auto-rows-max gap-4 overflow-y-auto overflow-x-hidden pr-2 pb-2 custom-scrollbar w-full">
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