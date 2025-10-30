"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardNav from "@/components/DashboardNav";
import DashboardHeader from "@/components/DashboardHeader";
import TransactionsSection from "@/components/TransactionSection";
import AnalyticsSection from "@/components/AnalyticsSection";
import AddTransactionModal from "@/components/AddTransactionModal";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      router.push("/login");
      return;
    }

    // Load sample data
    const sampleTransactions: Transaction[] = [
      {
        id: "1",
        type: "income",
        category: "Salary",
        amount: 5000,
        description: "Monthly salary",
        date: new Date().toISOString(),
      },
      {
        id: "2",
        type: "expense",
        category: "Food",
        amount: 150,
        description: "Groceries",
        date: new Date().toISOString(),
      },
      {
        id: "3",
        type: "expense",
        category: "Rent",
        amount: 1200,
        description: "Monthly rent",
        date: new Date().toISOString(),
      },
      {
        id: "4",
        type: "income",
        category: "Freelance",
        amount: 800,
        description: "Project payment",
        date: new Date().toISOString(),
      },
      {
        id: "5",
        type: "expense",
        category: "Entertainment",
        amount: 50,
        description: "Movie tickets",
        date: new Date().toISOString(),
      },
      {
        id: "6",
        type: "expense",
        category: "Utilities",
        amount: 120,
        description: "Electricity bill",
        date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "7",
        type: "expense",
        category: "Transportation",
        amount: 80,
        description: "Gas",
        date: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "8",
        type: "income",
        category: "Investment",
        amount: 250,
        description: "Dividend payment",
        date: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: "9",
        type: "expense",
        category: "Healthcare",
        amount: 100,
        description: "Doctor visit",
        date: new Date(Date.now() - 345600000).toISOString(),
      },
      {
        id: "10",
        type: "expense",
        category: "Shopping",
        amount: 200,
        description: "Clothing",
        date: new Date(Date.now() - 432000000).toISOString(),
      },
    ];

    setTransactions(sampleTransactions);
    setIsLoading(false);
  }, [router]);

  const handleAddTransaction = (newTransaction: {
    type: "income" | "expense";
    category: string;
    subCategory: string;
    thirdCategory?: string;
    description: string;
    amount: number;
    date: string;
  }) => {
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: newTransaction.type,
      category: newTransaction.category,
      amount: newTransaction.amount,
      description: newTransaction.description || newTransaction.subCategory,
      date: newTransaction.date,
    };

    setTransactions([transaction, ...transactions]);
  };

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <DashboardHeader
            balance={balance}
            income={income}
            expenses={expenses}
          />
          <TransactionsSection transactions={transactions} />
          <AnalyticsSection transactions={transactions} />
        </div>
      </main>
      <AddTransactionModal onAddTransaction={handleAddTransaction} />
    </div>
  );
}
