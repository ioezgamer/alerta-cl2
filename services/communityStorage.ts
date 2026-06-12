import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getStore } from "@netlify/blobs";
import { collection, getDocs, orderBy, query, setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ManagedCommunity } from "@/types/community";

const communitiesFilePath = join(process.cwd(), "storage", "communities.json");
const communitiesBlobKey = "communities.json";
const communitiesStoreName = "alerta-clima-communities";

export async function readManagedCommunities(): Promise<ManagedCommunity[]> {
  if (db) {
    const snapshot = await getDocs(query(collection(db, "communities"), orderBy("name", "asc")));
    return snapshot.docs.map((item) => {
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
    }).filter((community) => community.name);
  }

  if (shouldUseNetlifyBlobs()) {
    const data = await getCommunitiesStore().get(communitiesBlobKey, { type: "json" });
    return Array.isArray(data) ? data.filter(isManagedCommunity) : [];
  }

  try {
    const content = await readFile(communitiesFilePath, "utf8");
    const data = JSON.parse(content) as unknown;
    return Array.isArray(data) ? data.filter(isManagedCommunity) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function saveManagedCommunity(community: ManagedCommunity) {
  if (db) {
    await setDoc(doc(db, "communities", community.id), community);
    return;
  }

  const communities = await readManagedCommunities();
  const next = [community, ...communities.filter((item) => item.id !== community.id)].sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );

  if (shouldUseNetlifyBlobs()) {
    await getCommunitiesStore().setJSON(communitiesBlobKey, next);
    return;
  }

  await mkdir(dirname(communitiesFilePath), { recursive: true });
  await writeFile(communitiesFilePath, JSON.stringify(next, null, 2), "utf8");
}

function getCommunitiesStore() {
  return getStore({ name: communitiesStoreName, consistency: "strong" });
}

function shouldUseNetlifyBlobs() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

function isManagedCommunity(value: unknown): value is ManagedCommunity {
  if (!value || typeof value !== "object") return false;
  const community = value as ManagedCommunity;
  return Boolean(community.id && community.name && community.createdAt);
}
