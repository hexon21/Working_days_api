import { Request, Response } from "express";
import { z } from "zod";
import { getNextWorkingDate } from "../services/workingDaysService";

// ✅ Esquema de validación con Zod
const schema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .refine((val) => val >= 0, { message: "'days' debe ser un número positivo" }),

  hours: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : 0))
    .refine((val) => val >= 0, { message: "'hours' debe ser un número positivo" }),

  date: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      { message: "'date' debe tener un formato ISO válido (YYYY-MM-DDTHH:mm:ss)" }
    ),
});

// ✅ Controlador principal del endpoint /calculate
export async function calculateWorkingDate(req: Request, res: Response) {
  try {
    const parseResult = schema.safeParse(req.query);

    // 🧱 Si los parámetros son inválidos, devolver error 400
    if (!parseResult.success) {
      return res.status(400).json({
        error: "InvalidParameters",
        details: parseResult.error.errors.map((e) => e.message),
      });
    }

    const { days, hours, date } = parseResult.data;

    // 🚫 Si no se envía ni days ni hours
    if (!days && !hours) {
      return res.status(400).json({
        error: "InvalidParameters",
        message: "Debe enviar al menos uno de los parámetros: 'days' o 'hours'.",
      });
    }

    // ✅ Calcular el resultado final con manejo de días hábiles
    const result = getNextWorkingDate({ days, hours, date });

    return res.status(200).json({
      success: true,
      date: result,
    });

  } catch (error) {
    // ⚠️ Captura de errores internos o inesperados
    console.error("[ERROR calculateWorkingDate]:", (error as Error).message);
    return res.status(500).json({
      error: "InternalServerError",
      message: (error as Error).message,
    });
  }
}
