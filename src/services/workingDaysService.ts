import { DateTime } from "luxon";
import axios from "axios";

// ================================
// ⚙️ CONFIGURACIÓN BASE
// ================================

// Zona horaria local (Colombia)
const COLOMBIA_TZ = "America/Bogota";

// Horario laboral
const WORK_START = 8;   // 8:00 a.m.
const WORK_END = 17;    // 5:00 p.m.
const LUNCH_START = 12; // 12:00 p.m.
const LUNCH_END = 13;   // 1:00 p.m.

/**
 * Determina si una fecha está dentro del horario de almuerzo.
 */
function isLunchTime(date: DateTime): boolean {
  return date.hour >= LUNCH_START && date.hour < LUNCH_END;
}

/**
 * Determina si un día es fin de semana o festivo.
 */
function isNonWorkingDay(date: DateTime, holidays: string[]): boolean {
  const isoDate = date.toISODate() ?? "";
  const isWeekend = date.weekday > 5; // sábado (6) o domingo (7)
  const isHoliday = holidays?.includes(isoDate);
  return isWeekend || isHoliday;
}

/**
 * Avanza hasta el siguiente día hábil a las 8:00 a.m.
 */
function addNextWorkingDay(date: DateTime, holidays: string[]): DateTime {
  let next = date.plus({ days: 1 }).set({ hour: WORK_START, minute: 0 });
  while (isNonWorkingDay(next, holidays)) {
    next = next.plus({ days: 1 }).set({ hour: WORK_START, minute: 0 });
  }
  return next;
}

/**
 * Suma horas hábiles respetando jornada laboral, almuerzo y festivos.
 */
export function addWorkingHours(date: DateTime, hours: number, holidays: string[]): DateTime {
  let result = date;
  let remaining = hours;

  while (remaining > 0) {
    // Día no hábil → siguiente día laboral
    if (isNonWorkingDay(result, holidays)) {
      result = addNextWorkingDay(result, holidays);
      continue;
    }

    // Pausa de almuerzo → saltar a 1 p.m.
    if (isLunchTime(result)) {
      result = result.set({ hour: LUNCH_END, minute: 0 });
      continue;
    }

    // Fuera de horario laboral → siguiente día hábil
    if (result.hour >= WORK_END || result.hour < WORK_START) {
      result = addNextWorkingDay(result, holidays);
      continue;
    }

    // Límite actual: hasta almuerzo o fin de jornada
    const nextLimit =
      result.hour < LUNCH_START
        ? LUNCH_START
        : result.hour < LUNCH_END
        ? LUNCH_END
        : WORK_END;

    const available = nextLimit - result.hour; // horas hábiles posibles

    if (remaining <= available) {
      result = result.plus({ hours: remaining });
      remaining = 0;
    } else {
      result = result.set({ hour: nextLimit, minute: 0 });
      remaining -= available;

      // Si llegamos al fin del día, pasamos al siguiente hábil
      if (nextLimit === WORK_END) {
        result = addNextWorkingDay(result, holidays);
      }
    }
  }

  return result;
}

/**
 * Obtiene la lista de festivos colombianos.
 */
export async function getHolidays(): Promise<string[]> {
  const url = "https://content.capta.co/Recruitment/WorkingDays.json";

  try {
    const { data } = await axios.get(url);
    if (Array.isArray(data.holidays)) return data.holidays;
    if (Array.isArray(data)) return data;
    console.warn("⚠️ Estructura inesperada en JSON de festivos:", data);
    return [];
  } catch (error) {
    console.error("❌ Error obteniendo días festivos:", error);
    return [];
  }
}

/**
 * Calcula la fecha hábil final sumando días y horas.
 */
export async function getNextWorkingDate({
  days,
  hours,
  date,
}: {
  days: number;
  hours: number;
  date?: string;
}): Promise<string> {
  const holidays = await getHolidays();

  let startDate = date
    ? DateTime.fromISO(date, { zone: "utc" }).setZone(COLOMBIA_TZ)
    : DateTime.now().setZone(COLOMBIA_TZ);

  // Calcular total de horas (1 día = 8 horas hábiles)
  const totalHours = days * 8 + hours;

  let result = addWorkingHours(startDate, totalHours, holidays);

  return result.setZone("utc").toISO({ suppressMilliseconds: true })!;
}
