export type TransactionType = "expense" | "income" | "transfer";

export interface AddTransaction {
  type: TransactionType;
  accountId: string;
  toAccountId?: string;
  category?: string;
  subcategory?: string;
  thirdCategory?: string;
  description?: string;
  amount: number;
  date: Date | string;
}

export interface UpdateTransaction {
  accountId?: string;
  toAccountId?: string;
  category?: string;
  subcategory?: string;
  thirdCategory?: string;
  description?: string;
  amount?: number;
  date?: Date | string;
}

export type RequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors: any;
}

export interface Transaction {
  transactionId: string;
  userId: string;
  accountId: string;
  account?: string;
  toAccountId?: string;
  amount: number;
  currency: string;
  date: {
    _seconds: number;
    _nanoseconds: number;
  };
  type: TransactionType;
  category?: string;
  subcategory?: string;
  thirdCategory?: string;
  description?: string;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  updatedAt: {
    _seconds: number;
    _nanoseconds: number;
  };
}

export interface Balance {
  totalIncome: number;
  totalExpense: number;
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  updatedAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  userId: string;
  balanceId: string;
}

export interface Account {
  accountId: string;
  accountName: string;
  balance: number;
  userId: string;
  createdAt?: {
    _seconds: number;
    _nanoseconds: number;
  };
  updatedAt?: {
    _seconds: number;
    _nanoseconds: number;
  };
}

export interface AddAccount {
  accountName: string;
  balance?: number;
}

export interface MonthlySummaryData {
  userId: string;
  month: string;
  totalIncome: number;
  totalExpense: number;
  createdAt?: {
    _seconds: number;
    _nanoseconds: number;
  };
  updatedAt?: {
    _seconds: number;
    _nanoseconds: number;
  };
}

export interface AnalyticsData {
  byCategory: Record<string, { count: number; amount: number }>;
  byDay: Record<string, { income: number; expense: number; transfer: number }>;
  byType: Record<
    "income" | "expense" | "transfer",
    { count: number; amount: number }
  >;
}

export interface OwedEntry {
  owedId: string;
  userId: string;
  personName: string;
  amount: number;
  description: string;
  status: "pending" | "paid";
  createdAt: {
    _seconds: number;
    _nanoseconds: number;
  };
  updatedAt: {
    _seconds: number;
    _nanoseconds: number;
  };
}

export interface AddOwedEntry {
  personName: string;
  amount: number;
  description: string;
}
