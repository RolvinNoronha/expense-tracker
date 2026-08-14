import { adminDb } from "@/lib/firebaseAdmin";
import { withAuth } from "@/lib/with-auth";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import z from "zod";

const accountSchema = z.object({
  accountName: z
    .string({ error: "Account name is required" })
    .min(0, "Account name must be atleast 2 characters long")
    .max(100, "Account Name cannot exceed 100 characters"),
  balance: z.number().optional(),
});

const addAccount = async (request: NextRequest) => {
  const user = request.user;
  const body = await request.json();

  try {
    const result = await accountSchema.parseAsync(body);
    const { accountName, balance } = result;

    const accountsSnapshot = await adminDb
      .collection("accounts")
      .where("userId", "==", user?.uid)
      .count()
      .get();

    if (accountsSnapshot.data().count >= 5) {
      console.warn("Account creation limit reached");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Account creation limit reached",
          data: {},
          errors: {},
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await adminDb.collection("accounts").add({
      userId: user?.uid,
      accountName: accountName,
      balance: balance ? balance : 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    console.log("Successfully added account");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully added account",
        data: {},
        errors: {},
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to add account: ", error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to add account",
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
        message: "Failed to add account",
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

const getAccounts = async (request: NextRequest) => {
  const user = request.user;

  try {
    const accountsSnapshot = await adminDb
      .collection("accounts")
      .where("userId", "==", user?.uid)
      .get();

    const accounts = accountsSnapshot.docs.map((doc) => {
      return {
        accountId: doc.id,
        ...doc.data(),
      };
    });

    console.log("Successfully fetched accounts");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully fetched accounts",
        data: {
          accounts: accounts,
        },
        errors: {},
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to fetch accounts: ", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to fetch accounts",
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

export const GET = withAuth(getAccounts);
export const POST = withAuth(addAccount);
