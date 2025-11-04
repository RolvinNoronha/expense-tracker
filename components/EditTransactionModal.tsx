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
import Categories from "@/lib/categories";

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSave: (transaction: AddTransaction) => void;
}

const EXPENSE_CATEGORIES = [
  "housing",
  "transportataion",
  "food",
  "health",
  "entertainment",
  "personal-care",
  "education",
  "family",
  "debt",
  "insurance",
  "travel",
  "miscellaneous",
  "business",
  "taxes",
];

const INCOME_CATEGORIES = ["income", "gifts", "savings"];

const EditTransactionModal = ({
  transaction,
  onClose,
}: EditTransactionModalProps) => {
  const [type, setType] = useState<"income" | "expense">(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [subCategory, setSubCategory] = useState(transaction.subcategory);
  const [thirdCategory, setThirdCategory] = useState(
    transaction.thirdCategory ?? ""
  );
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [description, setDescription] = useState(transaction.description);

  console.log(transaction);
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const formatDate = (timestamp: {
    _seconds: number;
    _nanoseconds: number;
  }) => {
    const totalMilliseconds =
      timestamp._seconds * 1000 + Math.floor(timestamp._nanoseconds / 1000000);
    const date = new Date(totalMilliseconds);
    return date.toDateString();
  };

  const [date, setDate] = useState(formatDate(transaction.date));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !amount) {
      alert("Please fill in all required fields");
      return;
    }
  };

  const capitalizeWords = (str: string) => {
    return str
      .split(/[-\s]/) // Split by spaces or hyphens
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" "); // Join back with hyphens
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>Update the transaction details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Transaction Type</label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as "income" | "expense");
                setCategory("");
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
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {capitalizeWords(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sub Category</label>
            <Select value={subCategory} onValueChange={setSubCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a sub category" />
              </SelectTrigger>
              <SelectContent>
                {Categories[category as keyof typeof Categories].map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {capitalizeWords(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              onChange={(e) => setAmount(e.target.value)}
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
              onChange={(e) => setDate(e.target.value)}
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
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal;
