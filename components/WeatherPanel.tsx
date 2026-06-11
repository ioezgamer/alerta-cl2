import type { WeatherSnapshot } from "@/types/weather";
import { formatDateTime } from "@/utils/format";
import { Icon } from "./Icon";

interface WeatherPanelProps {
  weather: WeatherSnapshot;
}

export function WeatherPanel({ weather }: WeatherPanelProps) {
  return (
    <section
      id="clima"
      className="rounded-lg border border-slate-800 bg-[linear-gradient(135deg,#06131f_0%,#0f2334_54%,#113c44_100%)] p-5 text-white shadow-2xl shadow-slate-950/25 sm:p-6"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-cyan-400/15 p-3 text-cyan-200 ring-1 ring-cyan-300/20">
              <Icon name="rain" className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Clima actual</h2>
              <p className="text-sm text-slate-300">
                {weather.locationName} - Actualizado {formatDateTime(weather.updatedAt)}
              </p>
            </div>
          </div>
          <p className="mt-5 text-lg leading-7 text-slate-100">{weather.summary}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-bold">{weather.temperatureC}C</p>
            <p className="mt-1 text-xs text-slate-300">Temperatura</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-bold">{weather.rainChance}%</p>
            <p className="mt-1 text-xs text-slate-300">Lluvia</p>
          </div>
          <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/10">
            <p className="text-2xl font-bold">{weather.windKph}</p>
            <p className="mt-1 text-xs text-slate-300">km/h viento</p>
          </div>
        </div>
      </div>

      <ul className="mt-5 grid gap-3 md:grid-cols-3">
        {weather.details.map((detail) => (
          <li
            key={detail}
            className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-100"
          >
            {detail}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-400">
        Fuente:{" "}
        <a
          href={weather.attributionUrl}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-cyan-200 underline-offset-4 hover:underline"
        >
          {weather.source}
        </a>
      </p>
    </section>
  );
}
