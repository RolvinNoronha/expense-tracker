"use client";

import { useState, useEffect } from "react";
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
  Edit2,
  Trash2,
  LoaderCircleIcon,
  FilterX,
  Wallet,
} from "lucide-react";
import { Account, Transaction } from "@/store/interfaces";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetchAccounts, useFetchTransactions } from "@/hooks/hooks";
import { useInView } from "react-intersection-observer";
import EditTransactionModal from "@/components/EditTransactionModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import categories from "@/lib/categories";

const TransactionsTable = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<
    string | null
  >(null);

  const { data: accountsData } = useFetchAccounts();
  const accounts: Account[] = accountsData?.data?.accounts || [];

  const accountMap = new Map<string, string>();
  accounts.forEach((acc) => {
    accountMap.set(acc.accountId, acc.accountName);
  });

  const { ref, inView } = useInView();

  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFetchTransactions({
      accountId: selectedAccountId || undefined,
      category: selectedCategory || undefined,
      subcategory: selectedSubcategory || undefined,
    });

  useEffect(() => {
    if (data) {
      const txns = data.pages.map((page) => page.data.transactions || []);
      setTransactions(txns.flat());
    }
  }, [data]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

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
    if (!timestamp) return "—";
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

  const clearAllFilters = () => {
    setSelectedAccountId("");
    setSelectedCategory("");
    setSelectedSubcategory("");
  };

  const hasActiveFilters =
    selectedAccountId !== "" ||
    selectedCategory !== "" ||
    selectedSubcategory !== "";

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl font-bold">
              Transaction History
            </CardTitle>
            <CardDescription>
              {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""} loaded
            </CardDescription>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground gap-1 self-start sm:self-auto"
            >
              <FilterX className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Filters Bar: Account, Category, Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-secondary/30 rounded-xl border border-border">
            {/* Filter by Account */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Filter by Account
              </label>
              <Select
                value={selectedAccountId}
                onValueChange={(value) => {
                  if (value === "ALL") {
                    setSelectedAccountId("");
                    return;
                  }
                  setSelectedAccountId(value);
                }}
              >
                <SelectTrigger className="w-full bg-card">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="ALL">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem
                      key={account.accountId}
                      value={account.accountId}
                    >
                      {account.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Category */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Filter by Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  if (value === "ALL") {
                    setSelectedCategory("");
                    setSelectedSubcategory("");
                    return;
                  }
                  setSelectedCategory(value);
                  setSelectedSubcategory("");
                }}
              >
                <SelectTrigger className="w-full bg-card">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {Object.keys(categories).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {capitalizeWords(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Subcategory */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Filter by Subcategory
              </label>
              <Select
                value={selectedSubcategory}
                onValueChange={(value) => {
                  if (value === "ALL") {
                    setSelectedSubcategory("");
                    return;
                  }
                  setSelectedSubcategory(value);
                }}
                disabled={!selectedCategory}
              >
                <SelectTrigger
                  disabled={!selectedCategory}
                  className="w-full bg-card"
                >
                  <SelectValue
                    placeholder={
                      selectedCategory
                        ? "All Subcategories"
                        : "Select Category first"
                    }
                  />
                </SelectTrigger>
                {selectedCategory ? (
                  <SelectContent className="w-full">
                    <SelectItem value="ALL">All Subcategories</SelectItem>
                    {categories[
                      selectedCategory as keyof typeof categories
                    ]?.map((subcat) => (
                      <SelectItem key={subcat} value={subcat}>
                        {capitalizeWords(subcat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                ) : null}
              </Select>
            </div>
          </div>

          {/* Transactions Table */}
          {isPending ? (
            <div className="py-16 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                <p className="text-xs text-muted-foreground">
                  Loading transactions...
                </p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto mb-3">
                <Wallet className="h-6 w-6" />
              </div>
              <p className="font-semibold text-foreground">
                No transactions found
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {hasActiveFilters
                  ? "No transactions match your current filters. Try resetting the filters."
                  : "Start recording your transactions using the + button."}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="mt-3 text-xs"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Account
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Category / Note
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((transaction) => {
                      const isIncome = transaction.type === "income";
                      const isTransfer = transaction.type === "transfer";
                      const isExpense = transaction.type === "expense";

                      return (
                        <tr
                          key={transaction.transactionId}
                          className="hover:bg-secondary/40 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                                isIncome
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : isTransfer
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400"
                              }`}
                              title={
                                isIncome
                                  ? "Income"
                                  : isTransfer
                                  ? "Transfer"
                                  : "Expense"
                              }
                            >
                              {isIncome ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : isTransfer ? (
                                <ArrowRightLeft className="h-4 w-4" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4" />
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 font-medium text-foreground">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-xs font-semibold text-foreground">
                              {getAccountLabel(transaction)}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-medium text-foreground">
                              {isTransfer
                                ? "Transfer"
                                : capitalizeWords(
                                    transaction.category || "General",
                                  )}
                              {transaction.subcategory && (
                                <span className="text-muted-foreground font-normal text-xs ml-1">
                                  • {capitalizeWords(transaction.subcategory)}
                                </span>
                              )}
                            </div>
                            {transaction.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                                {transaction.description}
                              </p>
                            )}
                          </td>

                          <td
                            className={`px-4 py-3.5 text-right font-bold ${
                              isIncome
                                ? "text-green-600 dark:text-green-400"
                                : isTransfer
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {isIncome ? "+" : isExpense ? "-" : "⇄"}
                            {formatCurrency(transaction.amount)}
                          </td>

                          <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(transaction.date)}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex gap-1.5 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setEditingTransaction(transaction)
                                }
                                title="Edit transaction"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setDeletingTransactionId(
                                    transaction.transactionId,
                                  )
                                }
                                title="Delete transaction"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Intersection observer trigger for infinite scroll */}
              <div ref={ref} className="h-4"></div>
            </>
          )}
        </div>

        {isFetchingNextPage && (
          <div className="flex justify-center items-center gap-2 py-4 text-xs text-muted-foreground">
            <LoaderCircleIcon className="h-4 w-4 animate-spin text-primary" />
            <span>Loading more transactions...</span>
          </div>
        )}
      </CardContent>

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSave={() => {}}
        />
      )}

      {deletingTransactionId && (
        <DeleteConfirmationModal
          txnId={deletingTransactionId}
          onClose={() => setDeletingTransactionId(null)}
        />
      )}
    </Card>
  );
};

export default TransactionsTable;
