"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Sector,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { formatMonthLabel } from "@/components/MonthSelector";

interface DashboardHeaderProps {
  month: string;
  income: number;
  expenses: number;
}

const DashboardHeader = ({
  month,
  income,
  expenses,
}: DashboardHeaderProps) => {
  const netSavings = income - expenses;
  const monthLabel = formatMonthLabel(month);

  const chartData = [
    { name: "Income", value: income, fill: "#10b981" },
    { name: "Expenses", value: expenses, fill: "#ef4444" },
  ].filter((item) => item.value > 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Monthly Summary Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Monthly Overview ({monthLabel})
        </h2>
        <p className="text-xs text-muted-foreground">
          Income and expenses recorded for {monthLabel}
        </p>
      </div>

      {/* Income, Expenses, and Net Savings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Income Card */}
        <Card className="border-green-500/20 bg-green-500/5 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Monthly Income
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                  {formatCurrency(income)}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="border-red-500/20 bg-red-500/5 shadow-xs">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Monthly Expenses
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
                  {formatCurrency(expenses)}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Savings Card */}
        <Card
          className={`shadow-xs ${
            netSavings >= 0
              ? "border-primary/20 bg-primary/5"
              : "border-destructive/20 bg-destructive/5"
          }`}
        >
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Net Savings
                </p>
                <p
                  className={`text-xl sm:text-2xl font-bold mt-1 ${
                    netSavings >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {netSavings >= 0 ? "+" : ""}
                  {formatCurrency(netSavings)}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-secondary text-foreground">
                <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Distribution Chart */}
      {(income > 0 || expenses > 0) && (
        <Card className="shadow-xs">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-sm font-semibold text-foreground">
                  Income vs Expenses Ratio
                </p>
                <p className="text-xs text-muted-foreground">
                  {income > 0
                    ? `Expenses are ${Math.round(
                        (expenses / income) * 100,
                      )}% of income`
                    : "No income recorded for this month"}
                </p>
              </div>
              <div className="w-full sm:w-80 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={4}
                      dataKey="value"
                      shape={(props) => (
                        <Sector
                          {...props}
                          fill={
                            props.payload?.fill ||
                            (props.name === "Income" ? "#10b981" : "#ef4444")
                          }
                        />
                      )}
                    />
                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value as number)
                      }
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardHeader;
