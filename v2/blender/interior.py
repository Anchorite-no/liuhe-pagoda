"""Inside the ground floor: standing in the timber gallery, looking through the cusped
doorways of the outer and inner brick walls into the central chamber, as in the
photographs of the pagoda's interior.
Usage: ./run.sh interior.py <out.png> [samples] [width] [height]"""
import math
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out = argv[0] if argv else os.path.join(HERE, "out", "interior.png")
samples = int(argv[1]) if len(argv) > 1 else 384
W = int(argv[2]) if len(argv) > 2 else 1600
H = int(argv[3]) if len(argv) > 3 else 1500
EXPO = float(os.environ.get("EXPO", "1.2"))

bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "out", "pagoda.blend"))
from lib import geom as G  # noqa: E402
from lib import studio as S  # noqa: E402
from lib.pagoda import layout  # noqa: E402

scene = bpy.context.scene
S.engine(scene, samples, W, H, exposure=EXPO)
scene.cycles.max_bounces = 14
scene.cycles.diffuse_bounces = 8
# late-morning sun from the south, shining through the gallery door behind the camera
S.plain_world(scene, sun_elev_deg=34, sun_rot_deg=200, strength=0.55, warm=True, energy=4.0)
bpy.ops.mesh.primitive_plane_add(size=600)
gm = bpy.data.materials.new("Ground")
gm.use_nodes = True
gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.25, 0.27, 0.2, 1)
bpy.context.active_object.data.materials.append(gm)

# the dark panels behind the timber windows stand in for unlit rooms from outside;
# from inside the windows and doors must actually let the daylight in
void = bpy.data.materials.get("WindowVoid")
if void:
    nt = void.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    o = nt.nodes.new("ShaderNodeOutputMaterial")
    t = nt.nodes.new("ShaderNodeBsdfTransparent")
    nt.links.new(t.outputs["BSDF"], o.inputs["Surface"])

tiers, storeys = layout()
s0 = storeys[0]
z_floor = tiers[0]["z0"] + 0.22          # top of the gallery planks
shell_face = G.apothem(s0["R"])           # outer face of the brick wall on side 0

cam = S.camera(scene)
eye = z_floor + 1.55
S.aim(cam, (0.0, -(shell_face + 1.72), eye), (0.0, 0.0, eye - 0.3), 17)
cam.data.dof.use_dof = True
cam.data.dof.focus_distance = 3.0
cam.data.dof.aperture_fstop = 8.0

scene.render.filepath = out
bpy.ops.render.render(write_still=True)
print("RENDERED", out)
