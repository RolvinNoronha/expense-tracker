import categories from "@/lib/categories";
import { adminDb } from "@/lib/firebaseAdmin";
import { withAuth } from "@/lib/with-auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { z, ZodError } from "zod";

type Categories = typeof categories;

// Extract category keys and type them as a non-empty array for z.enum
const categoryKeys = Object.keys(categories) as [
  keyof Categories,
  ...(keyof Categories)[]
];

// Define the schema for the body using .superRefine for dependent validation
const transactionSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    category: z.enum(categoryKeys),
    subcategory: z.string({
      error: "Subcategory is required",
    }),
    thirdCategory: z.string().optional(),
    description: z.string().optional(),
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

// Function to generate a random number within a given range
function getRandomNumber(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

// Function to generate a random date within the last year
function getRandomDate() {
  const randomDate = new Date();
  randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 365));
  return randomDate;
}

// Function to randomly choose a value from an array
function getRandomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Function to generate 20 random objects
function generateRandomObjects(num = 20) {
  const randomObjects = [];

  for (let i = 0; i < num; i++) {
    // Randomly choose type (income or expense)
    const type = Math.random() < 0.5 ? "income" : "expense";

    // Randomly choose category and subcategory
    const categoryKey = getRandomItem(Object.keys(categories));
    const category = categoryKey;
    const subcategory = getRandomItem(
      categories[category as keyof typeof categories]
    );

    // Randomly choose thirdCategory (could be an additional subcategory or related item)
    let thirdCategory = "";
    if (categoryKey === "income" || categoryKey === "savings") {
      thirdCategory = "investments"; // Just an example, adjust for specific use case
    } else {
      thirdCategory = getRandomItem(
        categories[categoryKey as keyof typeof categories]
      );
    }

    // Random amount
    const amount = getRandomNumber(100, 5000).toFixed(2);

    // Random description
    const description = `Random transaction for ${subcategory} in the ${categoryKey} category.`;

    // Random date
    const date = getRandomDate();

    // Create object and add to the result array
    randomObjects.push({
      amount: parseFloat(amount),
      currency: "INR",
      date: date,
      type: type,
      category: category,
      subcategory: subcategory,
      thirdCategory: thirdCategory,
      description: description,
    });
  }

  return randomObjects;
}

// Add Transaction
const addTransaction = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const balanceId = searchParams.get("balanceId");
  if (!balanceId) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing balanceId in request query",
        data: {},
        errors: {},
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  const user = request.user;
  const body = await request.json();

  try {
    const result = await transactionSchema.parseAsync(body);
    const {
      amount,
      category,
      date,
      type,
      subcategory,
      description,
      thirdCategory,
    } = result;

    adminDb.collection("expenses").add({
      userId: user?.uid,
      balanceId: balanceId,
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

    /*
    const randomTransactions = generateRandomObjects(20);
    for (const transaction of randomTransactions) {
      await firebaseAdmin.collection("expenses").add({
        userId: user?.uid,
        amount: transaction.amount,
        currency: "INR",
        date: Timestamp.fromDate(transaction.date),
        type: transaction.type,
        category: transaction.category,
        subcategory: transaction.subcategory,
        thirdCategory: transaction.thirdCategory,
        description: transaction.description,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    */

    if (result.type === "expense") {
      await adminDb
        .collection("balance")
        .doc(balanceId)
        .update({
          totalExpense: FieldValue.increment(result.amount),
        });
    } else if (result.type === "income") {
      await adminDb
        .collection("balance")
        .doc(balanceId)
        .update({
          totalIncome: FieldValue.increment(result.amount),
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully added transaction",
        data: {},
        errors: {},
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to add the transaction",
          data: {},
          errors: JSON.parse(error.message),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to add the transaction",
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

export const POST = withAuth(addTransaction);

// Get Transactions
const getTransaction = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const lastTransaction = searchParams.get("lastTransactionId");
  // const category = searchParams.get("category");
  // const subcategory = searchParams.get("subcategory");
  const user = request.user;
  const limit = 20;

  try {
    let transactionQuery = adminDb
      .collection("expenses")
      .where("userId", "==", user?.uid)
      .orderBy("date", "desc")
      .limit(limit);

    if (lastTransaction) {
      const lastTransactionSnapshot = await adminDb
        .collection("expenses")
        .doc(lastTransaction)
        .get();

      if (!lastTransactionSnapshot.exists) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Successfully fetched transactions",
            data: {
              transactions: [],
              lastTransactionId: undefined,
              hasMore: false,
            },
            errors: {},
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      transactionQuery = transactionQuery.startAfter(lastTransactionSnapshot);
    }

    const transactionsSnapshot = await transactionQuery.get();
    if (transactionsSnapshot.empty) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Successfully fetched transactions",
          data: {
            transactions: [],
            lastTransactionId: undefined,
            hasMore: false,
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

    const lastTransactionId = transactionsSnapshot.docs.length
      ? transactionsSnapshot.docs[transactionsSnapshot.docs.length - 1].id
      : undefined;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully fetched transactions",
        data: {
          transactions: transactions,
          lastTransactionId: lastTransactionId,
          hasMore: transactionsSnapshot.docs.length === limit,
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
          lastTransactionId: undefined,
          hasMore: false,
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

export const GET = withAuth(getTransaction);

// Update Transaction
const updateTransaction = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get("transactionId");
  const balanceId = searchParams.get("balanceId");

  if (!transactionId || !balanceId) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing required fields",
        data: {},
        errors: {},
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await request.json();

    const result = await transactionSchema.parseAsync(body);
    const {
      amount,
      category,
      date,
      type,
      subcategory,
      description,
      thirdCategory,
    } = result;

    const txnRef = adminDb.collection("expenses").doc(transactionId);

    const txnSnapshot = await txnRef.get();
    const data = txnSnapshot.data();
    if (!txnSnapshot.exists || !data) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Transaction not found",
          data: {},
          errors: {},
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    txnRef.update({});

    adminDb.collection("expenses").add({
      amount: amount,
      date: Timestamp.fromDate(date),
      type: type,
      category: category,
      subcategory: subcategory,
      thirdCategory: thirdCategory ?? "",
      description: description ?? "",
    });

    let value = 0;
    if (data.type === "income" && result.type === "expense") {
      value = -result.amount - data.amount;
    } else if (data.type == "expense" && result.type === "income") {
      value = result.amount + data.amount;
    } else if (data.type === "income" && result.type === "income") {
      value = Math.abs(data.amount - result.amount);
    } else if (data.type === "expense" && result.type === "expense") {
      value = -Math.abs(data.amount - result.amount);
    }

    await adminDb
      .collection("balance")
      .doc(balanceId)
      .update({
        totalExpense: FieldValue.increment(value),
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully updated transaction",
        data: {},
        errors: {},
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Failed to update transaction: ", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to update transaction",
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

export const PATCH = withAuth(updateTransaction);

const deleteTransaction = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get("transactionId");

  if (!transactionId) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing required fields",
        data: {},
        errors: {},
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const txnRef = adminDb.collection("expenses").doc(transactionId);

    const txnSnapshot = await txnRef.get();
    const data = txnSnapshot.data();
    if (!txnSnapshot.exists || !data) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Transaction not found",
          data: {},
          errors: {},
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await adminDb
      .collection("balance")
      .doc(data.balanceId)
      .update({
        totalExpense: FieldValue.increment(
          data.type === "income" ? -data.amount : data.amount
        ),
      });

    await txnRef.delete();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully updated transaction",
        data: {},
        errors: {},
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Failed to delete transaction: ", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to delete transaction",
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

export const DELETE = withAuth(deleteTransaction);
