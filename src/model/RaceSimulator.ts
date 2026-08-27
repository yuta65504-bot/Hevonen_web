import { Horse, weatherBiasMultiplier } from "./Horse";
import { RaceCourse } from "./RaceCourse";
import { Weather } from "./Weather";

export const RACE_TRACK_LENGTH = 2400;
const BASE_ADVANCE_FACTOR = 2.0;          // slowed from 3.6
const RANDOM_VARIANCE_RANGE = 1.0;        // slowed from 1.8
const STAMINA_DEGRADATION_RATE = 0.0007;
const MIN_SPEED_RATIO = 0.52;
const STEP_RHYTHM_MIN = 0.92;
const STEP_RHYTHM_RANGE = 0.20;
const RACE_LUCK_MIN = 0.86;
const RACE_LUCK_RANGE = 0.30;
const SURGE_CHANCE = 0.035;               // slightly less frequent for calmer race
const SURGE_MIN = 1.8;                    // slowed from 3
const SURGE_RANGE = 3.5;                  // slowed from 7
const STUMBLE_CHANCE = 0.02;
const STUMBLE_MULTIPLIER = 0.82;

export interface RaceState {
  positions: number[];
  finished: boolean;
  finishOrder: number[]; // horse indices in finish order
}

export class RaceSimulator {
  private positions: number[];
  private finishOrder: number[] = [];
  private raceLuck: number[];
  private tick = 0;
  readonly effectiveTrackLength: number;
  private readonly horses: Horse[];
  private readonly weather: Weather;

  constructor(horses: Horse[], weather: Weather, trackLengthOrCourse: number | RaceCourse = RACE_TRACK_LENGTH) {
    this.horses = horses;
    this.weather = weather;
    this.effectiveTrackLength = typeof trackLengthOrCourse === "number" ? trackLengthOrCourse : trackLengthOrCourse.distanceM;
    this.positions = Array(horses.length).fill(0);
    this.raceLuck = horses.map(() => RACE_LUCK_MIN + Math.random() * RACE_LUCK_RANGE);
  }

  step(): RaceState {
    this.tick++;
    for (let i = 0; i < this.horses.length; i++) {
      if (this.finishOrder.includes(i)) continue;
      const horse = this.horses[i];
      const staminaRatio = 1 - this.tick * STAMINA_DEGRADATION_RATE * (1 - horse.stamina);
      const staminaAdjustedSpeed = horse.speed * Math.max(MIN_SPEED_RATIO, staminaRatio);
      const weatherBias = weatherBiasMultiplier(horse.weatherBias, this.weather);
      const rhythm = STEP_RHYTHM_MIN + Math.random() * STEP_RHYTHM_RANGE;
      const stumble = Math.random() < STUMBLE_CHANCE ? STUMBLE_MULTIPLIER : 1;
      const surge = Math.random() < SURGE_CHANCE ? SURGE_MIN + Math.random() * SURGE_RANGE : 0;
      const effectiveSpeed = staminaAdjustedSpeed * weatherBias * this.raceLuck[i] * rhythm * stumble;
      const advance = effectiveSpeed * (BASE_ADVANCE_FACTOR + Math.random() * RANDOM_VARIANCE_RANGE) + surge;
      this.positions[i] = Math.min(this.positions[i] + advance, this.effectiveTrackLength);
      if (this.positions[i] >= this.effectiveTrackLength && !this.finishOrder.includes(i)) {
        this.finishOrder.push(i);
      }
    }
    const finished = this.finishOrder.length === this.horses.length;
    return {
      positions: [...this.positions],
      finished,
      finishOrder: [...this.finishOrder],
    };
  }

  isFinished(): boolean {
    return this.finishOrder.length === this.horses.length;
  }

  getPositions(): number[] {
    return [...this.positions];
  }
}
