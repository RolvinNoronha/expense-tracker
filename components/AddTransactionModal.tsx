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
import { Plus } from "lucide-react";

interface AddTransactionModalProps {
  onAddTransaction?: (transaction: {
    type: "income" | "expense";
    category: string;
    subCategory: string;
    thirdCategory?: string;
    description: string;
    amount: number;
    date: string;
  }) => void;
}

const EXPENSE_CATEGORIES = {
  Food: ["Groceries", "Restaurants", "Delivery"],
  Rent: ["Apartment", "House", "Storage"],
  Entertainment: ["Movies", "Games", "Events"],
  Utilities: ["Electricity", "Water", "Internet"],
  Transportation: ["Gas", "Public Transit", "Parking"],
  Healthcare: ["Doctor", "Pharmacy", "Dental"],
  Shopping: ["Clothing", "Electronics", "Home"],
  Other: ["Miscellaneous"],
};

const INCOME_CATEGORIES = {
  Salary: ["Monthly", "Bonus", "Overtime"],
  Freelance: ["Projects", "Consulting", "Gigs"],
  Investment: ["Dividends", "Interest", "Capital Gains"],
  Other: ["Gifts", "Refunds", "Miscellaneous"],
};

const AddTransactionModal = ({
  onAddTransaction,
}: AddTransactionModalProps) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [thirdCategory, setThirdCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const subCategories = category
    ? categories[category as keyof typeof categories] || []
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !subCategory || !amount) {
      alert("Please fill in all required fields");
      return;
    }

    onAddTransaction?.({
      type,
      category,
      subCategory,
      thirdCategory,
      description,
      amount: Number.parseFloat(amount),
      date,
    });

    // Reset form
    setCategory("");
    setSubCategory("");
    setThirdCategory("");
    setDescription("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setOpen(false);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Record a new income or expense transaction
          </DialogDescription>
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
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(categories).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-Category */}
          {subCategories.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Sub-Category</label>
              <Select value={subCategory} onValueChange={setSubCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sub-category" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((subCat) => (
                    <SelectItem key={subCat} value={subCat}>
                      {subCat}
                    </SelectItem>
                  ))}
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
              onChange={(e) => setAmount(e.target.value)}
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
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Save Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionModal;
