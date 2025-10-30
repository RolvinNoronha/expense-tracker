"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface DashboardHeaderProps {
  balance: number;
  income: number;
  expenses: number;
}

const DashboardHeader = ({
  balance,
  income,
  expenses,
}: DashboardHeaderProps) => {
  const chartData = [
    { name: "Income", value: income },
    { name: "Expenses", value: expenses },
  ];

  const COLORS = ["#a78bfa", "#f87171"];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <Card className="bg-linear-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Balance
              </p>
              <p
                className={`text-4xl font-bold mt-2 ${
                  balance >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {formatCurrency(balance)}
              </p>
            </div>
            <Wallet className="h-12 w-12 text-primary/40" />
          </div>
        </CardContent>
      </Card>

      {/* Income and Expenses Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Income
                </p>
                <p className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">
                  {formatCurrency(income)}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600/40 dark:text-green-400/40" />
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>
                <p className="text-3xl font-bold mt-2 text-red-600 dark:text-red-400">
                  {formatCurrency(expenses)}
                </p>
              </div>
              <TrendingDown className="h-10 w-10 text-red-600/40 dark:text-red-400/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium text-muted-foreground mb-4">
            Income vs Expenses
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) =>
                  `${name}: ${formatCurrency(value as number)}`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHeader;
