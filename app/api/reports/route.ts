import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { NextResponse } from "next/server";
import type { AlertLevel, ReportFormPayload, ReportType } from "@/types/weather";
import { reportsFilePath } from "@/services/reportStorage";
import { alertLevels, reportTypes } from "@/utils/reportOptions";

export const runtime = "nodejs";

const MAX_NAME_LENGTH = 80;
const MAX_COMMUNITY_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 800;

export async function POST(request: Request) {
  let payload: ReportFormPayload;

  try {
    payload = (await request.json()) as ReportFormPayload;
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 });
  }

  const createdAt = new Date().toISOString();
  const report = {
    id: crypto.randomUUID(),
    reporterName: payload.reporterName?.trim() || null,
    community: normalizeCommunity(payload.community),
    type: payload.type,
    description: payload.description.trim(),
    perceivedLevel: payload.perceivedLevel,
    verificationStatus: "pendiente",
    createdAt,
    source: "web",
  };

  try {
    await persistReport(report);
    await notifyWebhook(report);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          "No se pudo guardar el reporte. Revise permisos de storage o configure REPORT_WEBHOOK_URL.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ...report, dateTime: createdAt }, { status: 201 });
}

function validatePayload(payload: ReportFormPayload) {
  const community = normalizeCommunity(payload.community);
  if (community.length < 2) {
    return "Escriba una comunidad valida.";
  }

  if (community.length > MAX_COMMUNITY_LENGTH) {
    return `La comunidad no debe superar ${MAX_COMMUNITY_LENGTH} caracteres.`;
  }

  if (!/^[\p{L}\p{N}\s#.'-]+$/u.test(community)) {
    return "La comunidad contiene caracteres no permitidos.";
  }

  if (!reportTypes.includes(payload.type as ReportType)) {
    return "Tipo de reporte no valido.";
  }

  if (!alertLevels.includes(payload.perceivedLevel as AlertLevel)) {
    return "Nivel percibido no valido.";
  }

  if (payload.reporterName && payload.reporterName.length > MAX_NAME_LENGTH) {
    return `El nombre no debe superar ${MAX_NAME_LENGTH} caracteres.`;
  }

  if (!payload.description || payload.description.trim().length < 12) {
    return "La descripcion debe tener al menos 12 caracteres.";
  }

  if (payload.description.length > MAX_DESCRIPTION_LENGTH) {
    return `La descripcion no debe superar ${MAX_DESCRIPTION_LENGTH} caracteres.`;
  }

  return null;
}

async function persistReport(report: Record<string, unknown>) {
  await mkdir(dirname(reportsFilePath), { recursive: true });
  await appendFile(reportsFilePath, `${JSON.stringify(report)}\n`, "utf8");
}

async function notifyWebhook(report: Record<string, unknown>) {
  const webhookUrl = process.env.REPORT_WEBHOOK_URL;
  if (!webhookUrl) return;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(report),
  });

  if (!response.ok) {
    throw new Error(`REPORT_WEBHOOK_URL respondio ${response.status}`);
  }
}

function normalizeCommunity(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
