import { AppLanguage } from "../model/AppLanguage";
import { BetType } from "../model/BettingLogic";
import { RaceCourse } from "../model/RaceCourse";
import { Weather } from "../model/Weather";

export interface AppStrings {
  title(): string;
  subtitle(): string;
  languageLabel(): string;
  japaneseLabel(): string;
  englishLabel(): string;
  menuTitle(): string;
  ownedSheep(sheep: number): string;
  tapAreaHint(): string;
  sheepTapped(taps: number): string;
  startWithSheep(): string;
  titleTip(): string;
  horseCount(total: number, entrants: number, standby: number): string;
  botsInfo(): string;
  startRaceButton(): string;
  yourSheep(sheep: number): string;
  pickHorseHint(): string;
  entrantsInfo(entrants: number, total: number, standby: number): string;
  weatherToday(weather: Weather): string;
  betTypeMenuTitle(): string;
  betTypeLabel(type: BetType): string;
  betTypeDescription(type: BetType): string;
  trifectaSelectionHint(selected: number): string;
  selectedOrderLabel(order: number, horseName: string): string;
  betAmount(amount: number): string;
  popularityBonus(bonus: number): string;
  ifWin(payout: number): string;
  raceButton(amount: number): string;
  selectHorseFirst(): string;
  speedStamina(speedStars: string, staminaStars: string): string;
  weatherEffect(weather: Weather, percent: string): string;
  popularityAndBonus(popularity: number, bonus: number): string;
  botCount(count: number): string;
  selectedMark(): string;
  raceStatus(finished: boolean): string;
  raceWeather(weather: Weather): string;
  racingLabel(): string;
  resultTitle(won: boolean): string;
  winnerLabel(): string;
  yourBetTitle(): string;
  conditionLabel(): string;
  predictionLabel(): string;
  actualTop3Label(top3: string): string;
  totalSheep(sheep: number): string;
  payoutSummary(popularity: number, bonus: number, multiplierPercent: number): string;
  outOfSheep(): string;
  finishingOrder(): string;
  yourPick(): string;
  raceAgain(): string;
  noSheepLeft(): string;
  startOver(): string;
  courseInfo(course: RaceCourse): string;
  courseDetail(course: RaceCourse): string;
  distanceLabel(distanceM: number): string;
  ovalTrackLabel(): string;
  commentaryLeader(name: string): string;
  commentarySurge(name: string): string;
  commentaryBreakaway(name: string): string;
  commentaryCloseBattle(): string;
  commentaryFinish(name: string, rank: number): string;
  commentaryLap(lap: number, total: number): string;
  photoFinishLabel(): string;
  mutedLabel(): string;
  unmutedLabel(): string;
}

class JapaneseStrings implements AppStrings {
  title() { return "🐴 Hevonen"; }
  subtitle() { return "ひつじで賭ける競馬ゲーム"; }
  languageLabel() { return "言語:"; }
  japaneseLabel() { return "日本語"; }
  englishLabel() { return "English"; }
  menuTitle() { return "メニュー"; }
  ownedSheep(sheep: number) { return `所持ひつじ: ${sheep} 🐑`; }
  tapAreaHint() { return "タップでひつじ +1 🐑\n(連打で増やせます)"; }
  sheepTapped(taps: number) { return `+${taps} 🐑 追加！`; }
  startWithSheep() { return "10 🐑 からスタート"; }
  titleTip() { return "レースで選んだ馬が勝てば配当で増える！"; }
  horseCount(total: number, entrants: number, standby: number) { return `登録 ${total} 頭 / 出走 ${entrants} 頭 / 控え ${standby} 頭`; }
  botsInfo() { return "100体のBOTも一緒に賭けます"; }
  startRaceButton() { return "レースへ →"; }
  yourSheep(sheep: number) { return `所持ひつじ: ${sheep} 🐑`; }
  pickHorseHint() { return "馬を選んで賭けよう"; }
  entrantsInfo(entrants: number, total: number, standby: number) { return `出走 ${entrants} / 登録 ${total} (控え ${standby})`; }
  weatherToday(weather: Weather) { return `本日の馬場: ${weatherJa(weather)} ${weatherEmoji(weather)}`; }
  betTypeMenuTitle() { return "賭け式"; }
  betTypeLabel(type: BetType) {
    switch (type) {
      case BetType.WIN: return "単勝";
      case BetType.PLACE: return "複勝";
      case BetType.TRIFECTA: return "三連単";
    }
  }
  betTypeDescription(type: BetType) {
    switch (type) {
      case BetType.WIN: return "1着を当てる";
      case BetType.PLACE: return "3着以内に入れば的中";
      case BetType.TRIFECTA: return "1〜3着を順番通りに当てる (高配当!)";
    }
  }
  trifectaSelectionHint(selected: number) { return `三連単: ${selected}/3 頭選択中（順番が重要）`; }
  selectedOrderLabel(order: number, horseName: string) { return `${order}着予想: ${horseName}`; }
  betAmount(amount: number) { return `賭けひつじ: ${amount} 🐑`; }
  popularityBonus(bonus: number) { return `人気ボーナス: +${bonus}% 配当`; }
  ifWin(payout: number) { return `的中時: +${payout} 🐑 獲得見込み`; }
  raceButton(amount: number) { return ` ${amount} 🐑 賭けてレース開始！`; }
  selectHorseFirst() { return "馬を選んでください"; }
  speedStamina(speedStars: string, staminaStars: string) { return `スピード ${speedStars} / スタミナ ${staminaStars}`; }
  weatherEffect(weather: Weather, percent: string) { return `${weatherJa(weather)}適性: ${percent}`; }
  popularityAndBonus(popularity: number, bonus: number) { return `人気 ${popularity}% / ボーナス +${bonus}%`; }
  botCount(count: number) { return `BOT ${count} 人`; }
  selectedMark() { return "選択中 ✓"; }
  raceStatus(finished: boolean) { return finished ? "🏁 レース終了！" : "🏇 レース中..."; }
  raceWeather(weather: Weather) { return `馬場: ${weatherJa(weather)} ${weatherEmoji(weather)}`; }
  racingLabel() { return "走行中"; }
  resultTitle(won: boolean) { return won ? "🎉 的中！" : "😢 ハズレ..."; }
  winnerLabel() { return "優勝"; }
  yourBetTitle() { return "あなたの賭け"; }
  conditionLabel() { return "条件"; }
  predictionLabel() { return "予想"; }
  actualTop3Label(top3: string) { return `結果 上位3頭: ${top3}`; }
  totalSheep(sheep: number) { return `現在: ${sheep} 🐑`; }
  payoutSummary(popularity: number, bonus: number, multiplierPercent: number) { return `人気 ${popularity}% / ボーナス +${bonus}% / 配当倍率 +${multiplierPercent}%`; }
  outOfSheep() { return "ひつじがなくなりました..."; }
  finishingOrder() { return "着順"; }
  yourPick() { return "あなたの予想"; }
  raceAgain() { return "もう一度レース"; }
  noSheepLeft() { return "ひつじなし"; }
  startOver() { return "最初から"; }
  courseInfo(course: RaceCourse) { return `コース: ${course.venueJa} ${course.distanceM}m`; }
  courseDetail(course: RaceCourse) { return `${course.nameJa} (${course.venueJa})`; }
  distanceLabel(distanceM: number) { return `${distanceM}m`; }
  ovalTrackLabel() { return "楕円コース"; }
  commentaryLeader(name: string) { return `${name}が先頭に！`; }
  commentarySurge(name: string) { return `${name}がスパート！`; }
  commentaryBreakaway(name: string) { return `${name}が抜け出した！`; }
  commentaryCloseBattle() { return `大接戦！`; }
  commentaryFinish(name: string, rank: number) { return `${name} ゴール！ ${rank}着`; }
  commentaryLap(lap: number, total: number) { return `${lap}/${total}周`; }
  photoFinishLabel() { return `📸 フォトフィニッシュ！`; }
  mutedLabel() { return `🔇 ミュート中`; }
  unmutedLabel() { return `🔊 サウンドON`; }
}

class EnglishStrings implements AppStrings {
  title() { return "🐴 Hevonen"; }
  subtitle() { return "Bet sheep on horse races!"; }
  languageLabel() { return "Language:"; }
  japaneseLabel() { return "日本語"; }
  englishLabel() { return "English"; }
  menuTitle() { return "Menu"; }
  ownedSheep(sheep: number) { return `Sheep: ${sheep} 🐑`; }
  tapAreaHint() { return "Tap for +1 sheep 🐑\n(Tap repeatedly!)"; }
  sheepTapped(taps: number) { return `+${taps} 🐑 added!`; }
  startWithSheep() { return "Start with 10 🐑"; }
  titleTip() { return "Win bet to double popularity-adjusted payout!"; }
  horseCount(total: number, entrants: number, standby: number) { return `${total} horses / ${entrants} runners / ${standby} standby`; }
  botsInfo() { return "100 bots bet every race"; }
  startRaceButton() { return "Go to Race →"; }
  yourSheep(sheep: number) { return `Your sheep: ${sheep} 🐑`; }
  pickHorseHint() { return "Pick a horse to bet on"; }
  entrantsInfo(entrants: number, total: number, standby: number) { return `${entrants} runners / ${total} total (${standby} standby)`; }
  weatherToday(weather: Weather) { return `Track: ${weatherEn(weather)} ${weatherEmoji(weather)}`; }
  betTypeMenuTitle() { return "Bet Type"; }
  betTypeLabel(type: BetType) {
    switch (type) {
      case BetType.WIN: return "WIN";
      case BetType.PLACE: return "PLACE";
      case BetType.TRIFECTA: return "TRIFECTA";
    }
  }
  betTypeDescription(type: BetType) {
    switch (type) {
      case BetType.WIN: return "Pick 1st place";
      case BetType.PLACE: return "Pick top 3";
      case BetType.TRIFECTA: return "Pick 1-2-3 in order (high payout!)";
    }
  }
  trifectaSelectionHint(selected: number) { return `Trifecta: ${selected}/3 selected (order matters)`; }
  selectedOrderLabel(order: number, horseName: string) { return `#${order}: ${horseName}`; }
  betAmount(amount: number) { return `Bet: ${amount} 🐑`; }
  popularityBonus(bonus: number) { return `Popularity bonus: +${bonus}%`; }
  ifWin(payout: number) { return `If win: +${payout} 🐑`; }
  raceButton(amount: number) { return `Bet ${amount} 🐑 & Race!`; }
  selectHorseFirst() { return "Select a horse first"; }
  speedStamina(speedStars: string, staminaStars: string) { return `Speed ${speedStars} / Stamina ${staminaStars}`; }
  weatherEffect(weather: Weather, percent: string) { return `${weatherEn(weather)}: ${percent}`; }
  popularityAndBonus(popularity: number, bonus: number) { return `Popularity ${popularity}% / Bonus +${bonus}%`; }
  botCount(count: number) { return `${count} bots`; }
  selectedMark() { return "Selected ✓"; }
  raceStatus(finished: boolean) { return finished ? "🏁 Finished!" : "🏇 Racing..."; }
  raceWeather(weather: Weather) { return `Weather: ${weatherEn(weather)} ${weatherEmoji(weather)}`; }
  racingLabel() { return "Racing"; }
  resultTitle(won: boolean) { return won ? "🎉 You Win!" : "😢 You Lose..."; }
  winnerLabel() { return "Winner"; }
  yourBetTitle() { return "Your Bet"; }
  conditionLabel() { return "Condition"; }
  predictionLabel() { return "Prediction"; }
  actualTop3Label(top3: string) { return `Top 3: ${top3}`; }
  totalSheep(sheep: number) { return `Total: ${sheep} 🐑`; }
  payoutSummary(popularity: number, bonus: number, multiplierPercent: number) { return `Popularity ${popularity}% / Bonus +${bonus}% / Payout +${multiplierPercent}%`; }
  outOfSheep() { return "Out of sheep..."; }
  finishingOrder() { return "Finishing Order"; }
  yourPick() { return "Your pick"; }
  raceAgain() { return "Race Again"; }
  noSheepLeft() { return "No sheep"; }
  startOver() { return "Start Over"; }
  courseInfo(course: RaceCourse) { return `Course: ${course.venueEn} ${course.distanceM}m`; }
  courseDetail(course: RaceCourse) { return `${course.nameEn} (${course.venueEn})`; }
  distanceLabel(distanceM: number) { return `${distanceM}m`; }
  ovalTrackLabel() { return "Oval Track"; }
  commentaryLeader(name: string) { return `${name} takes the lead!`; }
  commentarySurge(name: string) { return `${name} surges!`; }
  commentaryBreakaway(name: string) { return `${name} breaks away!`; }
  commentaryCloseBattle() { return `It's a close battle!`; }
  commentaryFinish(name: string, rank: number) { return `${name} finishes #${rank}!`; }
  commentaryLap(lap: number, total: number) { return `Lap ${lap}/${total}`; }
  photoFinishLabel() { return `📸 Photo Finish!`; }
  mutedLabel() { return `🔇 Muted`; }
  unmutedLabel() { return `🔊 Sound ON`; }
}

function weatherJa(w: Weather): string {
  switch (w) {
    case Weather.SUNNY: return "晴";
    case Weather.RAINY: return "雨";
    case Weather.WINDY: return "風";
  }
}
function weatherEn(w: Weather): string {
  switch (w) {
    case Weather.SUNNY: return "Sunny";
    case Weather.RAINY: return "Rainy";
    case Weather.WINDY: return "Windy";
  }
}
function weatherEmoji(w: Weather): string {
  switch (w) {
    case Weather.SUNNY: return "☀️";
    case Weather.RAINY: return "🌧️";
    case Weather.WINDY: return "💨";
  }
}

export function stringsFor(language: AppLanguage): AppStrings {
  return language === AppLanguage.JAPANESE ? new JapaneseStrings() : new EnglishStrings();
}
