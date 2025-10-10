import { DateTime } from "luxon";
import { COLOMBIA_HOLIDAYS } from "../utils/holidays";

const WORK_START = 8;
const WORK_END = 17;
const LUNCH_START = 12;
const LUNCH_END = 13;

function isWeekend(date: DateTime): boolean {
  return date.weekday === 6 || date.weekday === 7;
}

function isHoliday(date: DateTime, holidays: string[]): boolean {
  return holidays.includes(date.toISODate()!);
}

function addWorkingDays(date: DateTime, days: number, holidays: string[]): DateTime {
  let result = date;
  let added = 0;

  while (added < days) {
    result = result.plus({ days: 1 }).set({ hour: WORK_START });
    if (!isWeekend(result) && !isHoliday(result, holidays)) {
      added++;
    }
  }
  return result;
}

function addWorkingHours(date: DateTime, hours: number, holidays: string[]): DateTime {
  let result = date;

  while (hours > 0) {
    // si es fin de semana o festivo, pasa al siguiente día hábil
    if (isWeekend(result) || isHoliday(result, holidays)) {
      result = result.plus({ days: 1 }).set({ hour: WORK_START });
      continue;
    }

    // si está fuera del horario laboral, ajusta
    if (result.hour >= WORK_END) {
      result = result.plus({ days: 1 }).set({ hour: WORK_START });
      continue;
    }
    if (result.hour < WORK_START) {
      result = result.set({ hour: WORK_START });
    }

    // manejar horario de almuerzo
    if (result.hour >= LUNCH_START && result.hour < LUNCH_END) {
      result = result.set({ hour: LUNCH_END });
      continue;
    }

    // calcula el fin del bloque disponible antes del almuerzo o fin de jornada
    const nextLimit =
      result.hour < LUNCH_START
        ? LUNCH_START
        : WORK_END;

    const available = nextLimit - result.hour;
    const toAdd = Math.min(available, hours);

    // suma con precisión (sin truncar minutos ni segundos)
    result = result.plus({ hours: toAdd });
    hours -= toAdd;

    // si se completó el bloque, pasa al siguiente hábil
    if (result.hour >= WORK_END) {
      result = result.plus({ days: 1 }).set({ hour: WORK_START });
    }
  }

  return result;
}

export function getNextWorkingDate({
  days = 0,
  hours = 0,
  date,
  holidays = COLOMBIA_HOLIDAYS,
}: {
  days?: number;
  hours?: number;
  date?: string;
  holidays?: string[];
}): string {
  try {
    let current = date
      ? DateTime.fromISO(date, { zone: "America/Bogota" })
      : DateTime.now().setZone("America/Bogota");

    if (isNaN(days) || isNaN(hours)) {
      throw new Error("Parámetros inválidos. 'days' y 'hours' deben ser numéricos.");
    }

    if (days > 0) current = addWorkingDays(current, days, holidays);
    if (hours > 0) current = addWorkingHours(current, hours, holidays);

    return current.setZone("utc").toISO({ suppressMilliseconds: false });
  } catch (error) {
    throw new Error(
      `Error interno en el cálculo: ${(error as Error).message}`
    );
  }
}
