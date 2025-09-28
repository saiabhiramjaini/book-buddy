// server/src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

export const authenticateToken = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    // Get token from cookie
    let token = req.cookies?.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Add user to request
    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};