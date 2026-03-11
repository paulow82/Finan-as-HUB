import React, { useState, useEffect, useMemo, useRef } from 'react';
// Importação corrigida para evitar erros de "named export" com CommonJS no Vite
// FIX: Using a namespace import for react-grid-layout to address a module resolution
// issue with Vite where named exports like 'WidthProvider' are not correctly resolved.
import { Responsive, WidthProvider } from 'react-grid-layout';

import Header from './components/Header';
import Summary from './components/Summary';
import MonthlyBarChart from './components/charts/MonthlyBarChart';
import CategoryPieChart from './components/charts/CategoryPieChart';
import BudgetPlanner from './components/BudgetPlanner';
import MonthlySummarySidebar from './components/MonthlySummarySidebar';
import AddTransactionModal from './components/AddTransactionModal';
import SettingsModal from './components/SettingsModal';
import InvestmentProjections from './components/InvestmentProjections';
import InvestmentBoxList from './components/InvestmentBoxList';
import DashboardCard from './components/DashboardCard';
import CategoryDetailList from './components/CategoryDetailList';
import { ToastProvider, useToast } from './contexts/ToastContext';
import ConfirmationModal from './components/ConfirmationModal';
import MobileNavBar from './components/MobileNavBar';

import { Transaction, AppSettings, InvestmentBox } from './types';
import { transactionService } from './services/transactionService';
import { settingsService } from './services/settingsService';
import { investmentService } from './services/investmentService';

// @FIX: Using RGL namespace to access WidthProvider and Responsive due to build issues.
// With a namespace import, the default export of the module is accessed via the .default property.
const ResponsiveGridLayout = WidthProvider(Responsive);

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 } as const;
const COLS = { lg: 12, md: 6, sm: 2, xs: 1, xxs: 1 } as const;
type BP = keyof typeof BREAKPOINTS;

const smLayout = [
    { i: 'chart', x: 0, y: 0, w: 2, h: 9 },
    { i: 'pie', x: 0, y: 9, w: 2, h: 9 },
    { i: 'budget', x: 0, y: 18, w: 2, h: 10 },
    { i: 'expense-fixed', x: 0, y: 28, w: 2, h: 8 },
    { i: 'expense-variable', x: 0, y: 36, w: 2, h: 8 },
    { i: 'expense-leisure', x: 0, y: 44, w: 2, h: 8 },
    { i: 'income-fixed', x: 0, y: 52, w: 2, h: 8 },
    { i: 'income-variable', x: 0, y: 60, w: 2, h: 8 },
    { i: 'investments', x: 0, y: 68, w: 2, h: 8 },
    { i: 'investment-extract', x: 0, y: 76, w: 2, h: 8 },
    { i: 'projections', x: 0, y: 84, w: 2, h: 10 }
];
const xsLayout = smLayout.map(item => ({ ...item, w: 1 }));


const defaultLayouts = {
    lg: [
        { i: 'summary-kpis', x: 0, y: 0, w: 12, h: 4, static: true },
        
        { i: 'chart', x: 0, y: 4, w: 8, h: 10 },
        { i: 'pie', x: 8, y: 4, w: 4, h: 10 },
        
        { i: 'budget', x: 0, y: 14, w: 3, h: 11 },
        { i: 'expense-fixed', x: 3, y: 14, w: 3, h: 11 },
        { i: 'expense-variable', x: 6, y: 14, w: 3, h: 11 },
        { i: 'expense-leisure', x: 9, y: 14, w: 3, h: 11 },

        { i: 'income-fixed', x: 0, y: 25, w: 3, h: 11 },
        { i: 'income-variable', x: 3, y: 25, w: 3, h: 11 },
        
        { i: 'investments', x: 6, y: 25, w: 3, h: 11 },
        { i: 'investment-extract', x: 9, y: 25, w: 3, h: 11 },

        { i: 'projections', x: 0, y: 36, w: 12, h: 12 }
    ],
    md: [
        { i: 'chart', x: 0, y: 0, w: 6, h: 9 },
        { i: 'pie', x: 0, y: 9, w: 6, h: 9 },
        
        { i: 'budget', x: 0, y: 18, w: 3, h: 11 },
        { i: 'investments', x: 3, y: 18, w: 3, h: 11 },

        { i: 'expense-fixed', x: 0, y: 29, w: 2, h: 8 },
        { i: 'expense-variable', x: 2, y: 29, w: 2, h: 8 },
        { i: 'expense-leisure', x: 4, y: 29, w: 2, h: 8 },

        { i: 'income-fixed', x: 0, y: 37, w: 3, h: 8 },
        { i: 'income-variable', x: 3, y: 37, w: 3, h: 8 },

        { i: 'investment-extract', x: 0, y: 45, w: 6, h: 8 },
        { i: 'projections', x: 0, y: 53, w: 6, h: 10 }
    ],
    sm: smLayout,
    xs: xsLayout,
    xxs: xsLayout
};

const normalizeLayouts = (incoming: any): Record<BP, any[]> => {
  const out = {} as Record<BP, any[]>;
  (Object.keys(BREAKPOINTS) as BP[]).forEach((bp) => {
    out[bp] = Array.isArray(incoming?.[bp]) ? incoming[bp] : defaultLayouts[bp];
  });
  return out;
};

const defaultSettings: AppSettings = {
    title: 'Dashboard Financeiro',
    subtitle: 'Controle suas finanças com inteligência',
    theme: 'system',
    investmentProjectionTimeframe: '1Y',
    predictContributions: true,
    budgetGoals: { fixed: 50, variable: 30, leisure: 10, investment: 10 },
    categories: {
        INCOME: {
            fixed: ['Salário', 'Aluguel Recebido'],
            variable: ['Freelance', 'Reembolso', 'Vendas', 'Outros'],
            investment: ['Dividendos', 'Juros', 'Resgate']
        },
        EXPENSE: {
            fixed: ['Aluguel', 'Condomínio', 'Internet', 'Luz', 'Água', 'Assinaturas', 'Educação'],
            variable: ['Mercado', 'Farmácia', 'Combustível', 'Manutenção', 'Presentes', 'Roupas'],
            leisure: ['Restaurante', 'Cinema', 'Viagem', 'Hobby'],
            investment: ['Aporte', 'Previdência']
        }
    }
};

const LIST_KEYS = [
    'expense-fixed',
    'expense-variable',
    'expense-leisure',
    'income-fixed',
    'income-variable',
    'investment-extract'
];

const DashboardContent: React.FC = () => {
    const { addToast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [investmentBoxes, setInvestmentBoxes] = useState<InvestmentBox[]>([]);
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [layouts, setLayouts] = useState(defaultLayouts);
    const [cardColors, setCardColors] = useState<Record<string, string>>({});
    const [cardTitles, setCardTitles] = useState<Record<string, string>>({});
    
    // UI State
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
    const [quickAddType, setQuickAddType] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMutating, setIsMutating] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<Transaction | null>(null);
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    
    // Mobile Navigation State
    const [activeMobileTab, setActiveMobileTab] = useState('home');

    // Sticky Header State
    const [isHeaderSticky, setIsHeaderSticky] = useState(false);
    const mainRef = useRef<HTMLDivElement>(null);

    // Initial Data Load
    useEffect(() => {
        const loadData = async () => {
            try {
                const [fetchedTransactions, fetchedBoxes, prefs] = await Promise.all([
                    transactionService.fetchAll(),
                    investmentService.fetchBoxes(),
                    settingsService.fetchPreferences()
                ]);

                setTransactions(fetchedTransactions);
                setInvestmentBoxes(fetchedBoxes);

                if (prefs) {
                    setSettings(prefs.settings);
                    if (prefs.layouts) setLayouts(normalizeLayouts(prefs.layouts));
                    if (prefs.cardColors) setCardColors(prefs.cardColors);
                    if (prefs.cardTitles) setCardTitles(prefs.cardTitles);
                }
            } catch (error) {
                console.error("Failed to load data", error);
                addToast({ message: "Erro ao carregar dados. Verifique sua conexão.", type: "error" });
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [addToast]);

    // Scroll Handler Direto (Mais confiável)
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        // Optimization: Only run sticky logic on Desktop (md and up) to avoid re-renders on mobile scroll
        // Mobile sticky behavior was removed, so we don't need to update state on mobile.
        if (window.innerWidth >= 768) {
            const shouldBeSticky = e.currentTarget.scrollTop > 40;
            if (shouldBeSticky !== isHeaderSticky) {
                setIsHeaderSticky(shouldBeSticky);
            }
        }
    };

    // Theme Management
    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    }, [settings.theme]);

    // --- Computed Data ---
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === selectedMonth.getMonth() && 
                   tDate.getFullYear() === selectedMonth.getFullYear();
        });
    }, [transactions, selectedMonth]);

    const summaryData = useMemo(() => {
        let income = 0;
        let expenses = 0;
        let invested = 0;
        let pendingExpenses = 0;

        filteredTransactions.forEach(t => {
            if (t.type === 'income') {
                income += t.amount;
            } else {
                if (t.expenseType === 'investment') {
                    invested += t.amount;
                } else {
                    expenses += t.amount;
                }
                
                if (!t.paid && t.dueDate) {
                     pendingExpenses += t.amount;
                }
            }
        });

        return { 
            totalIncome: income, 
            totalExpenses: expenses, 
            totalInvested: invested, 
            balance: income - expenses - invested,
            pendingExpenses
        };
    }, [filteredTransactions]);

    const upcomingBills = useMemo(() => {
        return filteredTransactions
            .filter(t => t.type === 'expense' && t.expenseType !== 'investment' && !t.paid && t.dueDate)
            .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));
    }, [filteredTransactions]);

    // Cálculo detalhado das caixinhas com Juros Compostos (para bater com o Gráfico)
    const detailedBalances = useMemo(() => {
        const balances: Record<string, { patrimony: number, profit: number }> = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        investmentBoxes.forEach(box => {
            // 1. Filtrar e ordenar transações desta caixinha
            const boxTxs = transactions
                .filter(t => t.investmentBoxId === box.id)
                .sort((a, b) => {
                    const aDate = new Date(a.date);
                    const bDate = new Date(b.date);
                    return aDate.getTime() - bDate.getTime();
                });

            if (boxTxs.length === 0) {
                balances[box.id] = { patrimony: 0, profit: 0 };
                return;
            }

            let currentBalance = 0;
            let totalPrincipal = 0;

            // Taxa diária equivalente
            const annualRate = (box.interestRate || 0) / 100;
            const dailyRate = Math.pow(1 + annualRate, 1/365) - 1;

            // Começa do dia da primeira transação
            let cursorDate = new Date(boxTxs[0].date);
            cursorDate.setHours(0, 0, 0, 0);

            // Mapa para acesso rápido O(1) dentro do loop
            const txMap: Record<string, Transaction[]> = {};
            boxTxs.forEach(t => {
                const tDate = new Date(t.date);
                const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
                if (!txMap[key]) txMap[key] = [];
                txMap[key].push(t);
            });

            // Loop dia a dia até hoje
            while (cursorDate <= today) {
                const dateKey = `${cursorDate.getFullYear()}-${String(cursorDate.getMonth() + 1).padStart(2, '0')}-${String(cursorDate.getDate()).padStart(2, '0')}`;
                
                // Aplica Movimentações do dia
                if (txMap[dateKey]) {
                    txMap[dateKey].forEach(t => {
                        if (t.type === 'expense') { // Aporte
                            currentBalance += t.amount;
                            totalPrincipal += t.amount;
                        } else { // Resgate
                            currentBalance -= t.amount;
                            totalPrincipal -= t.amount; 
                        }
                    });
                }

                // Aplica Juros (Sobre o saldo do dia, incluindo movimentações)
                if (currentBalance > 0) {
                    currentBalance += currentBalance * dailyRate;
                }

                cursorDate.setDate(cursorDate.getDate() + 1);
            }

            balances[box.id] = { 
                patrimony: currentBalance, 
                profit: currentBalance - totalPrincipal 
            };
        });

        return balances;
    }, [transactions, investmentBoxes]);
    
    const sortedTransactions = useMemo(() => {
        const getList = (key: string): Transaction[] => {
            switch (key) {
                case 'expense-fixed': return filteredTransactions.filter(t => t.type === 'expense' && t.expenseType === 'fixed');
                case 'expense-variable': return filteredTransactions.filter(t => t.type === 'expense' && t.expenseType === 'variable');
                case 'expense-leisure': return filteredTransactions.filter(t => t.type === 'expense' && t.expenseType === 'leisure');
                case 'income-fixed': return filteredTransactions.filter(t => t.type === 'income' && t.incomeType === 'fixed');
                case 'income-variable': return filteredTransactions.filter(t => t.type === 'income' && t.incomeType === 'variable');
                case 'investment-extract': return filteredTransactions.filter(t => t.expenseType === 'investment' || t.incomeType === 'investment');
                default: return [];
            }
        };

        const result: Record<string, Transaction[]> = {};
        
        LIST_KEYS.forEach(key => {
            const originalList = getList(key);
            const order = settings.transactionOrder?.[key];

            if (order && order.length > 0) {
                const listMap = new Map(originalList.map(t => [t.id, t]));
                const sorted = order.map(id => listMap.get(id)).filter((t): t is Transaction => !!t);
                const orderedIds = new Set(order);
                const newItems = originalList.filter(t => !orderedIds.has(t.id));
                result[key] = [...sorted, ...newItems];
            } else {
                result[key] = originalList;
            }
        });

        return result;
    }, [filteredTransactions, settings.transactionOrder]);

    const getListTotal = (key: string) => {
        if (!sortedTransactions[key]) return 0;
        
        if (key === 'investment-extract') {
             return sortedTransactions[key].reduce((acc, t) => {
               if (t.type === 'expense') return acc + t.amount; // Aporte
               if (t.type === 'income') return acc - t.amount; // Resgate
               return acc;
           }, 0);
        }

        return sortedTransactions[key].reduce((acc, t) => acc + t.amount, 0);
    };

    // --- CRUD Handlers ---
    const handleSaveTransaction = async (data: any, isRecurring: boolean, recurrenceCount: number, attachment: File | null) => {
        setIsMutating(true);
        try {
            let attachmentUrl = undefined;
            if (attachment) {
                attachmentUrl = await transactionService.uploadAttachment(attachment);
            }
    
            const baseTransaction = { ...data, attachmentUrl };
            if (baseTransaction.dueDate) {
                const utcDate = new Date(baseTransaction.dueDate + 'T12:00:00Z');
                baseTransaction.date = utcDate;
            } else {
                const now = new Date();
                baseTransaction.date = now;
            }
            
            const isInstallment = baseTransaction.installmentsTotal && baseTransaction.installmentsTotal > 1;
            let createdTransactions: Transaction[] = [];
            if (isInstallment || isRecurring) {
                const recurrenceId = crypto.randomUUID();
                const transactionsToCreate = [];
                
                const totalIterations = isInstallment 
                    ? (baseTransaction.installmentsTotal - (baseTransaction.installmentsCurrent || 1) + 1) 
                    : recurrenceCount;
                const startInstallment = isInstallment ? (baseTransaction.installmentsCurrent || 1) : 1;
    
                for (let i = 0; i < totalIterations; i++) {
                    const installmentNumber = startInstallment + i;
                    const nextDate = new Date(baseTransaction.date);
                    nextDate.setMonth(nextDate.getMonth() + i);
    
                    let nextDueDate = undefined;
                    if (baseTransaction.dueDate) {
                        const d = new Date(baseTransaction.dueDate + 'T12:00:00Z');
                        d.setMonth(d.getMonth() + i);
                        nextDueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    }
    
                    transactionsToCreate.push({
                        ...baseTransaction,
                        date: nextDate,
                        dueDate: nextDueDate,
                        paid: (i === 0 && baseTransaction.type === 'expense') ? baseTransaction.paid : false,
                        recurrenceId: recurrenceId,
                        installmentsCurrent: isInstallment ? installmentNumber : undefined,
                        attachmentUrl: i === 0 ? attachmentUrl : undefined
                    });
                }
                createdTransactions = await transactionService.create(transactionsToCreate);
            } else {
                createdTransactions = await transactionService.create([baseTransaction]);
            }
    
            setTransactions(prev => [...prev, ...createdTransactions]);
            addToast({ message: "Transação salva!", type: "success" });
        } catch (error) { console.error(error); addToast({ message: "Erro ao salvar.", type: "error" }); } finally { setIsMutating(false); setIsAddModalOpen(false); }
    };
    
    const handleUpdateTransaction = async (updatedT: Transaction, attachment: File | null, removeAttachment: boolean, applyToFuture: boolean) => {
        setIsMutating(true);
        try {
            let attachmentUrl = updatedT.attachmentUrl;
            if (removeAttachment && attachmentUrl) { await transactionService.deleteAttachment(attachmentUrl); attachmentUrl = undefined; }
            if (attachment) { if (attachmentUrl) await transactionService.deleteAttachment(attachmentUrl); attachmentUrl = await transactionService.uploadAttachment(attachment); }
            
            const finalTransaction = { ...updatedT, attachmentUrl };
            const isInstallment = !!finalTransaction.installmentsTotal;
    
            if (isInstallment) {
                if (finalTransaction.recurrenceId) {
                    await transactionService.deleteFutureTransactions(finalTransaction.recurrenceId, finalTransaction.date);
                }
                
                await transactionService.update(finalTransaction, false);
    
                const transactionsToCreate = [];
                const startInstallment = (finalTransaction.installmentsCurrent || 1) + 1;
                const totalInstallments = finalTransaction.installmentsTotal || 0;
                
                for (let i = startInstallment; i <= totalInstallments; i++) {
                    const monthOffset = i - (finalTransaction.installmentsCurrent || 1);
                    const baseDate = new Date(finalTransaction.date);
                    const nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, baseDate.getDate());
    
                    let nextDueDate = undefined;
                    if (finalTransaction.dueDate) {
                        const d = new Date(finalTransaction.dueDate + 'T12:00:00Z');
                        d.setMonth(d.getMonth() + monthOffset);
                        nextDueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    }
    
                    transactionsToCreate.push({
                        ...finalTransaction,
                        id: crypto.randomUUID(),
                        date: nextDate,
                        dueDate: nextDueDate,
                        paid: false,
                        installmentsCurrent: i,
                        attachmentUrl: undefined,
                    });
                }
                if (transactionsToCreate.length > 0) {
                    await transactionService.create(transactionsToCreate.map(({ id, ...rest }) => rest as any));
                }
            } else if (applyToFuture) {
                if (finalTransaction.recurrenceId) { // Existing recurring series
                    await transactionService.update(finalTransaction, true);
                } else { // Create new recurring series from a single transaction
                    const recurrenceId = crypto.randomUUID();
                    const updatedWithRecurrence = { ...finalTransaction, recurrenceId };
                    await transactionService.update(updatedWithRecurrence, false);

                    const transactionsToCreate = [];
                    for (let i = 1; i < 12; i++) {
                        const nextDate = new Date(updatedWithRecurrence.date);
                        nextDate.setMonth(nextDate.getMonth() + i);
                        let nextDueDate = undefined;
                        if (updatedWithRecurrence.dueDate) {
                            const d = new Date(updatedWithRecurrence.dueDate + 'T12:00:00Z');
                            d.setMonth(d.getMonth() + i);
                            nextDueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        }
                        transactionsToCreate.push({ ...updatedWithRecurrence, date: nextDate, dueDate: nextDueDate, paid: false, attachmentUrl: undefined, id: crypto.randomUUID() });
                    }
                    if (transactionsToCreate.length > 0) {
                         await transactionService.create(transactionsToCreate.map(({ id, ...rest }) => rest as any));
                    }
                }
            } else { // Simple update
                await transactionService.update(finalTransaction, false);
            }
    
            const updatedList = await transactionService.fetchAll();
            setTransactions(updatedList);
            addToast({ message: "Atualizado com sucesso!", type: "success" });
        } catch (error) { console.error(error); addToast({ message: "Erro ao atualizar.", type: "error" }); } finally { setIsMutating(false); setTransactionToEdit(null); setIsAddModalOpen(false); }
    };

    const requestDeleteTransaction = (transaction: Transaction) => {
        setDeleteConfirmation(transaction);
    };

    const handleDeleteTransaction = async (id: string, recurrenceId?: string, applyToFuture?: boolean) => {
        setIsMutating(true);
        try {
            const t = transactions.find(tr => tr.id === id);
            if (t?.attachmentUrl) await transactionService.deleteAttachment(t.attachmentUrl);
            await transactionService.delete(id, recurrenceId, applyToFuture);
            const updated = await transactionService.fetchAll();
            setTransactions(updated);
            addToast({ message: "Excluído.", type: "success" });
        } catch (error) { console.error(error); addToast({ message: "Erro ao excluir.", type: "error" }); } finally { setIsMutating(false); setDeleteConfirmation(null); }
    };

    const handleTogglePaid = async (id: string, newStatus: boolean) => {
        try {
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, paid: newStatus } : t));
            await transactionService.togglePaid(id, newStatus);
        } catch (error) { const original = await transactionService.fetchAll(); setTransactions(original); addToast({ message: "Erro ao atualizar status.", type: "error" }); }
    };

    const requestCloneMonth = () => {
        const toClone = filteredTransactions.filter(t => !t.recurrenceId); 
        if (toClone.length === 0) {
            addToast({ message: "Nenhuma transação para clonar.", type: "warning" });
            return;
        }
        setIsCloneModalOpen(true);
    };

    const executeCloneMonth = async () => {
        setIsCloneModalOpen(false);
        setIsMutating(true);
        try {
            const nextMonthDate = new Date(selectedMonth);
            nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

            const toClone = filteredTransactions.filter(t => !t.recurrenceId); 

            if (toClone.length === 0) {
                addToast({ message: "Nenhuma transação para clonar.", type: "warning" });
                return;
            }

            const clones = toClone.map(t => {
                const tDate = new Date(t.date);
                const newDate = new Date(tDate);
                newDate.setMonth(newDate.getMonth() + 1);

                let newDueDate = undefined;
                if (t.dueDate) {
                    const d = new Date(t.dueDate + 'T12:00:00Z'); 
                    d.setMonth(d.getMonth() + 1);
                    newDueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                }

                const { id, ...rest } = t; 
                
                return { 
                    ...rest, 
                    date: newDate, 
                    dueDate: newDueDate, 
                    paid: false, 
                    attachmentUrl: undefined 
                } as any;
            });

            await transactionService.create(clones);
            const updated = await transactionService.fetchAll();
            setTransactions(updated);
            addToast({ message: "Mês clonado com sucesso!", type: "success" });
            setSelectedMonth(nextMonthDate);
        } catch (error) { 
            console.error("Clone error:", error);
            addToast({ message: "Erro ao clonar o mês.", type: "error" }); 
        } finally { 
            setIsMutating(false); 
        }
    };

    const handleCreateBox = async (box: Omit<InvestmentBox, 'id'>) => { const newBox = await investmentService.createBox(box); if (newBox) { setInvestmentBoxes(prev => [...prev, newBox]); addToast({ message: "Caixinha criada!", type: "success" }); return newBox; } return null; };
    const handleUpdateBox = async (box: InvestmentBox) => { try { await investmentService.updateBox(box); setInvestmentBoxes(prev => prev.map(b => b.id === box.id ? box : b)); addToast({ message: "Caixinha atualizada!", type: "success" }); } catch (e) { addToast({ message: "Erro ao atualizar caixinha.", type: "error" }); } };
    const handleDeleteBox = async (id: string) => { if (!window.confirm("Excluir esta caixinha? O histórico será perdido.")) return; try { await investmentService.deleteBox(id); setInvestmentBoxes(prev => prev.filter(b => b.id !== id)); const updatedT = await transactionService.fetchAll(); setTransactions(updatedT); addToast({ message: "Caixinha excluída.", type: "success" }); } catch (e) { addToast({ message: "Erro ao excluir.", type: "error" }); } };
    const handleSaveSettings = async (newSettings: AppSettings) => { setSettings(newSettings); await settingsService.savePreferences({ settings: newSettings, layouts, cardColors, cardTitles }); addToast({ message: "Configurações salvas!", type: "success" }); };
    const handleLayoutChange = (currentLayout: any, allLayouts: any) => { setLayouts(allLayouts); };
    const handleReorder = (reorderedTransactions: Transaction[], listKey: string) => {
        const newOrder = reorderedTransactions.map(t => t.id);
        setSettings(prev => ({
            ...prev,
            transactionOrder: {
                ...(prev.transactionOrder || {}),
                [listKey]: newOrder
            }
        }));
    };
    
    const handleTitleChange = (cardKey: string, newTitle: string) => {
        setCardTitles(prev => ({...prev, [cardKey]: newTitle }));
    }

    useEffect(() => { if (!isLoading) { const timer = setTimeout(() => { settingsService.savePreferences({ settings, layouts, cardColors, cardTitles }); }, 2000); return () => clearTimeout(timer); } }, [layouts, cardColors, settings, cardTitles, isLoading]);
    const onLayoutColorChange = (key: string, color: string) => { setCardColors(prev => ({ ...prev, [key]: color })); };
    const quickAdd = (mode: string, type?: string) => { setTransactionToEdit(null); setQuickAddType({ mode, type }); setIsAddModalOpen(true); };

    if (isLoading) { return <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-primary animate-pulse">Carregando Dashboard...</div>; }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-300">
            {/* Sidebar (Desktop Only) */}
            <div className="hidden md:block h-full shadow-xl z-20">
                 <MonthlySummarySidebar 
                    allTransactions={transactions} selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} onCloneMonth={requestCloneMonth} hasTransactions={filteredTransactions.length > 0} onClose={() => {}} 
                 />
            </div>

            {/* Mobile Sidebar (Modal) */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-[60] md:hidden flex">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
                    <div className="relative w-4/5 max-w-xs h-full bg-white dark:bg-gray-800 shadow-2xl animate-fade-in">
                         <MonthlySummarySidebar allTransactions={transactions} selectedMonth={selectedMonth} onSelectMonth={(d) => { setSelectedMonth(d); setIsSidebarOpen(false); }} onCloneMonth={() => { requestCloneMonth(); setIsSidebarOpen(false); }} hasTransactions={filteredTransactions.length > 0} onClose={() => setIsSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main 
                ref={mainRef} 
                onScroll={handleScroll}
                className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden relative custom-scrollbar scroll-smooth"
            >
                {/* Header (Both Mobile & Desktop) */}
                <div className="px-4 sm:px-6 md:px-8 pt-6 pb-2">
                     <Header 
                        title={settings.title} 
                        subtitle={settings.subtitle} 
                        theme={settings.theme} 
                        onAddTransaction={() => { setTransactionToEdit(null); setQuickAddType(null); setIsAddModalOpen(true); }} 
                        onOpenSettings={() => setIsSettingsModalOpen(true)} 
                        onThemeChange={(t) => handleSaveSettings({ ...settings, theme: t })} 
                        isMutating={isMutating} 
                        onToggleSidebar={() => setIsSidebarOpen(true)} 
                    />
                </div>

                {/* --- DESKTOP LAYOUT --- */}
                <div className="hidden md:block">
                    {/* Sticky Wrapper (Desktop) */}
                    <div className={`sticky top-0 z-40 transition-all duration-300 ease-in-out ${isHeaderSticky ? 'shadow-lg border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md py-1' : 'py-2 bg-gray-50 dark:bg-gray-900'}`}>
                        <div className="px-4 sm:px-6 md:px-8 relative">
                            <div className={`transition-all duration-300 ease-in-out ${isHeaderSticky ? 'w-[calc(100%-96px)]' : 'w-full'}`}>
                                <Summary 
                                    {...summaryData} 
                                    nextBill={upcomingBills[0]} 
                                    overdueBills={upcomingBills.filter(t => t.dueDate && new Date(t.dueDate + 'T12:00:00') < new Date() && new Date(t.dueDate).getDate() !== new Date().getDate())}
                                    pendingExpenses={summaryData.pendingExpenses}
                                    isSticky={isHeaderSticky}
                                />
                            </div>
                             {/* Floating Add Button (Desktop Sticky) */}
                             <div className={`absolute top-1/2 -translate-y-1/2 right-8 sm:right-10 transition-all duration-300 ${isHeaderSticky ? 'opacity-100 translate-x-0 pointer-events-auto scale-100' : 'opacity-0 translate-x-4 pointer-events-none scale-0'}`}>
                                <button onClick={() => { setTransactionToEdit(null); setQuickAddType(null); setIsAddModalOpen(true); }} className="p-2.5 bg-primary text-white rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center" title="Adicionar Transação">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Grid Layout (Desktop) */}
                    <div className="px-4 sm:px-6 md:px-8 pt-4 w-full flex flex-col gap-6">
                        <ResponsiveGridLayout
                            className="layout"
                            layouts={layouts}
                            breakpoints={BREAKPOINTS}
                            cols={COLS}
                            rowHeight={30}
                            draggableHandle=".drag-handle"
                            draggableCancel=".edit-title-handle"
                            onLayoutChange={handleLayoutChange}
                            margin={[16, 16]}
                            resizeHandles={['se', 'sw']}
                        >
                            <div key="chart">
                                 <DashboardCard title={cardTitles.chart || "Fluxo de Caixa"} cardKey="chart" cardColor={cardColors.chart} onColorChange={onLayoutColorChange} onTitleChange={handleTitleChange}>
                                     <MonthlyBarChart transactions={transactions} selectedMonth={selectedMonth} investmentBoxes={investmentBoxes} />
                                 </DashboardCard>
                            </div>
                            <div key="pie">
                                 <DashboardCard title={cardTitles.pie || "Despesas por Categoria"} cardKey="pie" cardColor={cardColors.pie} onColorChange={onLayoutColorChange} onTitleChange={handleTitleChange}>
                                     <CategoryPieChart transactions={filteredTransactions} />
                                 </DashboardCard>
                            </div>

                             <div key="budget">
                                 <DashboardCard title={cardTitles.budget || "Planejamento"} cardKey="budget" cardColor={cardColors.budget} onColorChange={onLayoutColorChange} onTitleChange={handleTitleChange}>
                                     <BudgetPlanner transactions={filteredTransactions} goals={settings.budgetGoals} />
                                 </DashboardCard>
                            </div>
                            
                            <div key="expense-fixed">
                                 <DashboardCard title={cardTitles['expense-fixed'] || "Despesas Fixas"} cardKey="expense-fixed" cardColor={cardColors['expense-fixed']} onColorChange={onLayoutColorChange} onQuickAdd={() => quickAdd('expense', 'fixed')} onTitleChange={handleTitleChange} totalAmount={getListTotal('expense-fixed')} amountType="expense">
                                     <CategoryDetailList transactions={sortedTransactions['expense-fixed']} onEdit={(t) => { setTransactionToEdit(t); setIsAddModalOpen(true); }} onDelete={requestDeleteTransaction} onTogglePaid={handleTogglePaid} onReorder={handleReorder} listKey="expense-fixed" />
                                 </DashboardCard>
                            </div>
                            <div key="expense-variable">
                                 <DashboardCard title={cardTitles['expense-variable'] || "Despesas Variáveis"} cardKey="expense-variable" cardColor={cardColors['expense-variable']} onColorChange={onLayoutColorChange} onQuickAdd={() => quickAdd('expense', 'variable')} onTitleChange={handleTitleChange} totalAmount={getListTotal('expense-variable')} amountType="expense">
                                     <CategoryDetailList transactions={sortedTransactions['expense-variable']} onEdit={(t) => { setTransactionToEdit(t); setIsAddModalOpen(true); }} onDelete={requestDeleteTransaction} onTogglePaid={handleTogglePaid} onReorder={handleReorder} listKey="expense-variable" />
                                 </DashboardCard>
                            </div>
                             <div key="expense-leisure">
                                 <DashboardCard title={cardTitles['expense-leisure'] || "Lazer e Outros"} cardKey="expense-leisure" cardColor={cardColors['expense-leisure']} onColorChange={onLayoutColorChange} onQuickAdd={() => quickAdd('expense', 'leisure')} onTitleChange={handleTitleChange} totalAmount={getListTotal('expense-leisure')} amountType="expense">
                                     <CategoryDetailList transactions={sortedTransactions['expense-leisure']} onEdit={(t) => { setTransactionToEdit(t); setIsAddModalOpen(true); }} onDelete={requestDeleteTransaction} onTogglePaid={handleTogglePaid} onReorder={handleReorder} listKey="expense-leisure" />
                                 </DashboardCard>
                            </div>

                            <div key="income-fixed">
                                 <DashboardCard title={cardTitles['income-fixed'] || "Receitas Fixas"} cardKey="income-fixed" cardColor={cardColors['income-fixed']} onColorChange={onLayoutColorChange} onQuickAdd={() => quickAdd('income', 'fixed')} onTitleChange={handleTitleChange} totalAmount={getListTotal('income-fixed')} amountType="income">
                                     <CategoryDetailList transactions={sortedTransactions['income-fixed']} onEdit={(t) => { setTransactionToEdit(t); setIsAddModalOpen(true); }} onDelete={requestDeleteTransaction} onTogglePaid={handleTogglePaid} onReorder={handleReorder} listKey="income-fixed" />
                                 </DashboardCard>
                            </div>
                            <div key="income-variable">
                                 <DashboardCard title={cardTitles['income-variable'] || "Receitas Variáveis"} cardKey="income-variable" cardColor={cardColors['income-variable']} onColorChange={onLayoutColorChange} onQuickAdd={() => quickAdd('income', 'variable')} onTitleChange={handleTitleChange} totalAmount={getListTotal('income-variable')} amountType="income">
                                     <CategoryDetailList transactions={sortedTransactions['income-variable']} onEdit={(t) => { setTransactionToEdit(t); setIsAddModalOpen(true); }} onDelete={requestDeleteTransaction} onTogglePaid={handleTogglePaid} onReorder={handleReorder} listKey="income-variable" />
                                 </DashboardCard>
                            </div>

                            <div key="investments">
                                 <DashboardCard title={cardTitles.investments || "Caixinhas"} cardKey="investments" cardColor={cardColors.investments} onColorChange={onLayoutColorChange} onTitleChange={handleTitleChange}>
                                     <InvestmentBoxList boxes={investmentBoxes} onDeleteBox={handleDeleteBox} onUpdateBox={handleUpdateBox} onCreateBox={handleCreateBox} detailedBalances={detailedBalances} />
                                 </DashboardCard>
                            </div>
                             <div key="investment-extract">
                                 <DashboardCard title={cardTitles['investment-extract'] || "Extrato de Investimentos"} cardKey="investment-extract" cardColor={cardColors['investment-extract']} onColorChange={onLayoutColorChange} onQuickAdd={() => quickAdd('investment')} onTitleChange={handleTitleChange} totalAmount={getListTotal('investment-extract')} amountType={getListTotal('investment-extract') >= 0 ? 'income' : 'expense'}>
                                     <CategoryDetailList transactions={sortedTransactions['investment-extract']} investmentBoxes={investmentBoxes} onEdit={(t) => { setTransactionToEdit(t); setIsAddModalOpen(true); }} onDelete={requestDeleteTransaction} onReorder={handleReorder} listKey="investment-extract" />
                                 </DashboardCard>
                            </div>

                            <div key="projections">
                                 <DashboardCard title={cardTitles.projections || "Projeção de Patrimônio"} cardKey="projections" cardColor={cardColors.projections} onColorChange={onLayoutColorChange} onTitleChange={handleTitleChange}>
                                     <InvestmentProjections 
                                        allTransactions={transactions} 
                                        investmentBoxes={investmentBoxes} 
                                        timeframe={settings.investmentProjectionTimeframe} 
                                        selectedMonth={selectedMonth} 
                                        predictContributions={settings.predictContributions}
                                        manualContribution={settings.manualContribution}
                                        onSettingsChange={(changes) => setSettings(prev => ({ ...prev, ...changes }))} 
                                     />
                                 </DashboardCard>
                            </div>
                        </ResponsiveGridLayout>

                        <div className="h-20"></div>
                    </div>
                </div>

                {/* --- MOBILE LAYOUT (Tabbed) --- */}
                <div className="md:hidden px-4">
                    {activeMobileTab === 'home' && (
                        <div className="space-y-4 pb-36">
                             {/* Summary Original (Grid) */}
                             <div className="px-1 pt-1">
                                <Summary 
                                    {...summaryData} 
                                    nextBill={upcomingBills[0]} 
                                    overdueBills={upcomingBills.filter(t => t.dueDate && new Date(t.dueDate + 'T12:00:00') < new Date() && new Date(t.dueDate).getDate() !== new Date().getDate())}
                                    pendingExpenses={summaryData.pendingExpenses}
                                    isSticky={false}
                                    mobileView={true}
                                />
                             </div>
                             
                            {upcomingBills.length > 0 && (
                                 <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in">
                                     <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2 text-sm">Próximo Pagamento</h3>
                                     <DashboardCard title="" cardKey="next-bill-mobile" cardColor="transparent" isAutoHeight={true}>
                                         <div className="flex items-center justify-between">
                                             <div>
                                                 <p className="font-semibold text-gray-900 dark:text-white text-sm">{upcomingBills[0].description}</p>
                                                 <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(upcomingBills[0].dueDate!).toLocaleDateString('pt-BR')}</p>
                                             </div>
                                             <p className="font-bold text-base text-gray-900 dark:text-white">
                                                 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(upcomingBills[0].amount)}
                                             </p>
                                         </div>
                                     </DashboardCard>
                                 </div>
                            )}
                             <DashboardCard title="Planejamento" cardKey="budget" cardColor={cardColors.budget} isAutoHeight={true}>
                                 <BudgetPlanner transactions={filteredTransactions} goals={settings.budgetGoals} />
                             </DashboardCard>
                        </div>
                    )}
                    {activeMobileTab === 'extract' && (
                        <div className="space-y-3 pb-36">
                             <div className="space-y-2">
                                 <h3 className="font-bold text-base text-gray-700 dark:text-gray-300 ml-1">Despesas</h3>
                                 <DashboardCard title="Fixas" cardKey="expense-fixed" cardColor={cardColors['expense-fixed']} onQuickAdd={() => quickAdd('expense', 'fixed')} isAutoHeight={true} totalAmount={getListTotal('expense-fixed')} amountType="expense">
                                    <CategoryDetailList transactions={sortedTransactions['expense-fixed']} onEdit={(t) => { setTransactionToEdit(t); setIsAddModalOpen(true); }} onDelete={requestDeleteTransaction} onTogglePaid={handleTogglePaid} onReorder={handleReorder} listKey="expense-fixed" />
                                 </DashboardCard>
                                 <DashboardCard title="Variáveis" cardKey="expense-variable" cardColor={cardColors['expense-variable']} onQuickAdd={() => quickAdd('expense', 'variable')} isAutoHeight={true} totalAmount={getListTotal('expense-variable')} amountType="expense">
                                    <CategoryDetailList transactions={sortedTransactions['expense-variable']} onEdit={(t) => { setTransactionToEdit(t); setIsAddModalOpen(true); }} onDelete={requestDeleteTransaction} onTogglePaid={handleTogglePaid} onReorder={handleReorder} listKey="expense-variable" />
                                 </DashboardCard>
                                 <DashboardCard title="Lazer" cardKey="expense-leisure" cardColor={cardColors['expense-leisure']} onQuickAdd={() => quickAdd('expense', 'leisure')} isAutoHeight={true} totalAmount={getListTotal('expense-leisure')} amountType="expense">
                                    <CategoryDetailList transactions={sortedTransactions['expense-leisure']} onEdit={(t) => { setTransactionToEdit(t); setIsAddModalOpen(true); }} onDelete={requestDeleteTransaction} onTogglePaid={handleTogglePaid} onReorder={handleReorder} listKey="expense-leisure" />
                                 </DashboardCard>
                             </div>

                             <div className="space-y-2">
                                 <h3 className="font-bold text-base text-gray-700 dark:text-gray-300 ml-1">Receitas</h3>
                                 <DashboardCard title="Fixas" cardKey="income-fixed" cardColor={cardColors['income-fixed']} onQuickAdd={() => quickAdd('income', 'fixed')} isAutoHeight={true} totalAmount={getListTotal('income-fixed')} amountType="income">
                                    <CategoryDetailList transactions={sortedTransactions['income-fixed']} onEdit={(t) => { setTransactionToEdit(t); setIsAddModalOpen(true); }} onDelete={requestDeleteTransaction} onTogglePaid={handleTogglePaid} onReorder={handleReorder} listKey="income-fixed" />
                                 </DashboardCard>
                                 <DashboardCard title="Variáveis" cardKey="income-variable" cardColor={cardColors['income-variable']} onQuickAdd={() => quickAdd('income', 'variable')} isAutoHeight={true} totalAmount={getListTotal('income-variable')} amountType="income">
                                    <CategoryDetailList transactions={sortedTransactions['income-variable']} onEdit={(t) => { setTransactionToEdit(t); setIsAddModalOpen(true); }} onDelete={requestDeleteTransaction} onTogglePaid={handleTogglePaid} onReorder={handleReorder} listKey="income-variable" />
                                 </DashboardCard>
                             </div>
                        </div>
                    )}
                    {activeMobileTab === 'charts' && (
                        <div className="space-y-3 pb-36">
                            <div className="h-80">
                                <DashboardCard title="Fluxo de Caixa" cardKey="chart" cardColor={cardColors.chart}>
                                    <MonthlyBarChart 
                                        transactions={transactions} 
                                        selectedMonth={selectedMonth} 
                                        investmentBoxes={investmentBoxes}
                                        isMobile={true} 
                                    />
                                </DashboardCard>
                            </div>
                            <div className="h-[550px]">
                                <DashboardCard title="Categorias" cardKey="pie" cardColor={cardColors.pie}>
                                    <CategoryPieChart transactions={filteredTransactions} />
                                </DashboardCard>
                            </div>
                        </div>
                    )}
                    {activeMobileTab === 'investments' && (
                        <div className="space-y-3 pb-36">
                            <DashboardCard title="Minhas Caixinhas" cardKey="investments" cardColor={cardColors.investments} isAutoHeight={true}>
                                <InvestmentBoxList boxes={investmentBoxes} onDeleteBox={handleDeleteBox} onUpdateBox={handleUpdateBox} onCreateBox={handleCreateBox} detailedBalances={detailedBalances} />
                            </DashboardCard>
                            <div className="h-[600px]">
                                 <DashboardCard title="Projeção" cardKey="projections" cardColor={cardColors.projections}>
                                     <InvestmentProjections 
                                        allTransactions={transactions} 
                                        investmentBoxes={investmentBoxes} 
                                        timeframe={settings.investmentProjectionTimeframe} 
                                        selectedMonth={selectedMonth} 
                                        predictContributions={settings.predictContributions}
                                        manualContribution={settings.manualContribution}
                                        onSettingsChange={(changes) => setSettings(prev => ({ ...prev, ...changes }))} 
                                     />
                                 </DashboardCard>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <MobileNavBar 
                activeTab={activeMobileTab} 
                onChange={setActiveMobileTab} 
                summary={{
                    balance: summaryData.balance,
                    income: summaryData.totalIncome,
                    expense: summaryData.totalExpenses
                }}
                onAddClick={() => { setTransactionToEdit(null); setQuickAddType(null); setIsAddModalOpen(true); }}
            />

            {/* Modals */}
            <AddTransactionModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddTransaction={handleSaveTransaction} onUpdateTransaction={handleUpdateTransaction} transactionToEdit={transactionToEdit} selectedMonth={selectedMonth} investmentBoxes={investmentBoxes} onCreateBox={handleCreateBox} settings={settings} detailedBalances={detailedBalances} quickAddData={quickAddType ? { mode: quickAddType.mode, expenseType: quickAddType.mode === 'expense' ? quickAddType.type : undefined, incomeType: quickAddType.mode === 'income' ? quickAddType.type : undefined } : undefined} />
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={settings} onSave={handleSaveSettings} onMigrateData={async () => { await transactionService.migrateFromLocalStorage(); }} />
            
            {deleteConfirmation && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setDeleteConfirmation(null)}
                    title="Confirmar Exclusão"
                    message={
                        deleteConfirmation.recurrenceId
                        ? "Esta é uma transação recorrente/parcelada.\nEscolha uma opção para continuar:"
                        : "Tem certeza que deseja excluir esta transação permanentemente?"
                    }
                    actions={
                        deleteConfirmation.recurrenceId
                        ? [
                            { label: 'Excluir Somente Esta', onClick: () => handleDeleteTransaction(deleteConfirmation.id), style: 'secondary' },
                            { label: 'Excluir Esta e Futuras', onClick: () => handleDeleteTransaction(deleteConfirmation.id, deleteConfirmation.recurrenceId, true), style: 'danger' }
                        ]
                        : [
                            { label: 'Excluir Transação', onClick: () => handleDeleteTransaction(deleteConfirmation.id), style: 'danger' }
                        ]
                    }
                />
            )}

            {isCloneModalOpen && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setIsCloneModalOpen(false)}
                    title="Copiar para o Próximo Mês"
                    message={`Deseja realmente copiar as transações de ${selectedMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} para o mês seguinte?\n\n(Transações recorrentes ou parceladas serão ignoradas).`}
                    actions={[
                        { label: 'Sim, Copiar', onClick: executeCloneMonth, style: 'primary' }
                    ]}
                />
            )}
        </div>
    );
};

export default function App() {
  return (
    <ToastProvider>
        <DashboardContent />
    </ToastProvider>
  );
}