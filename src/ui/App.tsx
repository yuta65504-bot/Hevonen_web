import { useEffect, useMemo, useState } from "react";
import { createInitialGameState, INITIAL_SHEEP_COUNT, Screen } from "../model/GameState";
import { createBots } from "../model/BotPlayerFactory";
import { selectRaceEntrants, standbyHorsesFor } from "../model/Horse";
import { randomRaceCourse } from "../model/RaceCourse";
import { randomWeather } from "../model/Weather";
import { calculateBetPayout, calculateBetPayoutInfo, isWinningBet } from "../model/BettingLogic";
import { SheepCountStorage } from "../storage/SheepCountStorage";
import { createSoundEffectPlayer, SoundEffect } from "../audio/SoundEffect";
import { TitleScreen } from "./TitleScreen";
import { BettingScreen } from "./BettingScreen";
import { RaceScreen } from "./RaceScreen";
import { ResultScreen } from "./ResultScreen";
import { MuteToggle } from "./MuteToggle";
import { AppLanguage } from "../model/AppLanguage";
import { GameState, RaceResult } from "../model/GameState";

export function App() {
  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(SheepCountStorage.loadSheepCount(INITIAL_SHEEP_COUNT))
  );

  const soundPlayer = useMemo(() => createSoundEffectPlayer(), []);

  useEffect(() => {
    return () => soundPlayer.dispose();
  }, [soundPlayer]);

  const [muteTick, setMuteTick] = useState(0);

  useEffect(() => {
    if (gameState.screen === Screen.RACE) soundPlayer.play(SoundEffect.RACE_START);
    if (gameState.screen === Screen.RESULT && gameState.raceResult) {
      soundPlayer.play(gameState.raceResult.playerWon ? SoundEffect.FANFARE : SoundEffect.FANFARE_LOSE);
    }
  }, [gameState.screen, gameState.raceResult, soundPlayer]);

  useEffect(() => {
    SheepCountStorage.saveSheepCount(gameState.sheep);
  }, [gameState.sheep]);

  const handleMuteToggle = () => {
    soundPlayer.setMuted(!soundPlayer.isMuted());
    setMuteTick((t) => t + 1);
  };

  return (
    <>
      <div style={{ position: "fixed", top: 8, right: 8, zIndex: 100 }}>
        <MuteToggle player={soundPlayer} language={gameState.language} onToggle={handleMuteToggle} />
      </div>
      {gameState.screen === Screen.TITLE && (
        <TitleScreen
          sheep={gameState.sheep}
          language={gameState.language}
          onLanguageChanged={(language) => setGameState((s) => ({ ...s, language }))}
          onGainSheep={() => setGameState((s) => ({ ...s, sheep: s.sheep + 1 }))}
          onStart={() => {
            const entrants = selectRaceEntrants();
            const bots = createBots(entrants);
            setGameState((s) => ({
              ...s,
              screen: Screen.BETTING,
              horses: entrants,
              standbyHorses: standbyHorsesFor(entrants),
              bots,
              weather: randomWeather(),
              raceCourse: randomRaceCourse(),
            }));
          }}
        />
      )}

      {gameState.screen === Screen.BETTING && (
        <BettingScreen
          sheep={gameState.sheep}
          language={gameState.language}
          horses={gameState.horses}
          weather={gameState.weather}
          raceCourse={gameState.raceCourse}
          bots={gameState.bots}
          onPlaceBet={(bet) => setGameState((s) => ({ ...s, screen: Screen.RACE, playerBet: bet }))}
        />
      )}

      {gameState.screen === Screen.RACE && (
        <RaceScreen
          key={muteTick}
          language={gameState.language}
          horses={gameState.horses}
          playerBetHorseId={gameState.playerBet?.horseIds[0] ?? null}
          weather={gameState.weather}
          raceCourse={gameState.raceCourse}
          soundPlayer={soundPlayer}
          onRaceComplete={(finishOrder, photoFinish) => {
            const bet = gameState.playerBet;
            const playerWon = bet ? isWinningBet(bet, finishOrder) : false;
            const payoutInfo = bet ? calculateBetPayoutInfo(bet, gameState.bots) : null;
            const delta = bet == null ? 0 : playerWon && payoutInfo ? calculateBetPayout(bet.amount, payoutInfo) : -bet.amount;
            const newSheep = Math.max(0, gameState.sheep + delta);
            const result: RaceResult = {
              finishOrder,
              playerWon,
              playerSheepDelta: delta,
              selectedHorsePopularityPercent: payoutInfo?.popularityPercent ?? null,
              selectedHorseProfitBonusPercent: payoutInfo?.profitBonusPercent ?? null,
              selectedHorsePayoutMultiplier: payoutInfo?.payoutMultiplier ?? null,
              photoFinish,
            };
            setGameState((s) => ({ ...s, screen: Screen.RESULT, sheep: newSheep, raceResult: result, raceFinished: true }));
          }}
        />
      )}

      {gameState.screen === Screen.RESULT && gameState.raceResult && (
        <ResultScreen
          sheep={gameState.sheep}
          language={gameState.language}
          raceResult={gameState.raceResult}
          playerBet={gameState.playerBet}
          horses={gameState.horses}
          onPlayAgain={() => {
            if (gameState.sheep <= 0) {
              const fresh = createInitialGameState();
              setGameState({ ...fresh, language: gameState.language });
            } else {
              const entrants = selectRaceEntrants();
              const bots = createBots(entrants);
              setGameState((s) => ({
                ...s,
                screen: Screen.BETTING,
                horses: entrants,
                standbyHorses: standbyHorsesFor(entrants),
                playerBet: null,
                bots,
                weather: randomWeather(),
                raceCourse: randomRaceCourse(),
                raceResult: null,
                raceFinished: false,
              }));
            }
          }}
        />
      )}
    </>
  );
}
