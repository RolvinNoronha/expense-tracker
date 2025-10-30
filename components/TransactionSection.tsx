"use client";

import TransactionsList from "@/components/TransactionList";
import TrendChart from "@/components/TrendChart";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface TransactionsSectionProps {
  transactions: Transaction[];
}

const TransactionsSection = ({ transactions }: TransactionsSectionProps) => {
  // Generate 30-day trend data
  const generateTrendData = () => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      // Simulate trend data
      const income = Math.floor(Math.random() * 2000) + 500;
      const expenses = Math.floor(Math.random() * 1500) + 300;

      data.push({
        date: dateStr,
        income,
        expenses,
      });
    }
    return data;
  };

  const trendData = generateTrendData();

  return (
    <div className="space-y-6">
      <TransactionsList transactions={transactions} />
      <TrendChart data={trendData} />
    </div>
  );
};

export default TransactionsSection;
