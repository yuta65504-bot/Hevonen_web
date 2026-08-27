import { useMemo, useState } from "react";
import { AppLanguage } from "../model/AppLanguage";
import { BetType, PlayerBet, HorsePayoutInfo, calculateBetPayout, calculateBetPayoutInfo } from "../model/BettingLogic";
import { Horse, RACE_ENTRANT_COUNT, STANDBY_HORSE_COUNT, TOTAL_HORSE_COUNT, weatherBiasMultiplier } from "../model/Horse";
import { RaceCourse } from "../model/RaceCourse";
import { Weather as WeatherEnum } from "../model/Weather";
import { BotPlayer } from "../model/BettingLogic";
import { stringsFor } from "../i18n/strings";
import { HorseCanvas } from "./HorseCanvas";

const MAX_BET = 30;

interface Props {
  sheep: number;
  language: AppLanguage;
  horses: Horse[];
  weather: WeatherEnum;
  raceCourse: RaceCourse;
  bots: BotPlayer[];
  onPlaceBet: (bet: PlayerBet) => void;
}

export function BettingScreen({ sheep, language, horses, weather, raceCourse, bots, onPlaceBet }: Props) {
  const strings = stringsFor(language);
  const [selectedBetType, setSelectedBetType] = useState<BetType>(BetType.WIN);
  const [selectedHorseId, setSelectedHorseId] = useState<number | null>(null);
  const [selectedTrifecta, setSelectedTrifecta] = useState<number[]>([]);
  const [betAmount, setBetAmount] = useState(1);

  const maxBet = Math.max(1, Math.min(sheep, MAX_BET));

  const payoutInfoByHorse = useMemo(() => {
    const m = new Map<number, HorsePayoutInfo>();
    horses.forEach((h) => {
      m.set(h.id, calculateBetPayoutInfo({ type: BetType.WIN, horseIds: [h.id], amount: 1 }, bots));
    });
    return m;
  }, [bots, horses]);

  const currentBet: PlayerBet | null = (() => {
    if (selectedBetType === BetType.WIN || selectedBetType === BetType.PLACE) {
      return selectedHorseId != null ? { type: selectedBetType, horseIds: [selectedHorseId], amount: betAmount } : null;
    }
    return selectedTrifecta.length === 3 ? { type: BetType.TRIFECTA, horseIds: [...selectedTrifecta], amount: betAmount } : null;
  })();

  const currentPayoutInfo = currentBet ? calculateBetPayoutInfo(currentBet, bots) : null;
  const expectedPayout = currentPayoutInfo ? calculateBetPayout(betAmount, currentPayoutInfo) : null;

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "8px 0" }}>{strings.yourSheep(sheep)}</h2>
      <p style={{ fontSize: 14, color: "#666", margin: 0 }}>{strings.pickHorseHint()}</p>
      <p style={{ fontSize: 12, color: "#888", margin: "4px 0" }}>{strings.entrantsInfo(RACE_ENTRANT_COUNT, TOTAL_HORSE_COUNT, STANDBY_HORSE_COUNT)}</p>
      <p style={{ fontSize: 13, color: "#666" }}>{strings.weatherToday(weather)}</p>
      <p style={{ fontSize: 13, color: "#2E7D32", fontWeight: 600 }}>{strings.courseInfo(raceCourse)}</p>
      <p style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>{strings.ovalTrackLabel()} / {strings.distanceLabel(raceCourse.distanceM)}</p>

      <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>{strings.betTypeMenuTitle()}</p>
      <div style={{ display: "flex", gap: 8, margin: "8px 0" }}>
        {(Object.values(BetType) as BetType[]).map((t) => (
          <button
            key={t}
            className={`chip ${selectedBetType === t ? "active" : ""}`}
            onClick={() => { setSelectedBetType(t); if (t !== BetType.TRIFECTA) setSelectedTrifecta([]); }}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 8px", lineHeight: 1.25, minHeight: 56 }}
          >
            <span style={{ fontSize: 13, fontWeight: 800 }}>{strings.betTypeLabel(t)}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: selectedBetType === t ? "rgba(255,255,255,0.92)" : "#666", marginTop: 3, textAlign: "center" }}>{strings.betTypeDescription(t)}</span>
          </button>
        ))}
      </div>

      {selectedBetType === BetType.TRIFECTA && (
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 12, color: "#2E7D32" }}>{strings.trifectaSelectionHint(selectedTrifecta.length)}</p>
          {selectedTrifecta.map((id, idx) => {
            const name = horses.find((h) => h.id === id)?.name ?? `#${id}`;
            return <div key={id} style={{ fontSize: 12, color: "#555" }}>{strings.selectedOrderLabel(idx + 1, name)}</div>;
          })}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 2 }}>
        {horses.map((horse) => {
          const botCount = bots.filter((b) => b.bet.horseIds[0] === horse.id).length;
          const trifectaOrder = selectedTrifecta.indexOf(horse.id);
          const isSelected = selectedBetType === BetType.TRIFECTA ? trifectaOrder >= 0 : selectedHorseId === horse.id;
          const payoutInfo = payoutInfoByHorse.get(horse.id);
          const weatherMul = weatherBiasMultiplier(horse.weatherBias, weather);
          const weatherPercent = Math.round((weatherMul - 1) * 100);
          const weatherPercentText = weatherPercent >= 0 ? `+${weatherPercent}%` : `${weatherPercent}%`;
          const weatherColor = weatherPercent > 0 ? "#2E7D32" : weatherPercent < 0 ? "#C62828" : "#666";

          return (
            <div
              key={horse.id}
              onClick={() => {
                if (selectedBetType === BetType.WIN || selectedBetType === BetType.PLACE) setSelectedHorseId(horse.id);
                else {
                  setSelectedTrifecta((prev) => {
                    if (prev.includes(horse.id)) return prev.filter((x) => x !== horse.id);
                    if (prev.length < 3) return [...prev, horse.id];
                    return prev;
                  });
                }
              }}
              className="card"
              style={{
                padding: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                borderColor: isSelected ? "#2E7D32" : "#e0e0e0",
                borderWidth: isSelected ? 2 : 1,
                background: isSelected ? "#E8F5E9" : "white",
              }}
            >
              <HorseCanvas horse={horse} scale={0.9} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{horse.name}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{strings.speedStamina("★".repeat(Math.min(5, Math.max(1, Math.floor(horse.speed / 0.6)))), "★".repeat(Math.min(5, Math.max(1, Math.floor(horse.stamina * 5)))) )}</div>
                <div style={{ fontSize: 12, color: weatherColor }}>{strings.weatherEffect(weather, weatherPercentText)}</div>
                {payoutInfo && <div style={{ fontSize: 12, color: "#2E7D32" }}>{strings.popularityAndBonus(payoutInfo.popularityPercent, payoutInfo.profitBonusPercent)}</div>}
              </div>
              <div style={{ textAlign: "right", minWidth: 80 }}>
                <div style={{ fontSize: 12 }}>{strings.botCount(botCount)}</div>
                {trifectaOrder >= 0 ? (
                  <div style={{ fontSize: 12, color: "#2E7D32", fontWeight: 700 }}>{language === AppLanguage.JAPANESE ? `${trifectaOrder + 1}着候補` : `#${trifectaOrder + 1} pick`}</div>
                ) : isSelected ? (
                  <div style={{ fontSize: 12, color: "#2E7D32", fontWeight: 700 }}>{strings.selectedMark()}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ fontWeight: 600 }}>{strings.betAmount(betAmount)}</div>
        <input
          type="range"
          min={1}
          max={maxBet}
          value={Math.min(betAmount, maxBet)}
          onChange={(e) => setBetAmount(parseInt(e.target.value, 10))}
          className="input-range"
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>1</span><span>{maxBet}</span></div>
        {currentPayoutInfo && expectedPayout != null && (
          <>
            <div style={{ height: 8 }} />
            <div style={{ fontSize: 12, color: "#2E7D32", fontWeight: 600 }}>{strings.popularityBonus(currentPayoutInfo.profitBonusPercent)}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{strings.ifWin(expectedPayout)}</div>
          </>
        )}
      </div>

      <button
        className="btn-primary"
        disabled={!currentBet || sheep <= 0}
        onClick={() => currentBet && onPlaceBet(currentBet)}
        style={{ width: "100%", marginTop: 12, marginBottom: 8 }}
      >
        {currentBet ? strings.raceButton(betAmount) : strings.selectHorseFirst()}
      </button>
    </div>
  );
}
