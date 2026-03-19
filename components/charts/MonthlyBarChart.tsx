import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction, InvestmentBox } from '../../types';

interface MonthlyBarChartProps {
  transactions: Transaction[];
  selectedMonth?: Date;
  investmentBoxes?: InvestmentBox[];
  isMobile?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Encontra os valores no payload
        const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
        const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
        const netWorth = payload.find((p: any) => p.dataKey === 'netWorth')?.value || 0;
        
        // Calcula o saldo do mês para exibição rápida
        const balance = income - expense;

        return (
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 text-sm min-w-[200px] z-50">
                <p className="font-bold text-gray-800 dark:text-gray-100 mb-3 capitalize text-base border-b border-gray-100 dark:border-gray-700 pb-2">{label}</p>
                
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-gray-600 dark:text-gray-300">Receitas</span>
                        </div>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                            <span className="text-gray-600 dark:text-gray-300">Despesas</span>
                        </div>
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-1 border-t border-dashed border-gray-200 dark:border-gray-700 mt-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Saldo do Mês</span>
                        </div>
                        <span className={`font-bold ${balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
                            {balance > 0 ? '+' : ''}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100 dark:border-gray-700 mt-1">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-1 rounded-full bg-blue-500"></div>
                            <span className="text-gray-800 dark:text-gray-200 font-medium">Patrimônio</span>
                        </div>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-base">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netWorth)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ transactions, selectedMonth, investmentBoxes = [], isMobile = false }) => {
  const data = useMemo(() => {
    // 1. Configuração de Datas
    const viewStartDate = selectedMonth ? new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1) : new Date();
    viewStartDate.setHours(0, 0, 0, 0);
    
    // Encontrar a primeira transação da história para calcular o patrimônio acumulado corretamente desde o início
    const sortedAllTransactions = [...transactions].sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        return aDate.getTime() - bDate.getTime();
    });
    const firstTransactionDate = sortedAllTransactions.length > 0 ? sortedAllTransactions[0].date : new Date();
    
    // O cálculo começa na data da primeira transação ou na data de visualização, o que vier antes
    const firstDate = new Date(firstTransactionDate);
    let cursorDate = new Date(firstDate < viewStartDate ? firstDate : viewStartDate);
    cursorDate.setHours(0,0,0,0);
    
    // Data final do gráfico (12 meses a partir do selecionado)
    const viewEndDate = new Date(viewStartDate.getFullYear(), viewStartDate.getMonth() + 11, 1); // Fim do período de visualização (aprox)
    // Ajusta para o último dia do último mês
    const loopEndDate = new Date(viewEndDate.getFullYear(), viewEndDate.getMonth() + 1, 0);

    // 2. Mapa de Transações por Data (para acesso rápido O(1) dentro do loop)
    const transactionsByDate: Record<string, Transaction[]> = {};
    sortedAllTransactions.forEach(t => {
        const tDate = new Date(t.date);
        const dateKey = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate()).toISOString().split('T')[0];
        if (!transactionsByDate[dateKey]) transactionsByDate[dateKey] = [];
        transactionsByDate[dateKey].push(t);
    });

    // 3. Estado das Caixinhas (Saldo Individual para aplicar juros específicos)
    const boxBalances: Record<string, number> = {};
    investmentBoxes.forEach(box => boxBalances[box.id] = 0);

    // 4. Estrutura para guardar os dados mensais que serão plotados
    const monthlyDataMap: Record<string, { income: number, expense: number, netWorth: number }> = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // 5. Loop de Simulação Diária (Juros Compostos)
    while (cursorDate <= loopEndDate) {
        const dateKey = cursorDate.toISOString().split('T')[0];
        const monthKey = `${cursorDate.getFullYear()}-${cursorDate.getMonth()}`;
        
        // A. Aplicar Juros do Dia Anterior (Overnight)
        investmentBoxes.forEach(box => {
            if (boxBalances[box.id] > 0) {
                const annualRate = (box.interestRate || 0) / 100;
                // Taxa diária equivalente
                const dailyRate = Math.pow(1 + annualRate, 1/365) - 1;
                boxBalances[box.id] += boxBalances[box.id] * dailyRate;
            }
        });

        // B. Processar Transações do Dia
        const todaysTransactions = transactionsByDate[dateKey] || [];
        
        // Acumuladores apenas para o mês de visualização (Barras)
        if (!monthlyDataMap[monthKey]) {
            monthlyDataMap[monthKey] = { income: 0, expense: 0, netWorth: 0 };
        }

        todaysTransactions.forEach(t => {
            // Atualiza saldos das caixinhas (Patrimônio)
            if (t.investmentBoxId) {
                if (t.type === 'expense') {
                    // Aporte (Adiciona ao saldo da caixinha)
                    boxBalances[t.investmentBoxId] = (boxBalances[t.investmentBoxId] || 0) + t.amount;
                } else {
                    // Resgate (Remove do saldo da caixinha)
                    boxBalances[t.investmentBoxId] = (boxBalances[t.investmentBoxId] || 0) - t.amount;
                }
            }

            // Atualiza Fluxo de Caixa (Barras) - Apenas se estiver dentro da janela de visualização (12 meses)
            if (cursorDate >= viewStartDate) {
                if (t.type === 'income') {
                    if (t.incomeType !== 'investment') {
                        monthlyDataMap[monthKey].income += t.amount;
                    }
                } else {
                    if (t.expenseType !== 'investment') {
                        monthlyDataMap[monthKey].expense += t.amount;
                    }
                }
            }
        });

        // C. Salvar o Patrimônio Total no final do dia
        // Para o gráfico, queremos o patrimônio no final de cada mês
        const totalNetWorth = Object.values(boxBalances).reduce((sum, val) => sum + val, 0);
        monthlyDataMap[monthKey].netWorth = totalNetWorth;

        // Avança um dia
        cursorDate.setDate(cursorDate.getDate() + 1);
    }

    // 6. Formatar Dados para o Recharts
    // MOBILE: Mostra apenas 6 meses. DESKTOP: Mostra 12 meses.
    const numberOfMonths = isMobile ? 6 : 12;
    const chartData = [];
    
    for (let i = 0; i < numberOfMonths; i++) {
        const currentMonthDate = new Date(viewStartDate.getFullYear(), viewStartDate.getMonth() + i, 1);
        const monthKey = `${currentMonthDate.getFullYear()}-${currentMonthDate.getMonth()}`;
        const data = monthlyDataMap[monthKey] || { income: 0, expense: 0, netWorth: 0 };

        // No mobile, removemos o ano do label para economizar espaço
        const label = isMobile 
            ? monthNames[currentMonthDate.getMonth()] 
            : `${monthNames[currentMonthDate.getMonth()]}/${currentMonthDate.getFullYear().toString().slice(-2)}`;

        chartData.push({
            monthKey,
            monthLabel: label,
            income: data.income,
            expense: data.expense,
            netWorth: data.netWorth
        });
    }
    
    return chartData;
  }, [transactions, selectedMonth, investmentBoxes, isMobile]);
  
  if (data.length === 0) {
    return (
       <div className="h-full flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 dark:text-gray-400">Não há dados suficientes para exibir o gráfico.</p>
      </div>
    );
  }

  // Ajustes de estilo baseados no dispositivo
  const barSize = isMobile ? 24 : 12; // Barras mais grossas no mobile
  const fontSize = isMobile ? 12 : 10;
  const barRadius: [number, number, number, number] = [4, 4, 0, 0];

  return (
    <div className="w-full h-full pt-2 min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
          barGap={isMobile ? 2 : 4}
        >
           <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.4}/>
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.4}/>
            </linearGradient>
            <filter id="shadow" height="200%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.3"/>
            </filter>
        </defs>

          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.08} vertical={false} stroke="#9ca3af" />
          
          <XAxis 
            dataKey="monthLabel" 
            axisLine={false}
            tickLine={false}
            tick={{fontSize: fontSize, fill: '#6b7280', fontWeight: 500}}
            dy={10}
            // Apenas no mobile forçamos o intervalo para 0 (mostrar tudo). 
            // No desktop (isMobile=false), deixamos o recharts calcular (undefined) para ocultar se não couber.
            interval={isMobile ? 0 : undefined} 
          />
          
          <YAxis 
            yAxisId="left"
            tickFormatter={(value) => {
                if(value >= 1000000) return `${(value/1000000).toFixed(1)}M`;
                if(value >= 1000) return `${(value/1000).toFixed(0)}k`;
                return value;
            }} 
            axisLine={false}
            tickLine={false}
            tick={{fontSize: 10, fill: '#9ca3af'}}
            width={35}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(156, 163, 175, 0.05)', radius: 8 }}
          />
          
          <Legend 
            wrapperStyle={{ paddingTop: '15px' }} 
            iconType="circle"
            formatter={(value) => <span className="text-gray-600 dark:text-gray-300 font-medium ml-1 text-xs">{value}</span>}
          />
          
          <Bar 
            yAxisId="left" 
            dataKey="income" 
            name="Receitas" 
            fill="url(#incomeGradient)" 
            barSize={barSize} 
            radius={barRadius}
            animationDuration={1500}
          />
          
          <Bar 
            yAxisId="left" 
            dataKey="expense" 
            name="Despesas" 
            fill="url(#expenseGradient)" 
            barSize={barSize} 
            radius={barRadius}
            animationDuration={1500}
            animationBegin={200}
          />
          
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="netWorth" 
            name="Patrimônio Total" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={isMobile} // Mostra pontos no mobile para facilitar leitura
            activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
            animationDuration={2000}
            style={{ filter: 'url(#shadow)' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyBarChart;