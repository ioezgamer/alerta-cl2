import type { CitizenReport } from "@/types/weather";
import { formatDateTime, verificationClass, verificationLabels } from "@/utils/format";
import { reportTypeLabels } from "@/utils/reportOptions";
import { Icon } from "./Icon";

interface ReportCardProps {
  report: CitizenReport;
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="rounded-md bg-cyan-50 p-2 text-cyan-800 ring-1 ring-cyan-100">
            <Icon
              name={report.type === "rio_crecido" ? "river" : report.type === "camino_danado" ? "road" : "rain"}
              className="h-5 w-5"
            />
          </span>
          <div>
            <h3 className="font-bold text-slate-950">{report.community}</h3>
            <p className="text-sm text-slate-600">{reportTypeLabels[report.type]}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${verificationClass(
            report.verificationStatus
          )}`}
        >
          {verificationLabels[report.verificationStatus]}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700">{report.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
        <span>{formatDateTime(report.dateTime)}</span>
        <span>Fuente: comunidad</span>
        {report.reporterName ? <span>Reporto: {report.reporterName}</span> : null}
      </div>
    </article>
  );
}
