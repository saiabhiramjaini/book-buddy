// server/src/common/bookValidator.ts

import z from "zod";

export const bookSchema = z.object({
  title: z
    .string()
    .min(2, {
      message: "Title must be at least 2 characters long",
    })
    .max(100, {
      message: "Title cannot exceed 100 characters",
    }),

  author: z
    .string()
    .min(2, {
      message: "Author name must be at least 2 characters long",
    })
    .max(100, {
      message: "Author name cannot exceed 100 characters",
    }),

  genre: z
    .string()
    .min(2, {
      message: "Genre must be at least 2 characters long",
    })
    .max(50, {
      message: "Genre cannot exceed 50 characters",
    }),

  ageGroup: z
    .string()
    .min(2, { message: "Age group must be at least 2 characters long" })
    .max(10, { message: "Age group cannot exceed 10 characters" }),

  coverImage: z.string().url({
    message: "Cover image must be a valid URL",
  }),

  availabilityType: z.enum(["Free", "Exchange"], {
    message: "Please select either Free or Exchange",
  }),

  ownerId: z.int().min(1, {
    message: "Owner ID must be a positive integer",
  }),
});

export type BookInput = z.infer<typeof bookSchema>;
