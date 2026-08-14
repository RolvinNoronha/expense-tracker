"use client";

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
  LineChart,
  Line,
} from "recharts";
import { useFetchAnalytics } from "@/hooks/hooks";
import { formatMonthLabel } from "@/components/MonthSelector";
import {
  BarChart3,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
} from "lucide-react";

interface AnalyticsSectionProps {
  month: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const capitalizeWords = (str: string) => {
  return str
    .split(/[-\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const AnalyticsSection = ({ month }: AnalyticsSectionProps) => {
  const { data, isPending } = useFetchAnalytics(month);
  const monthLabel = formatMonthLabel(month);

  const analyticsData = data?.data;

  // Process category data
  const categoryData = analyticsData?.byCategory
    ? Object.entries(analyticsData.byCategory)
        .map(([category, info]) => ({
          category: capitalizeWords(category),
          amount: info.amount,
          count: info.count,
        }))
        .sort((a, b) => b.amount - a.amount)
    : [];

  // Process daily data
  const dailyData = analyticsData?.byDay
    ? Object.entries(analyticsData.byDay)
        .map(([dateStr, values]) => {
          const date = new Date(dateStr);
          const formattedDate = date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          });
          return {
            date: formattedDate,
            rawDate: dateStr,
            income: values.income || 0,
            expense: values.expense || 0,
            transfer: values.transfer || 0,
          };
        })
        .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
    : [];

  const byType = analyticsData?.byType || {
    income: { count: 0, amount: 0 },
    expense: { count: 0, amount: 0 },
    transfer: { count: 0, amount: 0 },
  };

  const hasData =
    categoryData.length > 0 ||
    dailyData.length > 0 ||
    byType.income.count > 0 ||
    byType.expense.count > 0 ||
    byType.transfer.count > 0;

  if (isPending) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-xs text-muted-foreground">
            Loading analytics for {monthLabel}...
          </p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Monthly Analytics
          </CardTitle>
          <CardDescription>
            Analytics and breakdowns for {monthLabel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="h-5 w-5" />
            </div>
            <p className="font-medium text-foreground text-sm">
              No analytics data for {monthLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add transactions for this month to see spending trends and
              category breakdowns.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Section Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Analytics & Trends ({monthLabel})
        </h2>
        <p className="text-xs text-muted-foreground">
          Detailed insights into your spending and income for {monthLabel}
        </p>
      </div>

      {/* Breakdown by Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-xs border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Income Transactions
                </p>
                <p className="text-xl font-bold mt-1 text-green-600 dark:text-green-400">
                  {formatCurrency(byType.income?.amount || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {byType.income?.count || 0} transaction
                  {byType.income?.count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Expense Transactions
                </p>
                <p className="text-xl font-bold mt-1 text-red-600 dark:text-red-400">
                  {formatCurrency(byType.expense?.amount || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {byType.expense?.count || 0} transaction
                  {byType.expense?.count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <ArrowDownLeft className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Transfers
                </p>
                <p className="text-xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                  {formatCurrency(byType.transfer?.amount || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {byType.transfer?.count || 0} transfer
                  {byType.transfer?.count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Income & Expense Trend */}
      {dailyData.length > 0 && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Daily Income vs Expense Trend
            </CardTitle>
            <CardDescription>
              Day-by-day cash flow activity for {monthLabel}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Income"
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    name="Expense"
                  />
                  <Line
                    type="monotone"
                    dataKey="transfer"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2 }}
                    name="Transfer"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses by Category */}
      {categoryData.length > 0 && (
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Expenses & Income by Category
            </CardTitle>
            <CardDescription>
              Breakdown of total amounts per category for {monthLabel}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
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
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Bar
                    dataKey="amount"
                    fill="var(--primary)"
                    name="Amount"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsSection;
