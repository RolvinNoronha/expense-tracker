"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import DashboardNav from "@/components/DashboardNav";
import TransactionsTable from "@/components/TransactionsTable";

export default function TransactionsPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push("/login");
      return;
    }
  }, [router, user]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="space-y-5 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              All Transactions
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Manage all your transactions. Edit or delete as needed.
            </p>
          </div>

          <TransactionsTable />
        </div>
      </main>
    </div>
  );
}
