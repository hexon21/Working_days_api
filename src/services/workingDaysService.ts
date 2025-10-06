import { DateTime } from "luxon";
import { getHolidays } from "../utils/holidays";

// Tipos para los parámetros de entrada
export interface CalculationParams {
  days: number;
  hours: number;
  date?: string;
}

// Constantes de horario laboral
const COLOMBIA_TZ = "America/Bogota";
import { Settings } from "luxon";
Settings.defaultZone = COLOMBIA_TZ;
const WORK_START = 8;
const LUNCH_START = 12;
const LUNCH_END = 13;
const WORK_END = 17;

// Función principal
export async function getNextWorkingDate({
  days,
  hours,
  date,
}: CalculationParams): Promise<string> {
  const holidays = await getHolidays();

  // Punto de partida: ahora o la fecha recibida (convertida a hora Colombia)
  let current = date
    ? DateTime.fromISO(date, { zone: "utc" }).setZone(COLOMBIA_TZ)
    : DateTime.now().setZone(COLOMBIA_TZ);

  // Ajustar si está fuera del horario laboral o en día no hábil
  current = adjustToWorkingTime(current, holidays);

  // Sumar días hábiles
  for (let i = 0; i < days; i++) {
    current = addNextWorkingDay(current, holidays);
  }

  // Sumar horas hábiles
  current = addWorkingHours(current, hours, holidays);

  // Convertir a UTC para la respuesta
return current.setZone("utc").toISO({ suppressMilliseconds: true })!;
}

// ----------- Funciones auxiliares -----------

function adjustToWorkingTime(date: DateTime, holidays: string[]): DateTime {
  while (isNonWorkingDay(date, holidays)) {
    date = date.plus({ days: 1 }).set({ hour: WORK_START, minute: 0 });
  }

  if (date.hour < WORK_START) date = date.set({ hour: WORK_START, minute: 0 });
  else if (date.hour >= WORK_END) {
    date = date.plus({ days: 1 }).set({ hour: WORK_START, minute: 0 });
  } else if (date.hour >= LUNCH_START && date.hour < LUNCH_END) {
    date = date.set({ hour: LUNCH_END, minute: 0 });
  }

  return date;
}

function isNonWorkingDay(date: DateTime, holidays: string[]): boolean {
  const isWeekend = date.weekday > 5;
    const isHoliday = holidays.includes(date.toISODate() ?? "");
  return isWeekend || isHoliday;
}

function addNextWorkingDay(date: DateTime, holidays: string[]): DateTime {
  let next = date.plus({ days: 1 }).set({ hour: WORK_START, minute: 0 });
  while (isNonWorkingDay(next, holidays)) {
    next = next.plus({ days: 1 });
  }
  return next;
}

function addWorkingHours(date: DateTime, hours: number, holidays: string[]): DateTime {
  let result = date;
  let remaining = hours;

  while (remaining > 0) {
    // Si es hora de almuerzo, saltar a 1 p.m.
    if (result.hour >= LUNCH_START && result.hour < LUNCH_END) {
      result = result.set({ hour: LUNCH_END, minute: 0 });
      continue;
    }

    // Si está fuera del horario laboral, pasar al siguiente día hábil
    if (result.hour >= WORK_END || result.hour < WORK_START) {
      result = addNextWorkingDay(result, holidays);
      continue;
    }

    // Determinar cuántas horas disponibles hay hasta el siguiente límite (almuerzo o fin de día)
    const nextLimit = result.hour < LUNCH_START ? LUNCH_START : WORK_END;
    const available = nextLimit - result.hour;

    // Si las horas restantes caben antes del límite, sumar y terminar
    if (remaining <= available) {
      result = result.plus({ hours: remaining });
      remaining = 0;
    } else {
      // De lo contrario, avanzar al límite y descontar las horas usadas
      result = result.set({ hour: nextLimit, minute: 0 });
      remaining -= available;

      // Si se llegó al fin del día, pasar al siguiente hábil
      if (nextLimit === WORK_END) {
        result = addNextWorkingDay(result, holidays);
      }
    }
  }

  return result;
}
