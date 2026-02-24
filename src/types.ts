export interface Wallet {
  id: number;
  name: string;
  balance: number;
  monthly_limit: number;
  currency: string;
}

export interface Expense {
  id: number;
  wallet_id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface DashboardData {
  wallets: Wallet[];
  expenses: Expense[];
}
