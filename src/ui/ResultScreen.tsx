import { AppLanguage } from "../model/AppLanguage";
import { BetType, PlayerBet, basePayoutMultiplier } from "../model/BettingLogic";
import { Horse } from "../model/Horse";
import { RaceResult } from "../model/GameState";
import { stringsFor } from "../i18n/strings";
import { HorseCanvas } from "./HorseCanvas";

interface Props {
  sheep: number;
  language: AppLanguage;
  raceResult: RaceResult;
  playerBet: PlayerBet | null;
  horses: Horse[];
  onPlayAgain: () => void;
}

export function ResultScreen({ sheep, language, raceResult, playerBet, horses, onPlayAgain }: Props) {
  const strings = stringsFor(language);
  const winner = raceResult.finishOrder[0];
  const delta = raceResult.playerSheepDelta;

  const predictionText = (() => {
    if (!playerBet) return "";
    const nameOf = (id: number) => horses.find((h) => h.id === id)?.name ?? `#${id}`;
    switch (playerBet.type) {
      case BetType.WIN:
      case BetType.PLACE:
        return nameOf(playerBet.horseIds[0] ?? -1);
      case BetType.TRIFECTA:
        if (language === AppLanguage.JAPANESE) {
          return playerBet.horseIds.map((id, i) => `${i + 1}着:${nameOf(id)}`).join(" / ");
        }
        return playerBet.horseIds.map((id, i) => `#${i + 1}:${nameOf(id)}`).join(" / ");
    }
  })();

  const top3Text = raceResult.finishOrder.slice(0, 3).map((h) => h.name).join(" → ");

  return (
    <div style={{ minHeight: "100vh", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 720, margin: "0 auto", width: "100%" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, textAlign: "center" }}>{strings.resultTitle(raceResult.playerWon)}</h1>
      {raceResult.photoFinish && (
        <div style={{ marginTop: 8, background: "#FFF3E0", color: "#E65100", fontWeight: 800, fontSize: 14, padding: "6px 14px", borderRadius: 999, border: "1px solid #FFE0B2" }}>{strings.photoFinishLabel()}</div>
      )}

      {winner && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <HorseCanvas horse={winner} scale={1.2} />
          <div>
            <div style={{ fontSize: 14, color: "#666" }}>{strings.winnerLabel()}</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{winner.name}</div>
          </div>
        </div>
      )}

      {playerBet && (
        <div className="card" style={{ width: "100%", padding: 12, marginTop: 12 }}>
          <div style={{ fontWeight: 600 }}>{strings.yourBetTitle()}</div>
          <div style={{ fontSize: 13 }}>{strings.betTypeMenuTitle()}: {strings.betTypeLabel(playerBet.type)}</div>
          <div style={{ fontSize: 13 }}>{strings.conditionLabel()}: {strings.betTypeDescription(playerBet.type)}</div>
          <div style={{ fontSize: 13 }}>{strings.predictionLabel()}: {predictionText}</div>
          <div style={{ fontSize: 13, color: "#666" }}>{strings.actualTop3Label(top3Text)}</div>
        </div>
      )}

      <div
        className="card"
        style={{
          width: "100%",
          padding: 16,
          marginTop: 12,
          background: raceResult.playerWon ? "#E8F5E9" : "#FFEBEE",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 800 }}>{delta >= 0 ? `+${delta} 🐑` : `${delta} 🐑`}</div>
        <div style={{ fontSize: 18 }}>{strings.totalSheep(sheep)}</div>
        {raceResult.selectedHorsePopularityPercent != null && raceResult.selectedHorseProfitBonusPercent != null && raceResult.selectedHorsePayoutMultiplier != null && (
          <>
            <div style={{ height: 6 }} />
            <div style={{ fontSize: 13, color: "#666", textAlign: "center" }}>
              {strings.payoutSummary(raceResult.selectedHorsePopularityPercent, raceResult.selectedHorseProfitBonusPercent, Math.round((raceResult.selectedHorsePayoutMultiplier - 1) * 100))}
            </div>
            {playerBet && (
              <div style={{ fontSize: 12, color: "#666" }}>
                {language === AppLanguage.JAPANESE ? `基礎払戻: +${Math.round((basePayoutMultiplier(playerBet.type) - 1) * 100)}%` : `Base payout: +${Math.round((basePayoutMultiplier(playerBet.type) - 1) * 100)}%`}
              </div>
            )}
          </>
        )}
        {sheep <= 0 && <div style={{ marginTop: 8, fontSize: 14, color: "red" }}>{strings.outOfSheep()}</div>}
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, margin: "16px 0 8px", alignSelf: "flex-start" }}>{strings.finishingOrder()}</h3>
      <div style={{ flex: 1, width: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, minHeight: 120 }}>
        {raceResult.finishOrder.map((horse, idx) => {
          const isPick = playerBet?.horseIds.includes(horse.id);
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;
          return (
            <div key={horse.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20, minWidth: 32 }}>{medal}</span>
              <HorseCanvas horse={horse} scale={0.7} />
              <span style={{ fontSize: 14, fontWeight: isPick ? 700 : 400 }}>{horse.name}</span>
              {isPick && <span style={{ fontSize: 12, color: "#2E7D32" }}>{strings.yourPick()}</span>}
            </div>
          );
        })}
      </div>

      <button className="btn-primary" onClick={onPlayAgain} disabled={sheep <= 0} style={{ width: "70%", marginTop: 16 }}>
        {sheep > 0 ? strings.raceAgain() : strings.noSheepLeft()}
      </button>
      {sheep <= 0 && (
        <button className="btn-outline" onClick={onPlayAgain} style={{ width: "70%", marginTop: 8, borderRadius: 999, padding: "10px 16px" }}>
          {strings.startOver()}
        </button>
      )}
    </div>
  );
}
