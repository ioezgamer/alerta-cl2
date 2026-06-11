import type { AlertItem } from "@/types/weather";
import {
  alertLevelLabels,
  alertSourceLabels,
  alertStatusLabels,
  formatDateTime,
  levelClass,
} from "@/utils/format";
import { Icon } from "./Icon";

interface AlertCardProps {
  alert: AlertItem;
}

export function AlertCard({ alert }: AlertCardProps) {
  return (
    <article className={`rounded-lg border p-4 shadow-lg shadow-slate-950/5 ring-1 ring-white/60 ${levelClass(alert.level)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="mt-1 rounded-md bg-white/85 p-2 shadow-sm ring-1 ring-black/5">
            <Icon
              name={alert.level === "emergencia" ? "megaphone" : "cloud"}
              className="h-5 w-5"
            />
          </span>
          <div>
            <h3 className="text-base font-bold leading-6">{alert.title}</h3>
            <p className="mt-1 text-sm font-semibold">{alert.community}</p>
          </div>
        </div>
        <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-bold shadow-sm ring-1 ring-black/5">
          {alertLevelLabels[alert.level]}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6">{alert.description}</p>
      {alert.evidence ? (
        <p className="mt-3 rounded-md bg-white/70 p-3 text-xs font-semibold leading-5">
          Evidencia: {alert.evidence}
        </p>
      ) : null}
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <dt className="font-semibold opacity-70">Fecha</dt>
          <dd className="mt-1">{formatDateTime(alert.dateTime)}</dd>
        </div>
        <div>
          <dt className="font-semibold opacity-70">Estado</dt>
          <dd className="mt-1">{alertStatusLabels[alert.status]}</dd>
        </div>
        <div>
          <dt className="font-semibold opacity-70">Fuente</dt>
          <dd className="mt-1">{alertSourceLabels[alert.source]}</dd>
        </div>
        <div>
          <dt className="font-semibold opacity-70">Nivel</dt>
          <dd className="mt-1">{alertLevelLabels[alert.level]}</dd>
        </div>
      </dl>
    </article>
  );
}
