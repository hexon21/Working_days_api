import { Request, Response } from "express";
import { z } from "zod";
import { getNextWorkingDate } from "../services/workingDaysService";

// Validación de los parámetros del query string
const schema = z.object({
  days: z.string().optional(),
  hours: z.string().optional(),
  date: z.string().optional(),
});

// Controlador principal del endpoint
export async function calculateWorkingDate(req: Request, res: Response) {
  try {
    const params = schema.parse(req.query);
    const { days, hours, date } = params;

    if (!days && !hours) {
      return res.status(400).json({
        error: "InvalidParameters",
        message: "Debe enviar al menos 'days' o 'hours'.",
      });
    }

    const result = await getNextWorkingDate({
      days: days ? parseInt(days) : 0,
      hours: hours ? parseInt(hours) : 0,
      date: date || undefined,
    });

    return res.json({ date: result });
  } catch (err) {
    return res.status(400).json({
      error: "InvalidParameters",
      message: (err as Error).message,
    });
  }
}
