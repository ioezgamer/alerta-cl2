import type { ReportFormPayload } from "@/types/weather";

export async function submitCitizenReport(payload: ReportFormPayload) {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "No se pudo registrar el reporte.");
  }

  return response.json();
}
