"""Export the pagoda for the real-time viewer.
Usage: ./run.sh export.py <out.glb> <meta.json>

- Bevel modifiers are applied with one segment (light-catching edges, modest polycount).
- Bracket sets stay instances (EXT_mesh_gpu_instancing).
- Each brick storey also gets a pre-cut twin (front-left quarter removed, solid cut faces)
  named S{f}_cut, so the viewer can show the section without screen-space tricks.
- meta.json lists tiers / storeys with their heights and radii for the explode animation.
"""
import json
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out_glb = argv[0] if argv else os.path.join(HERE, "out", "pagoda.glb")
out_meta = argv[1] if len(argv) > 1 else os.path.join(HERE, "out", "pagoda.json")

bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "out", "pagoda.blend"))
from lib import materials as M  # noqa: E402
from lib import pagoda as P  # noqa: E402

scene = bpy.context.scene
objs = bpy.data.objects

for ob in objs:
    for mod in ob.modifiers:
        if mod.type == "BEVEL":
            mod.segments = 1

storeys = sorted([o for o in objs if o.type == "EMPTY" and o.name.startswith("S") and not o.name.endswith("_cut")], key=lambda o: o.name)
cutmat = M.brick_cut()
bpy.ops.mesh.primitive_cube_add(size=1)
cutter = bpy.context.active_object
cutter.name = "ExportCutter"
cutter.scale = (200, 200, 400)
cutter.location = (-100, -100, 150)
cutter.data.materials.append(cutmat)
col = bpy.data.collections["Pagoda"]
for s in storeys:
    twin = bpy.data.objects.new(s.name + "_cut", None)
    col.objects.link(twin)
    twin.location = s.location.copy()
    twin["storey"] = s["storey"]
    twin["variant"] = "cut"
    for ob in [c for c in objs if c.parent == s and c.type == "MESH"]:
        dup = ob.copy()
        dup.data = ob.data.copy()
        dup.name = ob.name + "_cut"
        col.objects.link(dup)
        dup.parent = twin
        dup.matrix_parent_inverse = ob.matrix_parent_inverse.copy()
        if cutmat.name not in [m.name for m in dup.data.materials if m]:
            dup.data.materials.append(cutmat)
        mod = dup.modifiers.new("cut", "BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.solver = "EXACT"
        mod.material_mode = "TRANSFER"
        mod.object = cutter
        with bpy.context.temp_override(object=dup, active_object=dup):
            bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cutter, do_unlink=True)

tiers, storey_layout = P.layout()
meta = {
    "units": "metres; y up after export (Blender z)",
    "tiers": [{"name": f"T{t['i']:02d}", "i": t["i"], "z0": t["z0"], "z1": t["z1"], "R": t["R"], "kind": t["kind"]} for t in tiers],
    "storeys": [{"name": f"S{s['f']}", "f": s["f"], "z0": s["z0"], "z1": s["z1"], "R": s["R"]} for s in storey_layout],
}

bpy.ops.export_scene.gltf(
    filepath=out_glb,
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    export_extras=True,
    export_gpu_instances=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
)
with open(out_meta, "w", encoding="utf-8") as fh:
    json.dump(meta, fh, ensure_ascii=False, indent=1)
print("EXPORTED", out_glb, os.path.getsize(out_glb) // 1024, "KB")
