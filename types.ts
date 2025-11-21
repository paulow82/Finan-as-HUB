

export type TransactionType = 'income' | 'expense';
export type ExpenseType = 'fixed' | 'variable' | 'investment' | 'leisure';
export type IncomeType = 'fixed' | 'variable' | 'investment';
export type Timeframe = '1Y' | '5Y' | '10Y' | '20Y';

export interface InvestmentBox {
  id: string;
  name: string;
  description?: string;
  targetAmount?: number;
  color?: string;
  interestRate?: number; // Ex: 100 (% do CDI) ou 0.5 (% a.m)
  taxRate?: number;      // Ex: 17.5 (% de IR)
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  expenseType?: ExpenseType;
  incomeType?: IncomeType;
  dueDate?: string;
  paid?: boolean;
  recurrenceId?: string; // To group recurring transactions
  interestRate?: number; // Monthly interest rate for investments
  investmentBoxId?: string; // Vínculo com a caixinha
  attachmentUrl?: string; // URL do comprovante
}

export type TransactionModalMode = 'income' | 'expense' | 'investment';

export interface AppSettings {
  title: string;
  subtitle: string;
  theme: 'light' | 'dark' | 'system';
  investmentProjectionTimeframe: Timeframe;
  predictContributions: boolean;
  budgetGoals: {
    fixed: number;
    variable: number;
    leisure: number;
    investment: number;
  };
  categories: {
    INCOME: {
      fixed: string[];
      variable: string[];
      investment: string[];
    };
    EXPENSE: {
      fixed: string[];
      variable: string[];
      leisure: string[];
      investment: string[];
    };
  };
}