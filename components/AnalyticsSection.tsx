"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsSectionProps {
  transactions: Array<{
    id: string;
    type: "income" | "expense";
    category: string;
    amount: number;
    description: string;
    date: string;
  }>;
}

const AnalyticsSection = ({ transactions }: AnalyticsSectionProps) => {
  const [timeRange, setTimeRange] = useState("30");

  // Generate time-based bar chart data
  const generateTimeBasedData = () => {
    const days = Number.parseInt(timeRange);
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      // Simulate data
      const income = Math.floor(Math.random() * 2000) + 300;
      const expenses = Math.floor(Math.random() * 1500) + 200;

      data.push({
        date: dateStr,
        income,
        expenses,
      });
    }

    return data;
  };

  // Generate category-based data
  const generateCategoryData = () => {
    const categoryTotals: Record<string, { income: number; expenses: number }> =
      {};

    transactions.forEach((transaction) => {
      if (!categoryTotals[transaction.category]) {
        categoryTotals[transaction.category] = { income: 0, expenses: 0 };
      }

      if (transaction.type === "income") {
        categoryTotals[transaction.category].income += transaction.amount;
      } else {
        categoryTotals[transaction.category].expenses += transaction.amount;
      }
    });

    return Object.entries(categoryTotals).map(([category, totals]) => ({
      category,
      income: totals.income,
      expenses: totals.expenses,
    }));
  };

  const timeBasedData = generateTimeBasedData();
  const categoryData = generateCategoryData();

  return (
    <div className="space-y-6">
      {/* Time-based Bar Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Income vs Expenses</CardTitle>
              <CardDescription>
                Daily breakdown for the selected period
              </CardDescription>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={timeBasedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value) =>
                  new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 0,
                  }).format(value as number)
                }
              />
              <Legend />
              <Bar
                dataKey="income"
                fill="#16a34a"
                name="Income"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                fill="#dc2626"
                name="Expenses"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category-based Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>
            Breakdown of spending across different categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-80 text-muted-foreground">
              <p>No transaction data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value) =>
                    new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "INR",
                      minimumFractionDigits: 0,
                    }).format(value as number)
                  }
                />
                <Legend />
                <Bar
                  dataKey="income"
                  fill="#16a34a"
                  name="Income"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  fill="#dc2626"
                  name="Expenses"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsSection;
