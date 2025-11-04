"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import ThemeToggle from "@/components/ThemeToggle";

const DashboardNav = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-primary">Expense Tracker</h1>
          <nav className="hidden md:flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/transactions"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Transactions
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardNav;
