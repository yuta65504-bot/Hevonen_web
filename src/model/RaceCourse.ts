import { AppLanguage } from "./AppLanguage";

export interface RaceCourse {
  id: number;
  nameJa: string;
  nameEn: string;
  distanceM: number;
  venueJa: string;
  venueEn: string;
}

export const ALL_RACE_COURSES: RaceCourse[] = [
  { id: 1, nameJa: "スプリント 1200m", nameEn: "Sprint 1200m", distanceM: 1200, venueJa: "中山", venueEn: "Nakayama" },
  { id: 2, nameJa: "マイル 1600m", nameEn: "Mile 1600m", distanceM: 1600, venueJa: "東京", venueEn: "Tokyo" },
  { id: 3, nameJa: "中距離 2000m", nameEn: "Middle 2000m", distanceM: 2000, venueJa: "中山", venueEn: "Nakayama" },
  { id: 4, nameJa: "中距離 2200m", nameEn: "Middle 2200m", distanceM: 2200, venueJa: "京都", venueEn: "Kyoto" },
  { id: 5, nameJa: "クラシック 2400m", nameEn: "Classic 2400m", distanceM: 2400, venueJa: "東京", venueEn: "Tokyo" },
  { id: 6, nameJa: "長距離 3000m", nameEn: "Long 3000m", distanceM: 3000, venueJa: "阪神", venueEn: "Hanshin" },
  { id: 7, nameJa: "長距離 3200m", nameEn: "Long 3200m", distanceM: 3200, venueJa: "京都", venueEn: "Kyoto" },
];

export const DEFAULT_RACE_COURSE: RaceCourse = ALL_RACE_COURSES[4];

export function randomRaceCourse(): RaceCourse {
  return ALL_RACE_COURSES[Math.floor(Math.random() * ALL_RACE_COURSES.length)];
}

export function displayName(course: RaceCourse, language: AppLanguage): string {
  return language === AppLanguage.JAPANESE ? `${course.venueJa} ${course.distanceM}m` : `${course.venueEn} ${course.distanceM}m`;
}

export function shortName(course: RaceCourse, language: AppLanguage): string {
  return language === AppLanguage.JAPANESE ? course.nameJa : course.nameEn;
}

// For backward compat with Kotlin constant
export const LEGACY_RACE_TRACK_LENGTH_F = 2400;
