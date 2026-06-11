import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getStore } from "@netlify/blobs";
import type { CitizenReport } from "@/types/weather";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";

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
  if (db) {
    try {
      const q = query(collection(db, "reports"), orderBy("dateTime", "desc"));
      const snapshot = await getDocs(q);
      const reports: CitizenReport[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        reports.push({
          id: docSnap.id,
          community: data.community,
          type: data.type,
          description: data.description,
          dateTime: data.dateTime || data.createdAt,
          verificationStatus: data.verificationStatus,
          reporterName: data.reporterName || undefined,
          perceivedLevel: data.perceivedLevel || undefined,
          source: data.source || "web",
        });
      });
      return reports;
    } catch (error) {
      console.error("Error reading from Firestore, falling back to local storage:", error);
    }
  }

  if (shouldUseNetlifyBlobs()) {
    const reports = await readBlobReports();
    return sortReports(reports);
  }

  return readLocalReports();
}

export async function saveStoredReport(report: StoredReport) {
  const citizenReport = toCitizenReport(report);

  if (db) {
    try {
      const docRef = doc(db, "reports", report.id);
      await setDoc(docRef, citizenReport);
      return;
    } catch (error) {
      console.error("Error writing to Firestore, falling back to local storage:", error);
    }
  }

  if (shouldUseNetlifyBlobs()) {
    const reports = await readBlobReports();
    await getReportsStore().setJSON(reportsBlobKey, [citizenReport, ...reports]);
    return;
  }

  await ensureReportsDirectory();
  await appendFile(reportsFilePath, `${JSON.stringify(report)}\n`, "utf8");
}

export async function updateReportStatusInStorage(
  id: string,
  status: CitizenReport["verificationStatus"]
) {
  if (db) {
    try {
      const docRef = doc(db, "reports", id);
      await updateDoc(docRef, { verificationStatus: status });
      return;
    } catch (error) {
      console.error("Error updating Firestore document, falling back:", error);
    }
  }

  if (shouldUseNetlifyBlobs()) {
    const reports = await readBlobReports();
    const updated = reports.map((r) =>
      r.id === id ? { ...r, verificationStatus: status } : r
    );
    await getReportsStore().setJSON(reportsBlobKey, updated);
    return;
  }

  const reports = await readLocalReports();
  const updated = reports.map((r) =>
    r.id === id ? { ...r, verificationStatus: status } : r
  );
  await writeAllLocalReports(updated);
}

export async function deleteReportFromStorage(id: string) {
  if (db) {
    try {
      const docRef = doc(db, "reports", id);
      await deleteDoc(docRef);
      return;
    } catch (error) {
      console.error("Error deleting Firestore document, falling back:", error);
    }
  }

  if (shouldUseNetlifyBlobs()) {
    const reports = await readBlobReports();
    const filtered = reports.filter((r) => r.id !== id);
    await getReportsStore().setJSON(reportsBlobKey, filtered);
    return;
  }

  const reports = await readLocalReports();
  const filtered = reports.filter((r) => r.id !== id);
  await writeAllLocalReports(filtered);
}

export function getCommunitiesFromReports(reports: CitizenReport[]) {
  return Array.from(new Set(reports.map((report) => report.community).filter(Boolean)));
}

async function readLocalReports(): Promise<CitizenReport[]> {
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

async function writeAllLocalReports(reports: CitizenReport[]) {
  await ensureReportsDirectory();
  const stored = reports.map(toStoredReport);
  const content = stored.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await writeFile(reportsFilePath, content, "utf8");
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
  const citizenReport: CitizenReport = {
    id: report.id,
    community: report.community,
    type: report.type,
    description: report.description,
    dateTime: report.createdAt,
    verificationStatus: report.verificationStatus,
  };

  if (report.reporterName !== null && report.reporterName !== undefined) {
    citizenReport.reporterName = report.reporterName;
  }
  if (report.perceivedLevel !== null && report.perceivedLevel !== undefined) {
    citizenReport.perceivedLevel = report.perceivedLevel;
  }
  if (report.source !== null && report.source !== undefined) {
    citizenReport.source = report.source;
  }

  return citizenReport;
}

function toStoredReport(report: CitizenReport): StoredReport {
  return {
    id: report.id,
    reporterName: report.reporterName ?? null,
    community: report.community,
    type: report.type,
    description: report.description,
    perceivedLevel: report.perceivedLevel ?? "informativa",
    verificationStatus: report.verificationStatus,
    createdAt: report.dateTime,
    source: report.source ?? "web",
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
