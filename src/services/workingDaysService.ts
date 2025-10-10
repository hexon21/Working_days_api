// src/services/workingDaysService.ts
import { DateTime } from "luxon";
import { getHolidays } from "../utils/holidays";

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
    if (isWeekend(result) || isHoliday(result, holidays)) {
      result = result.plus({ days: 1 }).set({ hour: WORK_START });
      continue;
    }

    if (result.hour >= WORK_END) {
      result = result.plus({ days: 1 }).set({ hour: WORK_START });
      continue;
    }

    if (result.hour < WORK_START) {
      result = result.set({ hour: WORK_START });
    }

    if (result.hour >= LUNCH_START && result.hour < LUNCH_END) {
      result = result.set({ hour: LUNCH_END });
      continue;
    }

    const nextLimit = result.hour < LUNCH_START ? LUNCH_START : WORK_END;
    const available = nextLimit - result.hour;
    const toAdd = Math.min(available, hours);

    result = result.plus({ hours: toAdd });
    hours -= toAdd;

    if (result.hour >= WORK_END) {
      result = result.plus({ days: 1 }).set({ hour: WORK_START });
    }
  }

  return result;
}

export async function getNextWorkingDate({
  days = 0,
  hours = 0,
  date,
  holidays = [],
}: {
  days?: number;
  hours?: number;
  date?: string;
  holidays?: string[];
}): Promise<string> {
  try {
    // Si no hay festivos cargados, los obtenemos dinámicamente
    if (!holidays || holidays.length === 0) {
      holidays = await getHolidays();
    }

    let current = date
      ? DateTime.fromISO(date, { zone: "America/Bogota" })
      : DateTime.now().setZone("America/Bogota");

    if (isNaN(days) || isNaN(hours)) {
      throw new Error("Parámetros inválidos: 'days' y 'hours' deben ser numéricos.");
    }

    if (days > 0) current = addWorkingDays(current, days, holidays);
    if (hours > 0) current = addWorkingHours(current, hours, holidays);

    // Evita error de tipo 'null'
    return current.setZone("utc").toISO({ suppressMilliseconds: false }) ?? "";
  } catch (error) {
    throw new Error(`Error interno en el cálculo: ${(error as Error).message}`);
  }
}
