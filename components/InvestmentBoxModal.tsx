
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { InvestmentBox } from '../types';

interface InvestmentBoxModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (box: Omit<InvestmentBox, 'id'> | InvestmentBox) => Promise<void>;
    boxToEdit?: InvestmentBox | null;
}

const InvestmentBoxModal: React.FC<InvestmentBoxModalProps> = ({ isOpen, onClose, onSave, boxToEdit }) => {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#10b981');
    const [interestRate, setInterestRate] = useState('');
    const [taxRate, setTaxRate] = useState('');

    useEffect(() => {
        if (boxToEdit) {
            setName(boxToEdit.name);
            setTargetAmount(boxToEdit.targetAmount?.toString() || '');
            setDescription(boxToEdit.description || '');
            setColor(boxToEdit.color || '#10b981');
            setInterestRate(boxToEdit.interestRate?.toString() || '');
            setTaxRate(boxToEdit.taxRate?.toString() || '');
        } else {
            // Reset for creation
            setName('');
            setTargetAmount('');
            setDescription('');
            setColor('#10b981');
            setInterestRate('');
            setTaxRate('');
        }
    }, [boxToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        const boxData = {
            ...(boxToEdit ? { id: boxToEdit.id } : {}),
            name,
            description,
            targetAmount: targetAmount ? parseFloat(targetAmount) : undefined,
            color,
            interestRate: interestRate ? parseFloat(interestRate) : undefined,
            taxRate: taxRate ? parseFloat(taxRate) : undefined,
        };

        await onSave(boxData as any);
        onClose();
    };

    const inputBaseClasses = "mt-1 block w-full h-12 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 text-base transition-shadow shadow-sm";

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10 animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 backdrop-blur-md z-20">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {boxToEdit ? 'Configurar Caixinha' : 'Nova Caixinha de Investimento'}
                    </h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Nome da Caixinha</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Reserva de Emergência" className={inputBaseClasses} required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Meta Financeira (Opcional)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                                <input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0,00" className={`${inputBaseClasses} pl-10`} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Rendimento (% a.a.)</label>
                                <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="Ex: 12" step="0.01" className={inputBaseClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Impostos/Taxas (%)</label>
                                <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} placeholder="Ex: 15" step="0.01" className={inputBaseClasses} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Descrição (Opcional)</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Dinheiro para imprevistos..." className={inputBaseClasses} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">Cor da Identificação</label>
                            <div className="flex flex-wrap gap-3">
                                {['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'].map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-10 h-10 rounded-full border-2 transition-transform ${color === c ? 'border-gray-600 dark:border-white scale-110 ring-2 ring-offset-2 ring-gray-300 dark:ring-offset-gray-800' : 'border-transparent hover:scale-105'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-200 dark:border-gray-700 sticky bottom-0 backdrop-blur-md z-20">
                        <button type="button" onClick={onClose} className="h-11 px-6 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                        <button type="submit" className="h-11 px-6 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20">
                            {boxToEdit ? 'Salvar Alterações' : 'Criar Caixinha'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default InvestmentBoxModal;
