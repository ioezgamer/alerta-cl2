import { communityLocations } from "@/data/locations";
import type {
  AlertItem,
  AlertLevel,
  CommunityState,
  CommunityStatus,
  RiskLevel,
  WeatherCondition,
  WeatherSnapshot,
} from "@/types/weather";

interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    precipitation: number;
    rain: number;
    showers: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
  };
  hourly: {
    time: string[];
    precipitation_probability: number[];
    precipitation: number[];
    rain: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_gusts_10m: number[];
  };
}

interface CommunityWeather {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sourceLabel: string;
  sourceUrl?: string;
  currentTime: string;
  temperatureC: number;
  precipitationMm: number;
  rainMm: number;
  showersMm: number;
  weatherCode: number;
  cloudCover: number;
  windKph: number;
  gustKph: number;
  nextRainChance: number;
  nextPrecipitationMm: number;
  nextWeatherCode: number;
}

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const TIMEZONE = "America/Managua";

export async function getRealWeatherDashboard() {
  const weatherByCommunity = await Promise.all(
    communityLocations.map((location) => fetchCommunityWeather(location))
  );

  const primaryWeather = weatherByCommunity[0];

  return {
    alerts: buildForecastAlerts(weatherByCommunity),
    reports: [],
    communities: weatherByCommunity.map(toCommunityState),
    weather: toWeatherSnapshot(primaryWeather),
  };
}

async function fetchCommunityWeather(location: (typeof communityLocations)[number]) {
  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "precipitation",
      "rain",
      "showers",
      "weather_code",
      "cloud_cover",
      "wind_speed_10m",
      "wind_gusts_10m",
    ].join(",")
  );
  url.searchParams.set(
    "hourly",
    [
      "precipitation_probability",
      "precipitation",
      "rain",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m",
    ].join(",")
  );
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", TIMEZONE);

  const response = await fetch(url, {
    next: { revalidate: 300 },
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo respondio ${response.status} para ${location.name}`);
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const currentHourIndex = findCurrentHourIndex(data.hourly.time, data.current.time);
  const nextIndexes = data.hourly.time
    .map((_, index) => index)
    .filter((index) => index >= currentHourIndex)
    .slice(0, 6);

  const nextRainChance = maxFromIndexes(data.hourly.precipitation_probability, nextIndexes);
  const nextPrecipitationMm = maxFromIndexes(data.hourly.precipitation, nextIndexes);
  const nextWeatherCode = data.hourly.weather_code[nextIndexes[0] ?? currentHourIndex] ?? data.current.weather_code;

  return {
    id: location.id,
    name: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
    sourceLabel: location.sourceLabel,
    sourceUrl: location.sourceUrl,
    currentTime: data.current.time,
    temperatureC: Math.round(data.current.temperature_2m),
    precipitationMm: roundOne(data.current.precipitation),
    rainMm: roundOne(data.current.rain),
    showersMm: roundOne(data.current.showers),
    weatherCode: data.current.weather_code,
    cloudCover: data.current.cloud_cover,
    windKph: Math.round(data.current.wind_speed_10m),
    gustKph: Math.round(data.current.wind_gusts_10m),
    nextRainChance,
    nextPrecipitationMm: roundOne(nextPrecipitationMm),
    nextWeatherCode,
  } satisfies CommunityWeather;
}

function findCurrentHourIndex(times: string[], currentTime: string) {
  const exactIndex = times.indexOf(currentTime);
  if (exactIndex >= 0) return exactIndex;

  const current = new Date(currentTime).getTime();
  const firstFuture = times.findIndex((time) => new Date(time).getTime() >= current);
  return firstFuture >= 0 ? firstFuture : 0;
}

function maxFromIndexes(values: number[], indexes: number[]) {
  return Math.max(...indexes.map((index) => values[index] ?? 0), 0);
}

function toWeatherSnapshot(weather: CommunityWeather): WeatherSnapshot {
  const condition = weatherCondition(weather);

  return {
    condition,
    summary: buildWeatherSummary(weather),
    temperatureC: weather.temperatureC,
    rainChance: weather.nextRainChance,
    windKph: weather.windKph,
    updatedAt: weather.currentTime,
    locationName: weather.name,
    source: "Open-Meteo Forecast API",
    attributionUrl: "https://open-meteo.com/",
    details: [
      `Lluvia registrada ahora: ${weather.precipitationMm} mm.`,
      `Probabilidad maxima de lluvia en las proximas 6 horas: ${weather.nextRainChance}%.`,
      `Rafagas estimadas: ${weather.gustKph} km/h.`,
    ],
  };
}

function toCommunityState(weather: CommunityWeather): CommunityState {
  const riskLevel = riskFromWeather(weather);
  const status = statusFromWeather(weather, riskLevel);

  return {
    id: weather.id,
    name: weather.name,
    status,
    lastReport: buildCommunitySourceText(weather, status),
    riskLevel,
    updatedAt: weather.currentTime,
    source: "pronostico",
  };
}

function buildForecastAlerts(weatherByCommunity: CommunityWeather[]): AlertItem[] {
  return weatherByCommunity
    .map((weather) => {
      const level = alertLevelFromWeather(weather);
      if (!level) return null;

      const title =
        level === "emergencia"
          ? `Riesgo alto por lluvia en ${weather.name}`
          : level === "alerta"
            ? `Lluvia o tormenta probable en ${weather.name}`
            : level === "precaucion"
              ? `Precaucion por lluvia en ${weather.name}`
              : `Seguimiento del clima en ${weather.name}`;

      return {
        id: `forecast-${weather.id}-${weather.currentTime}`,
        title,
        community: weather.name,
        level,
        description: buildWeatherSummary(weather),
        dateTime: weather.currentTime,
        status: "activa",
        source: "pronostico",
        evidence: `Open-Meteo: ${weather.precipitationMm} mm ahora, ${weather.nextRainChance}% de lluvia en 6 horas, rafagas ${weather.gustKph} km/h.`,
      } satisfies AlertItem;
    })
    .filter(Boolean) as AlertItem[];
}

function alertLevelFromWeather(weather: CommunityWeather): AlertLevel | null {
  if (weather.precipitationMm >= 12 || weather.nextPrecipitationMm >= 20 || weather.gustKph >= 65) {
    return "emergencia";
  }

  if (
    weather.precipitationMm >= 5 ||
    weather.nextPrecipitationMm >= 10 ||
    weather.nextRainChance >= 80 ||
    isThunderstorm(weather.weatherCode) ||
    isThunderstorm(weather.nextWeatherCode)
  ) {
    return "alerta";
  }

  if (weather.precipitationMm > 0 || weather.nextRainChance >= 45 || weather.gustKph >= 40) {
    return "precaucion";
  }

  if (weather.cloudCover >= 80 || weather.nextRainChance >= 30) {
    return "informativa";
  }

  return null;
}

function riskFromWeather(weather: CommunityWeather): RiskLevel {
  const level = alertLevelFromWeather(weather);
  if (level === "emergencia") return "critico";
  if (level === "alerta") return "alto";
  if (level === "precaucion") return "medio";
  return "bajo";
}

function statusFromWeather(weather: CommunityWeather, risk: RiskLevel): CommunityStatus {
  if (risk === "critico") return "emergencia";
  if (weather.precipitationMm >= 5 || weather.nextPrecipitationMm >= 10) return "lluvia fuerte";
  if (weather.precipitationMm > 0 || weather.nextRainChance >= 45) return "lluvia leve";
  if (weather.gustKph >= 45) return "afectacion vial";
  return "sin reportes";
}

function weatherCondition(weather: CommunityWeather): WeatherCondition {
  if (weather.precipitationMm > 0) return "lloviendo";
  if (isThunderstorm(weather.weatherCode) || isThunderstorm(weather.nextWeatherCode)) return "tormenta cerca";
  if (weather.nextPrecipitationMm >= 12) return "riesgo de inundacion";
  if (weather.nextRainChance >= 45) return "lluvia probable";
  return "despejado";
}

function buildWeatherSummary(weather: CommunityWeather) {
  const codeText = describeWeatherCode(weather.weatherCode);

  if (weather.precipitationMm > 0) {
    return `${codeText} en ${weather.name}. Lluvia actual de ${weather.precipitationMm} mm y probabilidad de ${weather.nextRainChance}% durante las proximas horas.`;
  }

  if (weather.nextRainChance >= 45) {
    return `${codeText} en ${weather.name}. Puede llover en las proximas horas; probabilidad maxima ${weather.nextRainChance}%.`;
  }

  return `${codeText} en ${weather.name}. Sin lluvia registrada ahora; mantener seguimiento si cambia la nubosidad.`;
}

function buildCommunitySourceText(weather: CommunityWeather, status: CommunityStatus) {
  if (status === "sin reportes") {
    return `Sin reportes ciudadanos conectados. Pronostico real: ${weather.nextRainChance}% de lluvia en las proximas 6 horas.`;
  }

  return `Pronostico real: ${weather.precipitationMm} mm de lluvia ahora y ${weather.nextRainChance}% de probabilidad en las proximas 6 horas.`;
}

function describeWeatherCode(code: number) {
  if (code === 0) return "Cielo despejado";
  if ([1, 2, 3].includes(code)) return "Cielo parcialmente nublado";
  if ([45, 48].includes(code)) return "Neblina";
  if ([51, 53, 55, 56, 57].includes(code)) return "Llovizna";
  if ([61, 63, 65, 66, 67].includes(code)) return "Lluvia";
  if ([80, 81, 82].includes(code)) return "Chubascos";
  if ([95, 96, 99].includes(code)) return "Tormenta";
  return "Condicion meteorologica variable";
}

function isThunderstorm(code: number) {
  return [95, 96, 99].includes(code);
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}
