"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CitizenReport, AlertLevel } from "@/types/weather";
import { reportTypeLabels } from "@/utils/reportOptions";
import { formatDateTime, verificationClass, verificationLabels, alertLevelLabels } from "@/utils/format";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"pendiente" | "verificado" | "descartado">("pendiente");
  const [communityFilter, setCommunityFilter] = useState("Todas");
  
  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check auth on load
  useEffect(() => {
    const savedPassword = localStorage.getItem("admin_password");
    if (savedPassword) {
      verifyAndLoadReports(savedPassword);
    } else {
      setIsAuthChecking(false);
    }
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  const verifyAndLoadReports = async (pwd: string) => {
    setIsLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/reports", {
        headers: {
          Authorization: `Bearer ${pwd}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setReports(data);
        localStorage.setItem("admin_password", pwd);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("admin_password");
        setIsAuthenticated(false);
        if (pwd) {
          setLoginError("Contraseña administrativa incorrecta.");
        }
      }
    } catch (err) {
      console.error(err);
      setLoginError("Error de conexión al servidor.");
    } finally {
      setIsLoading(false);
      setIsAuthChecking(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLoginError("Por favor ingrese la contraseña.");
      return;
    }
    verifyAndLoadReports(password);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_password");
    setIsAuthenticated(false);
    setPassword("");
    setReports([]);
    showToast("Sesión cerrada correctamente", "success");
  };

  const updateReportStatus = async (id: string, status: "pendiente" | "verificado" | "descartado") => {
    const pwd = localStorage.getItem("admin_password") || "";
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pwd}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, verificationStatus: status } : r))
        );
        showToast(
          `Reporte ${status === "verificado" ? "verificado" : status === "descartado" ? "descartado" : "marcado como pendiente"} con éxito.`
        );
      } else {
        showToast("Error al actualizar el estado del reporte", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión al servidor", "error");
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este reporte de forma permanente? Esta acción no se puede deshacer.")) {
      return;
    }

    const pwd = localStorage.getItem("admin_password") || "";
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${pwd}`,
        },
      });

      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        showToast("Reporte eliminado permanentemente.", "success");
      } else {
        showToast("Error al eliminar el reporte.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error de conexión al servidor", "error");
    }
  };

  // Get statistics
  const stats = useMemo(() => {
    return {
      pendiente: reports.filter((r) => r.verificationStatus === "pendiente").length,
      verificado: reports.filter((r) => r.verificationStatus === "verificado").length,
      descartado: reports.filter((r) => r.verificationStatus === "descartado").length,
    };
  }, [reports]);

  // Get unique communities from reports for filter options
  const communities = useMemo(() => {
    const list = Array.from(new Set(reports.map((r) => r.community).filter(Boolean)));
    return ["Todas", ...list.sort((a, b) => a.localeCompare(b, "es"))];
  }, [reports]);

  // Filtered reports to show
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const tabMatch = r.verificationStatus === activeTab;
      const communityMatch = communityFilter === "Todas" || r.community === communityFilter;
      return tabMatch && communityMatch;
    });
  }, [reports, activeTab, communityFilter]);

  if (isAuthChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-400">Verificando credenciales...</p>
        </div>
      </div>
    );
  }

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#0b253a,transparent_45%),linear-gradient(135deg,#020617_0%,#0f172a_100%)] p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/65 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <Link href="/" className="group mb-5 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="ACL2"
                width={56}
                height={56}
                className="rounded-xl bg-cyan-500 ring-2 ring-cyan-400/30 transition group-hover:scale-105"
              />
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-white">Panel Administrativo</h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Alerta Clima Limón 2
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div>
              <label htmlFor="pwd" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Contraseña Administrativa
              </label>
              <input
                id="pwd"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm font-medium text-white placeholder-slate-600 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10"
                required
              />
            </div>

            {loginError && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm font-semibold text-red-400">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3.5 text-sm font-bold text-white transition hover:bg-cyan-500 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- ADMIN DASHBOARD ---
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-slate-750 bg-slate-950/90 px-4 py-3.5 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className={`rounded-full p-1 ${toast.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
            {toast.type === "success" ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </span>
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/90 shadow-lg shadow-slate-950/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 font-black text-white">
            <Image
              src="/logo.png"
              alt="ACL2"
              width={38}
              height={38}
              className="rounded-lg bg-cyan-500 ring-1 ring-cyan-400/20"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-400">Admin Panel</p>
              <h1 className="text-lg font-black tracking-tight">Alerta Clima L2</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Ver sitio
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-950/30 px-3.5 py-2 text-xs font-bold text-red-300 transition hover:bg-red-900/40"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Statistics Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-850 p-5 shadow-md">
            <div className="absolute right-4 top-4 rounded-lg bg-amber-500/10 p-2 text-amber-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-3xl font-black text-white">{stats.pendiente}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">Reportes Pendientes</p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-850 p-5 shadow-md">
            <div className="absolute right-4 top-4 rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-black text-white">{stats.verificado}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">Reportes Verificados</p>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-850 p-5 shadow-md">
            <div className="absolute right-4 top-4 rounded-lg bg-slate-700/20 p-2 text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-black text-white">{stats.descartado}</p>
            <p className="mt-1 text-sm font-semibold text-slate-400">Reportes Descartados</p>
          </div>
        </section>

        {/* Tab & Filters Control Panel */}
        <section className="mt-8 rounded-xl border border-slate-800 bg-slate-850 p-4 shadow-md sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Tabs */}
            <div className="flex overflow-hidden rounded-lg bg-slate-900 p-1">
              {[
                { id: "pendiente", label: "Pendientes", count: stats.pendiente, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                { id: "verificado", label: "Verificados", count: stats.verificado, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
                { id: "descartado", label: "Descartados", count: stats.descartado, color: "text-slate-400 bg-slate-800 border-slate-700/50" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition rounded-md flex items-center gap-2 ${
                    activeTab === t.id
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    activeTab === t.id 
                      ? "bg-cyan-500/20 text-cyan-400" 
                      : "bg-slate-850 text-slate-500"
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filter by Community */}
            <div className="flex items-center gap-3">
              <label htmlFor="comFilter" className="text-xs font-bold uppercase tracking-wide text-slate-400 min-w-max">
                Comunidad:
              </label>
              <select
                id="comFilter"
                value={communityFilter}
                onChange={(e) => setCommunityFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-750 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/10 md:w-56"
              >
                {communities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Reports Grid */}
        <section className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse rounded-xl border border-slate-800 bg-slate-850/50 p-5 h-48 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-800 rounded w-full mt-4"></div>
                    <div className="h-3 bg-slate-800 rounded w-4/5"></div>
                  </div>
                  <div className="h-8 bg-slate-800 rounded w-1/4 mt-4"></div>
                </div>
              ))}
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredReports.map((report) => (
                <article
                  key={report.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-850 p-5 shadow-lg transition hover:-translate-y-0.5 hover:border-slate-750 hover:shadow-2xl"
                >
                  <div>
                    {/* Report Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="rounded-lg bg-cyan-950/50 p-2.5 text-cyan-400 ring-1 ring-cyan-500/10">
                          {report.type === "rio_crecido" ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          ) : report.type === "camino_danado" ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                            </svg>
                          )}
                        </span>
                        <div>
                          <h3 className="font-extrabold text-white text-base leading-tight">{report.community}</h3>
                          <p className="text-xs font-semibold text-slate-400 mt-1">{reportTypeLabels[report.type]}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ring-1 ${
                          report.verificationStatus === "verificado"
                            ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                            : report.verificationStatus === "descartado"
                            ? "bg-slate-800 text-slate-400 ring-slate-700"
                            : "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                        }`}>
                          {verificationLabels[report.verificationStatus]}
                        </span>
                        {report.perceivedLevel && (
                          <span className="text-[10px] font-bold text-slate-500">
                            Nivel: {alertLevelLabels[report.perceivedLevel]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Report Description */}
                    <p className="mt-4 text-sm leading-relaxed text-slate-350">{report.description}</p>
                  </div>

                  <div>
                    {/* Metadata Footer */}
                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-800/80 pt-3.5 text-xs text-slate-500 font-medium">
                      <span>{formatDateTime(report.dateTime)}</span>
                      {report.reporterName && (
                        <span>Enviado por: <strong className="text-slate-400 font-semibold">{report.reporterName}</strong></span>
                      )}
                    </div>

                    {/* Admin Actions buttons row */}
                    <div className="mt-4 flex flex-wrap gap-2 pt-2">
                      {report.verificationStatus !== "verificado" && (
                        <button
                          onClick={() => updateReportStatus(report.id, "verificado")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Verificar
                        </button>
                      )}

                      {report.verificationStatus !== "descartado" && (
                        <button
                          onClick={() => updateReportStatus(report.id, "descartado")}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-850 border border-slate-700 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 transition"
                        >
                          <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Descartar
                        </button>
                      )}

                      {report.verificationStatus !== "pendiente" && (
                        <button
                          onClick={() => updateReportStatus(report.id, "pendiente")}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-500"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
                          </svg>
                          Volver a Pendiente
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteReport(report.id)}
                        className="ml-auto inline-flex items-center gap-1 rounded-lg bg-red-950/20 text-red-400 border border-red-900/30 hover:bg-red-900/30 px-3 py-2 text-xs font-bold transition"
                        title="Eliminar de forma permanente"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-850 p-12 text-center text-slate-400">
              <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v4h16z" />
              </svg>
              <p className="mt-4 font-bold text-white text-lg">No hay reportes que mostrar</p>
              <p className="mt-1 text-sm">No se encontraron reportes en la pestaña de {activeTab} para la comunidad seleccionada.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
