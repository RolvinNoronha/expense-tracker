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
  Rectangle,
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
        .map(([category, info]) => {
          const isIncomeCat =
            category.toLowerCase() === "income" ||
            category.toLowerCase() === "salary" ||
            category.toLowerCase() === "freelance" ||
            category.toLowerCase() === "investments";
          return {
            category: capitalizeWords(category),
            amount: info.amount || 0,
            count: info.count || 0,
            fill: isIncomeCat ? "#10b981" : "#ef4444",
          };
        })
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
            income: values?.income || 0,
            expense: values?.expense || 0,
            transfer: values?.transfer || 0,
          };
        })
        .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
    : [];

  // Safely extract byType data avoiding undefined errors
  const byType = {
    income: analyticsData?.byType?.income || { count: 0, amount: 0 },
    expense: analyticsData?.byType?.expense || { count: 0, amount: 0 },
    transfer: analyticsData?.byType?.transfer || { count: 0, amount: 0 },
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
        <CardHeader className="px-4 py-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Monthly Analytics
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Analytics and breakdowns for {monthLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6">
          <div className="text-center py-10">
            <div className="w-10 h-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="h-5 w-5" />
            </div>
            <p className="font-semibold text-foreground text-sm">
              No analytics data for {monthLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Add transactions for this month to see income vs expense bar
              charts and category breakdowns.
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
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Analytics & Trends ({monthLabel})
        </h2>
        <p className="text-xs text-muted-foreground">
          Detailed insights into your spending and income for {monthLabel}
        </p>
      </div>

      {/* Breakdown by Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Income Card */}
        <Card className="shadow-xs border-green-500/20 bg-green-500/5">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Income Total
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-green-600 dark:text-green-400">
                  {formatCurrency(byType.income.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {byType.income.count} transaction
                  {byType.income.count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Card */}
        <Card className="shadow-xs border-red-500/20 bg-red-500/5">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Expense Total
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-red-600 dark:text-red-400">
                  {formatCurrency(byType.expense.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {byType.expense.count} transaction
                  {byType.expense.count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Card */}
        <Card className="shadow-xs border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Transfers
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                  {formatCurrency(byType.transfer.amount)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {byType.transfer.count} transfer
                  {byType.transfer.count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Income vs Expense Bar Chart: Green for Income, Red for Expense */}
      {dailyData.length > 0 && (
        <Card className="shadow-xs">
          <CardHeader className="px-4 py-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Daily Income vs Expense Bar Chart
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Daily comparison showing Income in green and Expense in red
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4">
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  />
                  <Bar
                    dataKey="income"
                    fill="#10b981"
                    name="Income"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    fill="#ef4444"
                    name="Expense"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown Bar Chart */}
      {categoryData.length > 0 && (
        <Card className="shadow-xs">
          <CardHeader className="px-4 py-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Expenses & Income by Category
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Breakdown of total amounts per category for {monthLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4">
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="category"
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    itemStyle={{
                      color: "var(--popover-foreground)",
                    }}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Bar
                    dataKey="amount"
                    name="Amount"
                    radius={[4, 4, 0, 0]}
                    shape={(props) => (
                      <Rectangle
                        {...props}
                        fill={
                          props.payload?.fill ||
                          (props.payload?.category?.toLowerCase() ===
                            "income" ||
                          props.payload?.category?.toLowerCase() === "salary" ||
                          props.payload?.category?.toLowerCase() ===
                            "freelance" ||
                          props.payload?.category?.toLowerCase() ===
                            "investments"
                            ? "#10b981"
                            : "#ef4444")
                        }
                        radius={[4, 4, 0, 0]}
                      />
                    )}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Cash Flow Trend Line Chart */}
      {dailyData.length > 0 && (
        <Card className="shadow-xs">
          <CardHeader className="px-4 py-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Daily Cash Flow Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Day-by-day trajectory for {monthLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4">
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    opacity={0.6}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                  />
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
    </div>
  );
};

export default AnalyticsSection;
