import AppService from "@/services/AppService";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export const useFetchTransactions = () =>
  useInfiniteQuery({
    queryKey: ["transactions"],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      AppService.getTransactions(20, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.data.hasMore ? lastPage.data.lastTransactionId : undefined,
  });

export const useFetchTenTransactions = () =>
  useQuery({
    queryKey: ["ten-transactions"],
    queryFn: () => AppService.getTransactions(10, undefined),
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
