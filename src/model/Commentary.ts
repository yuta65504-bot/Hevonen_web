import { Horse } from "./Horse";
import { AppLanguage } from "./AppLanguage";
import { stringsFor } from "../i18n/strings";

export type CommentaryLevel = "info" | "hot" | "finish";

export interface CommentaryEvent {
  tick: number;
  text: string;
  level: CommentaryLevel;
}

/**
 * Generate a single commentary event based on position deltas.
 * Pure - caller tracks prev leader etc.
 */
export function generateCommentary(params: {
  tick: number;
  positions: number[];
  prevPositions: number[];
  horses: Horse[];
  finishOrderIdx: number[];
  prevFinishOrderIdx: number[];
  prevLeaderIdx: number | null;
  language: AppLanguage;
  trackLength: number;
}): { event: CommentaryEvent | null; nextLeaderIdx: number | null } {
  const { tick, positions, prevPositions, horses, finishOrderIdx, prevFinishOrderIdx, prevLeaderIdx, language, trackLength } = params;
  const strings = stringsFor(language);

  // 1) New finish - highest priority
  if (finishOrderIdx.length > prevFinishOrderIdx.length) {
    const newIdx = finishOrderIdx[finishOrderIdx.length - 1];
    const horse = horses[newIdx];
    if (horse) {
      const rank = finishOrderIdx.length;
      return {
        event: { tick, text: strings.commentaryFinish(horse.name, rank), level: rank <= 3 ? "finish" as const : "info" },
        nextLeaderIdx: prevLeaderIdx,
      };
    }
  }

  // Determine leader (ignore finished horses? consider overall max pos but finished at trackLength)
  let leaderIdx: number | null = null;
  let maxPos = -1;
  for (let i = 0; i < positions.length; i++) {
    if (finishOrderIdx.includes(i)) continue;
    const p = positions[i] ?? 0;
    if (p > maxPos) {
      maxPos = p;
      leaderIdx = i;
    }
  }
  // if all finished, keep prev
  if (leaderIdx === null) {
    return { event: null, nextLeaderIdx: prevLeaderIdx };
  }

  // 2) Leader change
  if (prevLeaderIdx !== null && leaderIdx !== prevLeaderIdx && tick > 10) {
    const horse = horses[leaderIdx];
    if (horse) {
      return {
        event: { tick, text: strings.commentaryLeader(horse.name), level: "hot" },
        nextLeaderIdx: leaderIdx,
      };
    }
  }

  // 3) Surge detection: single horse advance > 1.8x median advance this tick
  // compute advances
  const advances: number[] = positions.map((p, i) => p - (prevPositions[i] ?? 0));
  const sorted = [...advances].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  if (median > 0) {
    for (let i = 0; i < advances.length; i++) {
      if (finishOrderIdx.includes(i)) continue;
      if (advances[i] > median * 2.2 && advances[i] > 5) {
        const horse = horses[i];
        if (horse) {
          return {
            event: { tick, text: strings.commentarySurge(horse.name), level: "hot" },
            nextLeaderIdx: leaderIdx,
          };
        }
      }
    }
  }

  // 4) Breakaway: gap between 1st and 2nd > 8% track
  const sortedByPos = horses
    .map((_, i) => ({ idx: i, pos: positions[i] ?? 0 }))
    .filter((x) => !finishOrderIdx.includes(x.idx))
    .sort((a, b) => b.pos - a.pos);
  if (sortedByPos.length >= 2) {
    const gap = sortedByPos[0].pos - sortedByPos[1].pos;
    if (gap > trackLength * 0.08 && sortedByPos[0].pos > trackLength * 0.35) {
      // throttle: only emit once per gap event by checking prev gap was smaller
      const prevSorted = horses
        .map((_, i) => ({ idx: i, pos: prevPositions[i] ?? 0 }))
        .filter((x) => !prevFinishOrderIdx.includes(x.idx))
        .sort((a, b) => b.pos - a.pos);
      const prevGap = prevSorted.length >= 2 ? prevSorted[0].pos - prevSorted[1].pos : 0;
      if (prevGap <= trackLength * 0.08) {
        const horse = horses[sortedByPos[0].idx];
        if (horse) {
          return {
            event: { tick, text: strings.commentaryBreakaway(horse.name), level: "hot" },
            nextLeaderIdx: leaderIdx,
          };
        }
      }
    }
  }

  // 5) Close battle: top 3 within 2.5% track in final 30%
  if (sortedByPos.length >= 3 && maxPos > trackLength * 0.7) {
    const top3 = sortedByPos.slice(0, 3);
    const spread = top3[0].pos - top3[2].pos;
    if (spread < trackLength * 0.025) {
      // throttle: only if not emitted recently (tick gap) - caller handles throttle, we just emit
      // To avoid spam, check prev spread was larger
      const prevTop3 = horses
        .map((_, i) => ({ idx: i, pos: prevPositions[i] ?? 0 }))
        .filter((x) => !prevFinishOrderIdx.includes(x.idx))
        .sort((a, b) => b.pos - a.pos)
        .slice(0, 3);
      const prevSpread = prevTop3.length >= 3 ? prevTop3[0].pos - prevTop3[2].pos : Infinity;
      if (prevSpread >= trackLength * 0.025) {
        return {
          event: { tick, text: strings.commentaryCloseBattle(), level: "hot" },
          nextLeaderIdx: leaderIdx,
        };
      }
    }
  }

  return { event: null, nextLeaderIdx: leaderIdx };
}
