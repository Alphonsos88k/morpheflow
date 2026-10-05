<!-- Shared look guide. Pulled into build_plan.md and blender_agent.md with {{> styles}}. Add a look here and both prompts see it. Keep each line short: it is sent on every call. Blender 3.1+ (Filmic before 4.0, AGX from 4.0). -->
Looks. Pick from the scene's style (style label/rules, prompt words, style references). Two separate choices that can mix, e.g. low poly + low-res render:

Model look:
- Voxel ("Minecraft-like", "blocky"): build smooth shapes first, then voxelize them (Remesh "Blocks", or the voxelize recipe when available). Finer cubes on faces, hair, beard and wing edges, chunkier on bodies and props. Keep the colors of the smooth source. Thin parts are at least one cube thick.
- Low poly ("low-poly", "faceted", "flat-shaded"): simple primitives, few faces (Decimate if needed), shade flat, one flat color per material from the palette, no textures, soft sun + ambient light.
- PS1 / retro 3D ("PS1", "N64", "retro 3D"): low poly (a few hundred triangles per object), tiny textures (64–128 px) with "Closest" interpolation, simple vertex-color shading, fog/mist for depth.
- Toon / cel ("cartoon", "anime", "cel-shaded"): Eevee, Shader to RGB → Color Ramp (Constant, 2–3 bands), outlines with an inverted hull (Solidify, flipped normals, black backface-culled material) or Freestyle.
- Smooth / detailed (default when no style is given): clean subdivided shapes, Principled BSDF with plain colors, three-point light.
- Realistic ("photo-real", "realistic"): Principled BSDF PBR materials, HDRI world, Cycles with denoise. Slowest and hardest; keep shapes simple and let materials and light do the work.

Render:
- Full resolution (default): 1920×1080, normal filtering.
- Low-res / pixelated ("low-res", "pixel", "PS1"): render small (e.g. 320×240 or 480×270), film filter size 0 for crisp pixels; for a pixel look on a full-size render, use a compositor Pixelate node between Scale down and Scale up. Optional: limit colors to the palette.

If the style is unclear, use Smooth / detailed + Full resolution and say so. Never mix two model looks on one object.
