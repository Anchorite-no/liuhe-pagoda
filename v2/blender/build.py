"""Build the procedural Liuhe Pagoda and save out/pagoda.blend.
Usage: ./run.sh build.py"""
import os
import sys
import time

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

bpy.ops.wm.read_factory_settings(use_empty=True)

from lib import pagoda as P  # noqa: E402

t0 = time.time()
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
col = bpy.data.collections.new("Pagoda")
scene.collection.children.link(col)
res = P.build(col)

verts = sum(len(o.data.vertices) for o in col.objects if o.type == "MESH")
uniq = {o.data.name: len(o.data.vertices) for o in col.objects if o.type == "MESH"}
print(f"BUILD objects={len(col.objects)} verts(all instances)={verts} unique_mesh_verts={sum(uniq.values())} time={time.time() - t0:.1f}s")
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "out", "pagoda.blend"))
print("SAVED")
