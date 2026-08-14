import axios, { type AxiosRequestConfig } from "axios";
import type {
  Account,
  AddAccount,
  AddOwedEntry,
  AddTransaction,
  AnalyticsData,
  APIResponse,
  MonthlySummaryData,
  OwedEntry,
  RequestMethod,
  Transaction,
  UpdateTransaction,
} from "@/store/interfaces";
import { auth } from "@/firebase/firebase";

export interface GetAccountsResponse extends APIResponse<{
  accounts: Account[];
}> {}

export interface GetMonthlySummaryResponse extends APIResponse<{
  monthlySummary: {
    data: MonthlySummaryData;
    created?: boolean;
  };
}> {}

export interface GetAnalyticsResponse extends APIResponse<AnalyticsData> {}

export interface GetTransactionsResponse extends APIResponse<{
  transactions: Transaction[];
  hasMore: boolean;
  lastTransactionId?: string;
}> {}

export interface GetOwedEntriesResponse extends APIResponse<{
  entries: OwedEntry[];
}> {}

class AppServiceClass {
  private static instance: AppServiceClass;
  private token: string | undefined;

  private async initToken() {
    this.token = await auth.currentUser?.getIdToken();
  }

  private constructor() {
    this.token = undefined;
  }

  private async request<T>(
    url: string,
    headers: Record<string, string> | null,
    data: string | null,
    method: RequestMethod,
  ): Promise<T> {
    const baseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
      ...(headers || {}),
    };

    const reqOptions: AxiosRequestConfig = {
      url: url,
      method: method,
      headers: baseHeaders,
    };

    if (method !== "GET" && data) {
      reqOptions.data = data;
    }

    try {
      const response = await axios.request(reqOptions);
      return response.data;
    } catch (error) {
      console.error("Failed to make an API request: ", error);
      throw error;
    }
  }

  public static getInstance(): AppServiceClass {
    if (!AppServiceClass.instance) {
      AppServiceClass.instance = new AppServiceClass();
    }
    return AppServiceClass.instance;
  }

  // Accounts
  getAccounts = async () => {
    await this.initToken();
    return this.request<GetAccountsResponse>(`/api/account`, null, null, "GET");
  };

  addAccount = async (account: AddAccount) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/account`,
      null,
      JSON.stringify(account),
      "POST",
    );
  };

  // Monthly Summary
  getMonthlySummary = async (month: string) => {
    await this.initToken();
    return this.request<GetMonthlySummaryResponse>(
      `/api/monthly-summary?month=${encodeURIComponent(month)}`,
      null,
      null,
      "GET",
    );
  };

  // Analytics
  getAnalytics = async (month: string) => {
    await this.initToken();
    return this.request<GetAnalyticsResponse>(
      `/api/analytics?month=${encodeURIComponent(month)}`,
      null,
      null,
      "GET",
    );
  };

  // Transactions
  getTransactions = async (params?: {
    lastTransactionId?: string;
    category?: string;
    subcategory?: string;
    accountId?: string;
    month?: string;
    limit?: number;
  }) => {
    await this.initToken();
    const searchParams = new URLSearchParams();
    if (params?.lastTransactionId) {
      searchParams.set("lastTransactionId", params.lastTransactionId);
    }
    if (params?.category) {
      searchParams.set("category", params.category);
    }
    if (params?.subcategory) {
      searchParams.set("subcategory", params.subcategory);
    }
    if (params?.accountId) {
      searchParams.set("accountId", params.accountId);
    }
    if (params?.month) {
      searchParams.set("month", params.month);
    }
    if (params?.limit) {
      searchParams.set("limit", params.limit.toString());
    }

    const queryString = searchParams.toString();
    const url = `/api/transaction${queryString ? `?${queryString}` : ""}`;

    return this.request<GetTransactionsResponse>(url, null, null, "GET");
  };

  getRecentTransactions = async (month: string, limit = 10) => {
    await this.initToken();
    return this.getTransactions({ month, limit });
  };

  addTransaction = async (t: AddTransaction) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/transaction`,
      null,
      JSON.stringify(t),
      "POST",
    );
  };

  updateTransaction = async (txnId: string, txn: UpdateTransaction) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/transaction?transactionId=${encodeURIComponent(txnId)}`,
      null,
      JSON.stringify(txn),
      "PATCH",
    );
  };

  deleteTransaction = async (txnId: string) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/transaction?transactionId=${encodeURIComponent(txnId)}`,
      null,
      null,
      "DELETE",
    );
  };

  // Owed Entries
  getOwedEntries = async () => {
    await this.initToken();
    return this.request<GetOwedEntriesResponse>(
      `/api/owed-to-me`,
      null,
      null,
      "GET",
    );
  };

  addOwedEntry = async (entry: AddOwedEntry) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/owed-to-me`,
      null,
      JSON.stringify(entry),
      "POST",
    );
  };

  markOwedEntryPaid = async (owedId: string) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/owed-to-me?owedId=${encodeURIComponent(owedId)}`,
      null,
      null,
      "PATCH",
    );
  };

  deleteOwedEntry = async (owedId: string) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/owed-to-me?owedId=${encodeURIComponent(owedId)}`,
      null,
      null,
      "DELETE",
    );
  };
}

const AppService = AppServiceClass.getInstance();

export default AppService;
