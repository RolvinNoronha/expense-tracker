"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Plus,
  Building2,
  CreditCard,
  Banknote,
  Coins,
} from "lucide-react";
import { useFetchAccounts } from "@/hooks/hooks";
import AddAccountModal from "@/components/AddAccountModal";
import { Account } from "@/store/interfaces";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const getAccountIcon = (name: string, index: number) => {
  const lower = name.toLowerCase();
  if (lower.includes("cash") || lower.includes("wallet")) {
    return <Banknote className="h-5 w-5 text-emerald-500" />;
  }
  if (
    lower.includes("card") ||
    lower.includes("credit") ||
    lower.includes("debit")
  ) {
    return <CreditCard className="h-5 w-5 text-blue-500" />;
  }
  if (
    lower.includes("bank") ||
    lower.includes("hdfc") ||
    lower.includes("sbi") ||
    lower.includes("icici") ||
    lower.includes("axis")
  ) {
    return <Building2 className="h-5 w-5 text-violet-500" />;
  }
  const icons = [
    <Building2 key="1" className="h-5 w-5 text-violet-500" />,
    <Wallet key="2" className="h-5 w-5 text-indigo-500" />,
    <CreditCard key="3" className="h-5 w-5 text-blue-500" />,
    <Banknote key="4" className="h-5 w-5 text-emerald-500" />,
    <Coins key="5" className="h-5 w-5 text-amber-500" />,
  ];
  return icons[index % icons.length];
};

const AccountsSection = () => {
  const { data, isPending } = useFetchAccounts();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const accounts: Account[] = data?.data?.accounts || [];
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (Number(acc.balance) || 0),
    0,
  );
  const accountCount = accounts.length;
  const isLimitReached = accountCount >= 5;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            My Accounts
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {accountCount}/5
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage your bank accounts, wallets, and cards
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          disabled={isLimitReached}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
        >
          <Plus className="h-4 w-4" />
          {isLimitReached ? "Account Limit Reached" : "Add Account"}
        </Button>
      </div>

      {isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-24 mb-3"></div>
                <div className="h-7 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card className="border-dashed border-2 bg-secondary/10">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              No accounts added yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Add your first account (e.g. Bank Account, Cash Wallet) to start
              tracking income, expenses, and transfers.
            </p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Net Balance Card */}
          <Card className="bg-linear-to-br from-primary/15 via-primary/5 to-card border-primary/25 shadow-xs">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Net Balance
                </p>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <p
                className={`text-2xl font-bold mt-2 ${
                  totalBalance >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {formatCurrency(totalBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {accountCount} account{accountCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          {/* Individual Account Cards */}
          {accounts.map((account, index) => (
            <Card
              key={account.accountId}
              className="hover:border-primary/40 transition-all shadow-xs"
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 max-w-[80%]">
                    <div className="p-2 rounded-lg bg-secondary">
                      {getAccountIcon(account.accountName, index)}
                    </div>
                    <p
                      className="text-sm font-semibold text-foreground truncate"
                      title={account.accountName}
                    >
                      {account.accountName}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/60 px-1.5 py-0.5 rounded bg-muted">
                    Acc #{index + 1}
                  </span>
                </div>
                <p className="text-xl font-bold mt-3 text-foreground">
                  {formatCurrency(Number(account.balance) || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Available Balance
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddAccountModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default AccountsSection;
