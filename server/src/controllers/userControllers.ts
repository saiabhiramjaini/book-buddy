// server/src/controllers/userControllers.ts

import { Response } from "express";
import { db } from "../db/connect";
import { users, books, transactions } from "../db/schema";
import { eq, or, desc, count } from "drizzle-orm";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const profile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get user profile
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: user[0],
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserBooks = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Build where conditions
    let whereCondition = eq(books.ownerId, userId);

    // Get all user's books
    const userBooks = await db
      .select()
      .from(books)
      .where(whereCondition)
      .orderBy(desc(books.createdAt));

    return res.status(200).json({
      success: true,
      message: "User books retrieved successfully",
      data: {
        books: userBooks,
      },
    });
  } catch (error: any) {
    console.error("Get user books error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserTransactions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Fetch transactions where user is either requester or owner
    const userTransactions = await db
      .select()
      .from(transactions)
      .innerJoin(books, eq(transactions.requestedBookId, books.id))
      .innerJoin(users, eq(transactions.requesterId, users.id))
      .where(
        or(
          eq(transactions.ownerId, userId),
          eq(transactions.requesterId, userId)
        )
      )
      .orderBy(desc(transactions.createdAt));

    // Transform result for clarity
    const transformedTransactions = userTransactions.map((item) => ({
      transaction: item.transactions,
      requestedBook: item.books,
      requester: item.users,
      transactionType:
        item.transactions.ownerId === userId ? "incoming" : "outgoing",
    }));

    return res.status(200).json({
      success: true,
      message: "User transactions retrieved successfully",
      data: {
        transactions: transformedTransactions,
      },
    });
  } catch (error: any) {
    console.error("Get user transactions error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
