<!-- Step 6 Build plan. Vars: scene_spec (JSON), inspiration (list of image readings + user overrides), recipes (list). Includes styles.md. -->
Plan a 3D scene for Blender. The user reads and approves this plan before anything is built, so keep it short and plain.

Scene: {{scene_spec}}
Inspiration (user overrides win over readings): {{inspiration}}
Available recipes: {{recipes}}

Write four short sections:
1. Objects: what gets built, biggest first. Mark which use a recipe.
2. Look: the model look and render choice from the list below, plus rules every object follows (from style references).
3. Lighting & camera.
4. Images: which image drives what.

Prefer recipes over hand-built geometry.

{{> styles}}
