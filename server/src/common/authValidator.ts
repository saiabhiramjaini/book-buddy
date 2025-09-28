// server/src/common/authValidator.ts

import z from "zod";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const signupSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters long",
    })
    .max(50, {
      message: "Name cannot exceed 50 characters",
    })
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Name can only contain letters and spaces",
    })
    .trim(),

  email: z
    .string()
    .email({
      message: "Please enter a valid email address",
    })
    .max(255, {
      message: "Email cannot exceed 255 characters",
    })
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters long",
    })
    .max(100, {
      message: "Password cannot exceed 100 characters",
    })
    .regex(passwordRegex, {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    }),
});

export const signinSchema = z.object({
  email: z
    .string()
    .email({
      message: "Please enter a valid email address",
    })
    .max(255, {
      message: "Email cannot exceed 255 characters",
    })
    .toLowerCase()
    .trim(),

  password: z.string().min(1, {
    message: "Password is required",
  }),
});

// Type exports for TypeScript
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
