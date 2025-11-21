

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Transaction, AppSettings, ExpenseType, IncomeType, TransactionModalMode, InvestmentBox, Timeframe } from './types';
import Header from './components/Header';
import Summary from './components/Summary';
import CategoryPieChart from './components/charts/CategoryPieChart';
import MonthlyBarChart from './components/charts/MonthlyBarChart';
import BudgetPlanner from './components/BudgetPlanner';
import MonthlySummarySidebar from './components/MonthlySummarySidebar';
import AddTransactionModal from './components/AddTransactionModal';
import InvestmentProjections from './components/InvestmentProjections';
import InvestmentBoxList from './components/InvestmentBoxList';
import { Responsive, WidthProvider } from 'react-grid-layout';
import DashboardCard from './components/DashboardCard';
import CategoryDetailList from './components/CategoryDetailList';
import SettingsModal from './components/SettingsModal';
import ConfirmationModal, { ActionButton } from './components/ConfirmationModal';
import { transactionService } from './services/transactionService';
import { settingsService, UserPreferences } from './services/settingsService';
import { investmentService } from './services/investmentService';
import { ToastProvider, useToast } from './contexts/ToastContext';

const ResponsiveGridLayout = WidthProvider(Responsive);

const defaultCardTitles = {
  fixedIncome: 'Ganhos Fixos',
  variableIncome: 'Ganhos Variáveis',
  leisureList: 'Lazer e Outros',
  monthlyInvestments: 'Aportes & Resgates',
  fixedExpenses: 'Despesas Fixas',
  variableExpenses: 'Despesas Variáveis',
  investmentsList: 'Caixinhas & Patrimônio',
  monthlyChart: 'Receitas vs Despesas Mensais',
  pieChart: 'Despesas por Categoria',
  budget: 'Planejamento Mensal',
  investmentsProj: 'Projeção de Investimentos',
};

const defaultLayouts = {
    lg: [
        { i: 'fixedIncome', x: 0, y: 0, w: 4, h: 9 },
        { i: 'variableIncome', x: 4, y: 0, w: 4, h: 9 },
        { i: 'leisureList', x: 8, y: 0, w: 4, h: 9 },
        { i: 'monthlyInvestments', x: 12, y: 0, w: 4, h: 9 },
        { i: 'fixedExpenses', x: 0, y: 9, w: 8, h: 9 },
        { i: 'variableExpenses', x: 8, y: 9, w: 8, h: 9 },
        { i: 'investmentsList', x: 0, y: 18, w: 16, h: 9 },
        { i: 'monthlyChart', x: 0, y: 27, w: 8, h: 10 },
        { i: 'pieChart', x: 8, y: 27, w: 8, h: 10 },
        { i: 'budget', x: 0, y: 37, w: 8, h: 9 },
        { i: 'investmentsProj', x: 8, y: 37, w: 8, h: 9 },
    ],
};

const defaultSettings: AppSettings = {
    title: 'Dashboard Financeiro',
    subtitle: 'Bem-vindo ao seu painel de controle financeiro pessoal.',
    theme: 'system',
    investmentProjectionTimeframe: '5Y',
    predictContributions: true,
    budgetGoals: {
        fixed: 40,
        variable: 30,
        leisure: 10,
        investment: 20,
    },
    categories: {
        INCOME: {
            fixed: ['Salário Fixo'],
            variable: ['Salário Extra', 'Freelance', 'Rendimento Investimentos', 'Outros'],
            investment: ['Resgate de Aplicação', 'Dividendos', 'Juros sobre Capital', 'Venda de Ativos']
        },
        EXPENSE: {
            fixed: ['Aluguel', 'Condomínio', 'Financiamento Carro', 'Plano de Saúde', 'Internet', 'Celular', 'Gás', 'Luz', 'Dízimo', 'Seguro'],
            variable: ['Supermercado', 'Transporte', 'Empréstimo', 'Cartão de Crédito', 'Compras Online', 'Comida'],
            leisure: ['Restaurantes/Jantares', 'Viagens', 'Hobbies', 'Streaming', 'Lazer e Outros'],
            investment: ['Fundo de Emergência', 'Ações', 'Fundos Imobiliários', 'Caixinha', 'Investimentos'],
        }
    }
};

type QuickAddData = {
    mode: TransactionModalMode;
    expenseType?: ExpenseType;
    incomeType?: IncomeType;
};

const AppContent: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investmentBoxes, setInvestmentBoxes] = useState<InvestmentBox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const { addToast } = useToast();
  
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [quickAddData, setQuickAddData] = useState<QuickAddData | null>(null);

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; actions: ActionButton[]; }>({ isOpen: false, title: '', message: '', actions: [] });

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [layouts, setLayouts] = useState<any>(defaultLayouts);
  const [cardColors, setCardColors] = useState<Record<string, string>>({});
  const [cardTitles, setCardTitles] = useState<Record<string, string>>(defaultCardTitles);
  
  const summaryRef = useRef<HTMLDivElement>(null);
  const [isSummarySticky, setIsSummarySticky] = useState(false);
  const [summaryHeight, setSummaryHeight] = useState(0);

  const isPreferencesLoaded = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reloadData = useCallback(async (showToast = false) => {
      setIsMutating(true);
      try {
          const [transData, boxesData] = await Promise.all([
              transactionService.fetchAll(),
              investmentService.fetchBoxes()
          ]);
          setTransactions(transData);
          setInvestmentBoxes(boxesData);
          if (showToast) addToast({ message: 'Dados atualizados!', type: 'success' });
      } catch (error) {
          console.error("Failed to reload data", error);
          addToast({ message: 'Falha ao buscar dados.', type: 'error' });
      } finally {
          setIsMutating(false);
      }
  }, [addToast]);
  
  const initialLoad = useCallback(async () => {
      setIsLoading(true);
      try {
          const prefs = await settingsService.fetchPreferences();
          if (prefs) {
              const loadedSettings = prefs.settings;
              // FIX: Safely access properties on potentially incomplete loadedSettings object.
              // This resolves type errors where properties might not exist.
              const finalSettings = {
                  ...defaultSettings,
                  ...(loadedSettings || {}),
                  categories: loadedSettings?.categories || defaultSettings.categories,
                  budgetGoals: loadedSettings?.budgetGoals || defaultSettings.budgetGoals,
                  investmentProjectionTimeframe: loadedSettings?.investmentProjectionTimeframe || defaultSettings.investmentProjectionTimeframe,
                  predictContributions: typeof loadedSettings?.predictContributions === 'boolean' ? loadedSettings.predictContributions : defaultSettings.predictContributions,
              };
              setSettings(finalSettings);
              
              if (prefs.layouts && prefs.layouts.lg) {
                  const hasInvestCard = prefs.layouts.lg.some((l: any) => l.i === 'monthlyInvestments');
                  if (!hasInvestCard) {
                       const defaultInvestCard = defaultLayouts.lg.find(l => l.i === 'monthlyInvestments');
                       if (defaultInvestCard) {
                           const newLayout = [...prefs.layouts.lg, defaultInvestCard];
                           setLayouts({ ...prefs.layouts, lg: newLayout });
                       } else {
                           setLayouts(prefs.layouts);
                       }
                  } else {
                      setLayouts(prefs.layouts);
                  }
              } else {
                  setLayouts(defaultLayouts);
              }

              if (prefs.cardColors) setCardColors(prefs.cardColors);
              if (prefs.cardTitles) setCardTitles({...defaultCardTitles, ...prefs.cardTitles});
          }
          isPreferencesLoaded.current = true;
          await reloadData();
      } catch (error) {
          console.error("Error during initial load", error);
      } finally {
          setIsLoading(false);
      }
  }, [reloadData]);

  useEffect(() => {
      initialLoad();
  }, [initialLoad]);

  useEffect(() => {
      if (!isPreferencesLoaded.current) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(() => {
          const prefs: UserPreferences = { settings, layouts, cardColors, cardTitles };
          settingsService.savePreferences(prefs).catch(err => console.error("Error auto-saving preferences:", err));
      }, 2000);

      return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [settings, layouts, cardColors, cardTitles]);

  useEffect(() => {
    const stickyElement = summaryRef.current;
    if (!stickyElement) return;
    const initialTop = stickyElement.offsetTop;
    const handleScroll = () => {
      const shouldBeSticky = window.scrollY > initialTop;
      setIsSummarySticky(prevIsSticky => {
        if (shouldBeSticky && !prevIsSticky) { setSummaryHeight(stickyElement.offsetHeight); return true; }
        if (!shouldBeSticky && prevIsSticky) { return false; }
        return prevIsSticky;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('scroll', handleScroll); };
  }, []);


  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, [settings.theme]);

  const handleLayoutChange = (layout: any, allLayouts: any) => { if (isPreferencesLoaded.current) setLayouts(allLayouts); };
  const handleCardColorChange = (cardKey: string, color: string) => { setCardColors(prev => ({ ...prev, [cardKey]: color })); };
  const handleThemeChange = (theme: AppSettings['theme']) => { setSettings(prev => ({...prev, theme})); };
  const handleQuickAdd = (data: QuickAddData) => { setQuickAddData(data); setIsModalOpen(true); };

  const handleCardTitleChange = (cardKey: string, newTitle: string) => {
    setCardTitles(prev => ({ ...prev, [cardKey]: newTitle }));
  };

  const handleInvestmentProjectionSettingsChange = (newProjSettings: { timeframe?: Timeframe; predictContributions?: boolean }) => {
    setSettings(prev => {
      const updatedValues: Partial<Pick<AppSettings, 'investmentProjectionTimeframe' | 'predictContributions'>> = {};
      if (newProjSettings.timeframe !== undefined) {
        updatedValues.investmentProjectionTimeframe = newProjSettings.timeframe;
      }
      if (newProjSettings.predictContributions !== undefined) {
        updatedValues.predictContributions = newProjSettings.predictContributions;
      }
      return { ...prev, ...updatedValues };
    });
  };

  const handleMigrateData = async () => {
      setIsMutating(true);
      try {
        const count = await transactionService.migrateFromLocalStorage();
        await reloadData(true);
        addToast({ message: `${count} transações foram migradas com sucesso!`, type: 'success'});
      } catch(e) {
        addToast({ message: 'Erro durante a migração.', type: 'error' });
      }
      setIsMutating(false);
  };

  const handleCreateBox = async (box: Omit<InvestmentBox, 'id'>) => {
      setIsMutating(true);
      const newBox = await investmentService.createBox(box);
      if (newBox) {
          setInvestmentBoxes(prev => [...prev, newBox]);
          addToast({ message: `Caixinha "${newBox.name}" criada!`, type: 'success' });
      } else {
          addToast({ message: 'Falha ao criar caixinha.', type: 'error' });
      }
      setIsMutating(false);
      return newBox;
  };
  
  const handleUpdateBox = async (box: InvestmentBox) => {
      setIsMutating(true);
      try {
          const updatedBox = await investmentService.updateBox(box);
          if (updatedBox) {
              setInvestmentBoxes(prev => prev.map(b => b.id === updatedBox.id ? updatedBox : b));
              addToast({ message: `Caixinha "${updatedBox.name}" atualizada!`, type: 'success' });
          }
      } catch(error) {
          addToast({ message: 'Erro ao atualizar caixinha.', type: 'error' });
      }
      setIsMutating(false);
  }

  const handleDeleteBox = async (id: string) => {
      const deleteAction = async () => {
        setIsMutating(true);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
            await investmentService.deleteBox(id);
            await reloadData();
            addToast({ message: 'Caixinha excluída.', type: 'success' });
        } catch (error: any) {
            addToast({ message: `Erro ao excluir: ${error.message}`, type: 'error' });
        } finally {
            setIsMutating(false);
        }
      };
      setConfirmModal({ isOpen: true, title: "Excluir Caixinha", message: "Tem certeza?", actions: [{ label: 'Excluir', onClick: deleteAction, style: 'danger' }] });
  };

  const handleAddTransaction = useCallback(async (transactionData: Omit<Transaction, 'id' | 'date'>, isRecurring: boolean, attachment: File | null) => {
    const executeAdd = async () => {
        setIsMutating(true);
        setConfirmModal(prev => ({...prev, isOpen: false}));

        try {
            let attachmentUrl: string | undefined = undefined;
            if (attachment) {
                attachmentUrl = await transactionService.uploadAttachment(attachment);
            }

            const newTransactions: Omit<Transaction, 'id'>[] = [];
            const recurrenceId = isRecurring ? crypto.randomUUID() : undefined;
            const baseDate = new Date(selectedMonth);
            let day: number;
            const dueDateObj = transactionData.dueDate ? new Date(transactionData.dueDate + 'T12:00:00') : null;

            // Get Current Date in Brasilia Time (UTC-3) to fix timezone issues
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const brasiliaOffset = -3 * 60 * 60 * 1000; // -3 hours
            const brasiliaDate = new Date(utc + brasiliaOffset);

            if (dueDateObj && !isNaN(dueDateObj.getTime())) {
                day = dueDateObj.getDate();
            } else {
                // Verifica se o mês selecionado é o mês atual (Brasília)
                if (baseDate.getMonth() === brasiliaDate.getMonth() && baseDate.getFullYear() === brasiliaDate.getFullYear()) {
                    day = brasiliaDate.getDate();
                } else {
                    day = baseDate.getDate(); // Mantém o dia 1 do mês selecionado
                }
            }
            
            baseDate.setDate(day);
            if (isNaN(baseDate.getTime())) { addToast({message: 'Data inválida.', type: 'error'}); return; }

            const transactionForCurrentMonth = {
                ...transactionData,
                date: baseDate,
                paid: transactionData.type === 'income' ? undefined : (transactionData.dueDate ? false : undefined),
                attachmentUrl,
            };

            if (isRecurring) {
                newTransactions.push({ ...transactionForCurrentMonth, recurrenceId });
                const startMonth = baseDate.getMonth();
                const startYear = baseDate.getFullYear();
                for (let i = 1; i < 12; i++) { // Start from 1 as current month is already handled
                    const transactionDate = new Date(startYear, startMonth + i, day);
                    if (transactionDate.getFullYear() > startYear) break;
                    // Attachment is only for the first transaction
                    newTransactions.push({ ...transactionData, date: transactionDate, dueDate: transactionData.dueDate ? new Date(transactionDate).toISOString().split('T')[0] : undefined, paid: transactionData.type === 'income' ? undefined : false, recurrenceId, attachmentUrl: undefined });
                }
            } else {
                newTransactions.push(transactionForCurrentMonth);
            }

            await transactionService.create(newTransactions);
            await reloadData();
            addToast({ message: 'Transação adicionada!', type: 'success' });
        } catch (error: any) {
            addToast({message: `Erro ao salvar: ${error.message || 'Erro desconhecido.'}`, type: 'error'});
        } finally {
            setIsMutating(false);
        }
    };
    
    if (isRecurring) {
        setConfirmModal({ isOpen: true, title: 'Confirmar Recorrência', message: `Isso criará múltiplas ocorrências para o resto do ano. Continuar?`, actions: [{ label: 'Confirmar', onClick: executeAdd, style: 'primary' }] });
    } else {
        executeAdd();
    }
  }, [selectedMonth, addToast, reloadData]);
  
  const handleUpdateTransaction = useCallback(async (updatedTransaction: Transaction, attachment: File | null, removeAttachment: boolean) => {
    const executeUpate = async (applyToFuture: boolean) => {
        setIsMutating(true);
        setConfirmModal(prev => ({...prev, isOpen: false}));
        
        try {
            let finalTransaction = { ...updatedTransaction };
            const originalTransaction = transactions.find(t => t.id === updatedTransaction.id);
            
            // Handle attachment removal
            if (removeAttachment && originalTransaction?.attachmentUrl) {
                await transactionService.deleteAttachment(originalTransaction.attachmentUrl);
                finalTransaction.attachmentUrl = undefined;
            }
            
            // Handle new attachment upload
            if (attachment) {
                // If there was an old attachment, remove it first
                if (originalTransaction?.attachmentUrl) {
                    await transactionService.deleteAttachment(originalTransaction.attachmentUrl);
                }
                finalTransaction.attachmentUrl = await transactionService.uploadAttachment(attachment);
            }

            if (finalTransaction.dueDate) {
                const dueDateCheck = new Date(finalTransaction.dueDate);
                if(isNaN(dueDateCheck.getTime())) finalTransaction.dueDate = undefined;
            }

            await transactionService.update(finalTransaction, applyToFuture);
            await reloadData();
            addToast({ message: 'Transação atualizada!', type: 'success' });
        } catch (error: any) { addToast({ message: `Erro ao atualizar: ${error.message || 'Erro desconhecido.'}`, type: 'error' }); }
        finally { setIsMutating(false); }
    };
    if (updatedTransaction.recurrenceId) {
        setConfirmModal({ isOpen: true, title: "Editar Recorrência", message: "Aplicar alterações para:", actions: [ { label: 'Apenas Esta', onClick: () => executeUpate(false), style: 'primary' }, { label: 'Esta e Futuras', onClick: () => executeUpate(true), style: 'warning' }, ] });
    } else {
        executeUpate(false);
    }
  }, [addToast, reloadData, transactions]);

  const handleDeleteTransaction = useCallback(async (id: string, recurrenceId?: string) => {
      const executeDelete = async (applyToFuture: boolean) => {
          setIsMutating(true);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          try {
            const transactionToDelete = transactions.find(t => t.id === id);
            // Delete attachment if it exists
            if (transactionToDelete?.attachmentUrl) {
                await transactionService.deleteAttachment(transactionToDelete.attachmentUrl);
            }
            // If deleting future recurrences, we don't delete their attachments as it's complex and rare.
            // The main use case is deleting one by one.

            await transactionService.delete(id, recurrenceId, applyToFuture);
            await reloadData();
            addToast({ message: 'Transação excluída.', type: 'success' });
          } catch (error: any) {
            addToast({ message: `Erro ao excluir: ${error.message}`, type: 'error' });
          } finally {
            setIsMutating(false);
          }
      };
      if (recurrenceId) {
          setConfirmModal({ isOpen: true, title: "Excluir Recorrência", message: "Deseja excluir apenas esta ou todas as futuras?", actions: [ { label: 'Apenas Esta', onClick: () => executeDelete(false), style: 'warning' }, { label: 'Esta e Futuras', onClick: () => executeDelete(true), style: 'danger' } ] });
      } else {
          setConfirmModal({ isOpen: true, title: "Excluir Transação", message: "Tem certeza?", actions: [{ label: 'Excluir', onClick: () => executeDelete(false), style: 'danger' }] });
      }
  }, [addToast, reloadData, transactions]);

  const handleCloneMonth = useCallback(async () => {
    const transactionsToClone = transactions.filter(t => t.date.getMonth() === selectedMonth.getMonth() && t.date.getFullYear() === selectedMonth.getFullYear());
    if (transactionsToClone.length === 0) {
        addToast({ message: 'Mês atual não possui transações para copiar.', type: 'error' });
        return;
    }

    const nextMonthDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
    const nextMonthHasTransactions = transactions.some(t => t.date.getMonth() === nextMonthDate.getMonth() && t.date.getFullYear() === nextMonthDate.getFullYear());

    const executeClone = async () => {
        setIsMutating(true);
        setConfirmModal(prev => ({...prev, isOpen: false}));

        const clonedTransactions = transactionsToClone.map(t => {
            const newDate = new Date(t.date);
            newDate.setMonth(newDate.getMonth() + 1);

            const newDueDate = t.dueDate ? new Date(t.dueDate) : null;
            if (newDueDate) {
                newDueDate.setMonth(newDueDate.getMonth() + 1);
            }

            const { id, recurrenceId, paid, attachmentUrl, ...rest } = t;
            return {
                ...rest,
                date: newDate,
                dueDate: newDueDate ? newDueDate.toISOString().split('T')[0] : undefined,
                paid: t.type === 'expense' ? false : undefined,
                attachmentUrl: undefined, // Attachments are not cloned
            };
        });

        try {
            await transactionService.create(clonedTransactions);
            await reloadData();
            setSelectedMonth(nextMonthDate);
            addToast({ message: `Mês clonado com sucesso para ${nextMonthDate.toLocaleDateString('pt-BR', {month: 'long'})}!`, type: 'success' });
        } catch (error) {
            addToast({ message: 'Erro ao clonar o mês.', type: 'error' });
        } finally {
            setIsMutating(false);
        }
    };

    if (nextMonthHasTransactions) {
        setConfirmModal({
            isOpen: true,
            title: "Confirmar Cópia",
            message: `O mês de destino já possui transações. Deseja adicionar as transações copiadas mesmo assim?`,
            actions: [{ label: 'Confirmar Cópia', onClick: executeClone, style: 'warning' }]
        });
    } else {
        executeClone();
    }
}, [transactions, selectedMonth, addToast, reloadData]);


  const togglePaidStatus = useCallback(async (id: string, paidStatus: boolean) => {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, paid: paidStatus } : t));
      try { await transactionService.togglePaid(id, paidStatus); } 
      catch (error) { reloadData(); addToast({message: 'Falha ao atualizar status.', type: 'error'}); }
  }, [addToast, reloadData]);
  
  const openEditModal = useCallback((transaction: Transaction) => { setEditingTransaction(transaction); setIsModalOpen(true); }, []);
  const closeModal = () => { setIsModalOpen(false); setEditingTransaction(null); setQuickAddData(null); }

  const transactionsForSelectedMonth = useMemo(() => transactions.filter(t => t.date.getMonth() === selectedMonth.getMonth() && t.date.getFullYear() === selectedMonth.getFullYear()), [transactions, selectedMonth]);
  
  const { totalIncome, totalExpenses, totalInvested, balance, paidExpenses } = useMemo(() => { 
    const income = transactionsForSelectedMonth.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0); 
    const expenses = transactionsForSelectedMonth.filter(t=>t.type==='expense'&&t.expenseType!=='investment').reduce((s,t)=>s+t.amount,0); 
    
    // Calculate Investments (Net: Contributions - Redemptions)
    const investedExpenses = transactionsForSelectedMonth.filter(t=>t.type==='expense'&&t.expenseType==='investment').reduce((s,t)=>s+t.amount,0); 
    const investedIncomes = transactionsForSelectedMonth.filter(t=>t.type==='income'&&t.incomeType==='investment').reduce((s,t)=>s+t.amount,0); 
    const investedNet = investedExpenses - investedIncomes;

    const paid = transactionsForSelectedMonth.filter(t=>t.type==='expense'&&t.paid).reduce((s,t)=>s+t.amount,0); 
    
    // Balance = All Income - (Normal Expenses + Investment Contributions)
    // This maintains accurate cash flow tracking.
    const balance = income - (expenses + investedExpenses);

    return { 
        totalIncome: income, 
        totalExpenses: expenses, 
        totalInvested: investedNet, 
        balance: balance, 
        paidExpenses: paid, 
    }; 
  }, [transactionsForSelectedMonth]);
  
  const overdueBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactionsForSelectedMonth.filter(t => t.type === 'expense' && t.dueDate && !t.paid && new Date(t.dueDate + 'T12:00:00') < today);
  }, [transactionsForSelectedMonth]);

  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return transactionsForSelectedMonth
      .filter(t => t.type === 'expense' && t.dueDate && !t.paid && new Date(t.dueDate + 'T12:00:00') >= today)
      .sort((a, b) => new Date(a.dueDate! + 'T12:00:00').getTime() - new Date(b.dueDate! + 'T12:00:00').getTime());
  }, [transactionsForSelectedMonth]);
  
  const fixedIncome = useMemo(() => transactionsForSelectedMonth.filter(t => t.type === 'income' && t.incomeType === 'fixed'), [transactionsForSelectedMonth]);
  const variableIncome = useMemo(() => transactionsForSelectedMonth.filter(t => t.type === 'income' && t.incomeType === 'variable'), [transactionsForSelectedMonth]);
  const fixedExpenses = useMemo(() => transactionsForSelectedMonth.filter(t => t.type === 'expense' && t.expenseType === 'fixed'), [transactionsForSelectedMonth]);
  const variableExpenses = useMemo(() => transactionsForSelectedMonth.filter(t => t.type === 'expense' && t.expenseType === 'variable'), [transactionsForSelectedMonth]);
  const leisureExpenses = useMemo(() => transactionsForSelectedMonth.filter(t => t.type === 'expense' && t.expenseType === 'leisure'), [transactionsForSelectedMonth]);
  
  const investmentTransactions = useMemo(() => 
    transactionsForSelectedMonth.filter(t => t.expenseType === 'investment' || t.incomeType === 'investment')
    .sort((a, b) => a.date.getTime() - b.date.getTime()), 
  [transactionsForSelectedMonth]);

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-200">
        <div className="fixed top-0 left-0 h-full z-20 w-64"> 
            <MonthlySummarySidebar 
                allTransactions={transactions} 
                selectedMonth={selectedMonth} 
                onSelectMonth={setSelectedMonth} 
                onCloneMonth={handleCloneMonth}
                hasTransactions={transactionsForSelectedMonth.length > 0}
            /> 
        </div>
        <main className="ml-64 flex-1 p-4 sm:p-6 lg:p-8">
            <Header title={settings.title} subtitle={settings.subtitle} theme={settings.theme} onAddTransaction={() => setIsModalOpen(true)} onOpenSettings={() => setIsSettingsModalOpen(true)} onThemeChange={handleThemeChange} isMutating={isMutating} />
            <div ref={summaryRef}><div className={`transition-all duration-300 ${isSummarySticky ? 'fixed top-0 left-64 right-0 z-30 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-md py-2 px-4' : ''}`}><Summary totalIncome={totalIncome} totalExpenses={totalExpenses} totalInvested={totalInvested} balance={balance} nextBill={upcomingBills[0]} paidExpenses={paidExpenses} overdueBills={overdueBills} isSticky={isSummarySticky} /></div></div>
            {isSummarySticky && <div style={{ height: summaryHeight }} />}
            {isLoading ? (<div className="flex items-center justify-center h-96"><p className="text-gray-500 animate-pulse">Carregando dados...</p></div>) : (
            <ResponsiveGridLayout className="layout mt-8" layouts={layouts} onLayoutChange={handleLayoutChange} breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} cols={{ lg: 16, md: 12, sm: 8, xs: 4, xxs: 2 }} rowHeight={30} draggableHandle=".drag-handle">
                <div key="fixedIncome"><DashboardCard title={cardTitles.fixedIncome} cardKey="fixedIncome" onTitleChange={handleCardTitleChange} onColorChange={handleCardColorChange} cardColor={cardColors['fixedIncome']} onQuickAdd={() => handleQuickAdd({ mode: 'income', incomeType: 'fixed'})}><CategoryDetailList transactions={fixedIncome} onEdit={openEditModal} onDelete={handleDeleteTransaction} /></DashboardCard></div>
                <div key="variableIncome"><DashboardCard title={cardTitles.variableIncome} cardKey="variableIncome" onTitleChange={handleCardTitleChange} onColorChange={handleCardColorChange} cardColor={cardColors['variableIncome']} onQuickAdd={() => handleQuickAdd({ mode: 'income', incomeType: 'variable'})}><CategoryDetailList transactions={variableIncome} onEdit={openEditModal} onDelete={handleDeleteTransaction} /></DashboardCard></div>
                <div key="leisureList"><DashboardCard title={cardTitles.leisureList} cardKey="leisureList" onTitleChange={handleCardTitleChange} onColorChange={handleCardColorChange} cardColor={cardColors['leisureList']} onQuickAdd={() => handleQuickAdd({ mode: 'expense', expenseType: 'leisure' })}><CategoryDetailList transactions={leisureExpenses} onTogglePaid={togglePaidStatus} onEdit={openEditModal} onDelete={handleDeleteTransaction}/></DashboardCard></div>
                
                <div key="monthlyInvestments">
                    <DashboardCard title={cardTitles.monthlyInvestments} cardKey="monthlyInvestments" onTitleChange={handleCardTitleChange} onColorChange={handleCardColorChange} cardColor={cardColors['monthlyInvestments']} onQuickAdd={() => handleQuickAdd({ mode: 'investment'})}>
                        <CategoryDetailList 
                            transactions={investmentTransactions} 
                            investmentBoxes={investmentBoxes}
                            onEdit={openEditModal} 
                            onDelete={handleDeleteTransaction}
                        />
                    </DashboardCard>
                </div>

                <div key="fixedExpenses"><DashboardCard title={cardTitles.fixedExpenses} cardKey="fixedExpenses" onTitleChange={handleCardTitleChange} onColorChange={handleCardColorChange} cardColor={cardColors['fixedExpenses']} onQuickAdd={() => handleQuickAdd({ mode: 'expense', expenseType: 'fixed' })}><CategoryDetailList transactions={fixedExpenses} onTogglePaid={togglePaidStatus} onEdit={openEditModal} onDelete={handleDeleteTransaction}/></DashboardCard></div>
                <div key="variableExpenses"><DashboardCard title={cardTitles.variableExpenses} cardKey="variableExpenses" onTitleChange={handleCardTitleChange} onColorChange={handleCardColorChange} cardColor={cardColors['variableExpenses']} onQuickAdd={() => handleQuickAdd({ mode: 'expense', expenseType: 'variable' })}><CategoryDetailList transactions={variableExpenses} onTogglePaid={togglePaidStatus} onEdit={openEditModal} onDelete={handleDeleteTransaction}/></DashboardCard></div>
                <div key="investmentsList"><DashboardCard title={cardTitles.investmentsList} cardKey="investmentsList" onTitleChange={handleCardTitleChange} onColorChange={handleCardColorChange} cardColor={cardColors['investmentsList']}><InvestmentBoxList boxes={investmentBoxes} transactions={transactions} onDeleteBox={handleDeleteBox} onUpdateBox={handleUpdateBox} onCreateBox={handleCreateBox}/></DashboardCard></div>
                <div key="monthlyChart"><DashboardCard title={cardTitles.monthlyChart} cardKey="monthlyChart" onTitleChange={handleCardTitleChange} onColorChange={handleCardColorChange} cardColor={cardColors['monthlyChart']}><MonthlyBarChart transactions={transactions} /></DashboardCard></div>
                <div key="pieChart"><DashboardCard title={cardTitles.pieChart} cardKey="pieChart" onTitleChange={handleCardTitleChange} onColorChange={handleCardColorChange} cardColor={cardColors['pieChart']}><CategoryPieChart transactions={transactionsForSelectedMonth} /></DashboardCard></div>
                <div key="budget"><DashboardCard title={cardTitles.budget} cardKey="budget" onTitleChange={handleCardTitleChange} onColorChange={handleCardColorChange} cardColor={cardColors['budget']}><BudgetPlanner transactions={transactionsForSelectedMonth} goals={settings.budgetGoals} /></DashboardCard></div>
                <div key="investmentsProj"><DashboardCard title={cardTitles.investmentsProj} cardKey="investmentsProj" onTitleChange={handleCardTitleChange} onColorChange={handleCardColorChange} cardColor={cardColors['investmentsProj']}><InvestmentProjections allTransactions={transactions} investmentBoxes={investmentBoxes} selectedMonth={selectedMonth} timeframe={settings.investmentProjectionTimeframe} predictContributions={settings.predictContributions} onSettingsChange={handleInvestmentProjectionSettingsChange}/></DashboardCard></div>
            </ResponsiveGridLayout>
            )}
        </main>
        {isModalOpen && <AddTransactionModal isOpen={isModalOpen} onClose={closeModal} onAddTransaction={handleAddTransaction} onUpdateTransaction={handleUpdateTransaction} transactionToEdit={editingTransaction} quickAddData={quickAddData} selectedMonth={selectedMonth} investmentBoxes={investmentBoxes} onCreateBox={handleCreateBox} settings={settings} />}
        {isSettingsModalOpen && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={settings} onSave={setSettings} onMigrateData={handleMigrateData}/>}
        <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} title={confirmModal.title} message={confirmModal.message} actions={confirmModal.actions}/>
    </div>
  );
};
const App: React.FC = () => ( <ToastProvider> <AppContent /> </ToastProvider> );
export default App;