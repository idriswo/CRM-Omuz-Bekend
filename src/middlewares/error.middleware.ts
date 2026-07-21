import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

// Миёнафзори марказии хатогиҳо — ҳамаи хатогиҳои async (аз express-async-errors)
// ва синхронӣ ба ин ҷо мерасанд, то сервер ҳеҷ гоҳ crash накунад (яъне 502 надиҳад).
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Сабт ёфт нашуд" });
    }
    if (err.code === "P2003") {
      return res
        .status(409)
        .json({ message: "Ин сабтро наметавон нест/навсозӣ кард, зеро дар ҷои дигар истифода мешавад" });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Ин қиммат аллакай истифода шудааст (такрорӣ)" });
    }
  }

  // Баъзе версияҳои Prisma ин намуди foreign-key/RESTRICT хатогиро на ҳамчун
  // PrismaClientKnownRequestError (P2003), балки ҳамчун паёми хоми Postgres мебароранд.
  const rawMessage = err instanceof Error ? err.message : String(err);
  if (/foreign key constraint|violates .* constraint/i.test(rawMessage)) {
    return res
      .status(409)
      .json({ message: "Ин сабтро наметавон нест/навсозӣ кард, зеро дар ҷои дигар истифода мешавад" });
  }

  // Тафсилот танҳо дар лог (console.error дар боло) мемонад, на дар ҷавоби HTTP —
  // то маълумоти дохилии база/сервер ба клиент намоён нашавад.
  res.status(500).json({ message: "Хатогии сервер" });
}
