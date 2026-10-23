"""The pagoda taken apart like an engine, then put back together in historical order.
Usage: ./run.sh anim3.py <outdir> [samples] [width] [height] [first] [last]
       FRAMES=1,80,150 ./run.sh anim3.py <outdir> ...    renders only those frames
       ANCHORS=<file.json> ./run.sh anim3.py ...           writes callout anchors, no render

Segments (each played through on its own on the site, 30 fps); see lib/explode.py:
  1-80     the finial lifts, the timber casing opens in two halves
  80-150   seven storey groups part (one brick storey + its two eaves)
  150-240  the lowest group's eaves come apart: floor, wall, brackets, roof
  240-300  a section blade opens the brick body: the double tube
  300-420  reassembly in historical order: Song brick, Yuan finial, Qing timber
"""
import json
import math
import os
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
outdir = argv[0] if argv else os.path.join(HERE, "out", "seq", "mech")
samples = int(argv[1]) if len(argv) > 1 else 40
W = int(argv[2]) if len(argv) > 2 else 1320
H = int(argv[3]) if len(argv) > 3 else 1200
first = int(argv[4]) if len(argv) > 4 else 1
last = int(argv[5]) if len(argv) > 5 else 420
ONLY = [int(f) for f in os.environ.get("FRAMES", "").split(",") if f.strip()]
ANCHORS = os.environ.get("ANCHORS", "")

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
scene.render.motion_blur_shutter = 0.4
scene.render.fps = 30

STAGE = [1, 80, 150, 240, 300]   # rest frames for u = 0, 1, 2, 3, 4
END = 420
finial = objs["Finial"]
pieces = X.pieces(objs)
brick = [p for p in pieces if not p.timber]
rest = {p.ob.name: p.ob.location.copy() for p in pieces}
finial_rest = finial.location.copy()


def u_at(f):
    """Disassembly progress for frames up to the last stage."""
    for k in range(4):
        if f <= STAGE[k + 1]:
            return k + (f - STAGE[k]) / (STAGE[k + 1] - STAGE[k])
    return 4.0


def weights(f):
    """Component weights at frame f: the disassembly timeline, then the historical reassembly:
    the brick settles (Song), the finial lands (Yuan), the timber closes in (Qing)."""
    if f <= STAGE[4]:
        return X.timeline(u_at(f))
    full = X.timeline(4.0)
    brick_down = 1 - X.seg(f, 312, 350)
    cap_down = 1 - X.seg(f, 346, 372)
    timber_down = 1 - X.seg(f, 368, 398)
    timber_close = 1 - X.seg(f, 392, 418)

    def w(comp, p):
        if comp == "cap":
            return full(comp, p) * cap_down
        if comp in ("lift_top", "room_top"):
            return full(comp, p) * cap_down
        if comp == "open":
            return full(comp, p) * timber_close
        k = brick_down if (p is not None and not p.timber) else timber_down
        return full(comp, p) * k
    return w


def sample_frames():
    fr = set(range(1, END + 1, 2)) | set(STAGE) | {END}
    return sorted(fr)


# ── key every piece (linear keys every other frame, so the eased motion is exact) ──
prefs = bpy.context.preferences.edit
prefs.keyframe_new_interpolation_type = "LINEAR"
frames = sample_frames()
plan = {}
for f in frames:
    w = weights(f)
    for p in pieces:
        plan.setdefault(p, []).append((f, rest[p.ob.name] + X.offset(p, w)))
    plan.setdefault("finial", []).append((f, finial_rest + X.finial_offset(w)))
for p, keys in plan.items():
    ob = finial if p == "finial" else p.ob
    for i, (f, loc) in enumerate(keys):
        # a resting piece needs only the keys where it stops and where it starts again
        same_prev = i > 0 and (loc - keys[i - 1][1]).length < 1e-5
        same_next = i < len(keys) - 1 and (loc - keys[i + 1][1]).length < 1e-5
        if same_prev and same_next:
            continue
        ob.location = loc
        ob.keyframe_insert("location", frame=f)
prefs.keyframe_new_interpolation_type = "BEZIER"

# ── camera ──
cam = S.camera(scene)
tgt = bpy.data.objects.new("CamTarget", None)
scene.collection.objects.link(tgt)
con = cam.constraints.new("TRACK_TO")
con.target = tgt
con.track_axis = "TRACK_NEGATIVE_Z"
con.up_axis = "UP_Y"


def key(ob, frame, loc):
    ob.location = Vector(loc)
    ob.keyframe_insert("location", frame=frame)


for (fr, pos, target, lens) in (
    (1, (-122, -122, 58), (0, 0, 30), 60),
    (20, (-124, -116, 62), (0, 0, 31), 58),
    (80, (-150, -105, 96), (0, 0, 34), 50),
    (150, (-164, -115, 106), (0, 0, 42), 48),
    (185, (-140, -98, 92), (0, 0, 28), 48),
    (240, (-98, -69, 62), (0, 0, 16), 50),
    (300, (-70, -49, 52), (0, 0, 17), 44),
    (330, (-110, -77, 74), (0, 0, 24), 46),
    (380, (-150, -112, 84), (0, 0, 32), 52),
    (420, (-122, -122, 58), (0, 0, 30), 60)):
    key(cam, fr, pos)
    key(tgt, fr, target)
    cam.data.lens = lens
    cam.data.keyframe_insert("lens", frame=fr)

# ── callout anchors: where each labelled part is on screen, frame by frame ──
ANCHOR_SPECS = {
    # casing open (the left half faces the camera)
    "timber": [("T06", "wall", 7)],
    "brick": [("S3", "shell", 7)],
    "finial": ["Finial"],
    # seven groups
    "ming": [("T04", "wall", 7)],
    "an": [("T05", "wall", 7)],
    "storey": [("S2", "shell", 7)],
    # one eave in layers
    "roof": [("T01", "roof", 0)],
    "bracket": [("T00", "bracket", 0)],
    "wall": [("T01", "wall", 7)],
    "floor": [("T00", "floor", 7)],
    # double tube (cut faces lie on the planes through sides 6 and 0)
    "shell": [("S0", "shell", 6)],
    "corridor": [("S0", "core", 6), ("S0", "shell", 6)],
    "core": [("S0", "core", 0)],
    "chamber": [("S0", "chamberfloor", -1)],
    # dynasties
    "song": [("S3", "shell", 7)],
    "qing": [("T08", "roof", 7)],
    # the centre line of the drawing
    "axis0": "axis0",
    "axis1": "axis1",
}


def matches(spec):
    out = []
    for p in pieces:
        if p.ob.parent.name == spec[0] and p.part == spec[1] and (spec[2] == -1 or p.face == spec[2]):
            out.append(p.ob)
    return out


def anchor_point(spec):
    if spec == "axis0":
        return Vector((0, 0, 0.7))
    if spec == "axis1":
        return finial.matrix_world.translation + Vector((0, 0, 9))
    pts = []
    for s in spec:
        if s == "Finial":
            pts.append(X.world_center(finial))
        else:
            pts += [X.world_center(o) for o in matches(s)]
    return sum(pts, Vector()) / len(pts)


if ANCHORS:
    data = {"frames": END, "w": W, "h": H, "anchors": {k: [] for k in ANCHOR_SPECS}}
    for f in range(1, END + 1):
        scene.frame_set(f)
        for k, spec in ANCHOR_SPECS.items():
            v = world_to_camera_view(scene, cam, anchor_point(spec))
            data["anchors"][k].append([round(v.x, 4), round(1 - v.y, 4)])
    with open(ANCHORS, "w", encoding="utf-8") as fh:
        json.dump(data, fh, separators=(",", ":"))
    print("ANCHORS", ANCHORS)
    sys.exit(0)

# ── the section blade: removes the quarter toward the camera, then backs out again ──
cutmat = bpy.data.materials.get("BrickCut") or M.brick_cut()
bpy.ops.mesh.primitive_cube_add(size=1)
cutter = bpy.context.active_object
cutter.name = "Cutter"
cutter.scale = (200, 200, 400)
cutter.data.materials.append(cutmat)
cutter.hide_render = True
key(cutter, 1, (-112, -100, 150))
key(cutter, 246, (-112, -100, 150))
key(cutter, 292, (-100, -100, 150))
key(cutter, 304, (-100, -100, 150))
key(cutter, 322, (-112, -100, 150))
for p in brick:
    ob = p.ob
    if cutmat.name not in [m.name for m in ob.data.materials if m]:
        ob.data.materials.append(cutmat)
    mod = ob.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.material_mode = "TRANSFER"
    mod.object = cutter
    for fr, on in ((1, False), (245, False), (246, True), (322, True), (323, False)):
        mod.show_render = on
        mod.keyframe_insert("show_render", frame=fr)

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
