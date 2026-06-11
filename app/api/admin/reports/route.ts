import { NextResponse } from "next/server";
import { readStoredReports } from "@/services/reportStorage";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const reports = await readStoredReports();
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json(
      { error: "Error al obtener los reportes." },
      { status: 500 }
    );
  }
}
