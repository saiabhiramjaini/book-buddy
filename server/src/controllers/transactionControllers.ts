// server/src/controllers/transactionControllers.ts

import { Response } from "express";
import { db } from "../db/connect";
import { transactions, books, users } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { createTransactionSchema, updateTransactionSchema } from "../common/transactionValidator";

export const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Validate input using safeParse
    const validationResult = createTransactionSchema.safeParse(req.body);

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((error: any) => ({
        field: error.path.join("."),
        message: error.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const { requestedBookId, ownerId, type, offeredBookId } = validationResult.data;

    // Check if the requested book exists
    const book = await db
      .select()
      .from(books)
      .where(eq(books.id, requestedBookId))
      .limit(1);

    if (book.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if the book is available
    if (book[0].status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Book is not available for request",
        errors: [
          {
            field: "requestedBookId",
            message: "Book is not available for request",
          }
        ],
      });
    }

    // Verify that the owner ID matches the book's owner
    if (book[0].ownerId !== ownerId) {
      return res.status(400).json({
        success: false,
        message: "Invalid owner ID for this book",
        errors: [
          {
            field: "ownerId",
            message: "Owner ID does not match the book's owner",
          }
        ],
      });
    }

    // For Exchange type, validate offered book
    if (type === "Exchange") {
      if (!offeredBookId) {
        return res.status(400).json({
          success: false,
          message: "Offered book is required for exchange type",
        });
      }

      // Check if offered book exists 
      const offeredBook = await db
        .select()
        .from(books)
        .where(eq(books.id, offeredBookId))
        .limit(1);

      if (offeredBook.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Offered book not found",
        });
      }

      // Check if offered book belongs to the requester
      if (offeredBook[0].ownerId !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only offer your own books",
        });
      }

      // Check if offered book is available
      if (offeredBook[0].status !== "available") {
        return res.status(400).json({
          success: false,
          message: "Offered book is not available",
        });
      }

      // Check if user is trying to offer the same book they're requesting
      if (offeredBookId === requestedBookId) {
        return res.status(400).json({
          success: false,
          message: "Cannot offer the same book you're requesting",
        });
      }
    }

    // Check if user is trying to request their own book
    if (book[0].ownerId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot request your own book",
      });
    }

    // Validate transaction type matches book availability
    if (book[0].availabilityType !== type) {
      return res.status(400).json({
        success: false,
        message: "Transaction type must match book availability type",
      });
    }

    // Check if there's already a pending transaction for this book by this user
    const existingTransaction = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.requesterId, userId),
          eq(transactions.requestedBookId, requestedBookId),
          eq(transactions.status, "pending")
        )
      )
      .limit(1);

    if (existingTransaction.length > 0) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending request for this book",

      });
    }

    // Create transaction
    const newTransaction = await db
      .insert(transactions)
      .values({
        requesterId: userId,
        requestedBookId,
        ownerId,
        type: type as any,
        offeredBookId: offeredBookId || null,
        status: "pending",
      })
      .returning();

    // Update requested book status to pending
    await db
      .update(books)
      .set({ 
        status: "pending",
        updatedAt: new Date()
      })
      .where(eq(books.id, requestedBookId));

    // If it's an exchange, also update offered book status to pending
    if (type === "Exchange" && offeredBookId) {
      await db
        .update(books)
        .set({ 
          status: "pending",
          updatedAt: new Date()
        })
        .where(eq(books.id, offeredBookId));
    }

    return res.status(201).json({
      success: true,
      message: "Book request submitted successfully",
      data: newTransaction[0],
    });
  } catch (error: any) {
    console.error("Create transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!transactionId || isNaN(transactionId)) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID must be a valid number",
      });
    }

    // Validate input using safeParse
    const validationResult = updateTransactionSchema.safeParse({
      id: transactionId,
      ...req.body,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((error: any) => ({
        field: error.path.join("."),
        message: error.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const { status } = validationResult.data;

    // Get transaction details with related book info
    const transactionWithBook = await db
      .select()
      .from(transactions)
      .innerJoin(books, eq(transactions.requestedBookId, books.id))
      .where(eq(transactions.id, transactionId))
      .limit(1);

    if (transactionWithBook.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const { transactions: transaction, books: book } = transactionWithBook[0];

    // Check if user is the owner of the book (only owner can approve/reject)
    if (book.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the book owner can update transaction status",
      });
    }

    // Check if transaction is in a state that can be updated
    if (transaction.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending transactions can be updated",
        errors: [
          {
            field: "status",
            message: "Only pending transactions can be updated",
          }
        ],
      });
    }

    // Validate status transition
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status can only be changed to approved or rejected",
        errors: [
          {
            field: "status",
            message: "Status can only be changed to approved or rejected",
          }
        ],
      });
    }

    // Update transaction
    const updatedTransaction = await db
      .update(transactions)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, transactionId))
      .returning();

    // Update book status based on transaction status
    let bookStatus: string;
    if (status === "approved") {
      bookStatus = "approved";
      
      // If approved, reject all other pending requests for this book
      const otherPendingTransactions = await db
        .select()
        .from(transactions)
        .where(
          eq(transactions.requestedBookId, transaction.requestedBookId)
        );

      for (const otherTransaction of otherPendingTransactions) {
        if (otherTransaction.id !== transactionId && otherTransaction.status === "pending") {
          await db
            .update(transactions)
            .set({
              status: "rejected",
              updatedAt: new Date(),
            })
            .where(eq(transactions.id, otherTransaction.id));

          // If the rejected transaction had an offered book, make it available again
          if (otherTransaction.offeredBookId) {
            await db
              .update(books)
              .set({ 
                status: "available",
                updatedAt: new Date()
              })
              .where(eq(books.id, otherTransaction.offeredBookId));
          }
        }
      }
    } else {
      bookStatus = "available"; // If rejected, make requested book available again
      
      // If rejected and it was an exchange, make offered book available again
      if (transaction.offeredBookId) {
        await db
          .update(books)
          .set({ 
            status: "available",
            updatedAt: new Date()
          })
          .where(eq(books.id, transaction.offeredBookId));
      }
    }

    // Update requested book status
    await db
      .update(books)
      .set({ 
        status: bookStatus,
        updatedAt: new Date()
      })
      .where(eq(books.id, transaction.requestedBookId));

    return res.status(200).json({
      success: true,
      message: `Transaction ${status} successfully`,
      data: updatedTransaction[0],
    });
  } catch (error: any) {
    console.error("Update transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};