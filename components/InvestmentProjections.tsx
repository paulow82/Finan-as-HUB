import React, { useMemo, useState, useEffect } from 'react';
import { ComposedChart, Area, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Transaction, InvestmentBox, Timeframe } from '../types';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';

interface InvestmentProjectionsProps {
  allTransactions: Transaction[];
  investmentBoxes: InvestmentBox[];
  selectedMonth: Date;
  timeframe: Timeframe;
  predictContributions: boolean;
  manualContribution?: number;
  onSettingsChange: (newSettings: { investmentProjectionTimeframe?: Timeframe; predictContributions?: boolean; manualContribution?: number }) => void;
}

const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const formattedLabel = typeof label === 'number' 
            ? new Date(label).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) 
            : label;

        const patrimony = payload.find((p: any) => p.dataKey === 'patrimony');
        const principal = payload.find((p: any) => p.dataKey === 'principal');
        const movement = payload.find((p: any) => p.dataKey === 'movement');

        return (
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 text-xs sm:text-sm ring-1 ring-black/5 z-50">
                <p className="font-bold text-gray-900 dark:text-gray-100 mb-2 capitalize">{formattedLabel}</p>
                <div className="space-y-1">
                    {patrimony && (
                        <p style={{ color: '#10b981' }} className="font-bold flex justify-between gap-4">
                            <span>Patrimônio:</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patrimony.value)}</span>
                        </p>
                    )}
                    {principal && (
                         <p style={{ color: '#9ca3af' }} className="text-xs flex justify-between gap-4">
                            <span>Total Investido:</span>
                            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(principal.value)}</span>
                        </p>
                    )}
                    {movement && Math.abs(movement.value) > 0 && (
                        <p className={`text-xs flex justify-between gap-4 font-bold ${movement.value >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            <span>Movimentação:</span>
                            <span>{movement.value >= 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(movement.value)}</span>
                        </p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

const InvestmentProjections: React.FC<InvestmentProjectionsProps> = ({ allTransactions, investmentBoxes, selectedMonth, timeframe, predictContributions, manualContribution, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState<string>('geral');
  const [activePoint, setActivePoint] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
      if (manualContribution !== undefined && manualContribution !== null) {
          setInputValue(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(manualContribution));
      } else {
          setInputValue('');
      }
  }, [manualContribution]);

  const { projectionData, hasAnyInvestment, autoContributionForPlaceholder } = useMemo(() => {
    const validBoxIds = new Set(investmentBoxes.map(b => b.id));
    const allInvestmentTransactions = allTransactions.filter(t => 
        t.investmentBoxId && 
        validBoxIds.has(t.investmentBoxId)
    );

    if (allInvestmentTransactions.length === 0) {
        return { projectionData: null, hasAnyInvestment: false, autoContributionForPlaceholder: 0 };
    }

    let targetTransactions = allInvestmentTransactions;
    if (activeTab !== 'geral') {
        targetTransactions = allInvestmentTransactions.filter(t => t.investmentBoxId === activeTab);
    }

    if (targetTransactions.length === 0) {
         return { projectionData: null, hasAnyInvestment: true, autoContributionForPlaceholder: 0 };
    }

    const transactionsByBox: Record<string, Transaction[]> = {};
    targetTransactions.forEach(t => {
        const boxId = t.investmentBoxId!; 
        if (!transactionsByBox[boxId]) transactionsByBox[boxId] = [];
        transactionsByBox[boxId].push(t);
    });

    // Encontrar a data da primeira movimentação
    let globalFirstDate = new Date();
    targetTransactions.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate < globalFirstDate) globalFirstDate = tDate;
    });
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    // Define a data final da projeção com base no timeframe selecionado
    const futureMonths = timeframe === '1Y' ? 12 : timeframe === '5Y' ? 60 : timeframe === '10Y' ? 120 : 240;
    const globalEndDate = new Date(today.getFullYear(), today.getMonth() + futureMonths, 1);

    const dailyAggregator = new Map<number, { patrimony: number, principal: number, dailyMovement: number }>();
    
    const contributionsByBox: Record<string, number> = {};
    let totalAutoContribution = 0;
    
    Object.entries(transactionsByBox).forEach(([boxId, transactions]) => {
        const flowsByMonth: Record<string, number> = {};
        transactions.forEach(t => {
            const tDate = new Date(t.date);
            const monthKey = `${tDate.getFullYear()}-${tDate.getMonth()}`;
            const amount = t.type === 'expense' ? t.amount : -t.amount;
            flowsByMonth[monthKey] = (flowsByMonth[monthKey] || 0) + amount;
        });

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        let recentSum = 0;
        let recentCount = 0;
        Object.entries(flowsByMonth).forEach(([key, flow]) => {
             const [year, month] = key.split('-').map(Number);
             const date = new Date(year, month, 1);
             if (date >= sixMonthsAgo && flow > 0) {
                 recentSum += flow;
                 recentCount++;
             }
        });
        const boxProjectedContribution = recentCount > 0 ? recentSum / recentCount : 0;
        contributionsByBox[boxId] = boxProjectedContribution;
        totalAutoContribution += boxProjectedContribution;
    });

    const effectiveTotalContribution = predictContributions
        ? (manualContribution !== undefined && manualContribution !== null ? manualContribution : totalAutoContribution)
        : 0;

    let weightedRateSum = 0;
    let weightedRateDivisor = 0;

    Object.entries(transactionsByBox).forEach(([boxId, transactions]) => {
        let annualInterestRate = 0.10;
        const box = investmentBoxes.find(b => b.id === boxId);
        if (box?.interestRate) annualInterestRate = box.interestRate / 100;
        
        const dailyInterestRate = Math.pow(1 + annualInterestRate, 1/365) - 1;

        const flowsByDate: Record<string, number> = {};
        transactions.forEach(t => {
            const tDate = new Date(t.date);
            const dateKey = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate()).toISOString().split('T')[0];
            const amount = t.type === 'expense' ? t.amount : -t.amount;
            flowsByDate[dateKey] = (flowsByDate[dateKey] || 0) + amount;
        });
        
        const boxShare = totalAutoContribution > 0 ? (contributionsByBox[boxId] / totalAutoContribution) : (1 / Object.keys(transactionsByBox).length);
        const projectedFlowForThisBox = effectiveTotalContribution * boxShare;

        let currentBalanceForWeight = 0;
        transactions.forEach(t => currentBalanceForWeight += (t.type === 'expense' ? t.amount : -t.amount));
        if (currentBalanceForWeight < 0) currentBalanceForWeight = 0;
        weightedRateSum += annualInterestRate * currentBalanceForWeight;
        weightedRateDivisor += currentBalanceForWeight;

        // O gráfico começa na data da primeira movimentação
        let cursorDate = new Date(globalFirstDate.getFullYear(), globalFirstDate.getMonth(), globalFirstDate.getDate());
        let currentPatrimony = 0;
        let currentPrincipal = 0;
        let accumulatedProfit = 0;

        while (cursorDate <= globalEndDate) {
            const timestamp = cursorDate.getTime();
            const dateKey = cursorDate.toISOString().split('T')[0];
            const isFuture = cursorDate > today;
            
            if (currentPatrimony > 0) {
                const dailyInterest = currentPatrimony * dailyInterestRate;
                accumulatedProfit += dailyInterest;
                currentPatrimony += dailyInterest;
            }

            let dailyFlow = flowsByDate[dateKey] || 0;
            
            if (isFuture && predictContributions && cursorDate.getDate() === 1) {
                dailyFlow += projectedFlowForThisBox;
            }

            if (dailyFlow > 0) {
                currentPrincipal += dailyFlow;
            } else {
                const withdrawalAmount = Math.abs(dailyFlow);
                const withdrawnFromPrincipal = Math.min(withdrawalAmount, currentPrincipal);
                const withdrawnFromProfit = withdrawalAmount - withdrawnFromPrincipal;
                
                currentPrincipal -= withdrawnFromPrincipal;
                accumulatedProfit -= withdrawnFromProfit;
            }
            currentPatrimony += dailyFlow;

            const existing = dailyAggregator.get(timestamp) || { patrimony: 0, principal: 0, dailyMovement: 0 };
            dailyAggregator.set(timestamp, {
                patrimony: existing.patrimony + currentPatrimony,
                principal: existing.principal + currentPrincipal,
                dailyMovement: existing.dailyMovement + dailyFlow
            });

            cursorDate.setDate(cursorDate.getDate() + 1);
        }
    });

    const sortedTimestamps = Array.from(dailyAggregator.keys()).sort((a, b) => a - b);
    const data = [];
    
    let currentTotalPatrimonyValue = 0;
    let currentTotalPrincipalValue = 0;
    let lastPushedMonthIdentifier: string | null = null;
    
    let accumulatedVisualMovement = 0;
    let currentVisualMonth = -1;

    for (const timestamp of sortedTimestamps) {
        const entry = dailyAggregator.get(timestamp)!;
        const date = new Date(timestamp);
        const isToday = timestamp === today.getTime();
        const currentMonth = date.getMonth();
        const currentYear = date.getFullYear();
        const currentMonthIdentifier = `${currentYear}-${currentMonth}`;

        if (currentMonth !== currentVisualMonth) {
            accumulatedVisualMovement = 0;
            currentVisualMonth = currentMonth;
        }
        accumulatedVisualMovement += entry.dailyMovement;

        if (isToday) {
            currentTotalPatrimonyValue = entry.patrimony;
            currentTotalPrincipalValue = entry.principal;
        }

        const isFirstDayOfMonth = date.getDate() === 1;
        const isFuture = date > today;

        let shouldPush = false;
        if (isToday) shouldPush = true;
        else if (isFirstDayOfMonth) {
             let meetsTimeframeCriteria = false;
            if (!isFuture) meetsTimeframeCriteria = true; 
            else if (timeframe === '1Y' || timeframe === '5Y') meetsTimeframeCriteria = true;
            else if (timeframe === '10Y') meetsTimeframeCriteria = (date.getMonth() % 3 === 0); 
            else meetsTimeframeCriteria = (date.getMonth() === 0); 

            if (meetsTimeframeCriteria) {
                 if (lastPushedMonthIdentifier === currentMonthIdentifier) {
                     shouldPush = false; 
                 } else {
                     shouldPush = true;
                 }
            }
        } else if (timestamp === sortedTimestamps[sortedTimestamps.length - 1]) {
            shouldPush = true;
        }

        if (shouldPush) {
            data.push({
                uniqueId: timestamp,
                fullDate: date.toISOString(),
                patrimony: Number(entry.patrimony.toFixed(2)),
                principal: Number(entry.principal.toFixed(2)),
                movement: Number(accumulatedVisualMovement.toFixed(2)),
                isToday
            });
            lastPushedMonthIdentifier = currentMonthIdentifier;
        }
    }

    const finalDataPoint = data[data.length - 1];
    const finalProjectedPatrimony = finalDataPoint ? finalDataPoint.patrimony : currentTotalPatrimonyValue;
    
    const totalFutureContributions = effectiveTotalContribution * futureMonths;
    const finalProjectedProfit = finalProjectedPatrimony - currentTotalPatrimonyValue - totalFutureContributions;

    const totalInterestProfit = currentTotalPatrimonyValue - currentTotalPrincipalValue;
    const profitPercentage = currentTotalPrincipalValue !== 0 ? (totalInterestProfit / currentTotalPrincipalValue) * 100 : 0;
    
    const avgAnnualRate = weightedRateDivisor > 0 ? weightedRateSum / weightedRateDivisor : 0.10;

    const todayDataPoint = data.find(d => d.isToday);

    const projectionResult = { 
        data, 
        totalCurrentCapital: currentTotalPatrimonyValue,
        totalInterestProfit,
        profitPercentage, 
        annualInterestRate: avgAnnualRate, 
        projectedMonthlyContribution: effectiveTotalContribution,
        todayUniqueId: todayDataPoint ? todayDataPoint.uniqueId : null,
        finalProjectedPatrimony,
        finalProjectedProfit,
    };
    
    return { projectionData: projectionResult, hasAnyInvestment: true, autoContributionForPlaceholder: totalAutoContribution };
  }, [allTransactions, investmentBoxes, timeframe, activeTab, selectedMonth, predictContributions, manualContribution]);

  const displayValues = useMemo(() => {
      if (!projectionData) return null;

      if (activePoint) {
          const patrimony = activePoint.patrimony;
          const principal = activePoint.principal;
          const profit = patrimony - principal;
          const date = new Date(activePoint.uniqueId);
          const label = `Em ${date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
          
          return { label, patrimony, profit };
      }

      return {
          label: 'Patrimônio Atual',
          patrimony: projectionData.totalCurrentCapital,
          profit: projectionData.totalInterestProfit,
      };
  }, [activePoint, projectionData]);

  const handleManualContributionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, '');
    
    if (numericValue === '') {
        setInputValue('');
        onSettingsChange({ manualContribution: undefined });
        return;
    }

    const floatValue = parseFloat(numericValue) / 100;
    setInputValue(new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(floatValue));
    onSettingsChange({ manualContribution: floatValue });
  };

  const TabButton: React.FC<{id: string; text: string}> = ({id, text}) => (
      <button
        onClick={() => setActiveTab(id)}
        className={`whitespace-nowrap px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all ${
            activeTab === id 
            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
        }`}
       >
           {text}
       </button>
  );

  const formatDateTick = (timestamp: number) => {
      const date = new Date(timestamp);
      // Sempre formata como Mês/Ano (ex: dez/24) para evitar ambiguidade quando o gráfico
      // abrange mais de um ano (ex: Dez 2024 e Dez 2025).
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
  };

  const handleMouseMove = (state: any) => {
      if (state && state.activePayload && state.activePayload.length) {
          setActivePoint(state.activePayload[0].payload);
      }
  };

  const handleMouseLeave = () => {
      setActivePoint(null);
  };

  if (!hasAnyInvestment) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          Adicione investimentos para ver suas projeções.
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex-1 w-full flex flex-col overflow-hidden">
       {/* Responsive Header Container with Flex Wrap for Small Screens/Resizing */}
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 flex-shrink-0 flex-wrap">
            {/* Tabs Row */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto custom-scrollbar hide-scrollbar min-w-0 max-w-full">
                <TabButton id="geral" text="Geral" />
                {investmentBoxes.map(box => <TabButton key={box.id} id={box.id} text={box.name} />)}
            </div>
            
            {/* Mobile Metrics Display (Patrimony & Projection) */}
            {projectionData && displayValues && (
                <div className="md:hidden grid grid-cols-2 gap-3 mb-2 w-full">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className={`text-[10px] uppercase font-bold mb-1 truncate ${activePoint ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                            {displayValues.label}
                        </p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(displayValues.patrimony)}
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1 truncate">
                            Projeção Final ({timeframe})
                        </p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 truncate">
                            {new Intl.NumberFormat('pt-BR', { notation: 'compact', style: 'currency', currency: 'BRL' }).format(projectionData.finalProjectedPatrimony)}
                        </p>
                    </div>
                </div>
            )}

            {/* Controls Row (Stacked on Mobile, Inline on Desktop) */}
            <div className="flex flex-col sm:flex-row justify-between sm:justify-end items-start sm:items-center gap-3 w-full md:w-auto flex-wrap">
                {/* Timeframe Selector */}
                <div className="w-full sm:w-auto flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    {(['1Y', '5Y', '10Y', '20Y'] as Timeframe[]).map((t) => (
                        <button key={t} onClick={() => onSettingsChange({ investmentProjectionTimeframe: t })} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${ timeframe === t ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                            {t}
                        </button>
                    ))}
                </div>

                {/* Simulation Controls */}
                <div className="w-full sm:w-auto flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1.5 px-3">
                    <label htmlFor="predict-toggle" className="text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer select-none whitespace-nowrap">
                        Simular Aportes
                    </label>
                    <div className="relative inline-block w-8 h-4 align-middle select-none transition duration-200 ease-in flex-shrink-0">
                        <input 
                            type="checkbox" 
                            name="predict-toggle" 
                            id="predict-toggle" 
                            checked={predictContributions}
                            onChange={(e) => onSettingsChange({ predictContributions: e.target.checked })}
                            className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-primary transition-all duration-200"
                        />
                        <label htmlFor="predict-toggle" className={`toggle-label block overflow-hidden h-4 rounded-full cursor-pointer transition-colors duration-200 ${predictContributions ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></label>
                    </div>
                    {predictContributions && (
                        <div className="relative animate-fade-in flex-1 sm:flex-none ml-2">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                            <input 
                                type="text"
                                inputMode="numeric"
                                value={inputValue}
                                onChange={handleManualContributionChange}
                                placeholder={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(autoContributionForPlaceholder || 0)}
                                className="w-full sm:w-28 h-7 pl-6 pr-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md text-xs text-right font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>
       </div>

       {projectionData && displayValues ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Desktop Metrics (Hidden on Mobile) - Using Flex Wrap for better responsiveness */}
          <div className="hidden md:flex flex-wrap justify-between items-end gap-6 mb-4 flex-shrink-0 w-full">
              <div className="flex flex-col justify-end min-w-[200px] flex-1">
                  <p className={`text-sm mb-1 font-medium transition-colors ${activePoint ? 'text-primary font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                      {displayValues.label}
                  </p>
                  <h3 className="text-2xl sm:text-4xl 2xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayValues.patrimony)}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className={`flex items-center gap-1 font-bold ${displayValues.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {displayValues.profit >= 0 ? <ArrowUpIcon className="w-4 h-4"/> : <ArrowDownIcon className="w-4 h-4"/>}
                          <span>Lucro (Juros): {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayValues.profit)}</span>
                          <div className="group relative flex items-center">
                            <InfoIcon className="w-3.5 h-3.5 text-gray-400 hover:text-primary cursor-help ml-1" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                Cálculo: Juros Compostos diários (Overnight). Taxa configurada: {(projectionData.annualInterestRate * 100).toFixed(1)}% a.a.
                            </div>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="hidden lg:block w-px h-16 bg-gray-200 dark:bg-gray-700 mx-2 self-center"></div>

              <div className="flex flex-col justify-end min-w-[200px] flex-1 text-right lg:text-left">
                   <p className="text-sm mb-1 font-medium text-gray-500 dark:text-gray-400">
                      Projeção Final ({timeframe})
                   </p>
                   <h3 className="text-xl sm:text-3xl 2xl:text-4xl font-bold text-gray-700 dark:text-gray-300 tracking-tight truncate opacity-90">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projectionData.finalProjectedPatrimony)}
                   </h3>
                   <div className="flex items-center justify-end lg:justify-start gap-4 mt-2 text-sm">
                       <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Lucro: +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projectionData.finalProjectedProfit)}
                       </span>
                       {predictContributions && projectionData.projectedMonthlyContribution > 0 && (
                            <span className="text-blue-500 font-medium text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                                +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(projectionData.projectedMonthlyContribution)}/mês
                            </span>
                       )}
                   </div>
              </div>
          </div>
          
          <div className="flex-1 w-full -ml-2 mt-2 md:mt-0 relative min-h-[250px]">
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={projectionData.data} 
                  margin={{ top: 35, right: 10, left: 0, bottom: 0 }}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <defs>
                      <linearGradient id="colorPatrimony" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis 
                      dataKey="uniqueId" 
                      tickFormatter={formatDateTick}
                      tick={{fontSize: 10, fill: '#9ca3af'}} 
                      axisLine={false} 
                      tickLine={false} 
                      minTickGap={20}
                  />
                  <YAxis 
                      tickFormatter={(value) => { if (value >= 1000000) return `R$${(value/1000000).toFixed(1)}M`; if (value >= 1000) return `R$${(value/1000).toFixed(0)}k`; return `R$${value}`;}} 
                      tick={{fontSize: 10, fill: '#9ca3af'}} 
                      axisLine={false} 
                      tickLine={false} 
                      width={40}
                  />
                  <Tooltip 
                      content={<CustomTooltip />} 
                      cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  
                  {projectionData.todayUniqueId && (
                      <ReferenceLine x={projectionData.todayUniqueId} stroke="#6b7280" strokeDasharray="3 3" label={{ position: 'top', value: 'Hoje', fill: '#6b7280', fontSize: 10 }} />
                  )}

                  <Bar dataKey="movement" barSize={6}>
                      {projectionData.data.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.movement >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.8} />
                      ))}
                  </Bar>

                  <Area 
                      type="linear" 
                      dataKey="patrimony" 
                      name="Patrimônio"
                      stroke="#10b981" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorPatrimony)" 
                      animationDuration={1000}
                  />
                  <Area 
                      type="linear" 
                      dataKey="principal" 
                      name="Total Investido" 
                      stroke="#6b7280" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                      fill="none"
                      opacity={0.5}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
       ) : (
        <div className="h-full flex flex-col items-center justify-center space-y-3 text-center p-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <ArrowUpIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div className="max-w-xs">
                <p className="font-medium text-gray-900 dark:text-gray-100">Nenhuma movimentação</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Não encontramos transações para esta caixinha. Adicione aportes para visualizar a projeção.
                </p>
            </div>
        </div>
       )}
    </div>
  );
};

export default InvestmentProjections;