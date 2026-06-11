import { communityLocations, communityNames } from "@/data/locations";
import { getCommunitiesFromReports, readStoredReports } from "./reportStorage";
import { getRealWeatherDashboard } from "./openMeteoService";

export async function getCommunityDashboard() {
  try {
    const [weatherDashboard, reports] = await Promise.all([
      getRealWeatherDashboard(),
      readStoredReports(),
    ]);

    return {
      ...weatherDashboard,
      reports,
      communityOptions: mergeCommunities(getCommunitiesFromReports(reports)),
    };
  } catch (error) {
    console.error(error);
    const reports = await readStoredReports();

    return {
      alerts: [],
      reports,
      communities: communityLocations.map((community) => ({
        id: community.id,
        name: community.name,
        status: "sin reportes" as const,
        lastReport:
          "No se pudo consultar la fuente meteorológica en este momento. Intente actualizar la página.",
        riskLevel: "bajo" as const,
        updatedAt: new Date().toISOString(),
        source: "sin datos" as const,
      })),
      weather: {
        condition: "despejado" as const,
        summary:
          "La fuente meteorológica no está disponible temporalmente. No se muestran valores de relleno.",
        temperatureC: 0,
        rainChance: 0,
        windKph: 0,
        updatedAt: new Date().toISOString(),
        details: [
          "Revise la página de Facebook si necesita información comunitaria urgente.",
          "La web volvera a consultar Open-Meteo al recargar.",
          "No hay datos inventados en esta vista.",
        ],
        source: "Sin fuente disponible",
        locationName: "Limón 2",
        attributionUrl: "https://open-meteo.com/",
      },
      communityOptions: mergeCommunities(getCommunitiesFromReports(reports)),
    };
  }
}

function mergeCommunities(reportCommunities: string[]) {
  return Array.from(new Set([...communityNames, ...reportCommunities])).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}
