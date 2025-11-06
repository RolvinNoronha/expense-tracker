"use client";

import type React from "react";
import { useState } from "react";
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
import { AddTransaction, Transaction } from "@/store/interfaces";
import categories from "@/lib/categories";
import { AlertCircle, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import AppService from "@/services/AppService";

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSave: (transaction: AddTransaction) => void;
}

const EditTransactionModal = ({
  transaction,
  onClose,
}: EditTransactionModalProps) => {
  const queryClient = useQueryClient();

  const [type, setType] = useState<"income" | "expense">(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [subCategory, setSubCategory] = useState(transaction.subcategory);
  const [thirdCategory, setThirdCategory] = useState(
    transaction.thirdCategory ?? ""
  );
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [description, setDescription] = useState(transaction.description);

  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const formatDate = (timestamp: {
    _seconds: number;
    _nanoseconds: number;
  }) => {
    const totalMilliseconds =
      timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1000000);
    const date = new Date(totalMilliseconds);
    return date.toISOString().split("T")[0];
  };

  const [date, setDate] = useState(formatDate(transaction.date));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !subCategory || !amount || !date) {
      setError("Please fill all the required fields.");
      return;
    }

    const addtransaction: AddTransaction = {
      amount: Number(amount),
      category: category,
      date: new Date(date),
      description: description ?? "",
      subcategory: subCategory,
      thirdCategory: thirdCategory ?? "",
      type: type,
    };

    setSaving(true);
    try {
      const result = await AppService.updateTransaction(
        transaction.transactionId,
        addtransaction,
        transaction.balanceId
      );
      if (result.success) {
        setCategory("");
        setSubCategory("");
        setThirdCategory("");
        setDescription("");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        toast.success("Successfully updated transaction");

        await queryClient.invalidateQueries({
          queryKey: [
            "balance",
            "transactions",
            "ten-transactions",
            "transaction-days",
          ],
        });
        onClose();
      }
    } catch (error) {
      toast.error("Failed to update transaction");
      console.error("Failed to update transaction: ", error);
    } finally {
      setSaving(false);
    }
  };

  const capitalizeWords = (str: string) => {
    return str
      .split(/[-\s]/) // Split by spaces or hyphens
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" "); // Join back with hyphens
  };

  console.log(date);
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>Update the transaction details</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Transaction Type</label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as "income" | "expense");
                setCategory("");
                setSubCategory("");
                setError("");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
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

          {/* Sub Category */}
          {category.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Sub Category</label>
              <Select
                value={subCategory}
                onValueChange={(value) => {
                  setSubCategory(value);
                  setError("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sub category" />
                </SelectTrigger>
                <SelectContent>
                  {categories[category as keyof typeof categories].map(
                    (subcat) => (
                      <SelectItem key={subcat} value={subcat}>
                        {capitalizeWords(subcat)}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Additiona Details */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional Details (Optional)
            </label>
            <Input
              placeholder="e.g., Specific store, project name"
              value={thirdCategory}
              onChange={(e) => setThirdCategory(e.target.value)}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setError("");
                setAmount(e.target.value);
              }}
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Add a note about this transaction"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setError("");
                setDate(e.target.value);
              }}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {saving ? <LoaderCircleIcon className="animate-spin" /> : null}
              {saving ? "Saving Transaction..." : "Save Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal;
