"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";

import DashboardNav from "@/components/DashboardNav";
import AccountsSection from "@/components/AccountsSection";
import MonthSelector, {
  getCurrentMonthString,
} from "@/components/MonthSelector";
import DashboardHeader from "@/components/DashboardHeader";
import TransactionsSection from "@/components/TransactionSection";
import AnalyticsSection from "@/components/AnalyticsSection";
import AddTransactionModal from "@/components/AddTransactionModal";
import { useFetchMonthlySummary } from "@/hooks/hooks";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [selectedMonth, setSelectedMonth] = useState<string>(
    getCurrentMonthString(),
  );

  const { data: summaryData } = useFetchMonthlySummary(selectedMonth);

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, router]);

  const monthlySummary = summaryData?.data?.monthlySummary?.data;
  const income = monthlySummary?.totalIncome || 0;
  const expenses = monthlySummary?.totalExpense || 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* 1. Accounts Section (at the top) */}
          <AccountsSection />

          {/* 2. Month Selector Option */}
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />

          {/* 3. Income and Expense for the selected month */}
          <DashboardHeader
            month={selectedMonth}
            income={income}
            expenses={expenses}
          />

          {/* 4. Latest 10 Transactions for that month */}
          <TransactionsSection month={selectedMonth} />

          {/* 5. Analytics for that month */}
          <AnalyticsSection month={selectedMonth} />
        </div>
      </main>

      {/* Floating Add Transaction Button / Modal */}
      <AddTransactionModal />
    </div>
  );
}
