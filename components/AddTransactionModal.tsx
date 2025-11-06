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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, LoaderCircleIcon, Plus } from "lucide-react";
import { AddTransaction } from "@/store/interfaces";
import { toast } from "sonner";
import AppService from "@/services/AppService";
import categories from "@/lib/categories";
import useBalanceStore from "@/store/balance-store";
import { useQueryClient } from "@tanstack/react-query";

const AddTransactionModal = () => {
  const { balance } = useBalanceStore();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [thirdCategory, setThirdCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string>("");
  const [adding, setAdding] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const capitalizeWords = (str: string) => {
    return str
      .split(/[-\s]/) // Split by spaces or hyphens
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" "); // Join back with hyphens
  };

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

    setAdding(true);
    try {
      const result = await AppService.addTransaction(
        addtransaction,
        balance?.balanceId
      );
      if (result.success) {
        setCategory("");
        setSubCategory("");
        setThirdCategory("");
        setDescription("");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        toast.success("Successfully added transaction");

        await queryClient.invalidateQueries({
          queryKey: [
            "balance",
            "transactions",
            "ten-transactions",
            "transaction-days",
          ],
        });
        setOpen(false);
      }
    } catch (error) {
      toast.error("Failed to add transaction");
      console.error("Failed to add transaction: ", error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Record a new income or expense transaction
          </DialogDescription>
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
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setSubCategory("");
                setError("");
              }}
            >
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

          {/* Sub-Category */}
          {category.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Sub-Category</label>
              <Select
                value={subCategory}
                onValueChange={(value) => {
                  setSubCategory(value);
                  setError("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sub-category" />
                </SelectTrigger>
                <SelectContent>
                  {categories[category as keyof typeof categories].map(
                    (subCat) => (
                      <SelectItem key={subCat} value={subCat}>
                        {capitalizeWords(subCat)}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Third Category (Optional) */}
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
                setAmount(e.target.value);
                setError("");
              }}
              step="0.01"
              min="0"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description (Optional)
            </label>
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
                setDate(e.target.value);
                setError("");
              }}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
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
              {adding ? <LoaderCircleIcon className="animate-spin" /> : null}
              {adding ? "Saving Transaction..." : "Save Transaction"}
            </Button>
          </div>
        </form>{" "}
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionModal;
