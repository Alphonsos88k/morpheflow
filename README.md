# morpheFlow

> A local, keyboard-first portal that turns a loose idea into a 3D scene: clarify it, optionally sketch it in ComfyUI, then have an AI agent build it in Blender.

[![Version](https://img.shields.io/github/v/release/Alphonsos88k/morpheflow?label=version)](https://github.com/Alphonsos88k/morpheflow/releases)
[![CI](https://github.com/Alphonsos88k/morpheflow/actions/workflows/ci.yml/badge.svg)](https://github.com/Alphonsos88k/morpheflow/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
![Status](https://img.shields.io/badge/status-alpha-orange)
![Platform](https://img.shields.io/badge/platform-Windows%2011-0078D6)
![Node](https://img.shields.io/badge/node-22%2B-339933)
![Blender](https://img.shields.io/badge/Blender-3.1%2B-F5792A)

*morphe* (Greek *morphē*, "form", said "mor-FAY") + *flow*: your idea, given form, step by step.

**describe it → clarify it → (optional) concept image in ComfyUI → an AI agent builds it in Blender → iterate → (optional) export for three.js and other apps**

Example: `anthro, bipedal, tiger man, minecraft dungeons rendering`

---

## TL;DR

| | |
|---|---|
| **Status** | Alpha. The app runs: prompt, step rail, settings, sessions, ComfyUI and Blender connections. The full idea-to-scene workflow is being built. |
| **Runs on** | Windows 11 desktop browsers (mobile isn't supported) |
| **Start it** | Double-click `start.bat`, then open http://127.0.0.1:5173 |
| **You'll need** | Node.js 22+, Blender 3.1+ with the blender-mcp addon, `uv`, and an AI provider key. ComfyUI is optional. |
| **License** | [AGPL-3.0](LICENSE) |

<br>

---

## Features

What works today, and what's coming next.

<details open>
<summary><b>Feature list</b></summary>

| Area | What it does | Status |
|---|---|---|
| **Prompt** | One box: `Enter` builds, `Shift+Enter` adds a line | ✅ |
| **Step rail** | 9 steps with status markers; jump anywhere, Back / Next skip switched-off steps; collapsible (`Ctrl+B`) | ✅ |
| **Command palette** | `Ctrl+K` lists every action with its shortcut | ✅ |
| **Sessions** | Auto-save (or `Ctrl+S`), saved per session with a `.blend` backup before every AI build | ✅ |
| **AI providers** | Anthropic, OpenAI, Google, OpenRouter, Vercel AI Gateway, Hugging Face; a model per job; live model lists | ✅ |
| **ComfyUI** | Auto-detects your install, launches it, generates concept images from your own workflows | ✅ |
| **Blender** | Connects through blender-mcp; an AI agent builds with a recipe library | ✅ (needs Blender 3.1+) |
| **Setup checks** | Finds Blender and ComfyUI, compares with the newest release, links to official downloads | ✅ |
| **Cost tracking** | Token usage and estimated cost per session | ✅ |
| **Clarify / Enhanced prompt / Build plan** | Questions, model-aware prompts, and a plan you approve | 🚧 next |
| **Voxel kit** | Natural voxel hair, fur, beards, and wings; "bright isometric" look | 🚧 planned |
| **Export** | GLB/glTF for three.js, FBX, OBJ, USD, renders | 🚧 planned |

</details>

<br>

---

## Setup

From download to first run.

<details open>
<summary><b>Install and run</b></summary>

**Windows:** double-click `start.bat`. It installs dependencies on the first run, starts the app, and opens http://127.0.0.1:5173. Close its window to stop the app.

Or manually:

```sh
npm install
npm run dev        # server on 127.0.0.1:5174, web app on http://127.0.0.1:5173
```

Then press `Ctrl+,` (Settings) and fill in:

1. **AI models:** an API key for at least one provider, then Save and Test.
2. **Blender:** usually found automatically. Install the [blender-mcp](https://github.com/ahujasid/blender-mcp) addon in Blender, and [uv](https://docs.astral.sh/uv/) (the MCP server runs via `uvx blender-mcp`).
3. **ComfyUI** (optional): usually found automatically; otherwise point it at your ComfyUI folder.

Settings are saved to `config/settings.local.json`, which is never committed. `config/settings.example.json` shows every option.

</details>

<br>

---

## Using it

Keys, files, and where things are saved.

<details open>
<summary><b>Keys and files</b></summary>

| Key | Action |
|---|---|
| `Ctrl+K` | Command palette |
| `Ctrl+,` | Settings |
| `Ctrl+S` | Save session |
| `Alt+1…9` / `Alt+←` `Alt+→` | Jump to a step / Back, Next |
| `Ctrl+B` | Collapse the step list |
| `Alt+C` | Toggle the ComfyUI step |

| Path | What's there |
|---|---|
| `outputs/<session>/` | Session file, images, `.blend` backups |
| `logs/server.log` | Server log |

</details>

<br>

---

## Customizing

Most changes happen in four places.

<details open>
<summary><b>Where to change what</b></summary>

| Folder | Change it to… |
|---|---|
| `system_prompts/` | Refine the AI's instructions for each step. Edit and save; the next call uses them (see `system_prompts/README.md`). |
| `config/` | Settings (also editable in the app), model lists, ComfyUI workflow templates |
| `constants/` (in `packages/spec/src`, `apps/web/src`, `apps/server/src`) | Defaults, timeouts, keybinds, step list |
| `apps/web/src/assets/patterns/` | Background patterns; drop in your own `.svg` / `.png` and pick it in Settings → General |

</details>

<br>

---

## Development

Scripts and how changes reach `main`.

<details open>
<summary><b>Scripts and pipeline</b></summary>

| Command | Does |
|---|---|
| `npm run dev` | Server + web app with live reload |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript across all packages |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | Production build of the web app |

Every push runs the CI pipeline: **Lint → Typecheck → Test → Build**. Changes reach `main` through pull requests, and each merge publishes a release with a changelog.

</details>

<br>

---

## License

[GNU Affero General Public License v3.0](LICENSE).
