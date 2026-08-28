import { AppLanguage } from "./AppLanguage";
import { PlayerBet, BotPlayer } from "./BettingLogic";
import { Horse, selectRaceEntrants, standbyHorsesFor } from "./Horse";
import { RaceCourse, DEFAULT_RACE_COURSE, randomRaceCourse } from "./RaceCourse";
import { Weather, randomWeather } from "./Weather";

export enum Screen {
  TITLE = "TITLE",
  BETTING = "BETTING",
  RACE = "RACE",
  RESULT = "RESULT",
}

export interface RaceResult {
  finishOrder: Horse[];
  playerWon: boolean;
  playerSheepDelta: number;
  selectedHorsePopularityPercent?: number | null;
  selectedHorseProfitBonusPercent?: number | null;
  selectedHorsePayoutMultiplier?: number | null;
  photoFinish?: boolean;
}

export interface GameState {
  sheep: number;
  screen: Screen;
  language: AppLanguage;
  horses: Horse[];
  standbyHorses: Horse[];
  weather: Weather;
  raceCourse: RaceCourse;
  playerBet: PlayerBet | null;
  bots: BotPlayer[];
  raceResult: RaceResult | null;
  racePositions: number[];
  raceFinished: boolean;
}

export const INITIAL_SHEEP_COUNT = 10;

export function createInitialGameState(initialSheep: number = INITIAL_SHEEP_COUNT): GameState {
  const entrants = selectRaceEntrants();
  return {
    sheep: initialSheep,
    screen: Screen.TITLE,
    language: AppLanguage.JAPANESE,
    horses: entrants,
    standbyHorses: standbyHorsesFor(entrants),
    weather: randomWeather(),
    raceCourse: randomRaceCourse(),
    playerBet: null,
    bots: [],
    raceResult: null,
    racePositions: [],
    raceFinished: false,
  };
}

// Keep compat with Kotlin's DEFAULT_RACE_COURSE export for any importers
export { DEFAULT_RACE_COURSE };
