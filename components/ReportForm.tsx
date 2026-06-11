"use client";

import { useState } from "react";
import { submitCitizenReport } from "@/services/reportClient";
import type { AlertLevel, CitizenReport, ReportFormPayload, ReportType } from "@/types/weather";
import { alertLevelLabels } from "@/utils/format";
import { alertLevels, reportTypeLabels, reportTypes } from "@/utils/reportOptions";
import { Icon } from "./Icon";

const otherCommunityValue = "__otra__";

interface ReportFormProps {
  communityOptions: string[];
  onReportCreated?: (report: CitizenReport) => void;
}

export function ReportForm({ communityOptions, onReportCreated }: ReportFormProps) {
  const initialCommunity = communityOptions[0] ?? "Limon 2";
  const [form, setForm] = useState<ReportFormPayload>({
    reporterName: "",
    community: initialCommunity,
    type: "lluvia",
    description: "",
    perceivedLevel: "precaucion",
  });
  const [localCommunities, setLocalCommunities] = useState<string[]>([]);
  const [communityMode, setCommunityMode] = useState<"select" | "custom">("select");
  const [customCommunity, setCustomCommunity] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const community =
        communityMode === "custom" ? customCommunity.trim() : form.community.trim();
      const createdReport = await submitCitizenReport({ ...form, community });
      onReportCreated?.({
        id: createdReport.id,
        community: createdReport.community,
        type: createdReport.type,
        description: createdReport.description,
        dateTime: createdReport.dateTime,
        verificationStatus: createdReport.verificationStatus,
        reporterName: createdReport.reporterName ?? undefined,
        perceivedLevel: createdReport.perceivedLevel,
        source: createdReport.source,
      });
      if (communityMode === "custom" && community) {
        setLocalCommunities((current) =>
          current.includes(community) ? current : [...current, community].sort((a, b) => a.localeCompare(b, "es"))
        );
        setForm((current) => ({ ...current, community }));
        setCommunityMode("select");
      }
      setStatus("success");
      setMessage("Reporte guardado como pendiente de verificacion.");
      setForm((current) => ({ ...current, reporterName: "", description: "" }));
      setCustomCommunity("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo registrar el reporte.");
    }
  }

  return (
    <section
      id="reportar"
      data-testid="report-form"
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 ring-1 ring-slate-100 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="rounded-md bg-emerald-50 p-3 text-emerald-700 ring-1 ring-emerald-100">
          <Icon name="send" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-bold text-slate-950">Enviar reporte</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            El reporte queda pendiente hasta que un administrador lo revise.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Nombre opcional
          <input
            className="rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            value={form.reporterName}
            onChange={(event) => setForm({ ...form, reporterName: event.target.value })}
            placeholder="Nombre o referencia"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Comunidad
          <select
            className="rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            value={communityMode === "custom" ? otherCommunityValue : form.community}
            onChange={(event) => {
              if (event.target.value === otherCommunityValue) {
                setCommunityMode("custom");
                return;
              }
              setCommunityMode("select");
              setForm({ ...form, community: event.target.value });
            }}
          >
            {[...new Set([...communityOptions, ...localCommunities])].map((community) => (
              <option key={community} value={community}>
                {community}
              </option>
            ))}
            <option value={otherCommunityValue}>Agregar otra comunidad</option>
          </select>
        </label>

        {communityMode === "custom" ? (
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Nueva comunidad
            <input
              required
              minLength={2}
              maxLength={80}
              className="rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
              value={customCommunity}
              onChange={(event) => setCustomCommunity(event.target.value)}
              placeholder="Ej: La Virgen, El Coyol, Nancimi..."
            />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Tipo de reporte
          <select
            className="rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value as ReportType })}
          >
            {reportTypes.map((type) => (
              <option key={type} value={type}>
                {reportTypeLabels[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Nivel percibido
          <select
            className="rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            value={form.perceivedLevel}
            onChange={(event) =>
              setForm({ ...form, perceivedLevel: event.target.value as AlertLevel })
            }
          >
            {alertLevels.map((level) => (
              <option key={level} value={level}>
                {alertLevelLabels[level]}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
          Descripcion
          <textarea
            required
            minLength={12}
            rows={4}
            className="resize-none rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-3 text-sm font-medium text-slate-950 outline-none transition focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Describe lo que esta pasando, punto de referencia y si el paso esta seguro."
          />
        </label>

        <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-cyan-800 disabled:cursor-wait disabled:bg-slate-500"
          >
            <Icon name="send" className="h-4 w-4" />
            {status === "submitting" ? "Enviando..." : "Enviar reporte"}
          </button>
          {status === "success" ? (
            <p className="text-sm font-semibold text-emerald-700">
              {message}
            </p>
          ) : null}
          {status === "error" ? (
            <p className="text-sm font-semibold text-red-700">
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
