"use client";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

const DashboardNav = () => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    router.push("/login");
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-6">
        <h1 className="text-2xl font-bold text-primary">Expense Tracker</h1>
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
