export type AlertLevel = "informativa" | "precaucion" | "alerta" | "emergencia";

export type AlertStatus = "activa" | "en seguimiento" | "finalizada";

export type AlertSource =
  | "comunidad"
  | "administrador"
  | "pronostico"
  | "institucion";

export type ReportType =
  | "lluvia"
  | "inundacion"
  | "camino_danado"
  | "rio_crecido"
  | "viento_fuerte"
  | "corte_energia"
  | "arbol_caido"
  | "otro";

export type VerificationStatus = "pendiente" | "verificado" | "descartado";

export type CommunityStatus =
  | "sin reportes"
  | "lluvia leve"
  | "lluvia fuerte"
  | "afectacion vial"
  | "inundacion"
  | "emergencia";

export type RiskLevel = "bajo" | "medio" | "alto" | "critico";

export type WeatherCondition =
  | "lloviendo"
  | "lluvia probable"
  | "tormenta cerca"
  | "despejado"
  | "riesgo de inundacion";

export interface AlertItem {
  id: string;
  title: string;
  community: string;
  level: AlertLevel;
  description: string;
  dateTime: string;
  status: AlertStatus;
  source: AlertSource;
  evidence?: string;
}

export interface CitizenReport {
  id: string;
  community: string;
  type: ReportType;
  description: string;
  dateTime: string;
  verificationStatus: VerificationStatus;
  reporterName?: string;
  perceivedLevel?: AlertLevel;
  source?: "web" | "admin" | "import";
}

export interface CommunityState {
  id: string;
  name: string;
  status: CommunityStatus;
  lastReport: string;
  riskLevel: RiskLevel;
  updatedAt: string;
  source: "pronostico" | "reporte ciudadano" | "sin datos";
}

export interface WeatherSnapshot {
  condition: WeatherCondition;
  summary: string;
  temperatureC: number;
  rainChance: number;
  windKph: number;
  updatedAt: string;
  details: string[];
  source: string;
  locationName: string;
  attributionUrl: string;
}

export interface ReportFormPayload {
  reporterName?: string;
  community: string;
  type: ReportType;
  description: string;
  perceivedLevel: AlertLevel;
}
