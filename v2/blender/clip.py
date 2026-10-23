"""Short looping clips of the path-traced scenes, so the pictures on the site breathe: the river
moves, cloud shadows drift over the water and the hills, the bore churns and throws spray,
lanterns flicker, and the camera sways a little.
Usage: ./run.sh clip.py <tide|listen|crest|night|nighttide> <outdir> [samples] [width] [height] [first] [last]
The clip is LOOP frames long plus FADE extra frames; tools/loop.py blends the extra frames
into the start so the clip loops without a seam, then encodes it."""
import math
import os
import random
import runpy
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
name = argv[0] if argv else "tide"
outdir = argv[1] if len(argv) > 1 else os.path.join(HERE, "out", "clips", name)
samples = argv[2] if len(argv) > 2 else "48"
W = argv[3] if len(argv) > 3 else "1600"
H = argv[4] if len(argv) > 4 else "1200"
LOOP = 96    # 4 s at 24 fps
FADE = 24
first = int(argv[5]) if len(argv) > 5 else 1
last = int(argv[6]) if len(argv) > 6 else LOOP + FADE

# ── build the scene with the same settings as the stills ──
os.environ["NO_RENDER"] = "1"
# the day shots look into a low morning sun: its disc in the frame, its glitter on the river
day = {"SUN_E": "18", "SUN_DISC": "60", "BLOOM": "0.4", "SAT": "1.12", "HAZE": "0.0001", "AEROSOL": "1.0",
       "SKY": "0.07", "AGX_LOOK": "AgX - Punchy"}
SHOTS = {
    # from above the river west of the pagoda, looking downstream at the bore coming up it
    "tide": dict(day, SUN_EL="8", SUN_ROT="112", EXPO="-0.35", BORE="-165", CAM="-230,-140,26;168,-105,-28;24"),
    # from the gallery of the fifth storey, through the south door, over the gate to the river
    "listen": dict(day, SUN_EL="12", SUN_ROT="186", EXPO="0.0", BORE="110", OPEN_VOIDS="1", CAM="0,-7.3,19.97;25,-220,-14;22"),
    # a long lens on the breaking crest, the low sun behind its spray
    "crest": dict(day, SUN_EL="8", SUN_ROT="112", EXPO="-0.35", BORE="-100", CAM="-215,-150,10;-108,-235,1;70"),
}
NIGHTS = {
    "night": dict(EXPO="0.9"),
    # from the hill above the temple at night: the lamp in the top storey, the moon on the river,
    # the bore coming up it
    "nighttide": dict(EXPO="0.9", BORE="120", MOON_EL="14", MOON_ROT="160", MOON_E="0.5", MOON_DISC="40",
                      CAM="-60,45,45;100,-200,-9;28"),
}
if name in SHOTS:
    os.environ.update(SHOTS[name])
    script, args = "render.py", ["hero", "x.png", samples, W, H]
else:
    os.environ.update(NIGHTS[name])
    script, args = "night.py", ["x.png", samples, W, H]
sys.argv = [sys.argv[0], "--", *args]
sys.path.insert(0, HERE)
runpy.run_path(os.path.join(HERE, script), run_name="__clip__")

from lib import geom as G  # noqa: E402

scene = bpy.context.scene
scene.render.fps = 24
prefs = bpy.context.preferences.edit
prefs.keyframe_new_interpolation_type = "LINEAR"
frames = LOOP + FADE
secs = frames / 24.0

# ── the water moves: every ocean surface advances in time ──
for ob in bpy.data.objects:
    for mod in ob.modifiers:
        if mod.type == "OCEAN":
            t0 = mod.time
            mod.time = t0
            mod.keyframe_insert("time", frame=1)
            mod.time = t0 + secs
            mod.keyframe_insert("time", frame=frames)

# ── the bore churns and throws spray ──
bore = bpy.data.objects.get("TidalBore")
if bore:
    churn = bpy.data.objects.new("ChurnMover", None)
    scene.collection.objects.link(churn)
    for mod in bore.modifiers:
        if mod.type == "DISPLACE":
            mod.texture_coords = "OBJECT"
            mod.texture_coords_object = churn
    churn.location = (0, 0, 0)
    churn.keyframe_insert("location", frame=1)
    churn.location = (6.0, 1.5, -2.0)
    churn.keyframe_insert("location", frame=frames)
spray = bpy.data.materials.get("BoreSpray")
if spray:
    for nd in spray.node_tree.nodes:
        if nd.type == "TEX_NOISE":
            nd.noise_dimensions = "4D"
            nd.inputs["W"].default_value = 0.0
            nd.inputs["W"].keyframe_insert("default_value", frame=1)
            nd.inputs["W"].default_value = 3.0
            nd.inputs["W"].keyframe_insert("default_value", frame=frames)

# ── cloud shadows drifting over the river and the hills (only the sun sees the clouds) ──
if name in SHOTS:
    cm = bpy.data.materials.new("CloudShadow")
    cm.use_nodes = True
    nt = cm.node_tree
    for nd in list(nt.nodes):
        nt.nodes.remove(nd)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    mix = nt.nodes.new("ShaderNodeMixShader")
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    df = nt.nodes.new("ShaderNodeBsdfDiffuse")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 34.0
    nz.inputs["Detail"].default_value = 5.0
    nz.inputs["Roughness"].default_value = 0.55
    nt.links.new(tc.outputs["Generated"], nz.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.interpolation_type = "SMOOTHSTEP"
    ramp.inputs["From Min"].default_value = 0.5
    ramp.inputs["From Max"].default_value = 0.62
    ramp.inputs["To Min"].default_value = 0.0
    ramp.inputs["To Max"].default_value = 0.6  # never fully dark: thin clouds
    nt.links.new(nz.outputs["Fac"], ramp.inputs["Value"])
    nt.links.new(ramp.outputs["Result"], mix.inputs["Fac"])
    nt.links.new(tr.outputs["BSDF"], mix.inputs[1])
    nt.links.new(df.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    import bmesh
    bm = bmesh.new()
    # the sun is low, so a cloud's shadow falls about a kilometre from the cloud: the layer is
    # centred out towards the sun from the part of the river and hill in view
    G.bm_box(bm, (9000, 7000, 0.1), (0, 0, 0))
    clouds = G.obj_from_bmesh(bm, "CloudShadows", scene.collection, cm)
    el = math.radians(float(os.environ["SUN_EL"]))
    rot = math.radians(float(os.environ["SUN_ROT"]))
    reach = (160 + 9) / math.tan(el)
    seen = {"tide": (-20, -160), "listen": (20, -200), "crest": (-110, -230)}[name]
    start = Vector((seen[0] + math.sin(rot) * reach, seen[1] + math.cos(rot) * reach, 160))
    clouds.location = start
    clouds.visible_camera = False
    clouds.visible_diffuse = False
    clouds.visible_glossy = False
    clouds.visible_transmission = False
    clouds.visible_volume_scatter = False
    clouds.keyframe_insert("location", frame=1)
    clouds.location = start + Vector((-90, 25, 0))  # drifting with the wind, up the river
    clouds.keyframe_insert("location", frame=frames)

# ── night: lanterns flicker, boats ride the swell ──
if name in NIGHTS:
    rnd = random.Random(4)
    for ob in bpy.data.objects:
        if ob.type == "LIGHT" and (ob.name.startswith("Lantern") or ob.name.startswith("Lamp") or ob.name.startswith("Spill")):
            e0 = ob.data.energy
            for f in range(1, frames + 1, 3):
                ob.data.energy = e0 * rnd.uniform(0.82, 1.08)
                ob.data.keyframe_insert("energy", frame=f)
    for ob in bpy.data.objects:
        if ob.name.startswith("Boat") or ob.name.startswith("LanternGlass"):
            z0 = ob.location.z
            ph = rnd.uniform(0, 6.28)
            for f in range(1, frames + 1, 4):
                ob.location.z = z0 + 0.18 * math.sin(2 * math.pi * (f - 1) / (LOOP / 2) + ph)
                ob.keyframe_insert("location", index=2, frame=f)

# ── the camera breathes: a slow loop exactly LOOP frames long ──
cam = scene.camera
base = cam.location.copy()
rot = cam.rotation_euler.copy()
amp = {"tide": 0.5, "listen": 0.05, "crest": 0.3, "night": 0.4, "nighttide": 0.3}[name]
for f in range(1, frames + 1, 2):
    a = 2 * math.pi * (f - 1) / LOOP
    cam.location = base + Vector((math.sin(a) * amp, math.cos(a) * amp * 0.4, math.sin(2 * a) * amp * 0.3))
    cam.rotation_euler = (rot.x + math.sin(a + 1.0) * 0.0025, rot.y, rot.z + math.cos(a) * 0.003)
    cam.keyframe_insert("location", frame=f)
    cam.keyframe_insert("rotation_euler", frame=f)

os.makedirs(outdir, exist_ok=True)
scene.frame_start = first
scene.frame_end = last
scene.render.filepath = os.path.join(outdir, "f_")
scene.render.image_settings.file_format = "PNG"
bpy.ops.render.render(animation=True)
print("CLIP DONE", name, outdir)
