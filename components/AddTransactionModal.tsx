"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  LoaderCircleIcon,
  Plus,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import { AddTransaction, TransactionType, Account } from "@/store/interfaces";
import { toast } from "sonner";
import AppService from "@/services/AppService";
import categories from "@/lib/categories";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchAccounts } from "@/hooks/hooks";
import AddAccountModal from "@/components/AddAccountModal";

const AddTransactionModal = () => {
  const { data: accountsData } = useFetchAccounts();
  const accounts: Account[] = accountsData?.data?.accounts || [];

  const [open, setOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  const [type, setType] = useState<TransactionType>("expense");
  const [accountId, setAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [thirdCategory, setThirdCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string>("");
  const [adding, setAdding] = useState<boolean>(false);

  const queryClient = useQueryClient();

  // Auto-select first account if not selected
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].accountId);
    }
  }, [accounts, accountId]);

  const capitalizeWords = (str: string) => {
    return str
      .split(/[-\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const resetForm = () => {
    setCategory("");
    setSubCategory("");
    setThirdCategory("");
    setDescription("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setError("");
    if (accounts.length > 0) {
      setAccountId(accounts[0].accountId);
    }
    setToAccountId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountId) {
      setError("Please select an account.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (type === "transfer") {
      if (!toAccountId) {
        setError("Please select a destination account for the transfer.");
        return;
      }
      if (accountId === toAccountId) {
        setError("Source and destination accounts must be different.");
        return;
      }
    } else {
      if (!category || !subCategory) {
        setError("Please select a category and subcategory.");
        return;
      }
    }

    const [year, month, day] = date.split("-").map(Number);
    const now = new Date();
    const correctDate = new Date(
      year,
      month - 1,
      day,
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds(),
    );

    const payload: AddTransaction =
      type === "transfer"
        ? {
            type: "transfer",
            accountId: accountId,
            toAccountId: toAccountId,
            amount: numAmount,
            description: description.trim(),
            date: correctDate,
          }
        : {
            type: type,
            accountId: accountId,
            category: category,
            subcategory: subCategory,
            thirdCategory: thirdCategory.trim(),
            description: description.trim(),
            amount: numAmount,
            date: correctDate,
          };

    setAdding(true);
    setError("");

    try {
      const result = await AppService.addTransaction(payload);
      if (result.success) {
        toast.success("Transaction added successfully");
        resetForm();

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["accounts"] }),
          queryClient.invalidateQueries({ queryKey: ["monthly-summary"] }),
          queryClient.invalidateQueries({ queryKey: ["analytics"] }),
          queryClient.invalidateQueries({ queryKey: ["transactions"] }),
          queryClient.invalidateQueries({ queryKey: ["recent-transactions"] }),
        ]);

        setOpen(false);
      } else {
        setError(result.message || "Failed to add transaction");
        toast.error(result.message || "Failed to add transaction");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add transaction";
      setError(msg);
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setError("");
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105 z-40"
            size="icon"
            title="Add New Transaction"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
          showCloseButton={true}
        >
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Record an income, expense, or transfer between your accounts
            </DialogDescription>
          </DialogHeader>

          {accounts.length === 0 ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
              <p className="text-sm font-medium text-destructive">
                You must create at least one account before adding transactions.
              </p>
              <Button
                onClick={() => {
                  setOpen(false);
                  setIsAddAccountOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 text-xs"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create Account Now
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Transaction Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Transaction Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setType("expense");
                      setError("");
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      type === "expense"
                        ? "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 font-semibold"
                        : "border-border hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                    Expense
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setType("income");
                      setError("");
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      type === "income"
                        ? "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400 font-semibold"
                        : "border-border hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Income
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setType("transfer");
                      setError("");
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                      type === "transfer"
                        ? "bg-blue-500/10 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
                        : "border-border hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    Transfer
                  </button>
                </div>
              </div>

              {/* Account Selection */}
              {type === "transfer" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* From Account */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      From Account <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={accountId}
                      onValueChange={(val) => {
                        setAccountId(val);
                        setError("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Source Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.accountId} value={acc.accountId}>
                            {acc.accountName} (₹{acc.balance})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* To Account */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      To Account <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={toAccountId}
                      onValueChange={(val) => {
                        setToAccountId(val);
                        setError("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Destination Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts
                          .filter((acc) => acc.accountId !== accountId)
                          .map((acc) => (
                            <SelectItem
                              key={acc.accountId}
                              value={acc.accountId}
                            >
                              {acc.accountName} (₹{acc.balance})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>
                      Account <span className="text-destructive">*</span>
                    </span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      Account charged/credited
                    </span>
                  </label>
                  <Select
                    value={accountId}
                    onValueChange={(val) => {
                      setAccountId(val);
                      setError("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.accountId} value={acc.accountId}>
                          {acc.accountName} (Balance: ₹{acc.balance})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Category & Subcategory (for Income/Expense only) */}
              {type !== "transfer" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Category <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={category}
                      onValueChange={(value) => {
                        setCategory(value);
                        setSubCategory("");
                        setError("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(categories).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {capitalizeWords(cat)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Subcategory <span className="text-destructive">*</span>
                    </label>
                    <Select
                      value={subCategory}
                      onValueChange={(value) => {
                        setSubCategory(value);
                        setError("");
                      }}
                      disabled={!category}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            category
                              ? "Select Subcategory"
                              : "Choose Category first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {category &&
                          categories[category as keyof typeof categories]?.map(
                            (subCat) => (
                              <SelectItem key={subCat} value={subCat}>
                                {capitalizeWords(subCat)}
                              </SelectItem>
                            ),
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Amount (₹) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError("");
                    }}
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setError("");
                    }}
                    required
                  />
                </div>
              </div>

              {/* Additional Details (Optional, for Income/Expense) */}
              {type !== "transfer" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Store / Payee / Tag (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Amazon, Starbucks, Client X"
                    value={thirdCategory}
                    onChange={(e) => setThirdCategory(e.target.value)}
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description / Note (Optional)
                </label>
                <Input
                  placeholder="Add a brief note about this transaction"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  disabled={adding}
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  disabled={adding}
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {adding ? (
                    <>
                      <LoaderCircleIcon className="animate-spin mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    "Save Transaction"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AddAccountModal
        open={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
      />
    </>
  );
};

export default AddTransactionModal;
