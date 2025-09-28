// server/src/controllers/authControllers.ts

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/connect";
import { users } from "../db/schema";
import { signupSchema, signinSchema } from "../common/authValidator";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "7d";

export const signup = async (req: Request, res: Response) => {
  try {
    // Validate input using safeParse
    const validationResult = signupSchema.safeParse(req.body);

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

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
      })
      .returning();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser[0].id, email: newUser[0].email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: newUser[0],
        token,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    // Validate input using safeParse
    const validationResult = signinSchema.safeParse(req.body);

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

    const { email, password } = validationResult.data;

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
        field: "credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user[0].id, email: user[0].email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "User signed in successfully",
      data: {
        token,
      },
    });
  } catch (error: any) {
    console.error("Signin error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const signout = async (req: Request, res: Response) => {
  try {
    // Clear the cookie
    res.clearCookie("token", {
      httpOnly: true,
    });

    return res.status(200).json({
      success: true,
      message: "User signed out successfully",
    });
  } catch (error: any) {
    console.error("Signout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
