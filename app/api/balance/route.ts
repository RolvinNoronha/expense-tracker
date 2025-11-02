import { adminDb } from "@/lib/firebaseAdmin";
import { withAuth } from "@/lib/with-auth";
import { NextRequest } from "next/server";

const getBalance = async (request: NextRequest) => {
  const user = request.user;

  try {
    const balanceSnapshot = await adminDb
      .collection("balance")
      .where("userId", "==", user?.uid)
      .get();

    if (balanceSnapshot.empty) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to fetch balance",
          data: {
            totalIncome: 0,
            totalExpense: 0,
          },
          errors: {},
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const doc = balanceSnapshot.docs[0];

    const balance = { balanceId: doc.id, ...doc.data() };

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully fetched transactions",
        data: {
          balance,
        },
        errors: {},
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Failed to fetch balance: ", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch balance",
        data: {
          totalIncome: 0,
          totalExpense: 0,
        },
        errors: {},
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const GET = withAuth(getBalance);
