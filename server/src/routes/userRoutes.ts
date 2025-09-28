// server/src/routes/userRoutes.ts

import express from 'express';
import { getUserBooks, getUserTransactions, profile } from '../controllers/userControllers';
import { authenticateToken } from '../middlewares/authMiddleware';

const userRouter = express.Router();

userRouter.get("/", authenticateToken, profile as any);
userRouter.get("/books", authenticateToken, getUserBooks as any);
userRouter.get("/transactions", authenticateToken, getUserTransactions as any);

export default userRouter;