import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest } from "next/server";

const temp = async (request: NextRequest) => {
  try {
    const snapshot = await adminDb
      .collection("transactions")
      .where("category", "==", "savings")
      .get();

    await Promise.all(
      snapshot.docs.map(async (doc) => {
        doc.ref.update({
          accountId: "hBcuWcbhLHdmApLCNZVM",
        });
      }),
    );
  } catch (error) {
    console.log(error);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Failed",
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

export const POST = temp;
