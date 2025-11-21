
import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionModalMode, ExpenseType, IncomeType, InvestmentBox, AppSettings } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import InvestmentBoxModal from './InvestmentBoxModal';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { TrashIcon } from './icons/TrashIcon';
// FIX: Added missing import for PencilIcon
import { PencilIcon } from './icons/PencilIcon';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>, isRecurring: boolean, attachment: File | null) => void;
  onUpdateTransaction: (transaction: Transaction, attachment: File | null, removeAttachment: boolean) => void;
  transactionToEdit: Transaction | null;
  quickAddData?: any;
  selectedMonth: Date;
  investmentBoxes: InvestmentBox[];
  onCreateBox: (box: Omit<InvestmentBox, 'id'>) => Promise<InvestmentBox | null>;
  settings: AppSettings;
}


const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ 
    isOpen, onClose, onAddTransaction, onUpdateTransaction, transactionToEdit, quickAddData,
    investmentBoxes, onCreateBox, settings
}) => {
  const [mode, setMode] = useState<TransactionModalMode>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(''); 
  const [category, setCategory] = useState('');
  const [expenseType, setExpenseType] = useState<ExpenseType>('fixed');
  const [incomeType, setIncomeType] = useState<IncomeType>('fixed');
  const [investmentOperation, setInvestmentOperation] = useState<'contribution' | 'redemption'>('contribution');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedBoxId, setSelectedBoxId] = useState<string>('');
  
  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);

  const [attachment, setAttachment] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  
  const getCategories = useCallback(() => {
    const cats = settings.categories;
    if (mode === 'income') return cats.INCOME[incomeType] || [];
    if (mode === 'investment') {
        if (investmentOperation === 'contribution') return cats.EXPENSE.investment || [];
        return cats.INCOME.investment || [];
    }
    return cats.EXPENSE[expenseType] || [];
  }, [mode, expenseType, incomeType, investmentOperation, settings.categories]);
  
  const resetForm = useCallback(() => {
    setDescription(''); setAmount(''); setDueDate(''); setIsRecurring(false); setMode('expense'); setExpenseType('fixed'); setIncomeType('fixed'); setInvestmentOperation('contribution'); setSelectedBoxId(''); setIsBoxModalOpen(false);
    setAttachment(null); setRemoveAttachment(false);
  }, []);
  
  useEffect(() => {
    if (transactionToEdit) {
      const type = transactionToEdit.expenseType === 'investment' ? 'investment' : (transactionToEdit.type === 'income' ? 'income' : 'expense');
      setMode(type); setDescription(transactionToEdit.description); setAmount(transactionToEdit.amount.toFixed(2)); setCategory(transactionToEdit.category); setExpenseType(transactionToEdit.expenseType || 'fixed'); setIncomeType(transactionToEdit.incomeType || 'fixed'); setDueDate(transactionToEdit.dueDate ? transactionToEdit.dueDate.split('T')[0] : ''); setIsRecurring(!!transactionToEdit.recurrenceId); setSelectedBoxId(transactionToEdit.investmentBoxId || '');
      setAttachment(null); setRemoveAttachment(false);
      if (type === 'investment') { if (transactionToEdit.type === 'income') setInvestmentOperation('redemption'); else setInvestmentOperation('contribution'); }
    } else if (quickAddData) {
        resetForm(); setMode(quickAddData.mode); if(quickAddData.expenseType) setExpenseType(quickAddData.expenseType); if(quickAddData.incomeType) setIncomeType(quickAddData.incomeType);
    } else { resetForm(); }
  }, [transactionToEdit, quickAddData, resetForm]);

  useEffect(() => {
      const categories = getCategories();
      if (!transactionToEdit || !categories.includes(category)) {
        setCategory(categories[0] || '');
      }
  }, [mode, expenseType, incomeType, investmentOperation, getCategories, transactionToEdit, category]);
  
  if (!isOpen) return null;
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => { const value = e.target.value; const numericValue = value.replace(/\D/g, ''); if (numericValue === '') { setAmount(''); return; } const floatValue = parseFloat(numericValue) / 100; setAmount(floatValue.toFixed(2)); };
  const handleSaveNewBox = async (boxData: Omit<InvestmentBox, 'id'> | InvestmentBox) => { if ('id' in boxData) return; const newBox = await onCreateBox(boxData); if (newBox) { setSelectedBoxId(newBox.id); setIsBoxModalOpen(false); } };
  const displayAmount = amount ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(amount)) : '';
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const parsedAmount = parseFloat(amount); if (!description || !amount || parsedAmount <= 0 || !category) { alert('Por favor, preencha todos os campos corretamente.'); return; } if (mode === 'investment' && !selectedBoxId) { alert('Por favor, selecione ou crie uma caixinha de investimento.'); return; } let finalType: 'income' | 'expense' = mode === 'income' ? 'income' : 'expense'; let finalExpenseType = mode === 'income' ? undefined : expenseType; let finalIncomeType = mode === 'income' ? incomeType : undefined; if (mode === 'investment') { if (investmentOperation === 'contribution') { finalType = 'expense'; finalExpenseType = 'investment'; finalIncomeType = undefined; } else { finalType = 'income'; finalExpenseType = undefined; finalIncomeType = 'investment'; } } const transactionData = { description, amount: parsedAmount, type: finalType, expenseType: finalExpenseType, incomeType: finalIncomeType, category, dueDate: (finalType === 'expense') && dueDate ? dueDate : undefined, investmentBoxId: mode === 'investment' ? selectedBoxId : undefined, }; if (transactionToEdit) { onUpdateTransaction({ ...transactionToEdit, ...transactionData }, attachment, removeAttachment); } else { onAddTransaction(transactionData, isRecurring, attachment); } onClose(); };
  const currentCategories = getCategories();
  const inputBaseClasses = "mt-1 block w-full h-12 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 text-base transition-shadow shadow-sm";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setAttachment(e.target.files[0]);
        setRemoveAttachment(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b dark:border-gray-700"> <h2 className="text-2xl font-bold text-gray-900 dark:text-white"> {transactionToEdit ? 'Editar Transação' : 'Adicionar Nova Transação'} </h2> </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
                {!transactionToEdit && ( <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-6"> <TabButton text="Despesa" isActive={mode === 'expense'} onClick={() => setMode('expense')} /> <TabButton text="Receita" isActive={mode === 'income'} onClick={() => setMode('income')} /> <TabButton text="Investimento" isActive={mode === 'investment'} onClick={() => setMode('investment')} /> </div> )}
                <InputField label="Descrição" id="description" value={description} onChange={setDescription} placeholder="Ex: Salário, Aluguel" className={inputBaseClasses} />
                <div> <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Valor</label> <div className="relative"> <input id="amount" type="text" inputMode="numeric" value={displayAmount} onChange={handleAmountChange} placeholder="R$ 0,00" className={`${inputBaseClasses} font-semibold text-lg tracking-wide`} /> </div> </div>
                {mode === 'income' && ( <SelectField label="Tipo de Receita" id="incomeType" value={incomeType} onChange={setIncomeType} className={inputBaseClasses}> <option value="fixed">Fixo</option> <option value="variable">Variável</option> </SelectField> )}
                {mode === 'expense' && ( <SelectField label="Tipo de Despesa" id="expenseType" value={expenseType} onChange={setExpenseType} className={inputBaseClasses}> <option value="fixed">Fixo</option> <option value="variable">Variável</option> <option value="leisure">Lazer</option> </SelectField> )}
                {mode === 'investment' && ( <div className="space-y-4"> <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800"> <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Operação</label> <div className="flex gap-4"> <label className="flex items-center cursor-pointer"> <input type="radio" name="op" checked={investmentOperation === 'contribution'} onChange={() => setInvestmentOperation('contribution')} className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"/> <span className="ml-2 text-gray-800 dark:text-gray-200">Aporte (Guardar)</span> </label> <label className="flex items-center cursor-pointer"> <input type="radio" name="op" checked={investmentOperation === 'redemption'} onChange={() => setInvestmentOperation('redemption')} className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"/> <span className="ml-2 text-gray-800 dark:text-gray-200">Resgate (Sacar)</span> </label> </div> </div> <div> <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Caixinha / Destino</label> <div className="flex gap-2"> <div className="relative flex-grow"> <select value={selectedBoxId} onChange={(e) => setSelectedBoxId(e.target.value)} className={`${inputBaseClasses} appearance-none`}> <option value="">Selecione...</option> {investmentBoxes.map(box => <option key={box.id} value={box.id}>{box.name}</option>)} </select> <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div> </div> <button type="button" onClick={() => setIsBoxModalOpen(true)} className="h-12 w-12 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-blue-600 transition-colors" title="Criar nova caixinha"> <PlusIcon className="w-6 h-6" /> </button> </div> </div> </div> )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <SelectField label="Categoria" id="category" value={category} onChange={setCategory} className={inputBaseClasses}> 
                      {currentCategories.length === 0 && <option disabled>Crie uma categoria nas Configurações</option>}
                      {currentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)} 
                    </SelectField>
                  </div>
                  {(mode === 'expense' || (mode === 'investment' && investmentOperation === 'contribution')) && ( <InputField label="Vencimento/Data" id="dueDate" type="date" value={dueDate} onChange={setDueDate} className={inputBaseClasses} /> )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Anexar Comprovante</label>
                    {!attachment && !transactionToEdit?.attachmentUrl && (
                        <label className="mt-1 flex justify-center w-full h-24 px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-xl cursor-pointer hover:border-primary dark:hover:border-primary transition-colors">
                            <div className="space-y-1 text-center">
                                <PaperclipIcon className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">Arraste um arquivo ou <span className="font-semibold text-primary">clique para selecionar</span></p>
                            </div>
                            <input type="file" onChange={handleFileChange} className="sr-only" accept="image/*,.pdf" />
                        </label>
                    )}
                    
                    {attachment && (
                        <div className="mt-2 flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <PaperclipIcon className="w-5 h-5" />
                                <span className="truncate">{attachment.name}</span>
                            </div>
                            <button type="button" onClick={() => setAttachment(null)} className="text-danger p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    )}

                    {transactionToEdit?.attachmentUrl && !attachment && !removeAttachment && (
                         <div className="mt-2 flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                            <a href={transactionToEdit.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary underline truncate">
                                <PaperclipIcon className="w-5 h-5" />
                                <span>Ver anexo atual</span>
                            </a>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setRemoveAttachment(true)} className="text-danger p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5"/></button>
                                <label className="text-primary p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-full cursor-pointer"><PencilIcon className="w-5 h-5"/><input type="file" onChange={handleFileChange} className="sr-only" accept="image/*,.pdf" /></label>
                            </div>
                        </div>
                    )}
                     {removeAttachment && (
                        <p className="text-sm text-danger mt-2">O anexo será removido ao salvar.</p>
                     )}
                </div>

                {!transactionToEdit && ( <CheckboxField label="Tornar recorrente" id="recurring" checked={isRecurring} onChange={setIsRecurring} disabled={!!attachment}/> )}
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={onClose} className="h-11 px-6 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                <button type="submit" className="h-11 px-6 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20"> {transactionToEdit ? 'Salvar Alterações' : 'Adicionar'} </button>
            </div>
        </form>
      </div>
      {isBoxModalOpen && ( <InvestmentBoxModal isOpen={isBoxModalOpen} onClose={() => setIsBoxModalOpen(false)} onSave={handleSaveNewBox} /> )}
    </div>
  );
};
const TabButton: React.FC<{ text: string; isActive: boolean; onClick: () => void }> = ({ text, isActive, onClick }) => ( <button type="button" onClick={onClick} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>{text}</button> );
const InputField: React.FC<{label: string, id: string, value: string, onChange: (val: string) => void, type?: string, placeholder?: string, onBlur?: () => void, className: string}> = ({label, id, value, onChange, type="text", placeholder, onBlur, className}) => ( <div> <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">{label}</label> <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} className={className} /> </div> );
const SelectField: React.FC<{label: string, id: string, value: string, onChange: (val: any) => void, children: React.ReactNode, className: string}> = ({label, id, value, onChange, children, className}) => ( <div> <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">{label}</label> <div className="relative"> <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${className} appearance-none`}>{children}</select> <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div> </div> </div> );
const CheckboxField: React.FC<{label: string, id: string, checked: boolean, onChange: (val: boolean) => void, disabled?: boolean}> = ({label, id, checked, onChange, disabled}) => ( <div className="flex items-start pt-2"> <div className="flex items-center h-5"><input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className={`h-5 w-5 text-primary rounded border-gray-300 focus:ring-primary bg-gray-100 dark:bg-gray-700 dark:border-gray-600 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}/></div> <div className="ml-3 text-sm"><label htmlFor={id} className={`font-medium text-gray-700 dark:text-gray-300 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer select-none'}`}>{label}</label> {disabled && <p className="text-xs text-gray-400">Recorrência não disponível com anexo.</p>}</div> </div> );

export default AddTransactionModal;