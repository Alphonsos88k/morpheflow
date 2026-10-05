# system_prompts

The instructions the AI gets at each stage. **Edit these to refine how morpheFlow thinks.** No code changes are needed; the server re-reads a file every time it's used.

| File | Used at step | Job |
|---|---|---|
| `clarify.md` | 2 Clarify | Ask 3–5 plain-language questions about a vague idea |
| `enhance_prompt.md` | 3 Enhanced prompt | Turn idea + answers into an image prompt for the target model family |
| `vision_reading.md` | 5 Inspiration board | Read one image and say what it contributes |
| `build_plan.md` | 6 Build plan | Write the short plan the user approves before Blender runs |
| `blender_agent.md` | 7–8 Build / Iterate | Drive Blender through MCP tools and recipes |
| `suggestions.md` | 2 and 8 | Offer 3–5 idea chips (e.g. "kitsune instead of fox?") |
| `comfy_suggestor.md` | 4 ComfyUI (side panel) | Advise on nodes/LoRAs/checkpoints; never installs anything |

## Rules

- `{{name}}` placeholders are filled in by the server. A missing value is an error, so typos surface immediately.
- Lines inside `<!-- -->` are notes for humans and are stripped before sending.
- Keep prompts short: every line is paid for on every call.
- When asking for JSON, show the exact shape. The server validates it.
