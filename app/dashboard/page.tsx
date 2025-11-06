"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { auth } from "@/firebase/firebase";

import DashboardNav from "@/components/DashboardNav";
import DashboardHeader from "@/components/DashboardHeader";
import TransactionsSection from "@/components/TransactionSection";
import AnalyticsSection from "@/components/AnalyticsSection";
import AddTransactionModal from "@/components/AddTransactionModal";
import { useFetchBalance } from "@/hooks/hooks";
import useBalanceStore from "@/store/balance-store";

type BalanceData = {
  expense: number;
  income: number;
  balance: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { updateBalance } = useBalanceStore();

  const [balanceData, setBalanceData] = useState<BalanceData>({
    balance: 0,
    expense: 0,
    income: 0,
  });
  const { data, isPending } = useFetchBalance();

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push("/login");
      return;
    }

    if (data) {
      const income = data?.data.balance.totalIncome;
      const expense = data.data.balance.totalExpense;
      const balance = income - expense;

      setBalanceData({ income, expense, balance });
      updateBalance(data.data.balance);
    }
  }, [router, data]);

  if (isPending) {
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
            balance={balanceData.balance}
            income={balanceData.income}
            expenses={balanceData.expense}
          />
          <TransactionsSection />
          <AnalyticsSection />
        </div>
      </main>
      <AddTransactionModal />
    </div>
  );
}
