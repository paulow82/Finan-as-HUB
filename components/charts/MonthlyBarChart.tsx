import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../types';

interface MonthlyBarChartProps {
  transactions: Transaction[];
}

const RoundedBar = (props: any) => {
    const { fill, x, y, width, height } = props;
    const radius = 6;
    if (height === 0) return null;
    return <path d={`M${x},${y + radius} A${radius},${radius},0,0,1,${x + radius},${y} L${x + width - radius},${y} A${radius},${radius},0,0,1,${x + width},${y + radius} L${x + width},${height + y} L${x},${height + y} Z`} stroke="none" fill={fill} />;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <p className="font-bold text-gray-900 dark:text-gray-100">{label}</p>
                {payload.map((pld: any, index: number) => (
                    <p key={index} style={{ color: pld.payload.income > pld.payload.expense ? '#22c55e' : '#ef4444' }}>
                        <span style={{color: pld.fill}}>{`${pld.name}: `}</span>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pld.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};


const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const monthlyData: { [key: string]: { month: string; income: number; expense: number } } = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    transactions.forEach(t => {
      const monthIndex = t.date.getMonth();
      const year = t.date.getFullYear();
      const key = `${year}-${monthIndex}`;
      const monthName = `${monthNames[monthIndex]}/${year.toString().slice(-2)}`;

      if (!monthlyData[key]) {
        monthlyData[key] = { month: monthName, income: 0, expense: 0 };
      }

      if (t.type === 'income') {
        monthlyData[key].income += t.amount;
      } else {
        monthlyData[key].expense += t.amount;
      }
    });

    return Object.values(monthlyData).sort((a,b) => {
        const [aMonth, aYear] = a.month.split('/');
        const [bMonth, bYear] = b.month.split('/');
        if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
        return monthNames.indexOf(aMonth) - monthNames.indexOf(bMonth);
    }).slice(-12); // show last 12 months
  }, [transactions]);
  
  if (data.length === 0) {
    return (
       <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Não há dados suficientes para exibir o gráfico.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full pt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
           <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.4}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.4}/>
            </linearGradient>
        </defs>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
          />
          <Legend />
          <Bar dataKey="income" fill="url(#colorIncome)" name="Receitas" shape={<RoundedBar />} />
          <Bar dataKey="expense" fill="url(#colorExpense)" name="Despesas" shape={<RoundedBar />} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyBarChart;