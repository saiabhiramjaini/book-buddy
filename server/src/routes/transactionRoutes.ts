// server/src/routes/transactionRoutes.ts

import express from 'express';
import { createTransaction, updateTransaction } from '../controllers/transactionControllers';
import { authenticateToken } from '../middlewares/authMiddleware';

const transactionRouter = express.Router();

transactionRouter.post("/", authenticateToken, createTransaction as any);
transactionRouter.patch("/:id", authenticateToken, updateTransaction as any);

export default transactionRouter;