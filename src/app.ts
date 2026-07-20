import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import restRoutes from "./routes";
import { authMiddleware } from "./middlewares/auth.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes); // кушода, бе токен
app.use("/api", authMiddleware, restRoutes); // ҳамаи боқимонда бо токен

export default app;
