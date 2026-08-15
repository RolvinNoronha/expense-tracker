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

  try {
    const transaction = await transactionSchema.parseAsync(body);
    const txnDate = new Date(transaction.date);
    const txnMonth = `${txnDate.getUTCFullYear()}-${String(
      txnDate.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    const summaryId = `${user?.uid}_${txnMonth}`;

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

        tx.set(
          summaryRef,
          {
            userId: user?.uid,
            month: txnMonth,
            totalIncome:
              transaction.type === "income"
                ? FieldValue.increment(transaction.amount)
                : FieldValue.increment(0),
            totalExpense:
              transaction.type === "expense"
                ? FieldValue.increment(transaction.amount)
                : FieldValue.increment(0),
            updatedAt: Timestamp.now(),
            createdAt: Timestamp.now(),
          },
          { merge: true },
        );

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
    if (month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
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

      const oldAccountId = existing.accountId || existing.account;
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

        // Calculate net delta and check sufficient balance on each account
        for (const [accId, accData] of accounts.entries()) {
          if (!accData) {
            return {
              success: false,
              message: "One of the transfer accounts was not found",
            };
          }
          let netDelta = 0;
          if (accId === oldAccountId) netDelta += oldAmount;
          if (accId === oldToAccountId) netDelta -= oldAmount;
          if (accId === newAccountId) netDelta -= newAmount;
          if (accId === newToAccountId) netDelta += newAmount;

          const resultingBalance = (accData.balance ?? 0) + netDelta;
          if (resultingBalance < 0) {
            return {
              success: false,
              message: `Insufficient balance in account ${
                accData.accountName || ""
              }`.trim(),
            };
          }
        }

        // Apply transfer balance updates
        for (const ref of uniqueAccountRefs) {
          const accId = ref.id;
          let netDelta = 0;
          if (accId === oldAccountId) netDelta += oldAmount;
          if (accId === oldToAccountId) netDelta -= oldAmount;
          if (accId === newAccountId) netDelta -= newAmount;
          if (accId === newToAccountId) netDelta += newAmount;

          if (netDelta !== 0) {
            tx.update(ref, {
              balance: FieldValue.increment(netDelta),
            });
          }
        }

        const transactionUpdate: Record<string, unknown> = {
          accountId: newAccountId,
          account: newAccountId,
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

      const oldAccount = accounts.get(oldAccountId);
      const newAccount = accounts.get(newAccountId);

      if (!newAccount) {
        return {
          success: false,
          message: "Account not found",
        };
      }

      /*
       * Calculate the balance effect.
       * income  => +amount
       * expense => -amount
       */
      const oldBalanceEffect = type === "expense" ? -oldAmount : oldAmount;
      const newBalanceEffect = type === "expense" ? -newAmount : newAmount;

      if (oldAccountId === newAccountId) {
        const delta = newBalanceEffect - oldBalanceEffect;
        const resultingBalance = (newAccount.balance ?? 0) + delta;

        if (resultingBalance < 0) {
          return {
            success: false,
            message: "Insufficient balance in the account",
          };
        }

        tx.update(newAccountRef, {
          balance: FieldValue.increment(delta),
        });
      } else {
        if (!oldAccount) {
          return {
            success: false,
            message: "Previous account not found",
          };
        }

        const oldResultingBalance =
          (oldAccount.balance ?? 0) - oldBalanceEffect;
        const newResultingBalance =
          (newAccount.balance ?? 0) + newBalanceEffect;

        if (oldResultingBalance < 0) {
          return {
            success: false,
            message: "Insufficient balance in the previous account",
          };
        }

        if (newResultingBalance < 0) {
          return {
            success: false,
            message: "Insufficient balance in the new account",
          };
        }

        tx.update(oldAccountRef, {
          balance: FieldValue.increment(-oldBalanceEffect),
        });

        tx.update(newAccountRef, {
          balance: FieldValue.increment(newBalanceEffect),
        });
      }

      // Update monthly-summary doc for the corresponding month(s)
      const existingDate = existing.date ? existing.date.toDate() : new Date();
      const oldMonth = `${existingDate.getUTCFullYear()}-${String(
        existingDate.getUTCMonth() + 1,
      ).padStart(2, "0")}`;

      const updatedDate = newTransaction.date
        ? new Date(newTransaction.date)
        : existingDate;
      const newMonth = `${updatedDate.getUTCFullYear()}-${String(
        updatedDate.getUTCMonth() + 1,
      ).padStart(2, "0")}`;

      if (oldMonth === newMonth) {
        const amountDiff = newAmount - oldAmount;
        if (amountDiff !== 0) {
          const summaryRef = adminDb
            .collection("monthly-summary")
            .doc(`${user?.uid}_${oldMonth}`);

          tx.set(
            summaryRef,
            {
              userId: user?.uid,
              month: oldMonth,
              totalIncome:
                type === "income"
                  ? FieldValue.increment(amountDiff)
                  : FieldValue.increment(0),
              totalExpense:
                type === "expense"
                  ? FieldValue.increment(amountDiff)
                  : FieldValue.increment(0),
              updatedAt: Timestamp.now(),
              createdAt: Timestamp.now(),
            },
            { merge: true },
          );
        }
      } else {
        // Month changed: adjust old month summary and new month summary
        const oldSummaryRef = adminDb
          .collection("monthly-summary")
          .doc(`${user?.uid}_${oldMonth}`);
        const newSummaryRef = adminDb
          .collection("monthly-summary")
          .doc(`${user?.uid}_${newMonth}`);

        tx.set(
          oldSummaryRef,
          {
            userId: user?.uid,
            month: oldMonth,
            totalIncome:
              type === "income"
                ? FieldValue.increment(-oldAmount)
                : FieldValue.increment(0),
            totalExpense:
              type === "expense"
                ? FieldValue.increment(-oldAmount)
                : FieldValue.increment(0),
            updatedAt: Timestamp.now(),
            createdAt: Timestamp.now(),
          },
          { merge: true },
        );

        tx.set(
          newSummaryRef,
          {
            userId: user?.uid,
            month: newMonth,
            totalIncome:
              type === "income"
                ? FieldValue.increment(newAmount)
                : FieldValue.increment(0),
            totalExpense:
              type === "expense"
                ? FieldValue.increment(newAmount)
                : FieldValue.increment(0),
            updatedAt: Timestamp.now(),
            createdAt: Timestamp.now(),
          },
          { merge: true },
        );
      }

      const transactionUpdate: Record<string, unknown> = {
        accountId: newAccountId,
        account: newAccountId,
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

    const txnDate = data.date ? data.date.toDate() : new Date();
    const txnMonth = `${txnDate.getUTCFullYear()}-${String(
      txnDate.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    const summaryId = `${user?.uid}_${txnMonth}`;

    await adminDb.runTransaction(async (tx) => {
      const fromAccountRef = adminDb
        .collection("accounts")
        .doc(data.accountId || data.account);
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

      const balanceChange =
        data.type === "income" ? -data.amount : data.amount;

      tx.update(fromAccountRef, {
        balance: FieldValue.increment(balanceChange),
      });

      if (data.type === "income" || data.type === "expense") {
        tx.set(
          summaryRef,
          {
            userId: user?.uid,
            month: txnMonth,
            totalIncome:
              data.type === "income"
                ? FieldValue.increment(-data.amount)
                : FieldValue.increment(0),
            totalExpense:
              data.type === "expense"
                ? FieldValue.increment(-data.amount)
                : FieldValue.increment(0),
            updatedAt: Timestamp.now(),
            createdAt: Timestamp.now(),
          },
          { merge: true },
        );
      }

      tx.delete(txnRef);
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully deleted transaction",
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
