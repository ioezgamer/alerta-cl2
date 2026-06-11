import { Dashboard } from "@/components/Dashboard";
import { getCommunityDashboard } from "@/services/weatherService";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getCommunityDashboard();

  return (
    <Dashboard
      alerts={data.alerts}
      reports={data.reports}
      communityStates={data.communities}
      weather={data.weather}
      communityOptions={data.communityOptions}
    />
  );
}
