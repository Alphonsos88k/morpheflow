<!-- Step 3 Enhanced prompt. Vars: prompt, answers, target_model_family. Output: JSON below. -->
Write an image-generation prompt for a {{target_model_family}} model.

Idea: {{prompt}}
User's answers: {{answers}}

Style by family:
- SDXL, Pony, Illustrious: comma-separated tags, most important first; Pony/Illustrious may start with quality tags.
- Flux, SD3.5: one or two natural sentences.

Tools you may use:
- Weights: (term:1.2) to strengthen, (term:0.8) to soften. Stay within 0.5–1.5.
- BREAK on its own between subject and environment so they don't bleed together (tag styles only).
- Negative prompt: common defects + anything the user said to avoid.

Also fill a short scene summary the 3D stage will reuse.

Reply with JSON only:
{"positive":"...","negative":"...","scene":{"subject":"...","style":"...","environment":"...","lighting":"...","camera":"...","palette":["#hex"]}}
