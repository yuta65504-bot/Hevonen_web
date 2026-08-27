import { Weather } from "./Weather";

export interface WeatherBias {
  sunny: number;
  rainy: number;
  windy: number;
}

export function weatherBiasMultiplier(bias: WeatherBias, weather: Weather): number {
  switch (weather) {
    case Weather.SUNNY: return bias.sunny;
    case Weather.RAINY: return bias.rainy;
    case Weather.WINDY: return bias.windy;
  }
}

export interface Horse {
  id: number;
  name: string;
  speed: number; // base speed 1.0-5.0
  stamina: number; // 0.5-1.0
  weatherBias: WeatherBias;
  color: string; // CSS hex
  accentColor: string;
}

export const TOTAL_HORSE_COUNT = 20;
export const RACE_ENTRANT_COUNT = 10;
export const STANDBY_HORSE_COUNT = TOTAL_HORSE_COUNT - RACE_ENTRANT_COUNT;

export const ALL_HORSES: Horse[] = [
  { id: 1, name: "Thunder Bolt", speed: 4.8, stamina: 0.6, weatherBias: { sunny: 1.12, rainy: 0.88, windy: 1.00 }, color: "#B5651D", accentColor: "#8B4513" },
  { id: 2, name: "Silver Wind", speed: 4.1, stamina: 0.8, weatherBias: { sunny: 1.00, rainy: 0.96, windy: 1.10 }, color: "#9E9E9E", accentColor: "#616161" },
  { id: 3, name: "Golden Star", speed: 3.4, stamina: 1.0, weatherBias: { sunny: 0.94, rainy: 1.10, windy: 1.00 }, color: "#FFD700", accentColor: "#FFA000" },
  { id: 4, name: "Midnight", speed: 4.6, stamina: 0.65, weatherBias: { sunny: 0.98, rainy: 1.08, windy: 0.96 }, color: "#212121", accentColor: "#424242" },
  { id: 5, name: "Cherry Blossom", speed: 3.0, stamina: 1.0, weatherBias: { sunny: 1.06, rainy: 1.02, windy: 0.92 }, color: "#FF80AB", accentColor: "#F50057" },
  { id: 6, name: "Ocean Wave", speed: 3.9, stamina: 0.9, weatherBias: { sunny: 0.95, rainy: 1.12, windy: 1.00 }, color: "#1565C0", accentColor: "#0D47A1" },
  { id: 7, name: "Crimson Dash", speed: 4.4, stamina: 0.72, weatherBias: { sunny: 1.08, rainy: 0.93, windy: 1.01 }, color: "#C62828", accentColor: "#8E0000" },
  { id: 8, name: "Emerald Mist", speed: 3.5, stamina: 0.94, weatherBias: { sunny: 1.00, rainy: 1.08, windy: 0.98 }, color: "#2E7D32", accentColor: "#1B5E20" },
  { id: 9, name: "Velvet Comet", speed: 4.7, stamina: 0.63, weatherBias: { sunny: 1.10, rainy: 0.87, windy: 1.00 }, color: "#6A1B9A", accentColor: "#4A148C" },
  { id: 10, name: "Amber Trail", speed: 3.7, stamina: 0.9, weatherBias: { sunny: 1.03, rainy: 1.04, windy: 0.98 }, color: "#FFB300", accentColor: "#FF8F00" },
  { id: 11, name: "Frost Fang", speed: 4.0, stamina: 0.82, weatherBias: { sunny: 0.95, rainy: 0.98, windy: 1.12 }, color: "#90CAF9", accentColor: "#42A5F5" },
  { id: 12, name: "Copper Echo", speed: 4.2, stamina: 0.76, weatherBias: { sunny: 1.04, rainy: 0.96, windy: 1.03 }, color: "#B87333", accentColor: "#8D5524" },
  { id: 13, name: "Storm Lantern", speed: 3.4, stamina: 0.98, weatherBias: { sunny: 0.91, rainy: 1.14, windy: 1.02 }, color: "#546E7A", accentColor: "#37474F" },
  { id: 14, name: "Moon Pebble", speed: 3.2, stamina: 1.0, weatherBias: { sunny: 0.98, rainy: 1.05, windy: 1.00 }, color: "#B39DDB", accentColor: "#7E57C2" },
  { id: 15, name: "Blaze Hopper", speed: 4.9, stamina: 0.58, weatherBias: { sunny: 1.15, rainy: 0.85, windy: 0.98 }, color: "#FF7043", accentColor: "#E64A19" },
  { id: 16, name: "Ivory Kite", speed: 3.9, stamina: 0.88, weatherBias: { sunny: 1.00, rainy: 0.99, windy: 1.08 }, color: "#E0E0E0", accentColor: "#BDBDBD" },
  { id: 17, name: "Jade Rocket", speed: 4.5, stamina: 0.69, weatherBias: { sunny: 1.06, rainy: 0.92, windy: 1.04 }, color: "#26A69A", accentColor: "#00897B" },
  { id: 18, name: "Sable Drift", speed: 3.6, stamina: 0.95, weatherBias: { sunny: 0.97, rainy: 1.09, windy: 1.01 }, color: "#5D4037", accentColor: "#3E2723" },
  { id: 19, name: "Neon Nimbus", speed: 4.1, stamina: 0.8, weatherBias: { sunny: 1.01, rainy: 0.94, windy: 1.12 }, color: "#00BCD4", accentColor: "#00838F" },
  { id: 20, name: "Maple Crown", speed: 3.3, stamina: 1.0, weatherBias: { sunny: 1.02, rainy: 1.06, windy: 0.95 }, color: "#8D6E63", accentColor: "#6D4C41" },
];

function validateHorseCatalog(): void {
  if (ALL_HORSES.length !== TOTAL_HORSE_COUNT) {
    throw new Error(`Expected ${TOTAL_HORSE_COUNT} horses, found ${ALL_HORSES.length}`);
  }
  const ids = new Set(ALL_HORSES.map((h) => h.id));
  if (ids.size !== ALL_HORSES.length) throw new Error("Horse IDs must be unique");
}

export function selectRaceEntrants(): Horse[] {
  validateHorseCatalog();
  const shuffled = [...ALL_HORSES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, RACE_ENTRANT_COUNT);
}

export function standbyHorsesFor(entrants: Horse[]): Horse[] {
  const entrantIds = new Set(entrants.map((h) => h.id));
  return ALL_HORSES.filter((h) => !entrantIds.has(h.id)).slice(0, STANDBY_HORSE_COUNT);
}
