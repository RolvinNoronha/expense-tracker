"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, PieChart, BarChart3, Zap } from "lucide-react";
import { useAuth } from "@/Providers/AuthProvider";
import ThemeToggle from "@/components/ThemeToggle";

const LandingPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Expense Tracker
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/login")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight text-balance">
              Take Control of Your{" "}
              <span className="text-primary">Finances</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Track your income and expenses with ease. Get insights into your
              spending habits and make smarter financial decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {user ? (
                <Button
                  onClick={() => router.push("/dashboard")}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => router.push("/login")}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => router.push("/login")}
                    size="lg"
                    variant="outline"
                    className="border-border hover:bg-secondary"
                  >
                    Try Demo
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-full h-80 bg-linear-to-br from-primary/10 to-secondary rounded-2xl flex items-center justify-center">
              <div className="space-y-4 w-full px-8">
                <div className="flex gap-2">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2 bg-primary/30 rounded w-24"></div>
                    <div className="h-2 bg-primary/20 rounded w-32"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2 bg-primary/30 rounded w-20"></div>
                    <div className="h-2 bg-primary/20 rounded w-28"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2 bg-primary/30 rounded w-32"></div>
                    <div className="h-2 bg-primary/20 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to manage your finances effectively
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Track Income",
                description: "Monitor all your income sources in one place",
              },
              {
                icon: PieChart,
                title: "Visualize Spending",
                description:
                  "See where your money goes with interactive charts",
              },
              {
                icon: BarChart3,
                title: "Analyze Trends",
                description: "Understand your spending patterns over time",
              },
              {
                icon: Zap,
                title: "Quick Entry",
                description: "Add transactions in seconds with our simple form",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
              >
                <feature.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-linear-to-r from-primary/10 to-primary/5 rounded-2xl p-12 text-center border border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to manage your finances?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start tracking your expenses today and gain complete visibility into
            your financial health.
          </p>
          {user ? (
            <Button
              onClick={() => router.push("/dashboard")}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Open Dashboard
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => router.push("/login")}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; 2025 Expense Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
