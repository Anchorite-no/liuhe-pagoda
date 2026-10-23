"""Render the 'take the pagoda apart' sequence as numbered frames.
Usage: ./run.sh anim.py <outdir> [samples] [width] [height] [first] [last]

Story (frames 1..150):
  1-20    the whole pagoda, camera drifts
  20-55   Qing timber tiers float up off the brick body, top tiers first
  55-80   the timber tiers slide right, the Southern Song brick body slides left
  80-100  the seven brick storeys separate
  105-130 a section plane slices the brick body: corridor, inner wall, chamber
  130-150 hold, slow push-in
"""
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
outdir = argv[0] if argv else os.path.join(HERE, "out", "seq", "explode")
samples = int(argv[1]) if len(argv) > 1 else 48
W = int(argv[2]) if len(argv) > 2 else 1600
H = int(argv[3]) if len(argv) > 3 else 1000
first = int(argv[4]) if len(argv) > 4 else 1
last = int(argv[5]) if len(argv) > 5 else 150

bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "out", "pagoda.blend"))
from lib import materials as M  # noqa: E402
from lib import studio as S  # noqa: E402

scene = bpy.context.scene
objs = bpy.data.objects
S.engine(scene, samples, W, H, exposure=-0.75)
S.plain_world(scene, 30, 205, warm=False)
S.sweep(scene)

tiers = sorted([o for o in objs if o.type == "EMPTY" and o.name.startswith("T")], key=lambda o: o.name)
storeys = sorted([o for o in objs if o.type == "EMPTY" and o.name.startswith("S")], key=lambda o: o.name)
finial = objs["Finial"]
podium = objs["Podium"]
DX = 15.5


def key_loc(ob, frame, loc):
    ob.location = Vector(loc)
    ob.keyframe_insert("location", frame=frame)


# ── timber tiers: rise (top first), then slide right ──
for i, t in enumerate(tiers):
    base = t.location.copy()
    lift = 2.5 + i * 1.55
    start = 20 + (12 - i) * 1.6
    key_loc(t, 1, base)
    key_loc(t, int(start), base)
    key_loc(t, int(start) + 16, base + Vector((0, 0, lift)))
    key_loc(t, 55, base + Vector((0, 0, lift)))
    key_loc(t, 80, base + Vector((DX, 0, lift)))
fb = finial.location.copy()
flift = 2.5 + 12 * 1.55 + 2.0
key_loc(finial, 1, fb)
key_loc(finial, 18, fb)
key_loc(finial, 34, fb + Vector((0, 0, flift)))
key_loc(finial, 55, fb + Vector((0, 0, flift)))
key_loc(finial, 80, fb + Vector((DX, 0, flift)))

# ── brick body: slide left, then storeys separate ──
for f, s in enumerate(storeys):
    base = s.location.copy()
    key_loc(s, 1, base)
    key_loc(s, 55, base)
    key_loc(s, 80, base + Vector((-DX, 0, 0)))
    key_loc(s, 100, base + Vector((-DX, 0, f * 0.9)))
pb = podium.location.copy()
key_loc(podium, 55, pb)
key_loc(podium, 80, pb + Vector((-DX, 0, 0)))

# ── section plane slicing the brick body ──
cutmat = M.brick_cut()
bpy.ops.mesh.primitive_cube_add(size=1)
cutter = bpy.context.active_object
cutter.name = "Cutter"
cutter.scale = (200, 200, 400)
cutter.data.materials.append(cutmat)
cutter.hide_render = True
key_loc(cutter, 1, (-DX - 100 - 300, -100, 150))
key_loc(cutter, 105, (-DX - 100 - 300, -100, 150))
key_loc(cutter, 130, (-DX - 100, -100, 150))
for s in storeys:
    for ob in [c for c in objs if c.parent == s and c.type == "MESH"]:
        if cutmat.name not in [m.name for m in ob.data.materials if m]:
            ob.data.materials.append(cutmat)
        mod = ob.modifiers.new("cut", "BOOLEAN")
        mod.operation = "DIFFERENCE"
        mod.solver = "EXACT"
        mod.material_mode = "TRANSFER"
        mod.object = cutter
        # only evaluate the boolean once the blade is near (saves time on earlier frames)
        mod.show_render = False
        mod.keyframe_insert("show_render", frame=1)
        mod.show_render = False
        mod.keyframe_insert("show_render", frame=104)
        mod.show_render = True
        mod.keyframe_insert("show_render", frame=105)
        mod.show_viewport = True

# ── camera on a target empty ──
cam = S.camera(scene)
tgt = bpy.data.objects.new("CamTarget", None)
scene.collection.objects.link(tgt)
con = cam.constraints.new("TRACK_TO")
con.target = tgt
con.track_axis = "TRACK_NEGATIVE_Z"
con.up_axis = "UP_Y"
CAM = [
    (1, (-70, -150, 24), (0, 0, 30), 40),
    (20, (-62, -156, 26), (0, 0, 31), 40),
    (55, (-78, -196, 44), (0, 0, 43), 40),
    (80, (-72, -204, 50), (0, 0, 41), 42),
    (100, (-70, -198, 48), (-3, 0, 39), 43),
    (130, (-64, -98, 46), (-DX, 0, 21), 36),
    (150, (-57, -90, 42), (-DX, 0, 20), 37),
]
for (fr, pos, target, lens) in CAM:
    key_loc(cam, fr, pos)
    key_loc(tgt, fr, target)
    cam.data.lens = lens
    cam.data.keyframe_insert("lens", frame=fr)

scene.frame_start = first
scene.frame_end = last
os.makedirs(outdir, exist_ok=True)
scene.render.filepath = os.path.join(outdir, "f_")
scene.render.image_settings.file_format = "PNG"
scene.render.use_file_extension = True
bpy.ops.render.render(animation=True)
print("ANIM DONE", outdir)
