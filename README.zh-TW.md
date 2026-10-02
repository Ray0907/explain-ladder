# explain-ladder

用 Karpathy 的解說階梯說明任何主題：文字 → 示意圖 → 互動網頁 → 影片。

[English](README.md)

![STE 解說影片預覽](examples/ste-video/poster.jpg)

## 安裝

```sh
npx skills add Ray0907/explain-ladder -g
```

選擇 Claude Code、pi 或其他支援的代理工具。在已安裝的技能目錄
（通常是 `~/.agents/skills/explain`）安裝一次瀏覽器相依套件：

```sh
cd ~/.agents/skills/explain
pnpm install
```

## 使用方式

```text
/explain 1,4 how HTTP cache works
/explain 2,3 HTTP 快取
```

可以任意組合格式。若沒有指定編號，技能會詢問格式和語言。
格式 1 固定使用英文；格式 2–4 支援繁體中文和英文。
預設輸出位置是 `~/Documents/explainers/<topic-slug>/`；
可用 `EXPLAIN_OUT` 更改輸出根目錄。

| 格式 | 輸出 | 檢查方式 |
|---|---|---|
| 1 · 文字 | ASD-STE100 風格的簡化技術英文與檢查器 | `ste-check` 結束碼為 0 |
| 2 · 示意圖 | 單頁內嵌 SVG／HTML 示意圖 | 淺色／深色截圖、390px、不超出畫面 |
| 3 · 互動網頁 | 可調整的控制項與即時解說 | 核心邏輯範例與瀏覽器檢查 |
| 4 · 影片 | 有旁白的 HTML 動畫、MP4 與封面 | ffprobe 音軌／影像／時長 OK、檢視影格 |

文字檢查器只涵蓋部分規則，不代表完整的 ASD-STE100 認證。
格式 2–3 在工具可用時發布為 Artifact；否則儲存本機 HTML，並註明尚待發布。

## 需求

- Node >= 22；使用 pnpm 安裝相依套件。
- Google Chrome（由 `playwright-core` 操作，用於截圖與影片輸出）。
- 影片：含 `ffprobe` 的 `ffmpeg`，以及一種旁白引擎。
- 預設旁白順序：有 `ELEVENLABS_API_KEY` 時先用 ElevenLabs →
  透過 `uv` 執行免費本機 Kokoro → macOS `say`。
  Kokoro 支援國語與英文；`uv` 使用獨立的 Python 3.12 相依環境，不需全域安裝。
- Kokoro 首次執行需連網，兩種語言共約 721 MB；之後重用
  `${XDG_CACHE_HOME:-$HOME/.cache}/explain-kokoro/` 中的快取。
- 設定 `EXPLAIN_TTS=elevenlabs|kokoro|say` 可指定引擎；失敗時直接停止。
  `ELEVENLABS_VOICE_ID` 可指定 ElevenLabs 的聲音。
- AskUserQuestion／Artifact 工具非必要；其他代理工具可用文字提問，
  並儲存本機 HTML，不直接發布。

## 開發

技能位於 `explain/`；`examples/` 留在儲存庫根目錄，不會隨技能安裝。

```sh
pnpm --dir explain install
node explain/scripts/ste-check.test.mjs
node explain/scripts/checker.test.mjs
node explain/scripts/make-video.test.mjs
```

旁白備援的基本測試需要 macOS `say`。修改儲存庫後，重新執行相同的本機安裝指令，
更新已安裝的副本：

```sh
npx -y skills add /Users/ray/Documents/explain-ladder -g -a claude-code -a pi -y
pnpm --dir ~/.agents/skills/explain install
```

若你的工作目錄不同，請替換儲存庫路徑。安裝副本位於 `~/.agents/skills/explain`；
Claude Code 與 pi 透過符號連結使用同一份技能。

## 致謝

- 解說階梯的構想來自 [Andrej Karpathy 的貼文](https://x.com/karpathy)。
- ASD-STE100 是 ASD 的商標與規範，詳見
  [asd-ste100.org](https://asd-ste100.org/)。本專案與 ASD 無隸屬關係。
- 本機旁白使用 [Kokoro ONNX](https://github.com/thewh1teagle/kokoro-onnx)
  （MIT 授權）；Kokoro 模型採 Apache-2.0 授權，另外下載。

## 授權

[MIT](LICENSE) · Copyright (c) 2026 Ray Tien.
