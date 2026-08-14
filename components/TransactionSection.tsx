"use client";

import TransactionsList from "@/components/TransactionList";

interface TransactionsSectionProps {
  month: string;
}

const TransactionsSection = ({ month }: TransactionsSectionProps) => {
  return (
    <div className="space-y-6">
      <TransactionsList month={month} />
    </div>
  );
};

export default TransactionsSection;
