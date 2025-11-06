"use client";

import { useState, useMemo, useEffect } from "react";
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
  Edit2,
  Trash2,
  LoaderCircleIcon,
} from "lucide-react";
import { Transaction } from "@/store/interfaces";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetchTransactions } from "@/hooks/hooks";
import { useInView } from "react-intersection-observer";
import EditTransactionModal from "@/components/EditTransactionModal";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import categories from "@/lib/categories";

const Transactions = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<
    string | null
  >(null);
  const { ref, inView } = useInView();

  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFetchTransactions(selectedCategory, selectedSubcategory);

  useEffect(() => {
    if (data) {
      const txns = data.pages.map((page) => {
        return page.data.transactions;
      });
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

  // const categories = useMemo(() => {
  //   const cats = new Set(transactions.map((t) => t.category));
  //   return Array.from(cats).sort();
  // }, [transactions]);

  // const subcategories = useMemo(() => {
  //   if (!selectedCategory) return [];
  //   const subs = new Set(
  //     transactions
  //       .filter((t) => t.category === selectedCategory)
  //       .map((t) => t.subcategory || "")
  //       .filter(Boolean)
  //   );
  //   return Array.from(subs).sort();
  // }, [transactions, selectedCategory]);

  const formatDate = (timestamp: {
    _seconds: number;
    _nanoseconds: number;
  }) => {
    const totalMilliseconds =
      timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1000000);
    const date = new Date(totalMilliseconds);
    return date.toDateString();
  };

  const capitalizeWords = (str: string) => {
    return str
      .split(/[-\s]/) // Split by spaces or hyphens
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" "); // Join back with hyphens
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction List</CardTitle>
        <CardDescription>
          {transactions.length} transaction
          {transactions.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  console.log(value, selectedCategory);
                  if (value === "reset") {
                    setSelectedCategory("");
                    setSelectedSubcategory("");
                    return;
                  }
                  setSelectedCategory(value);
                  setSelectedSubcategory("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {selectedCategory !== "" && (
                    <SelectItem value="reset">Clear selection</SelectItem>
                  )}
                  {Object.keys(categories).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {capitalizeWords(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subcategory
              </label>
              <Select
                value={selectedSubcategory}
                onValueChange={(value) => {
                  if (value === "reset") {
                    setSelectedSubcategory("");
                    return;
                  }
                  setSelectedSubcategory(value);
                }}
              >
                <SelectTrigger disabled={!selectedCategory} className="w-full">
                  <SelectValue placeholder="Select a subcategory" />
                </SelectTrigger>
                {selectedCategory ? (
                  <SelectContent className="w-full">
                    {selectedSubcategory !== "" && (
                      <SelectItem value="reset">Clear selection</SelectItem>
                    )}
                    {categories[
                      selectedCategory as keyof typeof categories
                    ].map((subcat) => (
                      <SelectItem key={subcat} value={subcat}>
                        {capitalizeWords(subcat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                ) : null}
              </Select>
            </div>
          </div>

          {/* Table */}
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {transactions.length === 0
                  ? "No transactions match your filters"
                  : "No transactions found"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Subcategory
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.transactionId}
                        className="border-b border-border hover:bg-secondary/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                              transaction.type === "income"
                                ? "bg-green-100 dark:bg-green-900/30"
                                : "bg-red-100 dark:bg-red-900/30"
                            }`}
                          >
                            {transaction.type === "income" ? (
                              <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowDownLeft className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {capitalizeWords(transaction.category)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {capitalizeWords(transaction.subcategory) || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {transaction.description || "—"}
                        </td>
                        <td
                          className={`px-4 py-3 text-right text-sm font-semibold ${
                            transaction.type === "income"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingTransaction(transaction)}
                              title="Edit transaction"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setDeletingTransactionId(
                                  transaction.transactionId
                                )
                              }
                              title="Delete transaction"
                              className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div ref={ref}></div>
            </>
          )}
        </div>
        {isFetchingNextPage ? (
          <div className="flex flex-col justify-center items-center my-2">
            <LoaderCircleIcon color="#53a500" className="animate-spin" />
            <p className="text-sm">Loading more transactions...</p>
          </div>
        ) : null}
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

export default Transactions;
