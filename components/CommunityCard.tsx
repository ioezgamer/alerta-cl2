import type { CommunityState } from "@/types/weather";
import { communityStatusLabels, formatDateTime, riskClass, riskLabels } from "@/utils/format";

interface CommunityCardProps {
  community: CommunityState;
}

export function CommunityCard({ community }: CommunityCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-lg shadow-slate-950/5 ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-950">{community.name}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {communityStatusLabels[community.status]}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${riskClass(
            community.riskLevel
          )}`}
        >
          Riesgo {riskLabels[community.riskLevel]}
        </span>
      </div>
      <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">{community.lastReport}</p>
      <p className="mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
        Actualizado {formatDateTime(community.updatedAt)} - Fuente: {community.source}
      </p>
    </article>
  );
}
