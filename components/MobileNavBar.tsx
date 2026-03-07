import React from 'react';
import { LayoutDashboardIcon } from 'lucide-react';
import { ListIcon } from './icons/ListIcon';
import { PieChartIcon } from './icons/PieChartIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { PlusIcon } from './icons/PlusIcon';

interface SummaryData {
    balance: number;
    income: number;
    expense: number;
}

interface MobileNavBarProps {
    activeTab: string;
    onChange: (tab: string) => void;
    summary?: SummaryData;
    onAddClick: () => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ activeTab, onChange, summary, onAddClick }) => {
    // Definimos os itens da esquerda e da direita para encaixar o botão no meio
    const leftItems = [
        { id: 'home', label: 'Início', icon: LayoutDashboardIcon },
        { id: 'extract', label: 'Extrato', icon: ListIcon },
    ];
    
    const rightItems = [
        { id: 'charts', label: 'Gráficos', icon: PieChartIcon },
        { id: 'investments', label: 'Invest.', icon: TrendingUpIcon },
    ];

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(val);

    const NavItem = ({ item }: { item: any }) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
            <button
                onClick={() => onChange(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                    isActive 
                        ? 'text-primary' 
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
            >
                <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
            </button>
        );
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex flex-col">
            {/* Barra de Resumo Fixa */}
            {summary && (
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 py-2 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex justify-between items-center text-xs">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase text-gray-400 dark:text-gray-500 font-bold tracking-wider">Saldo</span>
                            <span className={`font-bold text-xs ${summary.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>
                                {formatCurrency(summary.balance)}
                            </span>
                        </div>
                         <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] uppercase text-gray-400 dark:text-gray-500 font-bold tracking-wider">Receitas</span>
                            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(summary.income)}
                            </span>
                        </div>
                        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase text-gray-400 dark:text-gray-500 font-bold tracking-wider">Despesas</span>
                            <span className="font-bold text-xs text-rose-600 dark:text-rose-400">
                                {formatCurrency(summary.expense)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Menu de Navegação */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe">
                <div className="grid grid-cols-5 h-14 items-center">
                    {/* Itens da Esquerda */}
                    {leftItems.map((item) => (
                        <div key={item.id} className="h-full flex items-center justify-center">
                            <NavItem item={item} />
                        </div>
                    ))}

                    {/* Botão Central (Adicionar) - Agora encaixado dentro da barra */}
                    <div className="h-full flex items-center justify-center">
                        <button
                            onClick={onAddClick}
                            className="w-10 h-10 rounded-full bg-primary text-white shadow-md shadow-primary/30 flex items-center justify-center transform transition-transform active:scale-95 hover:bg-blue-600"
                            aria-label="Adicionar Transação"
                        >
                            <PlusIcon className="w-6 h-6" strokeWidth={3} />
                        </button>
                    </div>

                    {/* Itens da Direita */}
                    {rightItems.map((item) => (
                        <div key={item.id} className="h-full flex items-center justify-center">
                            <NavItem item={item} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileNavBar;