import type { AlertLevel, ReportType } from "@/types/weather";

export const reportTypeLabels: Record<ReportType, string> = {
  lluvia: "Lluvia",
  inundacion: "Inundacion",
  camino_danado: "Camino danado",
  rio_crecido: "Rio crecido",
  viento_fuerte: "Viento fuerte",
  corte_energia: "Corte de energia",
  arbol_caido: "Arbol caido",
  otro: "Otro",
};

export const reportTypes = Object.keys(reportTypeLabels) as ReportType[];

export const alertLevels: AlertLevel[] = ["informativa", "precaucion", "alerta", "emergencia"];
