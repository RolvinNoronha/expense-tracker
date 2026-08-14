import AppService from "@/services/AppService";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export const useFetchAccounts = () =>
  useQuery({
    queryKey: ["accounts"],
    queryFn: () => AppService.getAccounts(),
  });

export const useFetchMonthlySummary = (month: string) =>
  useQuery({
    queryKey: ["monthly-summary", month],
    queryFn: () => AppService.getMonthlySummary(month),
    enabled: !!month,
  });

export const useFetchAnalytics = (month: string) =>
  useQuery({
    queryKey: ["analytics", month],
    queryFn: () => AppService.getAnalytics(month),
    enabled: !!month,
  });

export const useFetchTransactions = (params?: {
  category?: string;
  subcategory?: string;
  accountId?: string;
  month?: string;
}) =>
  useInfiniteQuery({
    queryKey: [
      "transactions",
      params?.category,
      params?.subcategory,
      params?.accountId,
      params?.month,
    ],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      AppService.getTransactions({
        ...params,
        lastTransactionId: pageParam,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.data.hasMore ? lastPage.data.lastTransactionId : undefined,
  });

export const useFetchRecentTransactions = (month: string, limit = 10) =>
  useQuery({
    queryKey: ["recent-transactions", month, limit],
    queryFn: () => AppService.getRecentTransactions(month, limit),
    enabled: !!month,
  });

export const useFetchOwedEntries = () =>
  useQuery({
    queryKey: ["owed-entries"],
    queryFn: () => AppService.getOwedEntries(),
  });
