import categories from "@/lib/categories";
import { adminDb } from "@/lib/firebaseAdmin";
import { withAuth } from "@/lib/with-auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import * as z from "zod";

type Categories = typeof categories;

// Extract category keys and type them as a non-empty array for z.enum
const categoryKeys = Object.keys(categories) as [
  keyof Categories,
  ...(keyof Categories)[],
];

// Define the schema for the body using .superRefine for dependent validation
const transactionSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("income"),
      accountId: z.string(),
      category: z.enum(categoryKeys),
      subcategory: z.string(),
      thirdCategory: z.string().optional(),
      description: z.string().optional(),
      amount: z.number().min(0, "Amount must be positive"),
      date: z.coerce.date(),
    }),

    z.object({
      type: z.literal("expense"),
      accountId: z.string(),
      category: z.enum(categoryKeys),
      subcategory: z.string(),
      thirdCategory: z.string().optional(),
      description: z.string().optional(),
      amount: z.number().min(0, "Amount must be positive"),
      date: z.coerce.date(),
    }),

    z.object({
      type: z.literal("transfer"),
      accountId: z.string(),
      toAccountId: z.string(),
      description: z.string().optional(),
      amount: z.number().min(0, "Amount must be positive"),
      date: z.coerce.date(),
    }),
  ])
  .superRefine((data, ctx) => {
    if (data.type === "transfer") {
      if (data.accountId === data.toAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["toAccountId"],
          message: "From and to accounts must be different",
        });
      }

      return;
    }

    const category = data.category as keyof Categories;
    const validSubcategories = categories[category];

    if (!validSubcategories.includes(data.subcategory)) {
      ctx.addIssue({
        code: "custom",
        path: ["subcategory"],
        message: `Invalid subcategory for '${category}'. Expected one of: ${validSubcategories.join(
          ", ",
        )}`,
      });
    }
  });

const updateTransactionSchema = z.object({
  accountId: z.string().optional(),
  toAccountId: z.string().optional(),

  category: z.enum(categoryKeys).optional(),
  subcategory: z.string().optional(),
  thirdCategory: z.string().optional(),
  description: z.string().optional(),

  amount: z.number().min(0, "Amount must be positive").optional(),

  date: z.coerce.date().optional(),
});

// Add Transaction
const addTransaction = async (request: NextRequest) => {
  const user = request.user;
  const body = await request.json();
  const month = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
  });
  const summaryId = `${user?.uid}_${month}`;

  try {
    const transaction = await transactionSchema.parseAsync(body);

    const result = await adminDb.runTransaction(async (tx) => {
      const transactionRef = adminDb.collection("transactions").doc();
      const fromAccountRef = adminDb
        .collection("accounts")
        .doc(transaction.accountId);
      const summaryRef = adminDb.collection("monthly-summary").doc(summaryId);

      const data = (await fromAccountRef.get()).data();
      if (transaction.type === "expense" || transaction.type === "transfer") {
        if (!data || transaction.amount > (data.balance ?? 0)) {
          return {
            success: false,
            message: "Insufficient balance in the account",
          };
        }
      }

      if (transaction.type !== "transfer") {
        tx.set(transactionRef, {
          userId: user?.uid,
          amount: transaction.amount,
          account: transaction.accountId,
          accountId: transaction.accountId,
          currency: "INR",
          date: Timestamp.fromDate(transaction.date),
          type: transaction.type,
          category: transaction.category,
          subcategory: transaction.subcategory,
          thirdCategory: transaction.thirdCategory ?? "",
          description: transaction.description ?? "",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        const balanceChange =
          transaction.type === "income"
            ? transaction.amount
            : -transaction.amount;

        tx.update(fromAccountRef, {
          balance: FieldValue.increment(balanceChange),
        });

        if (transaction.type === "income") {
          tx.update(summaryRef, {
            totalIncome: FieldValue.increment(transaction.amount),
          });
        } else if (transaction.type === "expense") {
          tx.update(summaryRef, {
            totalExpense: FieldValue.increment(transaction.amount),
          });
        }

        return { success: true, message: "Successfully added transaction" };
      }

      const toAccountRef = adminDb
        .collection("accounts")
        .doc(transaction.toAccountId);

      tx.set(transactionRef, {
        userId: user?.uid,
        amount: transaction.amount,
        type: transaction.type,
        accountId: transaction.accountId,
        account: transaction.accountId,
        currency: "INR",
        toAccountId: transaction.toAccountId,
        description: transaction.description ?? "",
        date: Timestamp.fromDate(transaction.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      tx.update(fromAccountRef, {
        balance: FieldValue.increment(-transaction.amount),
      });

      tx.update(toAccountRef, {
        balance: FieldValue.increment(transaction.amount),
      });

      return {
        success: true,
        message: "Successfully added transaction",
      };
    });

    console.log(result.message);
    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.message,
        data: {},
        errors: {},
      }),
      {
        status: result.success ? 201 : 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to add transaction: ", error);
    if (error instanceof z.ZodError) {
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
        },
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
      },
    );
  }
};

// Get Transactions
const getTransaction = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const lastTransaction = searchParams.get("lastTransactionId");
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");
  const accountId = searchParams.get("accountId");
  const month = searchParams.get("month");
  const limitParam = searchParams.get("limit");
  const user = request.user;
  const limit = limitParam ? parseInt(limitParam, 10) : 10;
  const userId = user?.uid || (user as any)?.userId;

  try {
    let transactionQuery: FirebaseFirestore.Query = adminDb
      .collection("transactions")
      .where("userId", "==", userId);

    if (accountId && accountId.length > 0) {
      transactionQuery = transactionQuery.where("accountId", "==", accountId);
    }
    if (category && category.length > 0) {
      transactionQuery = transactionQuery.where("category", "==", category);
    }
    if (subcategory && subcategory.length > 0) {
      transactionQuery = transactionQuery.where(
        "subcategory",
        "==",
        subcategory,
      );
    }
    if (month && month.length > 0) {
      const [year, monthNumber] = month.split("-").map(Number);
      const startDate = new Date(Date.UTC(year, monthNumber - 1, 1));
      const endDate = new Date(Date.UTC(year, monthNumber, 1));
      transactionQuery = transactionQuery
        .where("date", ">=", Timestamp.fromDate(startDate))
        .where("date", "<", Timestamp.fromDate(endDate));
    }

    transactionQuery = transactionQuery.orderBy("date", "desc").limit(limit);

    if (lastTransaction) {
      const lastTransactionSnapshot = await adminDb
        .collection("transactions")
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
          },
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
        },
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
      },
    );
  } catch (error) {
    console.error("Failed to get transactions: ", error);
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
      },
    );
  }
};

// Update Transaction
const updateTransaction = async (request: NextRequest) => {
  const user = request.user;
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get("transactionId");

  if (!transactionId) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing transactionId in request params",
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
    const body = await request.json();
    const newTransaction = await updateTransactionSchema.parseAsync(body);

    const result = await adminDb.runTransaction(async (tx) => {
      const transactionRef = adminDb
        .collection("transactions")
        .doc(transactionId);

      const transactionSnapshot = await tx.get(transactionRef);

      if (!transactionSnapshot.exists) {
        return {
          success: false,
          message: "Transaction not found",
        };
      }

      const existing = transactionSnapshot.data();

      if (!existing || existing.userId !== user?.uid) {
        return {
          success: false,
          message: "Transaction not found",
        };
      }

      const type = existing.type as "income" | "expense" | "transfer";

      const oldAccountId = existing.accountId;
      const oldAmount = existing.amount;

      const newAccountId = newTransaction.accountId ?? oldAccountId;
      const newAmount = newTransaction.amount ?? oldAmount;

      // Validate transaction-specific fields
      if (type !== "transfer" && newTransaction.toAccountId !== undefined) {
        return {
          success: false,
          message: "toAccountId can only be specified for transfers",
        };
      }

      if (type === "transfer") {
        const oldToAccountId = existing.toAccountId;
        const newToAccountId = newTransaction.toAccountId ?? oldToAccountId;

        if (!newToAccountId) {
          return {
            success: false,
            message: "Destination account is required",
          };
        }

        if (newAccountId === newToAccountId) {
          return {
            success: false,
            message: "Source and destination accounts must be different",
          };
        }

        // TRANSFER
        const oldFromAccountRef = adminDb
          .collection("accounts")
          .doc(oldAccountId);

        const oldToAccountRef = adminDb
          .collection("accounts")
          .doc(oldToAccountId);

        const newFromAccountRef = adminDb
          .collection("accounts")
          .doc(newAccountId);

        const newToAccountRef = adminDb
          .collection("accounts")
          .doc(newToAccountId);

        // Read all affected accounts.
        const accountRefs = [
          oldFromAccountRef,
          oldToAccountRef,
          newFromAccountRef,
          newToAccountRef,
        ];

        const uniqueAccountRefs = Array.from(
          new Map(accountRefs.map((ref) => [ref.path, ref])).values(),
        );

        const snapshots = await Promise.all(
          uniqueAccountRefs.map((ref) => tx.get(ref)),
        );

        const accounts = new Map(
          snapshots.map((snapshot) => [snapshot.id, snapshot.data()]),
        );

        const newFromAccount = accounts.get(newAccountId);

        if (!newFromAccount) {
          return {
            success: false,
            message: "Source account not found",
          };
        }

        /*
         * If the new source account is the same as the old
         * source account, its old transfer amount will be
         * returned before the new transfer is applied.
         */
        let availableBalance = newFromAccount.balance ?? 0;

        if (newAccountId === oldAccountId) {
          availableBalance += oldAmount;
        }

        if (availableBalance < newAmount) {
          return {
            success: false,
            message: "Insufficient balance in the source account",
          };
        }

        // Undo old transfer.
        tx.update(oldFromAccountRef, {
          balance: FieldValue.increment(oldAmount),
        });

        tx.update(oldToAccountRef, {
          balance: FieldValue.increment(-oldAmount),
        });

        // Apply new transfer.
        tx.update(newFromAccountRef, {
          balance: FieldValue.increment(-newAmount),
        });

        tx.update(newToAccountRef, {
          balance: FieldValue.increment(newAmount),
        });

        const transactionUpdate: Record<string, unknown> = {
          accountId: newAccountId,
          toAccountId: newToAccountId,
          amount: newAmount,
          updatedAt: Timestamp.now(),
        };

        if (newTransaction.description !== undefined) {
          transactionUpdate.description = newTransaction.description;
        }

        if (newTransaction.date !== undefined) {
          transactionUpdate.date = Timestamp.fromDate(newTransaction.date);
        }

        tx.update(transactionRef, transactionUpdate);

        return {
          success: true,
          message: "Successfully updated transaction",
        };
      }

      // INCOME / EXPENSE
      // These transaction types shouldn't contain toAccountId.
      if (newTransaction.toAccountId !== undefined) {
        return {
          success: false,
          message: "toAccountId can only be specified for transfers",
        };
      }

      // Validate category/subcategory.
      const newCategory = newTransaction.category ?? existing.category;
      const newSubcategory = newTransaction.subcategory ?? existing.subcategory;
      const validSubcategories = categories[newCategory as keyof Categories];

      if (!validSubcategories || !validSubcategories.includes(newSubcategory)) {
        return {
          success: false,
          message: `Invalid subcategory for '${newCategory}'. Expected one of: ${validSubcategories?.join(
            ", ",
          )}`,
        };
      }

      const oldAccountRef = adminDb.collection("accounts").doc(oldAccountId);
      const newAccountRef = adminDb.collection("accounts").doc(newAccountId);

      const accountRefs =
        oldAccountId === newAccountId
          ? [oldAccountRef]
          : [oldAccountRef, newAccountRef];

      const snapshots = await Promise.all(
        accountRefs.map((ref) => tx.get(ref)),
      );

      const accounts = new Map(
        snapshots.map((snapshot) => [snapshot.id, snapshot.data()]),
      );

      const newAccount = accounts.get(newAccountId);

      if (!newAccount) {
        return {
          success: false,
          message: "Account not found",
        };
      }

      /*
       * Calculate the balance effect.
       *
       * income  => +amount
       * expense => -amount
       */
      const oldBalanceEffect = type === "expense" ? -oldAmount : oldAmount;
      const newBalanceEffect = type === "expense" ? -newAmount : newAmount;

      if (oldAccountId === newAccountId) {
        // Same account: remove old effect and apply new effect after checking enough balance.
        if (newAccount.balance < newBalanceEffect - oldBalanceEffect) {
          return {
            success: false,
            message: "Insufficient balance in the account",
          };
        }

        tx.update(newAccountRef, {
          balance: FieldValue.increment(newBalanceEffect - oldBalanceEffect),
        });
      } else {
        // Account changed: undo transaction on old account and apply it to new account.
        tx.update(oldAccountRef, {
          balance: FieldValue.increment(-oldBalanceEffect),
        });

        // For a new expense, make sure the new account has enough balance.
        if (type === "expense" && (newAccount.balance ?? 0) < newAmount) {
          return {
            success: false,
            message: "Insufficient balance in the new account",
          };
        }

        tx.update(newAccountRef, {
          balance: FieldValue.increment(newBalanceEffect),
        });
      }

      const transactionUpdate: Record<string, unknown> = {
        accountId: newAccountId,
        amount: newAmount,
        updatedAt: Timestamp.now(),
      };

      if (newTransaction.category !== undefined) {
        transactionUpdate.category = newTransaction.category;
      }

      if (newTransaction.subcategory !== undefined) {
        transactionUpdate.subcategory = newTransaction.subcategory;
      }

      if (newTransaction.thirdCategory !== undefined) {
        transactionUpdate.thirdCategory = newTransaction.thirdCategory;
      }

      if (newTransaction.description !== undefined) {
        transactionUpdate.description = newTransaction.description;
      }

      if (newTransaction.date !== undefined) {
        transactionUpdate.date = Timestamp.fromDate(newTransaction.date);
      }

      tx.update(transactionRef, transactionUpdate);

      return {
        success: true,
        message: "Successfully updated transaction",
      };
    });

    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.message,
        data: {},
        errors: {},
      }),
      {
        status: result.success ? 200 : 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Failed to update transaction:", error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to update the transaction",
          data: {},
          errors: error.issues,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to update the transaction",
        data: {},
        errors: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

// Delete Transaction
const deleteTransaction = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get("transactionId");
  const user = request.user;
  const month = new Date().toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
  });
  const summaryId = `${user?.uid}_${month}`;

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
      },
    );
  }

  try {
    const txnRef = adminDb.collection("transactions").doc(transactionId);

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
        },
      );
    }

    await adminDb.runTransaction(async (tx) => {
      const fromAccountRef = adminDb.collection("accounts").doc(data.accountId);
      const summaryRef = adminDb.collection("monthly-summary").doc(summaryId);

      if (data.type === "transfer") {
        const toAccountRef = adminDb
          .collection("accounts")
          .doc(data.toAccountId);
        tx.update(toAccountRef, {
          balance: FieldValue.increment(-data.amount),
        });

        tx.update(fromAccountRef, {
          balance: FieldValue.increment(data.amount),
        });

        tx.delete(txnRef);
        return;
      }

      tx.update(fromAccountRef, {
        balance: FieldValue.increment(data.amount),
      });

      if (data.type === "income") {
        tx.update(summaryRef, {
          totalIncome: FieldValue.increment(-data.amount),
        });
      } else if (data.type === "expense") {
        tx.update(summaryRef, {
          totalExpense: FieldValue.increment(-data.amount),
        });
      }

      tx.delete(txnRef);
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
      },
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
      },
    );
  }
};

export const POST = withAuth(addTransaction);
export const GET = withAuth(getTransaction);
export const PATCH = withAuth(updateTransaction);
export const DELETE = withAuth(deleteTransaction);
