import AppService from "@/services/AppService";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export const useFetchTransactions = (category?: string, subcategory?: string) =>
  useInfiniteQuery({
    queryKey: ["transactions", category, subcategory],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      AppService.getTransactions(pageParam, category, subcategory),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.data.hasMore ? lastPage.data.lastTransactionId : undefined,
  });

export const useFetchTenTransactions = () =>
  useQuery({
    queryKey: ["ten-transactions"],
    queryFn: () => AppService.getTenTransactions(),
  });

export const useFetchTransactionsDays = (days: number) =>
  useQuery({
    queryKey: ["transaction-days", days],
    queryFn: () => AppService.getTransactionsDays(days),
  });

export const useFetchBalance = () =>
  useQuery({
    queryKey: ["balance"],
    queryFn: () => AppService.getBalance(),
  });
