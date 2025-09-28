// server/src/routes/authRoutes.ts

import express from "express";
import { signin, signout, signup } from "../controllers/authControllers";

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.post("/signout", signout);

export default authRouter;
