import { Request, Response } from "express";
import { z } from "zod";
import { getNextWorkingDate } from "../services/workingDaysService";

// ✅ Esquema de validación con Zod
const schema = z.object({
  days: z.string().optional(),
  hours: z.string().optional(),
  date: z.string().optional(),
});

// ✅ Controlador principal del endpoint
export async function calculateWorkingDate(req: Request, res: Response) {
  try {
    // Validar query params
    const params = schema.parse(req.query);
    const { days, hours, date } = params;

    if (!days && !hours) {
      return res.status(400).json({
        success: false,
        error: "Debe enviar al menos 'days' o 'hours'.",
      });
    }

    // Llamar al servicio principal
    const result = await getNextWorkingDate({
      days: days ? parseInt(days) : 0,
      hours: hours ? parseInt(hours) : 0,
      date: date || undefined,
    });

    // 👇 Corregido: asegúrate de devolver el valor como string
    return res.json({
      success: true,
      date: result,
    });
  } catch (err) {
    console.error("❌ Error en controlador:", err);
    return res.status(400).json({
      success: false,
      error: (err as Error).message,
    });
  }
}
