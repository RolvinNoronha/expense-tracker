"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import AppService from "@/services/AppService";
import { Transaction, Account } from "@/store/interfaces";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LoaderCircleIcon,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Edit2,
  Trash2,
  FilterX,
  Wallet,
} from "lucide-react";
import categories from "@/lib/categories";
import EditTransactionModal from "@/components/EditTransactionModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { useFetchAccounts } from "@/hooks/hooks";

const TransactionsTable = () => {
  const { ref, inView } = useInView();

  const { data: accountsData } = useFetchAccounts();
  const accounts: Account[] = accountsData?.data?.accounts || [];

  // Account ID to Name mapping
  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => {
      map.set(acc.accountId, acc.accountName);
    });
    return map;
  }, [accounts]);

  // Generate selectable month options (e.g. Next month down to past 24 months)
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (let i = -1; i <= 24; i++) {
      const d = new Date(Date.UTC(currentYear, currentMonth - i, 1));
      const year = d.getUTCFullYear();
      const monthNum = String(d.getUTCMonth() + 1).padStart(2, "0");
      const val = `${year}-${monthNum}`;
      const label = d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
      const isCurrent = i === 0;
      options.push({
        value: val,
        label: isCurrent ? `${label} (Current)` : label,
      });
    }
    return options;
  }, []);

  // Filter state
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");

  // Modals state
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<
    string | null
  >(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery({
      queryKey: [
        "transactions",
        selectedMonth,
        selectedAccountId,
        selectedCategory,
        selectedSubcategory,
      ],
      queryFn: ({ pageParam }) =>
        AppService.getTransactions({
          limit: 15,
          lastTransactionId: pageParam as string | undefined,
          month: selectedMonth || undefined,
          accountId: selectedAccountId || undefined,
          category: selectedCategory || undefined,
          subcategory: selectedSubcategory || undefined,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => {
        return lastPage.data.hasMore
          ? lastPage.data.lastTransactionId
          : undefined;
      },
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const transactions: Transaction[] = useMemo(() => {
    return data?.pages.flatMap((page) => page.data.transactions) || [];
  }, [data]);

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
    setSelectedMonth("");
    setSelectedAccountId("");
    setSelectedCategory("");
    setSelectedSubcategory("");
  };

  const hasActiveFilters =
    selectedMonth !== "" ||
    selectedAccountId !== "" ||
    selectedCategory !== "" ||
    selectedSubcategory !== "";

  return (
    <Card className="shadow-xs">
      <CardHeader className="px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg sm:text-xl font-bold">
              Transaction History
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
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
      <CardContent className="px-3 sm:px-6 pb-6">
        <div className="space-y-5">
          {/* Filters Bar: Month, Account, Category, Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-secondary/30 rounded-xl border border-border">
            {/* Filter by Month - Select dropdown instead of freeform text input */}
            <div className="space-y-1">
              <label className="block text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Filter by Month
              </label>
              <Select
                value={selectedMonth || "ALL"}
                onValueChange={(value) => {
                  if (value === "ALL") {
                    setSelectedMonth("");
                    return;
                  }
                  setSelectedMonth(value);
                }}
              >
                <SelectTrigger className="w-full bg-card text-xs sm:text-sm">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent className="w-full max-h-60">
                  <SelectItem value="ALL">All Months</SelectItem>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Account */}
            <div className="space-y-1">
              <label className="block text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                <SelectTrigger className="w-full bg-card text-xs sm:text-sm">
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
              <label className="block text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                <SelectTrigger className="w-full bg-card text-xs sm:text-sm">
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
              <label className="block text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                  className="w-full bg-card text-xs sm:text-sm"
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

          {/* Transactions Content */}
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
              <p className="font-semibold text-foreground text-sm sm:text-base">
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
              {/* Mobile Card List View (sm:hidden) */}
              <div className="block sm:hidden space-y-2.5">
                {transactions.map((transaction) => {
                  const isIncome = transaction.type === "income";
                  const isTransfer = transaction.type === "transfer";
                  const isExpense = transaction.type === "expense";

                  return (
                    <div
                      key={transaction.transactionId}
                      className="p-3 rounded-xl border border-border bg-card shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
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
                          <p className="font-semibold text-xs text-foreground truncate">
                            {isTransfer
                              ? "Transfer"
                              : capitalizeWords(
                                  transaction.category || "General",
                                )}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-bold shrink-0 ${
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
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-[11px] font-medium text-foreground truncate max-w-35">
                          {getAccountLabel(transaction)}
                        </span>
                        <span>{formatDate(transaction.date)}</span>
                      </div>

                      {transaction.description && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {transaction.description}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTransaction(transaction)}
                          className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeletingTransactionId(transaction.transactionId)
                          }
                          className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (hidden sm:block) */}
              <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
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
