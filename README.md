# morpheFlow

*morphe* (Greek *morphē*, "form", said "mor-FAY") + *flow*: your idea, given form, step by step.

> **Status: ALPHA / design phase. No runnable code yet.**
>
> **Desktop only.** Built for desktop browsers on Windows 11. Mobile isn't supported or tested.

A local, keyboard-first web portal that turns a loose idea into a 3D scene:

**describe it → clarify it → (optional) concept image in ComfyUI → an LLM agent builds it in Blender through MCP → iterate → (optional) export for three.js / other apps.**

Example: `anthro, bipedal, tiger man, minecraft dungeons rendering`

## Features (planned)

- One prompt box: `Enter` to submit, everything else has a keybind
- **Reinterpret** pop-up: 3–5 quick questions → a clarified, model-aware prompt you can edit
- **ComfyUI** concept images (optional, on by default) using your own local models/workflows
- **Blender MCP** agent builds the scene and refines it with each edit, with suggestions like "kitsune instead of fox?"
- **Export** (optional, off by default): GLB/glTF for three.js, FBX, OBJ, USD, renders
- Anthropic API or OpenRouter, with a model choice per stage
- All ports, paths, and API keys live in Settings (cog wheel), stored locally and never in the browser

## Prerequisites (planned)

- Windows 11 x64
- Node.js 22+ (npm included)
- Blender 3.1 or newer (5.x recommended; the addon needs Python 3.10+) with the [blender-mcp](https://github.com/ahujasid/blender-mcp) addon, plus `uv` for its MCP server
- ComfyUI (portable or Desktop), optional
- An Anthropic API key and/or an OpenRouter API key

## Setup

**Windows:** double-click `start.bat`. It installs dependencies on the first run, starts the app, and opens http://127.0.0.1:5173. Close its window to stop the app.

Or manually:

```sh
npm install
npm run dev        # server on 127.0.0.1:5174, web app on http://127.0.0.1:5173
```

Then open the app, press `Ctrl+,` and fill in:

1. **AI models:** an Anthropic and/or OpenRouter API key → Save → Test.
2. **Blender:** path to `blender.exe`. Install the [blender-mcp](https://github.com/ahujasid/blender-mcp) addon in Blender and install [uv](https://docs.astral.sh/uv/) (the MCP server runs via `uvx blender-mcp`).
3. **ComfyUI** (optional): URL and launch command (e.g. `run_nvidia_gpu.bat` + its folder).

Settings are saved to `config/settings.local.json` (never committed). `config/settings.example.json` shows every option.

Other scripts: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.

**Handy keys:** `Ctrl+K` lists every command, `Ctrl+,` opens Settings, `Ctrl+S` saves the session, `Alt+1…9` / `Alt+←→` move between steps.

Sessions are saved to `outputs/<session>/` (with a `.blend` backup before every AI build); the server log is `logs/server.log`.

## Customizing

Most changes happen in three folders:

- **`system_prompts/`**: the AI's instructions for each step (clarifying questions, image prompts, build plans, the Blender agent). Edit and save; the next call uses them. See `system_prompts/README.md`.
- **`config/`**: your settings (also editable in the app), downloaded model lists, and ComfyUI workflow templates.
- **`constants/`** (in `packages/spec/src`, `apps/web/src`, `apps/server/src`): defaults, timeouts, keybinds, step list.

## Build stages

1. **Skeleton + linkages**: every piece (web app, server, AI, ComfyUI, Blender) connected
2. **Code + app refinement**: solid structure, final look, stable
3. **Bulk of the features**: full workflows, voxel kit, export
4. **Missed features + feedback**: tuning and extras driven by real use

## Versioning

Versions are `MAJOR.MINOR.PATCH` and are set automatically from commit messages when a PR merges into `main`:

| Commit starts with | Bump | Example |
|---|---|---|
| `fix:`, `perf:`, `refactor:` | patch (1.2.**3**) | `fix: close button off-center at 125% scaling` |
| `feat:` | minor (1.**3**.0) | `feat: custom background picker` |
| `feat!:` / `fix!:` or a `BREAKING CHANGE:` footer | major (**2**.0.0) | `feat!: new session file format` |
| `docs:`, `chore:`, `style:`, `test:` | none | `docs: update setup steps` |

Each release gets a changelog entry and downloadable source (`.zip` and `.tar.gz`).
