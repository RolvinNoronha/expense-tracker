import categories from "@/lib/categories";
import { adminDb as firebaseAdmin } from "@/lib/firebaseAdmin";
import { withAuth } from "@/lib/with-auth";
import { Timestamp } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

type Categories = typeof categories;

// Extract category keys and type them as a non-empty array for z.enum
const categoryKeys = Object.keys(categories) as [
  keyof Categories,
  ...(keyof Categories)[]
];

// Define the schema for the body using .superRefine for dependent validation
const expenseSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    category: z.enum(categoryKeys),
    subcategory: z.string({
      error: "Subcategory is required",
    }),
    thirdCategory: z.string().min(2).optional(),
    description: z.string().min(2).optional(),
    amount: z
      .number({ error: "Amount is required" })
      .min(0, "Amount must be positive"),
    date: z.coerce.date({ error: "Date is required" }),
  })
  .superRefine((data, ctx) => {
    const category = data.category as keyof Categories;

    const validSubcategories = categories[category];

    // Check if the provided subcategory is in the valid list
    if (!validSubcategories.includes(data.subcategory)) {
      // If not, add an issue specifically for the subcategory field
      ctx.addIssue({
        code: "custom",
        path: ["subcategory"], // The field this error applies to
        message: `Invalid subcategory for '${category}'. Expected one of: ${validSubcategories.join(
          ", "
        )}`,
        received: data.subcategory,
        options: validSubcategories, // This provides the list of valid options
      });
    }
  });

const addExpense = async (request: NextRequest) => {
  try {
    const user = request.user;
    const body = await request.json();
    const result = await expenseSchema.parseAsync(body);
    const {
      amount,
      category,
      date,
      type,
      subcategory,
      description,
      thirdCategory,
    } = result;

    firebaseAdmin.collection("expenses").add({
      userId: user?.uid,
      amount: amount,
      currency: "INR",
      date: Timestamp.fromDate(date),
      type: type,
      category: category,
      subcategory: subcategory,
      thirdCategory: thirdCategory ?? "",
      description: description ?? "",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return new Response(
      JSON.stringify({
        message: "successfully added expense",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({ error: JSON.parse(error.message) }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return new Response(JSON.stringify({ error: error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST = withAuth(addExpense);
