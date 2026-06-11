"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type {
  AlertItem,
  AlertLevel,
  CitizenReport,
  CommunityState,
  ReportType,
  WeatherSnapshot,
} from "@/types/weather";
import { alertLevelLabels } from "@/utils/format";
import { reportTypeLabels } from "@/utils/reportOptions";
import { AlertCard } from "./AlertCard";
import { CommunityCard } from "./CommunityCard";
import { Icon } from "./Icon";
import { ReportCard } from "./ReportCard";
import { ReportForm } from "./ReportForm";
import { SectionHeader } from "./SectionHeader";
import { WeatherPanel } from "./WeatherPanel";

interface DashboardProps {
  alerts: AlertItem[];
  reports: CitizenReport[];
  communityStates: CommunityState[];
  weather: WeatherSnapshot;
  communityOptions: string[];
}

const allCommunities = "Todas";
const allAlertLevels = "Todos";
const allReportTypes = "Todos";

export function Dashboard({
  alerts,
  reports,
  communityStates,
  weather,
  communityOptions,
}: DashboardProps) {
  const [communityFilter, setCommunityFilter] = useState(allCommunities);
  const [visibleReports, setVisibleReports] = useState(reports);
  const [visibleCommunityOptions, setVisibleCommunityOptions] = useState(communityOptions);
  const [alertLevelFilter, setAlertLevelFilter] = useState<AlertLevel | typeof allAlertLevels>(
    allAlertLevels
  );
  const [reportTypeFilter, setReportTypeFilter] = useState<ReportType | typeof allReportTypes>(
    allReportTypes
  );

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const communityMatches =
        communityFilter === allCommunities || alert.community === communityFilter;
      const levelMatches =
        alertLevelFilter === allAlertLevels || alert.level === alertLevelFilter;
      return communityMatches && levelMatches;
    });
  }, [alerts, alertLevelFilter, communityFilter]);

  const filteredReports = useMemo(() => {
    return visibleReports.filter((report) => {
      const communityMatches =
        communityFilter === allCommunities || report.community === communityFilter;
      const typeMatches = reportTypeFilter === allReportTypes || report.type === reportTypeFilter;
      return communityMatches && typeMatches;
    });
  }, [visibleReports, communityFilter, reportTypeFilter]);

  const activeAlerts = alerts.filter((alert) => alert.status !== "finalizada").length;
  const verifiedReports = visibleReports.filter((report) => report.verificationStatus === "verificado").length;
  const featuredAlert = alerts[0];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 shadow-sm shadow-slate-950/5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex items-center gap-3 font-black text-slate-950">
            <Image src="/logo.png" alt="ACL2" width={42} height={42} className="rounded-lg bg-cyan-500 ring-1 ring-cyan-100" priority />
            <span className="leading-tight">Alerta Clima<br className="sm:hidden" /> Limón 2</span>
          </a>
          <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 lg:flex">
            <a href="#alertas" className="hover:text-cyan-700">Alertas</a>
            <a href="#reportes" className="hover:text-cyan-700">Reportes</a>
            <a href="#comunidades" className="hover:text-cyan-700">Comunidades</a>
            <a href="#clima" className="hover:text-cyan-700">Clima</a>
            <a href="#seguridad" className="hover:text-cyan-700">Seguridad</a>
            <a href="/admin" className="border-l border-slate-200 pl-4 text-cyan-600 hover:text-cyan-800">Panel Admin</a>
          </nav>
          <a
            href="https://facebook.com/AlertaCL2"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-cyan-800"
          >
            <Icon name="facebook" className="h-4 w-4" />
            Facebook
          </a>
        </div>
      </header>

      <section id="inicio" className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#dff7ff,transparent_34%),linear-gradient(135deg,#ffffff_0%,#f7fbff_46%,#eefdf4_100%)]">
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-50 to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-16">
          <div className="relative z-10 flex flex-col justify-center">
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Alerta Clima Limón 2
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Alertas, reportes y clima para Limón 2 y comunidades cercanas.
            </p>
            <div className="mt-7 rounded-lg border border-orange-200 border-l-4 border-l-orange-500 bg-white/85 p-4 text-orange-950 shadow-lg shadow-orange-900/5 backdrop-blur">
              <p className="text-sm font-bold uppercase tracking-wide">Estado general</p>
              <p className="mt-1 text-xl font-black">
                {featuredAlert ? featuredAlert.title : "Sin alertas activas por pronóstico"}
              </p>
              <p className="mt-2 text-sm leading-6">
                {featuredAlert
                  ? featuredAlert.description
                  : "La web consulta datos reales de Open-Meteo y muestra reportes ciudadanos solo cuando entran por el formulario."}
              </p>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["#reportar", "Reportar lluvia", "rain"],
                ["#alertas", "Ver alertas", "megaphone"],
                ["#comunidades", "Comunidades", "road"],
                ["#reportes", "Reportes recientes", "filter"],
              ].map(([href, label, icon]) => (
                <a
                  key={href}
                  href={href}
                className="flex min-h-24 flex-col justify-between rounded-lg border border-slate-200 bg-white/90 p-4 text-sm font-bold text-slate-900 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-lg"
                >
                  <Icon name={icon as "rain"} className="h-5 w-5 text-cyan-700" />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="relative z-10 rounded-lg border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/30">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Panel comunitario</p>
                <p className="mt-1 text-2xl font-black">Situacion de hoy</p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
                Activo
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric label="Alertas activas" value={activeAlerts} />
              <Metric label="Reportes verificados" value={verifiedReports} />
              <Metric label="Comunidades" value={communityStates.length} />
            </div>
            <div className="mt-5 space-y-3">
              {alerts.length > 0 ? (
                alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="font-bold">{alert.title}</p>
                    <p className="mt-1 text-sm text-slate-300">{alert.community} - {alertLevelLabels[alert.level]}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="font-bold">Sin alertas activas</p>
                  <p className="mt-1 text-sm text-slate-300">No hay umbrales de lluvia, tormenta o viento activos en la consulta actual.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <WeatherPanel weather={weather} />

        <section
          data-testid="filters-panel"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-cyan-800">
                <Icon name="filter" className="h-4 w-4" />
                Filtros de consulta
              </p>
              <p className="mt-1 text-sm text-slate-600">Use los filtros para revisar alertas y reportes por comunidad.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[680px]">
              <FilterSelect label="Comunidad" value={communityFilter} onChange={setCommunityFilter} options={[allCommunities, ...visibleCommunityOptions]} />
              <FilterSelect
                label="Nivel de alerta"
                value={alertLevelFilter}
                onChange={(value) => setAlertLevelFilter(value as AlertLevel | typeof allAlertLevels)}
                options={[allAlertLevels, ...Object.keys(alertLevelLabels)]}
                renderLabel={(value) => value === allAlertLevels ? value : alertLevelLabels[value as AlertLevel]}
              />
              <FilterSelect
                label="Tipo de reporte"
                value={reportTypeFilter}
                onChange={(value) => setReportTypeFilter(value as ReportType | typeof allReportTypes)}
                options={[allReportTypes, ...Object.keys(reportTypeLabels)]}
                renderLabel={(value) => value === allReportTypes ? value : reportTypeLabels[value as ReportType]}
              />
            </div>
          </div>
        </section>

        <section id="alertas">
          <SectionHeader
            title="Alertas activas"
            description="Cada alerta indica nivel, comunidad, estado y fuente para distinguir reportes comunitarios, pronósticos y avisos administrados."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))
            ) : (
              <EmptyState
                title="No hay alertas con estos filtros"
                description="La consulta real no encontro condiciones que superen los umbrales configurados."
              />
            )}
          </div>
        </section>

        <section id="reportes">
          <SectionHeader
            title="Reportes recientes"
            description="Los reportes ciudadanos no se publican como verificados automáticamente. Quedan en Pendiente hasta que un administrador los revise y cambie su estado."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))
            ) : (
              <EmptyState
                title="Todavía no hay reportes ciudadanos publicados"
                description="Los reportes enviados por la web se guardan como pendientes. Publicarlos requiere un panel o proceso de verificación."
              />
            )}
          </div>
        </section>

        <section id="comunidades">
          <SectionHeader
            title="Estado por comunidad"
            description="Vista rápida para Limón 2, Astillero, Las Lajas, El Higueral, Rancho Santana y zonas cercanas."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {communityStates.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <ReportForm
            communityOptions={visibleCommunityOptions}
            onReportCreated={(report) => {
              setVisibleReports((current) => [report, ...current]);
              setVisibleCommunityOptions((current) =>
                current.includes(report.community)
                  ? current
                  : [...current, report.community].sort((a, b) => a.localeCompare(b, "es"))
              );
            }}
          />
          <section id="seguridad" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-md bg-cyan-50 p-3 text-cyan-800">
                <Icon name="shield" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Seguridad y confianza</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Antes de cruzar ríos, caminos con corriente o tramos con lodo, confirme con vecinos cercanos y atienda indicaciones oficiales.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              <p><strong>Cómo reportar:</strong> incluya comunidad, punto de referencia, tipo de afectación y si el paso está cerrado o transitable.</p>
              <p><strong>Aviso:</strong> Este sitio es una herramienta comunitaria de información. No sustituye los comunicados oficiales de las autoridades correspondientes. Ante una emergencia, siga las indicaciones de las instituciones oficiales y organismos de respuesta.</p>
              <a
                href="https://facebook.com/AlertaCL2"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-700 px-4 py-3 text-sm font-bold text-cyan-800 transition hover:bg-cyan-50"
              >
                <Icon name="facebook" className="h-4 w-4" />
                Ir a Facebook
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-slate-700 lg:col-span-2">
      <p className="font-bold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6">{description}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/10 p-4">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-300">{label}</p>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  renderLabel?: (value: string) => string;
}

function FilterSelect({ label, value, options, onChange, renderLabel }: FilterSelectProps) {
  return (
    <label className="grid gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-bold normal-case tracking-normal text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {renderLabel ? renderLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}
