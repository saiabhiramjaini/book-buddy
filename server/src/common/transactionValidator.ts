// server/src/common/transactionValidator.ts

import z from "zod";

export const createTransactionSchema = z.object({
  requestedBookId: z
    .number()
    .int({
      message: "Book ID must be an integer",
    })
    .positive({
      message: "Book ID must be a positive number",
    }),
  ownerId: z
    .number()
    .int({
      message: "Owner ID must be an integer",
    })
    .positive({
      message: "Owner ID must be a positive number",
    }),
  type: z.enum(["Free", "Exchange"], {
    message: "Type must be either Free or Exchange",
  }),
  offeredBookId: z
    .number()
    .int({
      message: "Offered Book ID must be an integer",
    })
    .positive({
      message: "Offered Book ID must be a positive number",
    })
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // If type is Exchange, offeredBookId is required
    if (data.type === "Exchange" && !data.offeredBookId) {
      return false;
    }
    // If type is Free, offeredBookId should be null
    if (data.type === "Free" && data.offeredBookId) {
      return false;
    }
    return true;
  },
  {
    message: "For Exchange type, offeredBookId is required. For Free type, offeredBookId should be null.",
    path: ["offeredBookId"],
  }
);

export const updateTransactionSchema = z.object({
  id: z
    .number()
    .int({
      message: "Transaction ID must be an integer",
    })
    .positive({
      message: "Transaction ID must be a positive number",
    }),
  status: z.enum(["available", "pending", "approved", "rejected", "shared"], {
    message:
      "Status must be one of: available, pending, approved, rejected, or shared",
  }),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;