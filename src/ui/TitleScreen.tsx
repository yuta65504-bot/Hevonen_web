import { useState } from "react";
import { ALL_HORSES, RACE_ENTRANT_COUNT, STANDBY_HORSE_COUNT, TOTAL_HORSE_COUNT } from "../model/Horse";
import { AppLanguage } from "../model/AppLanguage";
import { stringsFor } from "../i18n/strings";
import { HorseCanvas } from "./HorseCanvas";

interface Props {
  sheep: number;
  language: AppLanguage;
  onLanguageChanged: (l: AppLanguage) => void;
  onGainSheep: () => void;
  onStart: () => void;
}

export function TitleScreen({ sheep, language, onLanguageChanged, onGainSheep, onStart }: Props) {
  const strings = stringsFor(language);
  const [taps, setTaps] = useState(0);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, margin: 0 }}>{strings.title()}</h1>
      <p style={{ fontSize: 20, color: "#666", margin: "8px 0 12px" }}>{strings.subtitle()}</p>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14 }}>{strings.languageLabel()}</span>
        <button className={`btn-outline ${language === AppLanguage.JAPANESE ? "active" : ""}`} onClick={() => onLanguageChanged(AppLanguage.JAPANESE)}>{strings.japaneseLabel()}</button>
        <button className={`btn-outline ${language === AppLanguage.ENGLISH ? "active" : ""}`} onClick={() => onLanguageChanged(AppLanguage.ENGLISH)}>{strings.englishLabel()}</button>
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 600, margin: "8px 0" }}>{strings.menuTitle()}</h2>
      <p style={{ fontSize: 18, fontWeight: 500 }}>{strings.ownedSheep(sheep)}</p>

      <div
        role="button"
        tabIndex={0}
        aria-label={strings.tapAreaHint()}
        onClick={() => { setTaps((t) => t + 1); onGainSheep(); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTaps((t) => t + 1); onGainSheep(); } }}
        style={{
          width: "100%",
          maxWidth: 420,
          height: 120,
          background: "#E8F5E9",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          userSelect: "none",
          marginTop: 8,
          border: "2px dashed #4CAF50",
          whiteSpace: "pre-line",
          fontWeight: 500,
          color: "#2E7D32",
        }}
      >
        {strings.tapAreaHint()}
      </div>
      {taps > 0 && <p style={{ color: "#2E7D32", fontSize: 14, marginTop: 8 }}>{strings.sheepTapped(taps)}</p>}

      <div style={{ display: "flex", gap: 8, padding: 16, marginTop: 8 }}>
        {ALL_HORSES.slice(0, 3).map((h) => (
          <HorseCanvas key={h.id} horse={h} scale={1.2} />
        ))}
      </div>

      <p style={{ fontSize: 16, margin: "8px 0 0" }}>{strings.startWithSheep()}</p>
      <p style={{ fontSize: 14, color: "#666", margin: 4 }}>{strings.titleTip()}</p>
      <p style={{ fontSize: 14, color: "#666" }}>{strings.horseCount(TOTAL_HORSE_COUNT, RACE_ENTRANT_COUNT, STANDBY_HORSE_COUNT)}</p>
      <p style={{ fontSize: 14, color: "#666" }}>{strings.botsInfo()}</p>

      <button className="btn-primary" onClick={onStart} style={{ marginTop: 24, width: "60%", maxWidth: 280 }}>
        {strings.startRaceButton()}
      </button>
    </div>
  );
}
