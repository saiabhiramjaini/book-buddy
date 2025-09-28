// server/src/routes/bookRoutes.ts

import express from "express";
import {
  createBook,
  deleteBook,
  getBookInfo,
  getBooks,
  updateBook,
} from "../controllers/bookControllers";
import { authenticateToken,  } from "../middlewares/authMiddleware";

const bookRouter = express.Router();

bookRouter.post("/", authenticateToken, createBook as any);
bookRouter.get("/", authenticateToken, getBooks as any);
bookRouter.get("/:id", authenticateToken, getBookInfo as any);
bookRouter.patch("/:id", authenticateToken, updateBook as any);
bookRouter.delete("/:id", authenticateToken, deleteBook as any);

export default bookRouter;
