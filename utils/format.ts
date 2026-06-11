import type {
  AlertLevel,
  AlertSource,
  AlertStatus,
  CommunityStatus,
  RiskLevel,
  VerificationStatus,
} from "@/types/weather";

export const alertLevelLabels: Record<AlertLevel, string> = {
  informativa: "Informativa",
  precaucion: "Precaucion",
  alerta: "Alerta",
  emergencia: "Emergencia",
};

export const alertStatusLabels: Record<AlertStatus, string> = {
  activa: "Activa",
  "en seguimiento": "En seguimiento",
  finalizada: "Finalizada",
};

export const alertSourceLabels: Record<AlertSource, string> = {
  comunidad: "Comunidad",
  administrador: "Administrador",
  pronostico: "Pronostico",
  institucion: "Institucion",
};

export const verificationLabels: Record<VerificationStatus, string> = {
  pendiente: "Pendiente",
  verificado: "Verificado",
  descartado: "Descartado",
};

export const communityStatusLabels: Record<CommunityStatus, string> = {
  "sin reportes": "Sin reportes",
  "lluvia leve": "Lluvia leve",
  "lluvia fuerte": "Lluvia fuerte",
  "afectacion vial": "Afectacion vial",
  inundacion: "Inundacion",
  emergencia: "Emergencia",
};

export const riskLabels: Record<RiskLevel, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
  critico: "Critico",
};

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function levelClass(level: AlertLevel) {
  const classes: Record<AlertLevel, string> = {
    informativa: "border-sky-300 bg-sky-50 text-sky-900",
    precaucion: "border-yellow-300 bg-yellow-50 text-yellow-950",
    alerta: "border-orange-400 bg-orange-50 text-orange-950",
    emergencia: "border-red-500 bg-red-50 text-red-950",
  };

  return classes[level];
}

export function riskClass(risk: RiskLevel) {
  const classes: Record<RiskLevel, string> = {
    bajo: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    medio: "bg-yellow-50 text-yellow-900 ring-yellow-200",
    alto: "bg-orange-50 text-orange-900 ring-orange-200",
    critico: "bg-red-50 text-red-900 ring-red-200",
  };

  return classes[risk];
}

export function verificationClass(status: VerificationStatus) {
  const classes: Record<VerificationStatus, string> = {
    pendiente: "bg-yellow-50 text-yellow-900 ring-yellow-200",
    verificado: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    descartado: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return classes[status];
}
