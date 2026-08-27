export enum BetType {
  WIN = "WIN",
  PLACE = "PLACE",
  TRIFECTA = "TRIFECTA",
}

export interface PlayerBet {
  type: BetType;
  horseIds: number[];
  amount: number;
}

export interface BotPlayer {
  id: number;
  bet: PlayerBet;
}

export interface HorsePayoutInfo {
  popularityPercent: number;
  profitBonusPercent: number;
  payoutMultiplier: number;
  botCountOnHorse: number;
  totalBots: number;
}

export interface HorseRef {
  id: number;
}

export function basePayoutMultiplier(type: BetType): number {
  switch (type) {
    case BetType.WIN: return 2.0;
    case BetType.PLACE: return 1.55;
    case BetType.TRIFECTA: return 12.0;
  }
}

export function isWinningBet(bet: PlayerBet, finishOrder: HorseRef[]): boolean {
  if (finishOrder.length === 0) return false;
  switch (bet.type) {
    case BetType.WIN:
      return finishOrder[0]?.id === bet.horseIds[0];
    case BetType.PLACE: {
      const target = bet.horseIds[0];
      if (target == null) return false;
      return finishOrder.slice(0, 3).some((h) => h.id === target);
    }
    case BetType.TRIFECTA: {
      if (bet.horseIds.length !== 3) return false;
      const top3 = finishOrder.slice(0, 3).map((h) => h.id);
      return top3.length === 3 && top3.every((id, i) => id === bet.horseIds[i]);
    }
  }
}

export function calculateBetPayoutInfo(bet: PlayerBet, bots: BotPlayer[]): HorsePayoutInfo {
  const total = Math.max(bots.length, 1);
  let botCount = 0;
  switch (bet.type) {
    case BetType.WIN:
    case BetType.PLACE: {
      const target = bet.horseIds[0];
      botCount = bots.filter((b) => b.bet.horseIds[0] === target).length;
      break;
    }
    case BetType.TRIFECTA: {
      botCount = bots.filter((b) => b.bet.type === BetType.TRIFECTA && arraysEqual(b.bet.horseIds, bet.horseIds)).length;
      break;
    }
  }
  const popularity = Math.round((botCount * 100) / total);
  const clampedPopularity = Math.min(100, Math.max(0, popularity));
  let bonusFactor: number;
  switch (bet.type) {
    case BetType.WIN: bonusFactor = 1.1; break;
    case BetType.PLACE: bonusFactor = 0.65; break;
    case BetType.TRIFECTA: bonusFactor = 3.2; break;
  }
  const profitBonus = Math.max(0, Math.round((100 - clampedPopularity) * bonusFactor));
  const base = basePayoutMultiplier(bet.type);
  const multiplier = Math.max(1.05, base * (1 + profitBonus / 100));
  return {
    popularityPercent: clampedPopularity,
    profitBonusPercent: profitBonus,
    payoutMultiplier: multiplier,
    botCountOnHorse: botCount,
    totalBots: total,
  };
}

export function calculateBetPayout(amount: number, payoutInfo: HorsePayoutInfo): number {
  return Math.round(amount * payoutInfo.payoutMultiplier);
}

// Backward compat aliases
export const calculateHorsePayoutInfo = calculateBetPayoutInfo;
export const calculateWinPayout = calculateBetPayout;

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}
