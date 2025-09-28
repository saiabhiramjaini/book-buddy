// server/src/db/schema.ts

import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const transactionStatusEnum = pgEnum("transaction_status", [
  "available",
  "pending",
  "approved",
  "rejected",
  "shared",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "Free",
  "Exchange",
]);

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  avatar: varchar({ length: 255 }).default(""),
  password: varchar({ length: 255 }).notNull(),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const books = pgTable("books", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  author: varchar({ length: 255 }).notNull(),
  genre: varchar({ length: 255 }).notNull(),
  ageGroup: varchar({ length: 255 }).notNull(),
  coverImage: varchar({ length: 255 }).notNull(),
  availabilityType: transactionTypeEnum().notNull(),
  status: varchar({ length: 255 }).notNull().default("available"),
  ownerId: integer()
    .notNull()
    .references(() => users.id),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  requesterId: integer()
    .notNull()
    .references(() => users.id),
  requestedBookId: integer()
    .notNull()
    .references(() => books.id),
  ownerId: integer()
    .notNull()
    .references(() => users.id),
  type: transactionTypeEnum().notNull(),
  offeredBookId: integer().references(() => books.id),
  status: transactionStatusEnum().notNull().default("available"),

  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});
