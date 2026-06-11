import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getStore } from "@netlify/blobs";
import type { CitizenReport } from "@/types/weather";

export const reportsFilePath = join(process.cwd(), "storage", "reports.jsonl");
const reportsBlobKey = "reports.json";
const reportsStoreName = "alerta-clima-reports";

export interface StoredReport {
  id: string;
  reporterName: string | null;
  community: string;
  type: CitizenReport["type"];
  description: string;
  perceivedLevel: CitizenReport["perceivedLevel"];
  verificationStatus: CitizenReport["verificationStatus"];
  createdAt: string;
  source: CitizenReport["source"];
}

export async function ensureReportsDirectory() {
  await mkdir(dirname(reportsFilePath), { recursive: true });
}

export async function readStoredReports(): Promise<CitizenReport[]> {
  if (shouldUseNetlifyBlobs()) {
    const reports = await readBlobReports();
    return sortReports(reports);
  }

  try {
    const content = await readFile(reportsFilePath, "utf8");
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .map(parseStoredReport)
      .filter((report): report is CitizenReport => Boolean(report))
      .sort(sortByNewest);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function saveStoredReport(report: StoredReport) {
  if (shouldUseNetlifyBlobs()) {
    const reports = await readBlobReports();
    await getReportsStore().setJSON(reportsBlobKey, [toCitizenReport(report), ...reports]);
    return;
  }

  await ensureReportsDirectory();
  await appendFile(reportsFilePath, `${JSON.stringify(report)}\n`, "utf8");
}

export function getCommunitiesFromReports(reports: CitizenReport[]) {
  return Array.from(new Set(reports.map((report) => report.community).filter(Boolean)));
}

function parseStoredReport(line: string): CitizenReport | null {
  try {
    const report = JSON.parse(line) as StoredReport;
    if (!report.id || !report.community || !report.type || !report.description) return null;

    return {
      id: report.id,
      community: report.community,
      type: report.type,
      description: report.description,
      dateTime: report.createdAt,
      verificationStatus: report.verificationStatus,
      reporterName: report.reporterName ?? undefined,
      perceivedLevel: report.perceivedLevel,
      source: report.source,
    };
  } catch {
    return null;
  }
}

function toCitizenReport(report: StoredReport): CitizenReport {
  return {
    id: report.id,
    community: report.community,
    type: report.type,
    description: report.description,
    dateTime: report.createdAt,
    verificationStatus: report.verificationStatus,
    reporterName: report.reporterName ?? undefined,
    perceivedLevel: report.perceivedLevel,
    source: report.source,
  };
}

function getReportsStore() {
  return getStore({ name: reportsStoreName, consistency: "strong" });
}

async function readBlobReports() {
  const data = await getReportsStore().get(reportsBlobKey, { type: "json" });
  if (!Array.isArray(data)) return [];

  return data.filter(isCitizenReport);
}

function isCitizenReport(value: unknown): value is CitizenReport {
  if (!value || typeof value !== "object") return false;
  const report = value as CitizenReport;
  return Boolean(report.id && report.community && report.type && report.description && report.dateTime);
}

function shouldUseNetlifyBlobs() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

function sortReports(reports: CitizenReport[]) {
  return [...reports].sort(sortByNewest);
}

function sortByNewest(a: CitizenReport, b: CitizenReport) {
  return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
}
