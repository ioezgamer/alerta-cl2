import { NextResponse } from "next/server";
import {
  updateReportStatusInStorage,
  deleteReportFromStorage,
} from "@/services/reportStorage";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status } = body;

    if (!["pendiente", "verificado", "descartado"].includes(status)) {
      return NextResponse.json({ error: "Estado no válido." }, { status: 400 });
    }

    await updateReportStatusInStorage(id, status);
    return NextResponse.json({ success: true, id, status });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Error al actualizar el reporte." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const authHeader = request.headers.get("Authorization");

  if (authHeader !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    await deleteReportFromStorage(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Error al eliminar el reporte." },
      { status: 500 }
    );
  }
}
