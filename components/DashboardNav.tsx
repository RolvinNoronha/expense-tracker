"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import ThemeToggle from "@/components/ThemeToggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/owed-to-me", label: "Owed To Me" },
];

const DashboardNav = () => {
  const { logout } = useAuth();
  const router = useRouter();
  const pathName = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-8">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">
            Expense Tracker
          </h1>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium hover:text-primary transition-colors ${
                  pathName === link.href
                    ? "underline underline-offset-2"
                    : ""
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
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

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-card px-4 pb-3 pt-2 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathName === link.href
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted hover:text-primary"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
};

export default DashboardNav;
