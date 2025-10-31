import { withAuth } from "@/lib/with-auth";
import { NextRequest } from "next/server";
import { date, z } from "zod";

const expenseSchema = z.object({
  body: z.object({
    name: z.enum(["income", "expense"]),
    category: z.enum([
      "salary",
      "housing",
      "transporation",
      "food",
      "health",
      "entertainment",
      "personal-care",
      "education",
      "family",
      "debt",
      "savings",
      "insurance",
    ]),
    subCategory: "",
    thirdCategory: z.string().min(2).optional(),
    description: z.string().min(2).optional(),
    amount: z.number(),
    date: z.date(),
  }),
});

const addExpense = async (request: NextRequest) => {
  const body = await request.json();
  const {
    type,
    category,
    subCategory,
    thirdCategory,
    description,
    amount,
    date,
  } = body;

  return new Response(
    JSON.stringify({
      type,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
};

export const POST = withAuth(addExpense);
