"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowRight,
  ReceiptText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useFetchAccounts, useFetchRecentTransactions } from "@/hooks/hooks";
import { formatMonthLabel } from "@/components/MonthSelector";
import { Account, Transaction } from "@/store/interfaces";

interface TransactionsListProps {
  month: string;
}

const TransactionsList = ({ month }: TransactionsListProps) => {
  const { data, isPending } = useFetchRecentTransactions(month, 10);
  const { data: accountsData } = useFetchAccounts();
  const router = useRouter();

  const transactions: Transaction[] = data?.data?.transactions || [];
  const accounts: Account[] = accountsData?.data?.accounts || [];

  // Account ID to Name mapping
  const accountMap = new Map<string, string>();
  accounts.forEach((acc) => {
    accountMap.set(acc.accountId, acc.accountName);
  });

  const getAccountLabel = (transaction: Transaction) => {
    const fromName =
      accountMap.get(transaction.accountId || transaction.account || "") ||
      "Account";
    if (transaction.type === "transfer" && transaction.toAccountId) {
      const toName =
        accountMap.get(transaction.toAccountId) || "Destination Account";
      return `${fromName} → ${toName}`;
    }
    return fromName;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (timestamp?: {
    _seconds: number;
    _nanoseconds: number;
  }) => {
    if (!timestamp) return "";
    const totalMilliseconds =
      timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1000000);
    const date = new Date(totalMilliseconds);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const capitalizeWords = (str?: string) => {
    if (!str) return "";
    return str
      .split(/[-\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              Latest Transactions
            </CardTitle>
            <CardDescription>
              Showing latest {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""} for{" "}
              {formatMonthLabel(month)}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/transactions")}
            className="text-xs gap-1.5"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="py-12 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-xs text-muted-foreground">
                Loading transactions...
              </p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto mb-2">
              <ReceiptText className="h-5 w-5" />
            </div>
            <p className="font-medium text-foreground text-sm">
              No transactions for {formatMonthLabel(month)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add income, expense, or transfer transactions using the + button
              below.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";
              const isTransfer = transaction.type === "transfer";
              const isExpense = transaction.type === "expense";

              return (
                <div
                  key={transaction.transactionId}
                  className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border hover:bg-secondary/40 transition-all gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isIncome
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : isTransfer
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : isTransfer ? (
                        <ArrowRightLeft className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {isTransfer
                            ? "Account Transfer"
                            : capitalizeWords(transaction.category || "General")}
                        </p>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0">
                          {getAccountLabel(transaction)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {transaction.description ||
                          (transaction.subcategory
                            ? capitalizeWords(transaction.subcategory)
                            : isTransfer
                            ? "Transfer between accounts"
                            : "No description")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold ${
                        isIncome
                          ? "text-green-600 dark:text-green-400"
                          : isTransfer
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isIncome ? "+" : isExpense ? "-" : "⇄"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
