import { adminDb } from "@/lib/firebaseAdmin";
import { withAuth } from "@/lib/with-auth";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import * as z from "zod";

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format");

// get monthly summary
const getMonthlySummary = async (request: NextRequest) => {
  const user = request.user;
  const searchParams = request.nextUrl.searchParams;
  const monthParam = searchParams.get("month");

  try {
    const month = await monthSchema.parseAsync(monthParam);
    const docId = `${user?.userId}_${month}`;
    const summaryRef = adminDb.collection("monthly-summary").doc(docId);

    const monthlySummary = await adminDb.runTransaction(async (tx) => {
      const msDoc = await tx.get(summaryRef);

      if (msDoc.exists) {
        return { data: msDoc.data(), created: false };
      }

      const newMsData = {
        userId: user?.userId,
        month: month,
        totalIncome: 0,
        totalExpense: 0,
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      };

      tx.set(summaryRef, newMsData);
      console.log("New report created successfully!");
      return { data: newMsData, created: true };
    });

    console.log("Successfully fetched monthly summary");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully fetched monthly summary",
        data: {
          monthlySummary,
        },
        errors: {},
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to fetch transactions:", error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to fetch transaction",
          data: {},
          errors: JSON.parse(error.message),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch transaction",
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

export const GET = withAuth(getMonthlySummary);
