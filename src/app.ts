import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./modules/auth/auth.routes";
import restRoutes from "./routes";
import { authMiddleware } from "./middlewares/auth.middleware";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req, res) => res.json({ name: "Omuz CRM Backend API", status: "running" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes); // кушода, бе токен
app.use("/api", authMiddleware, restRoutes); // ҳамаи боқимонда бо токен

export default app;
