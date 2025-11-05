export interface AddTransaction {
  type: "expense" | "income";
  category: string;
  subcategory: string;
  thirdCategory: string;
  description: string;
  amount: number;
  date: Date;
}

export type RequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface APIResponse {
  success: boolean;
  message: string;
  data: any;
  errors: any;
}

export interface Transaction {
  transactionId: string;
  userId: string;
  balanceId: string;
  amount: number;
  currency: string;
  date: {
    _seconds: number;
    _nanoseconds: number;
  };
  type: "expense" | "income";
  category: string;
  subcategory: string;
  thirdCategory: string;
  description: string;
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
