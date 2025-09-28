// server/src/index.ts

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRouter from "./routes/authRoutes";
import userRouter from "./routes/userRoutes";
import bookRouter from "./routes/bookRoutes";
import transactionRouter from "./routes/transactionRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.CLIENT_URL!],
  })
);

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is healthy" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/books", bookRouter);
app.use("/api/v1/transaction", transactionRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});