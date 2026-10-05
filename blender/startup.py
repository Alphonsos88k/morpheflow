"""Run by morpheFlow when it launches Blender (`blender --python startup.py`).

1. Makes the recipe library importable.
2. Enables the blender-mcp addon and starts its socket server, so the app can connect.
"""

import os
import sys

import bpy

RECIPES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recipes")
if RECIPES_DIR not in sys.path:
    sys.path.insert(0, RECIPES_DIR)

# Module name depends on how the addon was installed (from addon.py it's "addon").
ADDON_MODULES = ("blender_mcp", "addon")


def _enable_addon() -> bool:
    for name in ADDON_MODULES:
        try:
            bpy.ops.preferences.addon_enable(module=name)
            return True
        except Exception:
            continue
    return False


def _start_server():
    """Runs once Blender's UI is ready; returning None stops the timer."""
    try:
        bpy.ops.blendermcp.start_server()
        print("[morpheFlow] Blender MCP server started.")
    except Exception as err:
        print(f"[morpheFlow] Couldn't auto-start the MCP server ({err}). "
              "Open the N-panel > BlenderMCP tab and click 'Connect'.")
    return None


if _enable_addon():
    bpy.app.timers.register(_start_server, first_interval=1.0)
else:
    print("[morpheFlow] blender-mcp addon not found. Install addon.py via Edit > Preferences > Add-ons.")
