import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { CitizenReport } from "@/types/weather";

export const reportsFilePath = join(process.cwd(), "storage", "reports.jsonl");

interface StoredReport {
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
  try {
    const content = await readFile(reportsFilePath, "utf8");
    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .map(parseStoredReport)
      .filter((report): report is CitizenReport => Boolean(report))
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
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
