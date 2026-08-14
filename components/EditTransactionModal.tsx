"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Account,
  Transaction,
  UpdateTransaction,
} from "@/store/interfaces";
import categories from "@/lib/categories";
import {
  AlertCircle,
  LoaderCircleIcon,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import AppService from "@/services/AppService";
import { useFetchAccounts } from "@/hooks/hooks";

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSave?: () => void;
}

const EditTransactionModal = ({
  transaction,
  onClose,
  onSave,
}: EditTransactionModalProps) => {
  const queryClient = useQueryClient();
  const { data: accountsData } = useFetchAccounts();
  const accounts: Account[] = accountsData?.data?.accounts || [];

  const [accountId, setAccountId] = useState<string>(
    transaction.accountId || transaction.account || "",
  );
  const [toAccountId, setToAccountId] = useState<string>(
    transaction.toAccountId || "",
  );
  const [category, setCategory] = useState<string>(transaction.category || "");
  const [subCategory, setSubCategory] = useState<string>(
    transaction.subcategory || "",
  );
  const [thirdCategory, setThirdCategory] = useState<string>(
    transaction.thirdCategory || "",
  );
  const [amount, setAmount] = useState<string>(transaction.amount.toString());
  const [description, setDescription] = useState<string>(
    transaction.description || "",
  );

  const formatDateString = (timestamp?: {
    _seconds: number;
    _nanoseconds: number;
  }) => {
    if (!timestamp) return new Date().toISOString().split("T")[0];
    const totalMilliseconds =
      timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1000000);
    const d = new Date(totalMilliseconds);
    return d.toISOString().split("T")[0];
  };

  const [date, setDate] = useState<string>(
    formatDateString(transaction.date),
  );
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const capitalizeWords = (str?: string) => {
    if (!str) return "";
    return str
      .split(/[-\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
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

    if (transaction.type === "transfer") {
      if (!toAccountId) {
        setError("Please select a destination account.");
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

    const payload: UpdateTransaction =
      transaction.type === "transfer"
        ? {
            accountId: accountId,
            toAccountId: toAccountId,
            amount: numAmount,
            description: description.trim(),
            date: correctDate,
          }
        : {
            accountId: accountId,
            category: category,
            subcategory: subCategory,
            thirdCategory: thirdCategory.trim(),
            description: description.trim(),
            amount: numAmount,
            date: correctDate,
          };

    setSaving(true);
    setError("");

    try {
      const result = await AppService.updateTransaction(
        transaction.transactionId,
        payload,
      );

      if (result.success) {
        toast.success("Transaction updated successfully");

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["accounts"] }),
          queryClient.invalidateQueries({ queryKey: ["monthly-summary"] }),
          queryClient.invalidateQueries({ queryKey: ["analytics"] }),
          queryClient.invalidateQueries({ queryKey: ["transactions"] }),
          queryClient.invalidateQueries({ queryKey: ["recent-transactions"] }),
        ]);

        if (onSave) onSave();
        onClose();
      } else {
        setError(result.message || "Failed to update transaction");
        toast.error(result.message || "Failed to update transaction");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update transaction";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const typeConfig = {
    income: {
      label: "Income",
      icon: <ArrowUpRight className="h-4 w-4 text-green-500" />,
      badgeClass: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    },
    expense: {
      label: "Expense",
      icon: <ArrowDownLeft className="h-4 w-4 text-red-500" />,
      badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    transfer: {
      label: "Transfer",
      icon: <ArrowRightLeft className="h-4 w-4 text-blue-500" />,
      badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
  }[transaction.type];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Update details for this transaction
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Read-only / Locked Transaction Type */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transaction Type
              </label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Type cannot be changed
              </span>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-semibold text-sm ${typeConfig?.badgeClass}`}
            >
              {typeConfig?.icon}
              <span>{typeConfig?.label}</span>
            </div>
          </div>

          {/* Account Selection */}
          {transaction.type === "transfer" ? (
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
                        <SelectItem key={acc.accountId} value={acc.accountId}>
                          {acc.accountName} (₹{acc.balance})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Account <span className="text-destructive">*</span>
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
          {transaction.type !== "transfer" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category <span className="text-destructive">*</span>
                </label>
                <Select
                  value={category}
                  onValueChange={(val) => {
                    setCategory(val);
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
                  onValueChange={(val) => {
                    setSubCategory(val);
                    setError("");
                  }}
                  disabled={!category}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Subcategory" />
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
          {transaction.type !== "transfer" && (
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
              disabled={saving}
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              disabled={saving}
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <LoaderCircleIcon className="animate-spin mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal;
