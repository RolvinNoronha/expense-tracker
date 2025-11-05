import axios, { type AxiosRequestConfig } from "axios";
import type {
  AddTransaction,
  APIResponse,
  Balance,
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
    method: RequestMethod
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

    console.log(reqOptions);

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
      "POST"
    );
  };

  updateTransaction = async (
    txnId: string,
    txn: AddTransaction,
    balanceId: string | undefined
  ) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/transaction?transactionId=${txnId}&balanceId=${
        balanceId ? balanceId : ""
      }`,
      null,
      JSON.stringify(txn),
      "PATCH"
    );
  };

  deleteTransaction = async (txnId: string) => {
    await this.initToken();
    return this.request<APIResponse>(
      `/api/transaction?transactionId=${txnId}`,
      null,
      null,
      "DELETE"
    );
  };

  getTransactions = async (lastTransactionId?: string) => {
    await this.initToken();
    return this.request<GetTransactionsResponse>(
      `/api/transaction?lastTransactionId=${
        lastTransactionId ? lastTransactionId : ""
      }`,
      null,
      null,
      "GET"
    );
  };

  getTenTransactions = async () => {
    await this.initToken();
    return this.request<GetTenTransactionsResponse>(
      `/api/ten-transactions`,
      null,
      null,
      "GET"
    );
  };

  getTransactionsDays = async (days: number) => {
    await this.initToken();
    return this.request<GetTransactionsResponse>(
      `/api/get-transactions-days/${days}`,
      null,
      null,
      "GET"
    );
  };
}

const AppService = AppServiceClass.getInstance();

export default AppService;
