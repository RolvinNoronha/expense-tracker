import axios, { type AxiosRequestConfig } from "axios";
import type {
  AddOwedEntry,
  AddTransaction,
  APIResponse,
  Balance,
  OwedEntry,
  RequestMethod,
  Transaction,
} from "@/store/interfaces";
import { auth } from "@/firebase/firebase";

interface GetTransactionsResponse extends APIResponse {
  data: {
    transactions: Transaction[];
    hasMore: boolean;
    lastTransactionId: string;
  };
}

interface GetTenTransactionsResponse extends APIResponse {
  data: {
    transactions: Transaction[];
  };
}

interface GetBalanceResponse extends APIResponse {
  data: {
    balance: Balance;
  };
}

interface GetOwedEntriesResponse extends APIResponse {
  data: {
    entries: OwedEntry[];
  };
}

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

  getBalance = async () => {
    await this.initToken();
    return this.request<GetBalanceResponse>(`/api/balance`, null, null, "GET");
  };

  addTransaction = async (t: AddTransaction, balanceId: string | undefined) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/transaction?balanceId=${balanceId ? balanceId : ""}`,
      null,
      JSON.stringify(t),
      "POST",
    );
  };

  updateTransaction = async (
    txnId: string,
    txn: AddTransaction,
    balanceId: string | undefined,
  ) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/transaction?transactionId=${txnId}&balanceId=${
        balanceId ? balanceId : ""
      }`,
      null,
      JSON.stringify(txn),
      "PATCH",
    );
  };

  deleteTransaction = async (txnId: string) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/transaction?transactionId=${txnId}`,
      null,
      null,
      "DELETE",
    );
  };

  getTransactions = async (
    lastTransactionId?: string,
    category?: string,
    subcategory?: string,
  ) => {
    await this.initToken();
    return this.request<GetTransactionsResponse>(
      `/api/transaction?lastTransactionId=${
        lastTransactionId ? lastTransactionId : ""
      }&category=${category ? category : ""}&subcategory=${
        subcategory ? subcategory : ""
      }`,
      null,
      null,
      "GET",
    );
  };

  getTenTransactions = async () => {
    await this.initToken();
    return this.request<GetTenTransactionsResponse>(
      `/api/ten-transactions`,
      null,
      null,
      "GET",
    );
  };

  getTransactionsDays = async (days: number) => {
    await this.initToken();
    return this.request<GetTransactionsResponse>(
      `/api/transactions-days/${days}`,
      null,
      null,
      "GET",
    );
  };

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
      `/api/owed-to-me?owedId=${owedId}`,
      null,
      null,
      "PATCH",
    );
  };

  deleteOwedEntry = async (owedId: string) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/owed-to-me?owedId=${owedId}`,
      null,
      null,
      "DELETE",
    );
  };
}

const AppService = AppServiceClass.getInstance();

export default AppService;
