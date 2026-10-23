"""'The spinning top': the pagoda starts to turn and bursts open as it spins, the Qing timber
flies away, the Southern Song brick body closes up into seven storeys, then a blade cuts it open.
Usage: ./run.sh anim2.py <outdir> [samples] [width] [height] [first] [last]
       FRAMES=1,60,90 ./run.sh anim2.py <outdir> ...   renders only those frames

Segments (each played through on its own on the site, 30 fps):
  1-90     the tower spins up and bursts
  90-150   the timber flies away, the brick body stays open
  150-210  the brick closes up into seven separated storeys, the spin settles
  210-270  a section blade slices the brick body
"""
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
outdir = argv[0] if argv else os.path.join(HERE, "out", "seq", "burst")
samples = int(argv[1]) if len(argv) > 1 else 48
W = int(argv[2]) if len(argv) > 2 else 1320
H = int(argv[3]) if len(argv) > 3 else 1200
first = int(argv[4]) if len(argv) > 4 else 1
last = int(argv[5]) if len(argv) > 5 else 270
ONLY = [int(f) for f in os.environ.get("FRAMES", "").split(",") if f.strip()]

bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "out", "pagoda.blend"))
from lib import explode as X  # noqa: E402
from lib import materials as M  # noqa: E402
from lib import studio as S  # noqa: E402

scene = bpy.context.scene
objs = bpy.data.objects
S.engine(scene, samples, W, H, exposure=-0.75)
S.plain_world(scene, 32, 205, warm=False)
S.sweep(scene, half_width=3000, depth=1500, back=500, radius=400, top=3000)
scene.render.use_motion_blur = True
scene.render.motion_blur_shutter = 0.45
scene.render.fps = 30

tiers = sorted([o for o in objs if o.type == "EMPTY" and o.name.startswith("T")], key=lambda o: o.name)
storeys = sorted([o for o in objs if o.type == "EMPTY" and o.name.startswith("S")], key=lambda o: o.name)
finial = objs["Finial"]
podium = objs["Podium"]

# everything turns around the axis on one empty
spin = bpy.data.objects.new("Spin", None)
scene.collection.objects.link(spin)
for ob in tiers + storeys + [finial, podium]:
    ob.parent = spin
bpy.context.view_layer.update()

pieces = X.pieces(objs)
timber = {p for p in pieces if p.parent.name.startswith("T")}
brick = [p for p in pieces if p not in timber]


def smooth(u):
    u = max(0.0, min(1.0, u))
    return u * u * u * (u * (u * 6 - 15) + 10)


def ease_in(u):
    u = max(0.0, min(1.0, u))
    return u * u


def key_matrix(ob, frame, m):
    loc, rot, _ = m.decompose()
    ob.location = loc
    ob.rotation_euler = rot.to_euler("XYZ")
    ob.keyframe_insert("location", frame=frame)
    ob.keyframe_insert("rotation_euler", frame=frame)


def key(ob, frame, loc):
    ob.location = Vector(loc)
    ob.keyframe_insert("location", frame=frame)


# pieces are sampled every other frame with linear keys, so the pivots stay exact;
# all matrices are worked out at rest before any piece is moved
plan = {}
for p in pieces:
    rest = p.matrix_basis.copy()
    # higher and outer pieces let go a little earlier
    lead = min(14, int((X.world_center(p).z / X.HEIGHT) * 10 + X.RADIAL.get(p["part"], 0) * 0.15))
    s0, s1 = 26 - lead, 80 - lead // 3
    frames = list(range(s0, s1 + 1, 2)) + [s1]
    if p in timber:
        frames += list(range(96, 141, 2))
        hold = (s1, 96)
    else:
        frames += list(range(150, 201, 2))
        hold = (s1, 150)
    keys = [(1, rest)]
    for f in sorted(set(frames)):
        if f <= s1:
            m = X.transform(p, smooth((f - s0) / (s1 - s0)))
        elif p in timber:
            u = ease_in((f - hold[1]) / 44)
            m = X.transform(p, 1.0, timber_scale=1 + 3.2 * u, tilt_scale=1 + 2.0 * u, extra_rise=30 * u)
        else:
            m = X.transform(p, 1.0 - smooth((f - hold[1]) / 50))
        keys.append((f, m @ rest))
    plan[p] = keys

prefs = bpy.context.preferences.edit
prefs.keyframe_new_interpolation_type = "LINEAR"
for p, keys in plan.items():
    p.rotation_mode = "XYZ"
    for f, m in keys:
        key_matrix(p, f, m)
    if p in timber:  # gone once they have flown out of the picture
        p.hide_render = False
        p.keyframe_insert("hide_render", frame=144)
        p.hide_render = True
        p.keyframe_insert("hide_render", frame=145)

prefs.keyframe_new_interpolation_type = "BEZIER"
fb = finial.location.copy()
up = Vector((0, 0, X.HEIGHT * X.RISE + 8))
key(finial, 1, fb)
key(finial, 16, fb)
key(finial, 80, fb + up)
key(finial, 96, fb + up)
key(finial, 140, fb + up + Vector((0, 0, 90)))

# the seven storeys draw apart as the brick closes in
for f, s in enumerate(storeys):
    b = s.location.copy()
    key(s, 1, b)
    key(s, 165, b)
    key(s, 208, b + Vector((0, 0, f * 1.8)))

# the spin: speeds up, holds while bursting, slows to rest (an octagon looks the same every 45°)
TURN = math.radians(450)
rate = [0.0] + [min(1.0, (f - 1) / 34) ** 2 * (1 - smooth((f - 80) / 125)) for f in range(1, 271)]
total = sum(rate)
spin.rotation_mode = "XYZ"
acc = 0.0
prefs.keyframe_new_interpolation_type = "LINEAR"
for f in range(1, 271):
    acc += rate[f]
    spin.rotation_euler = (0, 0, TURN * acc / total)
    spin.keyframe_insert("rotation_euler", frame=f)
prefs.keyframe_new_interpolation_type = "BEZIER"

# the section blade, in world space: removes the quarter toward the camera
cutmat = bpy.data.materials.get("BrickCut") or M.brick_cut()
bpy.ops.mesh.primitive_cube_add(size=1)
cutter = bpy.context.active_object
cutter.name = "Cutter"
cutter.scale = (200, 200, 400)
cutter.data.materials.append(cutmat)
cutter.hide_render = True
key(cutter, 1, (-400, -100, 150))
key(cutter, 214, (-112, -100, 150))
key(cutter, 258, (-100, -100, 150))
for p in brick:
    if cutmat.name not in [m.name for m in p.data.materials if m]:
        p.data.materials.append(cutmat)
    mod = p.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.material_mode = "TRANSFER"
    mod.object = cutter
    mod.show_render = False
    mod.keyframe_insert("show_render", frame=1)
    mod.keyframe_insert("show_render", frame=213)
    mod.show_render = True
    mod.keyframe_insert("show_render", frame=214)

cam = S.camera(scene)
tgt = bpy.data.objects.new("CamTarget", None)
scene.collection.objects.link(tgt)
con = cam.constraints.new("TRACK_TO")
con.target = tgt
con.track_axis = "TRACK_NEGATIVE_Z"
con.up_axis = "UP_Y"
for (fr, pos, target, lens) in (
    (1, (-92, -158, 20), (0, 0, 29), 58),
    (24, (-96, -165, 26), (0, 0, 31), 57),
    (86, (-124, -212, 86), (0, 0, 52), 50),
    (150, (-108, -186, 66), (0, 0, 42), 60),
    (210, (-80, -138, 40), (0, 0, 30), 64),
    (270, (-74, -115, 54), (0, 0, 31), 49),
):
    key(cam, fr, pos)
    key(tgt, fr, target)
    cam.data.lens = lens
    cam.data.keyframe_insert("lens", frame=fr)

os.makedirs(outdir, exist_ok=True)
scene.render.image_settings.file_format = "PNG"
if ONLY:
    for f in ONLY:
        scene.frame_set(f)
        scene.render.filepath = os.path.join(outdir, f"f_{f:04d}.png")
        bpy.ops.render.render(write_still=True)
else:
    scene.frame_start = first
    scene.frame_end = last
    scene.render.filepath = os.path.join(outdir, "f_")
    bpy.ops.render.render(animation=True)
print("ANIM DONE", outdir)
