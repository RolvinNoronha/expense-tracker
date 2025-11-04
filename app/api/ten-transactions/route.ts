import { adminDb } from "@/lib/firebaseAdmin";
import { withAuth } from "@/lib/with-auth";
import { NextRequest } from "next/server";

// Get Ten Transactions
const getTenTransaction = async (request: NextRequest) => {
  const user = request.user;
  try {
    const transactionQuery = adminDb
      .collection("expenses")
      .where("userId", "==", user?.uid)
      .orderBy("date", "desc")
      .limit(10);

    const transactionsSnapshot = await transactionQuery.get();
    if (transactionsSnapshot.empty) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Successfully fetched transactions",
          data: {
            transactions: [],
          },
          errors: {},
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const transactions = transactionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return { transactionId: doc.id, ...data };
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully fetched transactions",
        data: {
          transactions: transactions,
        },
        errors: {},
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to get transactions",
        data: {
          transactions: [],
        },
        errors: { error },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const GET = withAuth(getTenTransaction);
