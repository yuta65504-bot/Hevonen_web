import { BetType, BotPlayer } from "./BettingLogic";
import { Horse } from "./Horse";

export function createBots(horses: Horse[], count = 100): BotPlayer[] {
  return Array.from({ length: count }, (_, idx) => {
    const horse = horses[Math.floor(Math.random() * horses.length)];
    const betAmount = Math.floor(Math.random() * 8) + 1; // 1-8
    return {
      id: idx + 1,
      bet: { type: BetType.WIN, horseIds: [horse.id], amount: betAmount },
    } satisfies BotPlayer;
  });
}
