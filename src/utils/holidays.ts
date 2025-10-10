// src/utils/holidays.ts
import axios from "axios";

/**
 * Obtiene los días festivos de Colombia desde el JSON remoto.
 * @returns Promise<string[]> con las fechas en formato ISO (YYYY-MM-DD)
 */
export async function getHolidays(): Promise<string[]> {
  const url = "https://content.capta.co/Recruitment/WorkingDays.json";

  try {
    const { data } = await axios.get(url);

    // Si data tiene propiedad "holidays"
    if (data && Array.isArray(data.holidays)) {
      return data.holidays;
    }

    // Si data es un array directamente
    if (Array.isArray(data)) {
      return data as string[];
    }

    console.warn("⚠️ Estructura inesperada en WorkingDays.json:", data);
    return [];
  } catch (error) {
    console.error("❌ Error obteniendo días festivos:", error);
    return [];
  }
}

