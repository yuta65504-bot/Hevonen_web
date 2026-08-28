import { SoundEffectPlayer } from "../audio/SoundEffect";
import { AppLanguage } from "../model/AppLanguage";
import { stringsFor } from "../i18n/strings";

interface Props {
  player: SoundEffectPlayer;
  language: AppLanguage;
  onToggle: () => void;
}

export function MuteToggle({ player, language, onToggle }: Props) {
  const strings = stringsFor(language);
  const muted = player.isMuted();
  return (
    <button
      onClick={onToggle}
      aria-label={muted ? strings.unmutedLabel() : strings.mutedLabel()}
      title={muted ? strings.unmutedLabel() : strings.mutedLabel()}
      style={{
        background: muted ? "#f5f5f5" : "#E8F5E9",
        border: "1px solid #e0e0e0",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
