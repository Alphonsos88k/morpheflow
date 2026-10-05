import type { PickPathRequest, PickPathResponse } from "@morpheflow/spec";
import { api } from "./api.ts";

/** Common Windows dialog filters. Add new ones here for future import/export types. */
export const PATH_FILTERS = {
  all: "All files (*.*)|*.*",
  exe: "Programs (*.exe)|*.exe|All files (*.*)|*.*",
  launcher: "Launchers (*.bat;*.cmd;*.exe)|*.bat;*.cmd;*.exe|All files (*.*)|*.*",
  json: "JSON (*.json)|*.json|All files (*.*)|*.*",
  image: "Images (*.png;*.jpg;*.jpeg;*.webp)|*.png;*.jpg;*.jpeg;*.webp|All files (*.*)|*.*",
  blend: "Blender files (*.blend)|*.blend|All files (*.*)|*.*",
  background:
    "Background images (*.svg;*.png;*.jpg;*.jpeg;*.webp)|*.svg;*.png;*.jpg;*.jpeg;*.webp|All files (*.*)|*.*",
  glb: "glTF binary (*.glb)|*.glb|glTF (*.gltf)|*.gltf|All files (*.*)|*.*",
} as const;

/**
 * Opens the native Windows picker (via our local server) and waits for the user.
 * @param request - "file" (open), "save" (save as), or "folder", plus title/filter/start location.
 * @returns The chosen path, or null if cancelled.
 */
export async function pickPath(
  request: Partial<PickPathRequest> & Pick<PickPathRequest, "kind">,
): Promise<string | null> {
  return (await api.post<PickPathResponse>("/system/pick-path", request)).path;
}
