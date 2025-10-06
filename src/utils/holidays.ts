import axios from "axios";

export async function getHolidays(): Promise<string[]> {
  const url = "https://content.capta.co/Recruitment/WorkingDays.json";

  try {
    const { data } = await axios.get(url);

    // Si data es un objeto con propiedad 'holidays'
    if (data && Array.isArray(data.holidays)) {
      return data.holidays;
    }

    // Si data es directamente un arreglo de fechas
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
