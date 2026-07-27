import "express-async-errors"; // бояд пеш аз ҳама route/middleware import шавад
import express from "express";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./modules/auth/auth.routes";
import restRoutes from "./routes";
import { authMiddleware } from "./middlewares/auth.middleware";
import { requirePasswordChanged } from "./middlewares/passwordChange.middleware";
import { swaggerSpec } from "./swagger";
import { errorHandler } from "./middlewares/error.middleware";
import { mailProvider } from "./utils/mailer";

const app = express();

// Дар Render (ва ҳар reverse proxy) req.ip бе ин танзим ҳамеша IP-и proxy мешавад —
// он гоҳ rate-limit ҳамаи корбаронро як шумурда, ҳамаро якҷо маҳдуд мекард.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (_req, res) => res.json({ name: "Omuz CRM Backend API", status: "running" }));
// `mail` нишон медиҳад, ки кадом провайдер фаъол аст: "brevo" (production),
// "gmail" (SMTP, танҳо локалӣ) ё "stub" (тамоман танзим нашуда). Бе ин аз
// берун фаҳмидан мумкин набуд, ки чаро email намеравад — танҳо аз логи
// сервер. Худи калидҳо ошкор намешаванд.
app.get("/health", (_req, res) => res.json({ status: "ok", mail: mailProvider() }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// /auth берун аз requirePasswordChanged аст — вагарна корбаре, ки бояд
// паролашро иваз кунад, ба change-password ҳам роҳ намеёфт
app.use("/api/auth", authRoutes); // кушода, бе токен
app.use("/api", authMiddleware, requirePasswordChanged, restRoutes); // ҳамаи боқимонда бо токен

app.use((req, res) => res.status(404).json({ message: "Route ёфт нашуд" }));
app.use(errorHandler); // ҳатман дар охир — ҳамаи хатогиҳои async-ро мегирад

export default app;
