"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import type { ManagedCommunity } from "@/types/community";
import type { CitizenReport, VerificationStatus } from "@/types/weather";
import { formatDateTime, verificationLabels } from "@/utils/format";
import { reportTypeLabels } from "@/utils/reportOptions";

type ReportTab = VerificationStatus | "todos";

interface FirestoreReport extends CitizenReport {
  adminNote?: string;
  publicNote?: string;
  updatedAt?: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authReady, setAuthReady] = useState(!auth || !db);
  const [reports, setReports] = useState<FirestoreReport[]>([]);
  const [communities, setCommunities] = useState<ManagedCommunity[]>([]);
  const [activeTab, setActiveTab] = useState<ReportTab>("pendiente");
  const [communityFilter, setCommunityFilter] = useState("Todas");
  const [message, setMessage] = useState("");
  const [communityForm, setCommunityForm] = useState({
    name: "",
    notes: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (!auth || !db) {
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const reportsQuery = query(collection(db, "reports"), orderBy("dateTime", "desc"));
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      setReports(
        snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            community: String(data.community ?? ""),
            type: data.type,
            description: String(data.description ?? ""),
            dateTime: String(data.dateTime ?? data.createdAt ?? new Date().toISOString()),
            verificationStatus: data.verificationStatus ?? "pendiente",
            reporterName: data.reporterName || undefined,
            perceivedLevel: data.perceivedLevel || undefined,
            source: data.source || "web",
            adminNote: data.adminNote || undefined,
            publicNote: data.publicNote || undefined,
            updatedAt: data.updatedAt || undefined,
          };
        })
      );
    });

    const communitiesQuery = query(collection(db, "communities"), orderBy("name", "asc"));
    const unsubscribeCommunities = onSnapshot(communitiesQuery, (snapshot) => {
      setCommunities(
        snapshot.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            name: String(data.name ?? ""),
            notes: data.notes ? String(data.notes) : undefined,
            latitude: typeof data.latitude === "number" ? data.latitude : undefined,
            longitude: typeof data.longitude === "number" ? data.longitude : undefined,
            createdAt: String(data.createdAt ?? new Date().toISOString()),
            updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
          };
        })
      );
    });

    return () => {
      unsubscribeReports();
      unsubscribeCommunities();
    };
  }, [user]);

  const stats = useMemo(
    () => ({
      total: reports.length,
      pendiente: reports.filter((report) => report.verificationStatus === "pendiente").length,
      verificado: reports.filter((report) => report.verificationStatus === "verificado").length,
      descartado: reports.filter((report) => report.verificationStatus === "descartado").length,
    }),
    [reports]
  );

  const communityOptions = useMemo(() => {
    const names = reports.map((report) => report.community).filter(Boolean);
    return ["Todas", ...Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "es"))];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const tabMatches = activeTab === "todos" || report.verificationStatus === activeTab;
      const communityMatches = communityFilter === "Todas" || report.community === communityFilter;
      return tabMatches && communityMatches;
    });
  }, [activeTab, communityFilter, reports]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!auth) {
      setMessage("Firebase no está configurado.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setMessage("No se pudo iniciar sesión. Revise el correo, la contraseña y las reglas de Firebase.");
    }
  }

  async function updateReport(id: string, changes: Partial<FirestoreReport>) {
    if (!db) return;

    await updateDoc(doc(db, "reports", id), {
      ...changes,
      updatedAt: new Date().toISOString(),
    });
  }

  async function removeReport(id: string) {
    if (!db) return;
    if (!window.confirm("¿Eliminar este reporte de forma permanente?")) return;
    await deleteDoc(doc(db, "reports", id));
  }

  async function addCommunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db || !communityForm.name.trim()) return;

    const now = new Date().toISOString();
    await addDoc(collection(db, "communities"), {
      name: communityForm.name.trim().replace(/\s+/g, " "),
      notes: communityForm.notes.trim(),
      latitude: communityForm.latitude ? Number(communityForm.latitude) : null,
      longitude: communityForm.longitude ? Number(communityForm.longitude) : null,
      createdAt: now,
      updatedAt: now,
    });

    setCommunityForm({ name: "", notes: "", latitude: "", longitude: "" });
  }

  async function removeCommunity(id: string) {
    if (!db) return;
    if (!window.confirm("¿Eliminar esta comunidad del catálogo administrativo?")) return;
    await deleteDoc(doc(db, "communities", id));
  }

  if (!isFirebaseConfigured) {
    return (
      <AdminShell>
        <SetupPanel />
      </AdminShell>
    );
  }

  if (!authReady) {
    return (
      <AdminShell>
        <p className="text-sm font-semibold text-slate-300">Cargando panel administrativo...</p>
      </AdminShell>
    );
  }

  if (!user) {
    return (
      <AdminShell compact>
        <form onSubmit={handleLogin} className="mx-auto w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="text-center">
            <Image src="/logo.png" alt="ACL2" width={60} height={60} className="mx-auto rounded-lg bg-cyan-500" />
            <h1 className="mt-5 text-2xl font-black text-white">Panel administrativo</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ingrese con el usuario creado en Firebase Authentication.
            </p>
          </div>
          <label className="mt-6 grid gap-2 text-sm font-bold text-slate-300">
            Correo
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-500"
              required
            />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-bold text-slate-300">
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-500"
              required
            />
          </label>
          {message ? <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm font-semibold text-red-300">{message}</p> : null}
          <button className="mt-5 w-full rounded-lg bg-cyan-600 px-4 py-3 text-sm font-black text-white transition hover:bg-cyan-500">
            Iniciar sesión
          </button>
        </form>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold text-cyan-300">Administrador conectado</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-white">Centro de control comunitario</h1>
          <p className="mt-2 text-sm text-slate-400">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800">
            Ver sitio
          </Link>
          <button
            onClick={() => auth && signOut(auth)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <Metric label="Total" value={stats.total} />
        <Metric label="Pendientes" value={stats.pendiente} tone="amber" />
        <Metric label="Verificados" value={stats.verificado} tone="emerald" />
        <Metric label="Descartados" value={stats.descartado} tone="slate" />
      </section>

      <section className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_240px]">
          <div className="flex flex-wrap gap-2">
            {[
              ["pendiente", "Pendientes"],
              ["verificado", "Verificados"],
              ["descartado", "Descartados"],
              ["todos", "Todos"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as ReportTab)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  activeTab === id ? "bg-cyan-600 text-white" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={communityFilter}
            onChange={(event) => setCommunityFilter(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-500"
          >
            {communityOptions.map((community) => (
              <option key={community} value={community}>
                {community}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="grid gap-4">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <ReportAdminCard
                key={report.id}
                report={report}
                onUpdate={updateReport}
                onDelete={removeReport}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900 p-8 text-center text-slate-400">
              No hay reportes con estos filtros.
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <form onSubmit={addCommunity} className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl font-black text-white">Agregar comunidad</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Estas comunidades aparecerán en el formulario público aunque todavía no tengan reportes.
            </p>
            <label className="mt-4 grid gap-2 text-sm font-bold text-slate-300">
              Nombre
              <input
                value={communityForm.name}
                onChange={(event) => setCommunityForm({ ...communityForm, name: event.target.value })}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-500"
                required
              />
            </label>
            <label className="mt-4 grid gap-2 text-sm font-bold text-slate-300">
              Información adicional
              <textarea
                value={communityForm.notes}
                onChange={(event) => setCommunityForm({ ...communityForm, notes: event.target.value })}
                rows={3}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-500"
              />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={communityForm.latitude}
                onChange={(event) => setCommunityForm({ ...communityForm, latitude: event.target.value })}
                placeholder="Latitud opcional"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
              <input
                value={communityForm.longitude}
                onChange={(event) => setCommunityForm({ ...communityForm, longitude: event.target.value })}
                placeholder="Longitud opcional"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-500"
              />
            </div>
            <button className="mt-4 w-full rounded-lg bg-cyan-600 px-4 py-3 text-sm font-black text-white hover:bg-cyan-500">
              Agregar comunidad
            </button>
          </form>

          <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-xl font-black text-white">Comunidades agregadas</h2>
            <div className="mt-4 space-y-3">
              {communities.length > 0 ? (
                communities.map((community) => (
                  <div key={community.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">{community.name}</p>
                        {community.notes ? <p className="mt-1 text-sm text-slate-400">{community.notes}</p> : null}
                      </div>
                      <button onClick={() => removeCommunity(community.id)} className="text-xs font-bold text-red-300 hover:text-red-200">
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Todavía no hay comunidades administradas.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}

function ReportAdminCard({
  report,
  onUpdate,
  onDelete,
}: {
  report: FirestoreReport;
  onUpdate: (id: string, changes: Partial<FirestoreReport>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [adminNote, setAdminNote] = useState(report.adminNote ?? "");
  const [publicNote, setPublicNote] = useState(report.publicNote ?? "");

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-xl shadow-slate-950/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black text-white">{report.community}</h2>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-slate-300 ring-1 ring-slate-700">
              {verificationLabels[report.verificationStatus]}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-cyan-300">{reportTypeLabels[report.type]}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{report.description}</p>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            {formatDateTime(report.dateTime)}
            {report.reporterName ? ` · Enviado por ${report.reporterName}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusButton label="Pendiente" status="pendiente" report={report} onUpdate={onUpdate} />
          <StatusButton label="Verificar" status="verificado" report={report} onUpdate={onUpdate} />
          <StatusButton label="Descartar" status="descartado" report={report} onUpdate={onUpdate} />
          <button onClick={() => onDelete(report.id)} className="rounded-lg border border-red-900/50 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-950/40">
            Eliminar
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-300">
          Nota administrativa
          <textarea
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            rows={3}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-medium text-white outline-none focus:border-cyan-500"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-300">
          Información pública adicional
          <textarea
            value={publicNote}
            onChange={(event) => setPublicNote(event.target.value)}
            rows={3}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm font-medium text-white outline-none focus:border-cyan-500"
          />
        </label>
      </div>
      <button
        onClick={() => onUpdate(report.id, { adminNote, publicNote })}
        className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
      >
        Guardar información
      </button>
    </article>
  );
}

function StatusButton({
  label,
  status,
  report,
  onUpdate,
}: {
  label: string;
  status: VerificationStatus;
  report: FirestoreReport;
  onUpdate: (id: string, changes: Partial<FirestoreReport>) => Promise<void>;
}) {
  const active = report.verificationStatus === status;
  return (
    <button
      disabled={active}
      onClick={() => onUpdate(report.id, { verificationStatus: status })}
      className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
        active ? "bg-cyan-600 text-white" : "bg-slate-950 text-slate-300 hover:bg-slate-800"
      } disabled:cursor-default`}
    >
      {label}
    </button>
  );
}

function Metric({ label, value, tone = "cyan" }: { label: string; value: number; tone?: "cyan" | "amber" | "emerald" | "slate" }) {
  const toneClass = {
    cyan: "text-cyan-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
    slate: "text-slate-300",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <p className={`text-3xl font-black ${toneClass}`}>{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-400">{label}</p>
    </div>
  );
}

function AdminShell({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return (
    <main className={`min-h-screen bg-slate-950 text-white ${compact ? "flex items-center justify-center p-4" : ""}`}>
      <div className={compact ? "w-full" : "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"}>{children}</div>
    </main>
  );
}

function SetupPanel() {
  return (
    <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6 text-amber-50">
      <h1 className="text-2xl font-black">Firebase no está configurado</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-amber-100">
        Para activar el panel administrativo, configure las variables `NEXT_PUBLIC_FIREBASE_*`,
        habilite Authentication con correo/contraseña y cree un usuario administrador.
      </p>
      <Link href="/" className="mt-5 inline-flex rounded-lg bg-amber-400 px-4 py-2 text-sm font-black text-slate-950">
        Volver al sitio
      </Link>
    </section>
  );
}
