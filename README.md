# 🐴 Hevonen — Horse Racing Game (TypeScript / Web)

ひつじ (🐑) を賭けて競馬を楽しむ Web ゲーム。Kotlin Multiplatform 版から **TypeScript + React + Vite** に全面書き換え、WEB 専用として再構築しました。

## Game Overview

- 10 🐑 からスタート
- 毎レース、馬を選んでひつじを賭ける
  - **単勝 (WIN)**: 1着を当てる — 基礎配当 2.0×
  - **複勝 (PLACE)**: 3着以内に入れば的中 — 基礎配当 1.55×
  - **三連単 (TRIFECTA)**: 1〜3着を順番通りに当てる — 基礎配当 12.0×（高配当）
- **的中**: `賭け額 × 配当倍率` を獲得（配当倍率は人気に応じてボーナス付与）
- **ハズレ**: 賭け額を失う
- **100体のBOT** も毎レース賭ける — 人気 (popularity) が低い馬ほどボーナスが高くなる
- レース結果は **スピード + スタミナ + 天候適性 + ランダム要素 (surge / stumble / rhythm / raceLuck)** で決まる
- 天候は毎レース変化（☀️ 晴 / 🌧️ 雨 / 💨 風）
- **実在 JRA コース準拠** (1200m–3200m: 中山/東京/京都/阪神) — 距離が毎レース変わる
- **楕円 (オーバル) トラック**: 馬は直線ではなく楕円コースを周回
- **高速シミュレーション** (BASE_ADVANCE_FACTOR 3.6, 4 steps/frame)
- **レスポンシブ Web**: デスクトップ / モバイルどちらでもプレイ可能
- 日本語 / 英語切り替え対応
- ひつじ所持数は `localStorage` に永続化、サウンドは Web Audio で再生

## Horses (20頭、毎レース10頭出走)

| # | Name | Speed | Stamina |
|---|------|-------|---------|
| 1 | Thunder Bolt | 4.8 | ★★★ |
| 2 | Silver Wind | 4.1 | ★★★★ |
| 3 | Golden Star | 3.4 | ★★★★★ |
| 4 | Midnight | 4.6 | ★★★ |
| 5 | Cherry Blossom | 3.0 | ★★★★★ |
| 6 | Ocean Wave | 3.9 | ★★★★ |
| ... | ... | 3.2–4.9 | ★★★–★★★★★ |

全20頭は `src/model/Horse.ts:15` を参照。

## Tech Stack

- **TypeScript 5.6** (strict)
- **React 18** + **Vite 6**
- **HTML Canvas 2D** — 楕円トラック & 馬ポリゴン描画
- **Web Audio API** — 効果音 (RACE_START / FANFARE)
- **localStorage** — ひつじ所持数永続化

## Getting Started

```bash
# 依存関係インストール
npm install

# 開発サーバー (HMR)
npm run dev
# → http://localhost:5173

# 型チェック
npm run lint  # tsc --noEmit

# プロダクションビルド
npm run build
# → dist/ に出力

# プレビュー
npm run preview
# → http://localhost:4173
```

## Project Structure

```
Hevonen/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx                # React エントリ
    ├── styles/index.css        # グローバルスタイル
    ├── model/
    │   ├── Horse.ts            # 馬データ + 選抜ロジック
    │   ├── Weather.ts          # 天候
    │   ├── RaceCourse.ts       # JRAコース (1200-3200m)
    │   ├── BettingLogic.ts     # 賭け式・配当計算
    │   ├── BotPlayerFactory.ts # BOT生成 (100体)
    │   ├── RaceSimulator.ts    # レースシミュレーション
    │   ├── GameState.ts        # ゲーム状態 + Screen enum
    │   └── AppLanguage.ts      # 言語
    ├── storage/
    │   └── SheepCountStorage.ts # localStorage 永続化
    ├── audio/
    │   └── SoundEffect.ts      # Web Audio 効果音
    ├── i18n/
    │   └── strings.ts          # 日英ローカライズ
    └── ui/
        ├── App.tsx             # ルーティング (TITLE/BETTING/RACE/RESULT)
        ├── TitleScreen.tsx
        ├── BettingScreen.tsx
        ├── RaceScreen.tsx      # 楕円トラック Canvas
        ├── ResultScreen.tsx
        └── HorseCanvas.tsx     # 馬ポリゴン Canvas
```

## Game Design — 移植時の対応関係

| 旧 Kotlin (composeApp) | 新 TypeScript (src) |
|---|---|
| `model/Horse.kt` | `model/Horse.ts` |
| `model/Weather.kt` | `model/Weather.ts` |
| `model/RaceCourse.kt` | `model/RaceCourse.ts` |
| `model/BettingLogic.kt` | `model/BettingLogic.ts` |
| `model/BotPlayerFactory.kt` | `model/BotPlayerFactory.ts` |
| `model/RaceSimulator.kt` | `model/RaceSimulator.ts` |
| `model/GameState.kt` | `model/GameState.ts` |
| `model/AppLanguage.kt` | `model/AppLanguage.ts` |
| `storage/SheepCountStorage.kt` | `storage/SheepCountStorage.ts` (localStorage) |
| `audio/SoundEffect.kt` | `audio/SoundEffect.ts` (Web Audio) |
| `ui/Strings.kt` | `i18n/strings.ts` |
| `ui/App.kt` | `ui/App.tsx` |
| `ui/TitleScreen.kt` | `ui/TitleScreen.tsx` |
| `ui/BettingScreen.kt` | `ui/BettingScreen.tsx` |
| `ui/RaceScreen.kt` (Compose Canvas) | `ui/RaceScreen.tsx` (HTML Canvas) |
| `ui/ResultScreen.kt` | `ui/ResultScreen.tsx` |
| `ui/HorseCanvas.kt` | `ui/HorseCanvas.tsx` |
| `wasmJsMain/main.kt` + `index.html` | `main.tsx` + `index.html` (Vite) |

### 主な設計判断
- **Kotlin → TypeScript**: `data class` は `interface`, `enum class` は `enum`, `Color` は CSS hex 文字列に変換
- **Compose Multiplatform → React**: `remember/mutableStateOf/LaunchedEffect` は `useState/useEffect/useRef` に置換
- **Compose Canvas → HTML Canvas 2D**: 楕円トラックは `CanvasRenderingContext2D.ellipse()`, 馬は `drawHorse()` ポリゴンで再現
- **プラットフォーム固有コード削除**: Android / iOS / Wasm ターゲットを廃止し、Web 単一ターゲットに統一
- **ビルド**: Gradle → Vite (高速 HMR, ESM)

## Simulation Constants

`RaceSimulator` は旧実装と同一の定数を使用:

```
BASE_ADVANCE_FACTOR = 3.6
RANDOM_VARIANCE_RANGE = 1.8
STAMINA_DEGRADATION_RATE = 0.0007
MIN_SPEED_RATIO = 0.52
STEP_RHYTHM = 0.92–1.12
RACE_LUCK = 0.86–1.16
SURGE_CHANCE = 4.5% (+3–10)
STUMBLE_CHANCE = 2.5% (×0.78)
```

## License

MIT (旧リポジトリに準拠)
