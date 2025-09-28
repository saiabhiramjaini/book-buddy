// server/src/controllers/bookControllers.ts


import { Request, Response } from "express";
import { db } from "../db/connect";
import { books, users } from "../db/schema";
import { bookSchema } from "../common/bookValidator";
import { eq, and, ilike, or, desc, asc, count } from "drizzle-orm";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const createBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Validate input using safeParse
    const validationResult = bookSchema.safeParse({
      ...req.body,
      ownerId: userId,
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
    const bookData = validationResult.data;

    // Create book
    const newBook = await db.insert(books).values(bookData).returning();

    return res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: newBook[0],
    });
  } catch (error: any) {
    console.error("Create book error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getBooks = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      search,
      genre,
      ageGroup,
      availabilityType,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions for filtering
    const conditions = [];
    
    // Search filter - search in title and author
    if (search) {
      conditions.push(
        or(
          ilike(books.title, `%${search}%`),
          ilike(books.author, `%${search}%`)
        )
      );
    }
    
    // Genre filter
    if (genre) {
      conditions.push(eq(books.genre, genre as string));
    }
    
    // Age group filter
    if (ageGroup) {
      conditions.push(eq(books.ageGroup, ageGroup as string));
    }
    
    // Availability type filter
    if (availabilityType) {
      conditions.push(eq(books.availabilityType, availabilityType as "Free" | "Exchange"));
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(books)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = totalResult[0].count;

    // Map sortBy to valid column objects
    const sortColumns: Record<string, any> = {
      id: books.id,
      title: books.title,
      author: books.author,
      genre: books.genre,
      ageGroup: books.ageGroup,
      coverImage: books.coverImage,
      availabilityType: books.availabilityType,
      status: books.status,
      ownerId: books.ownerId,
      createdAt: books.createdAt,
      updatedAt: books.updatedAt,
    };
    const sortColumn = sortColumns[sortBy as string] || books.createdAt;

    // Get books with owner info
    const booksWithOwners = await db
      .select()
      .from(books)
      .innerJoin(users, eq(books.ownerId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn))
      .limit(limitNum)
      .offset(offset);

    const totalPages = Math.ceil(total / limitNum);

    // Transform the data to match your preferred structure
    const transformedBooks = booksWithOwners.map((item) => ({
      book: item.books,
      owner: item.users,
    }));

    return res.status(200).json({
      success: true,
      message: "Books retrieved successfully",
      data: {
        books: transformedBooks,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Get books error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getBookInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const bookId = parseInt(req.params.id);

    if (!bookId || isNaN(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Book ID must be a valid number",
      });
    }

    // Get book with owner info
    const bookWithOwner = await db
      .select()
      .from(books)
      .innerJoin(users, eq(books.ownerId, users.id))
      .where(eq(books.id, bookId))
      .limit(1);

    if (bookWithOwner.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Destructure the result to rename keys
    const { books: book, users: owner } = bookWithOwner[0];

    return res.status(200).json({
      success: true,
      message: "Book retrieved successfully",
      data: {
        book,
        owner,
      },
    });
  } catch (error: any) {
    console.error("Get book info error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const bookId = parseInt(req.params.id);

    if (!bookId || isNaN(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Book ID must be a valid number",
      });
    }

    // Check if book exists and user owns it
    const existingBook = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (existingBook.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (existingBook[0].ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own books",
      });
    }

    // Validate input (partial validation for updates)
    const validationResult = bookSchema.partial().safeParse(req.body);

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

    // Update book
    const updatedBook = await db
      .update(books)
      .set({
        ...validationResult.data,
        updatedAt: new Date(),
      })
      .where(eq(books.id, bookId))
      .returning();

    return res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: updatedBook[0],
    });
  } catch (error: any) {
    console.error("Update book error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteBook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const bookId = parseInt(req.params.id);

    if (!bookId || isNaN(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Book ID must be a valid number",
      });
    }

    // Check if book exists and user owns it
    const existingBook = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (existingBook.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (existingBook[0].ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own books",
      });
    }

    // Delete book
    await db.delete(books).where(eq(books.id, bookId));

    return res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete book error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
