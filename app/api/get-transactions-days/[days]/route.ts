import { adminDb } from "@/lib/firebaseAdmin";
import { withAuth } from "@/lib/with-auth";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest } from "next/server";

const getTransactionDays = async (
  request: NextRequest,
  { params }: { params: Promise<{ days: string }> }
) => {
  const user = request.user;
  const days = (await params).days;

  const now = new Date();
  const daysAgo = Number(days);
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysAgo
  );

  try {
    const transactionsSnapshot = await adminDb
      .collection("expenses")
      .where("userId", "==", user?.uid)
      .where("date", ">=", Timestamp.fromDate(endDate))
      .where("date", "<=", Timestamp.fromDate(startDate))
      .get();

    const transactions = transactionsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return { transactionId: doc.id, ...data };
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully fetched transactions data",
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
        message: "Failed to get transactions data",
        data: {},
        errors: { error },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const GET = withAuth(getTransactionDays);
