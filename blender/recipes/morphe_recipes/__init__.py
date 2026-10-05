"""morpheFlow recipe library: tested helpers the Blender agent calls instead of writing raw geometry code."""

import bpy


def _material(name: str, rgba: tuple[float, float, float, float]) -> bpy.types.Material:
    """Returns a simple colored material, reusing it if it already exists."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = rgba
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = rgba
    return mat


def hello_recipe() -> str:
    """Connection test: adds a red cube resting on a ground plane.

    Returns:
        A short description of what was created.
    """
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0))
    plane = bpy.context.active_object
    plane.name = "Ground"
    plane.data.materials.append(_material("Ground_Grey", (0.5, 0.5, 0.5, 1)))

    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.5))
    cube = bpy.context.active_object
    cube.name = "Red_Cube"
    cube.data.materials.append(_material("Cube_Red", (0.8, 0.05, 0.05, 1)))
    return "Added Red_Cube on Ground."
