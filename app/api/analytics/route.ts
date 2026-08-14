import { adminDb } from "@/lib/firebaseAdmin";
import { withAuth } from "@/lib/with-auth";
import { Transaction } from "@/store/interfaces";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest } from "next/server";

const getAnalytics = async (request: NextRequest) => {
  const user = request.user;
  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month");

  if (!month) {
    return new Response(
      JSON.stringify({
        success: false,
        message:
          "Month is required in the format YYYY-MM in the request params",
        data: {},
        errors: {},
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const [year, monthNumber] = month.split("-").map(Number);
    const startDate = new Date(Date.UTC(year, monthNumber - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNumber, 1));

    const snapshot = await adminDb
      .collection("transactions")
      .where("userId", "==", user?.userId)
      .where("date", ">=", Timestamp.fromDate(startDate))
      .where("date", "<", Timestamp.fromDate(endDate))
      .orderBy("date", "asc")
      .get();

    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Transaction, "id">),
    }));

    const byType = transactions.reduce(
      (acc, transaction) => {
        const type = transaction.type;

        if (!acc[type]) {
          acc[type] = {
            count: 0,
            amount: 0,
          };
        }

        acc[type].count += 1;
        acc[type].amount += transaction.amount;

        return acc;
      },
      {} as Record<
        "income" | "expense" | "transfer",
        { count: number; amount: number }
      >,
    );

    const byCategory = transactions
      .filter((transaction) => transaction.type !== "transfer")
      .reduce(
        (acc, transaction) => {
          const category = transaction.category;

          if (!acc[category]) {
            acc[category] = {
              count: 0,
              amount: 0,
            };
          }

          acc[category].count += 1;
          acc[category].amount += transaction.amount;

          return acc;
        },
        {} as Record<string, { count: number; amount: number }>,
      );

    const byDay = transactions.reduce(
      (acc, transaction) => {
        // @ts-ignore
        const date = transaction.date.toDate().toISOString().slice(0, 10);

        if (!acc[date]) {
          acc[date] = {
            income: 0,
            expense: 0,
            transfer: 0,
          };
        }

        acc[date][transaction.type] += transaction.amount;

        return acc;
      },
      {} as Record<
        string,
        {
          income: number;
          expense: number;
          transfer: number;
        }
      >,
    );

    console.log("Successfuly fetched analytics");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully fetched analytics",
        data: {
          byCategory,
          byDay,
          byType,
        },
        errors: {},
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to fetch analytics: ", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch analytics",
        data: {},
        errors: { error },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const GET = withAuth(getAnalytics);
