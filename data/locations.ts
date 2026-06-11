export interface CommunityLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sourceLabel: string;
  sourceUrl?: string;
}

export const communityLocations: CommunityLocation[] = [
  {
    id: "limon-2",
    name: "Limon 2",
    latitude: 11.45789,
    longitude: -86.07781,
    sourceLabel: "Coordenadas de El Limon, Tola",
    sourceUrl: "https://mapcarta.com/es/19585004",
  },
  {
    id: "astillero",
    name: "Astillero",
    latitude: 11.51219,
    longitude: -86.16407,
    sourceLabel: "Coordenadas de El Astillero, Tola",
    sourceUrl: "https://mapcarta.com/19585848",
  },
  {
    id: "las-lajas",
    name: "Las Lajas",
    latitude: 11.45525,
    longitude: -86.0836,
    sourceLabel: "Coordenadas de Las Lajas, Tola",
    sourceUrl: "https://mapcarta.com/es/N3971700245",
  },
  {
    id: "el-higueral",
    name: "El Higueral",
    latitude: 11.50748,
    longitude: -86.08608,
    sourceLabel: "Coordenadas de El Higueral, Tola",
    sourceUrl: "https://mapcarta.com/es/19585122",
  },
  {
    id: "rancho-santana",
    name: "Rancho Santana",
    latitude: 11.45753,
    longitude: -86.07716,
    sourceLabel: "Zona Comarca Limon #1 / El Limon",
    sourceUrl: "https://ranchosantana.com/",
  },
];

export const communityNames = communityLocations.map((community) => community.name);
