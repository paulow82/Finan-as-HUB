
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onMigrateData?: () => Promise<void>;
}

const CategoryManager: React.FC<{
    categories: AppSettings['categories'];
    onCategoriesChange: (newCategories: AppSettings['categories']) => void;
}> = ({ categories, onCategoriesChange }) => {
    
    const [editing, setEditing] = useState<{ type: string; subtype: string; index: number } | null>(null);
    const [newCategory, setNewCategory] = useState<{ [key: string]: string }>({});
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
        }
    }, [editing]);

    const handleAddCategory = <T extends 'INCOME' | 'EXPENSE'>(type: T, subtype: keyof AppSettings['categories'][T]) => {
        const key = `${type}-${String(subtype)}`;
        const value = newCategory[key]?.trim();
        if (value) {
            const updatedCategories = JSON.parse(JSON.stringify(categories));
            updatedCategories[type][subtype].push(value);
            onCategoriesChange(updatedCategories);
            setNewCategory(prev => ({ ...prev, [key]: '' }));
        }
    };
    
    const handleUpdateCategory = <T extends 'INCOME' | 'EXPENSE'>(type: T, subtype: keyof AppSettings['categories'][T], index: number, value: string) => {
        const updatedCategories = JSON.parse(JSON.stringify(categories));
        updatedCategories[type][subtype][index] = value;
        onCategoriesChange(updatedCategories);
    };

    const handleDeleteCategory = <T extends 'INCOME' | 'EXPENSE'>(type: T, subtype: keyof AppSettings['categories'][T], index: number) => {
        if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
            const updatedCategories = JSON.parse(JSON.stringify(categories));
            updatedCategories[type][subtype].splice(index, 1);
            onCategoriesChange(updatedCategories);
        }
    };

    const renderCategoryGroup = <T extends 'INCOME' | 'EXPENSE'>(type: T, title: string) => (
        <div>
            <h4 className="text-md font-bold mb-3 text-gray-700 dark:text-gray-300">{title}</h4>
            <div className="space-y-4">
                {(Object.keys(categories[type]) as Array<keyof AppSettings['categories'][T]>).map((subtype) => {
                    const catList = categories[type][subtype] as string[];
                    return (
                        <div key={String(subtype)}>
                            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 capitalize">{String(subtype)}</label>
                            <div className="space-y-2">
                                {catList.map((cat, index) => (
                                    <div key={`${String(subtype)}-${index}`} className="group flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={cat}
                                            onChange={(e) => handleUpdateCategory(type, subtype, index, e.target.value)}
                                            className="flex-grow bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-primary focus:outline-none transition"
                                        />
                                        <button type="button" onClick={() => handleDeleteCategory(type, subtype, index)} className="opacity-0 group-hover:opacity-100 text-danger transition-opacity">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nova categoria..."
                                        value={newCategory[`${type}-${String(subtype)}`] || ''}
                                        onChange={(e) => setNewCategory(prev => ({ ...prev, [`${type}-${String(subtype)}`]: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory(type, subtype)}
                                        className="flex-grow bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 focus:border-primary focus:outline-none transition rounded-t-md px-1"
                                    />
                                    <button type="button" onClick={() => handleAddCategory(type, subtype)} className="text-primary">
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );

    return (
        <section>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">Gerenciar Categorias</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {renderCategoryGroup('EXPENSE', 'Despesas')}
                {renderCategoryGroup('INCOME', 'Receitas')}
            </div>
        </section>
    );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onMigrateData }) => {
  const [currentSettings, setCurrentSettings] = useState<AppSettings>(settings);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = parseFloat(value);

    if (isNaN(newValue)) newValue = 0;
    if (newValue < 0) newValue = 0;

    const changedKey = name as keyof AppSettings['budgetGoals'];

    setCurrentSettings(prev => ({
        ...prev,
        budgetGoals: {
            ...prev.budgetGoals,
            [changedKey]: newValue,
        }
    }));
  };
  
  const handleRebalance = () => {
    const goals = currentSettings.budgetGoals;
    // FIX: Explicitly typing the accumulator and value in `reduce` ensures correct type inference for `total`, preventing errors with arithmetic operations.
    const total = Object.values(goals).reduce((sum: number, v: number) => sum + v, 0);
    
    if (total === 0 || total === 100) return;

    const scaleFactor = 100 / total;
    const newGoals: AppSettings['budgetGoals'] = {
        fixed: 0,
        variable: 0,
        leisure: 0,
        investment: 0,
    };

    let runningTotal = 0;
    const keys = Object.keys(goals) as Array<keyof typeof goals>;

    keys.forEach((key, index) => {
        if (index < keys.length - 1) {
            // FIX: Removed redundant Number() conversion. `goals[key]` is already a number.
            // The arithmetic error was caused by `scaleFactor` being of type `unknown`.
            const adjustedValue = Math.round(goals[key] * scaleFactor);
            newGoals[key] = adjustedValue;
            runningTotal += adjustedValue;
        } else {
            newGoals[key] = 100 - runningTotal;
        }
    });

    setCurrentSettings(prev => ({
        ...prev,
        budgetGoals: newGoals,
    }));
  };

  const handleCategoriesChange = (newCategories: AppSettings['categories']) => {
      setCurrentSettings(prev => ({ ...prev, categories: newCategories }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(currentSettings);
    onClose();
  };

  const handleMigration = async () => {
      if (!onMigrateData) return;
      if (!window.confirm("Isso importará as transações salvas neste navegador para o banco de dados. Deseja continuar?")) return;

      setIsMigrating(true);
      try {
          await onMigrateData();
          alert("Dados migrados com sucesso!");
      } catch (error) {
          alert("Erro ao migrar dados. Verifique o console para mais detalhes.");
      } finally {
          setIsMigrating(false);
      }
  };
  
  // FIX: Explicitly typing the accumulator and value in `reduce` ensures the result is a number and can be passed to `Math.round`.
  const totalBudget = Math.round(Object.values(currentSettings.budgetGoals).reduce((sum: number, v: number) => sum + v, 0));

  const inputBaseClasses = "mt-1 block w-full h-12 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 text-base transition-shadow shadow-sm";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Configurações do Dashboard
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-8">
                <section>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">Geral</h3>
                    <div className="space-y-4">
                        <InputField 
                            label="Título do Dashboard" 
                            id="title" 
                            name="title" 
                            value={currentSettings.title} 
                            onChange={handleInputChange} 
                            className={inputBaseClasses}
                        />
                        <InputField 
                            label="Subtítulo do Dashboard" 
                            id="subtitle" 
                            name="subtitle" 
                            value={currentSettings.subtitle} 
                            onChange={handleInputChange} 
                            className={inputBaseClasses}
                        />
                    </div>
                </section>

                {currentSettings.categories && (
                    <CategoryManager categories={currentSettings.categories} onCategoriesChange={handleCategoriesChange} />
                )}
                
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Planejamento Mensal (Metas em %)</h3>
                         <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${totalBudget === 100 ? 'text-green-500' : 'text-red-500'}`}>
                                Total: {totalBudget}%
                            </span>
                            {totalBudget !== 100 && (
                                <button
                                    type="button"
                                    onClick={handleRebalance}
                                    className="px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
                                >
                                    Ajustar para 100%
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <InputField 
                            label="Despesas Fixas (%)" 
                            id="fixed" 
                            name="fixed" 
                            type="number" 
                            value={currentSettings.budgetGoals.fixed.toString()} 
                            onChange={handleBudgetChange} 
                            className={inputBaseClasses}
                        />
                        <InputField 
                            label="Despesas Variáveis (%)" 
                            id="variable" 
                            name="variable" 
                            type="number" 
                            value={currentSettings.budgetGoals.variable.toString()} 
                            onChange={handleBudgetChange} 
                            className={inputBaseClasses}
                        />
                        <InputField 
                            label="Lazer e Outros (%)" 
                            id="leisure" 
                            name="leisure" 
                            type="number" 
                            value={currentSettings.budgetGoals.leisure.toString()} 
                            onChange={handleBudgetChange} 
                            className={inputBaseClasses}
                        />
                        <InputField 
                            label="Investimentos (%)" 
                            id="investment" 
                            name="investment" 
                            type="number" 
                            value={currentSettings.budgetGoals.investment.toString()} 
                            onChange={handleBudgetChange} 
                            className={inputBaseClasses}
                        />
                    </div>
                </section>

                {onMigrateData && (
                    <section className="pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                         <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Zona de Dados</h3>
                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                             <p className="text-sm text-gray-600 dark:text-gray-400">
                                 Importe suas transações antigas salvas no navegador para a nuvem.
                             </p>
                             <button 
                                type="button" 
                                onClick={handleMigration}
                                disabled={isMigrating}
                                className="whitespace-nowrap h-10 px-4 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md"
                            >
                                {isMigrating ? 'Migrando...' : 'Migrar Dados Locais'}
                             </button>
                         </div>
                    </section>
                )}
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={onClose} className="h-11 px-6 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                <button type="submit" className="h-11 px-6 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/20">Salvar Alterações</button>
            </div>
        </form>
      </div>
    </div>
  );
};

const InputField: React.FC<{label: string, id: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, className: string}> = ({label, id, name, value, onChange, type="text", className}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">{label}</label>
        <input id={id} name={name} type={type} value={value} onChange={onChange} className={className} />
    </div>
);

export default SettingsModal;