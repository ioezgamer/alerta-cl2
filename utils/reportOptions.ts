import type { AlertLevel, ReportType } from "@/types/weather";

export const reportTypeLabels: Record<ReportType, string> = {
  lluvia: "Lluvia",
  inundacion: "Inundación",
  camino_danado: "Camino dañado",
  rio_crecido: "Río crecido",
  viento_fuerte: "Viento fuerte",
  corte_energia: "Corte de energía",
  arbol_caido: "Árbol caído",
  otro: "Otro",
};

export const reportTypes = Object.keys(reportTypeLabels) as ReportType[];

export const alertLevels: AlertLevel[] = ["informativa", "precaucion", "alerta", "emergencia"];
