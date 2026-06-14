import { adminDb } from "@/lib/firebaseAdmin";
import { withAuth } from "@/lib/with-auth";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import * as z from "zod";

const owedEntrySchema = z.object({
  personName: z
    .string({ error: "Person name is required" })
    .min(1, "Person name is required"),
  amount: z
    .number({ error: "Amount is required" })
    .min(0, "Amount must be positive"),
  description: z.string().optional(),
});

// Get all owed entries
const getOwedEntries = async (request: NextRequest) => {
  const user = request.user;

  try {
    const snapshot = await adminDb
      .collection("owedToMe")
      .where("userId", "==", user?.uid)
      .orderBy("createdAt", "desc")
      .get();

    const entries = snapshot.docs.map((doc) => ({
      owedId: doc.id,
      ...doc.data(),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully fetched owed entries",
        data: { entries },
        errors: {},
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to get owed entries: ", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to get owed entries",
        data: { entries: [] },
        errors: { error },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const GET = withAuth(getOwedEntries);

// Add a new owed entry
const addOwedEntry = async (request: NextRequest) => {
  const user = request.user;
  const body = await request.json();

  try {
    const result = await owedEntrySchema.parseAsync(body);

    await adminDb.collection("owedToMe").add({
      userId: user?.uid,
      personName: result.personName,
      amount: result.amount,
      description: result.description ?? "",
      status: "pending",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully added owed entry",
        data: {},
        errors: {},
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Validation failed",
          data: {},
          errors: JSON.parse(error.message),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    console.error("Failed to add owed entry: ", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to add owed entry",
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

export const POST = withAuth(addOwedEntry);

// Mark owed entry as paid
const updateOwedEntry = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const owedId = searchParams.get("owedId");

  if (!owedId) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing owedId in request query",
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
    const docRef = adminDb.collection("owedToMe").doc(owedId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Owed entry not found",
          data: {},
          errors: {},
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await docRef.update({
      status: "paid",
      updatedAt: Timestamp.now(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully marked as paid",
        data: {},
        errors: {},
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to update owed entry: ", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to update owed entry",
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

export const PATCH = withAuth(updateOwedEntry);

// Delete owed entry
const deleteOwedEntry = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const owedId = searchParams.get("owedId");

  if (!owedId) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing owedId in request query",
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
    const docRef = adminDb.collection("owedToMe").doc(owedId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Owed entry not found",
          data: {},
          errors: {},
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await docRef.delete();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully deleted owed entry",
        data: {},
        errors: {},
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to delete owed entry: ", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to delete owed entry",
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

export const DELETE = withAuth(deleteOwedEntry);
