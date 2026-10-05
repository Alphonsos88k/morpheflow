import { z } from "zod";

/** Body of POST /api/comfy/generate. */
export const ComfyGenerateRequestSchema = z.object({
  positive: z.string().min(1),
  negative: z.string().default(""),
});
export type ComfyGenerateRequest = z.infer<typeof ComfyGenerateRequestSchema>;

/** Body of POST /api/blender/run. */
export const BlenderRunRequestSchema = z.object({
  prompt: z.string().min(1),
  /** Session the run belongs to; its folder gets the .blend backup. */
  sessionId: z.string().min(1),
});
export type BlenderRunRequest = z.infer<typeof BlenderRunRequestSchema>;

/** Body of POST /api/system/pick-path: open a native dialog on this PC. */
export const PickPathRequestSchema = z.object({
  /** "file" = open existing (import), "save" = save as (export), "folder" = pick a folder. */
  kind: z.enum(["file", "save", "folder"]),
  /** Dialog title. */
  title: z.string().default("Select"),
  /** Windows filter string, e.g. "Programs (*.exe)|*.exe|All files (*.*)|*.*". Files only. */
  filter: z.string().default("All files (*.*)|*.*"),
  /** Where the dialog starts (a file or folder path); may be empty. */
  initialPath: z.string().default(""),
});
export type PickPathRequest = z.infer<typeof PickPathRequestSchema>;
