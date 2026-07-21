import "express-async-errors"; // бояд пеш аз ҳама route/middleware import шавад
import express from "express";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./modules/auth/auth.routes";
import restRoutes from "./routes";
import { authMiddleware } from "./middlewares/auth.middleware";
import { swaggerSpec } from "./swagger";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req, res) => res.json({ name: "Omuz CRM Backend API", status: "running" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/auth", authRoutes); // кушода, бе токен
app.use("/api", authMiddleware, restRoutes); // ҳамаи боқимонда бо токен

app.use((req, res) => res.status(404).json({ message: "Route ёфт нашуд" }));
app.use(errorHandler); // ҳатман дар охир — ҳамаи хатогиҳои async-ро мегирад

export default app;
