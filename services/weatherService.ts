import { communityLocations, communityNames } from "@/data/locations";
import { readManagedCommunities } from "./communityStorage";
import { getCommunitiesFromReports, readStoredReports } from "./reportStorage";
import { getRealWeatherDashboard } from "./openMeteoService";

export async function getCommunityDashboard() {
  const [reports, managedCommunities] = await Promise.all([
    readReportsSafely(),
    readCommunitiesSafely(),
  ]);

  try {
    const weatherDashboard = await getRealWeatherDashboard();

    return {
      ...weatherDashboard,
      reports,
      communityOptions: mergeCommunities([
        ...managedCommunities.map((community) => community.name),
        ...getCommunitiesFromReports(reports),
      ]),
    };
  } catch (error) {
    console.error(error);

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
      communityOptions: mergeCommunities([
        ...managedCommunities.map((community) => community.name),
        ...getCommunitiesFromReports(reports),
      ]),
    };
  }
}

async function readReportsSafely() {
  try {
    return await readStoredReports();
  } catch (error) {
    console.error("No se pudieron leer los reportes:", error);
    return [];
  }
}

async function readCommunitiesSafely() {
  try {
    return await readManagedCommunities();
  } catch (error) {
    console.error("No se pudieron leer las comunidades administradas:", error);
    return [];
  }
}

function mergeCommunities(extraCommunities: string[]) {
  return Array.from(new Set([...communityNames, ...extraCommunities])).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}
