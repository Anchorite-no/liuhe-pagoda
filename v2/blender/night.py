"""Night on the Qiantang: the lamp burning in the top storey, its light on the river,
a few boats with lanterns steering by it.
Usage: ./run.sh night.py <out.png> [samples] [width] [height]
Optional environment: BORE (x of a tidal bore), CAM ("x,y,z;tx,ty,tz;lens"),
MOON_EL / MOON_ROT (moon height and bearing, degrees), MOON_E (its strength),
MOON_DISC (strength of a visible moon in the sky)."""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out = argv[0] if argv else os.path.join(HERE, "out", "night.png")
samples = int(argv[1]) if len(argv) > 1 else 256
W = int(argv[2]) if len(argv) > 2 else 1600
H = int(argv[3]) if len(argv) > 3 else 1000
EXPO = float(os.environ.get("EXPO", "0.4"))

bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "out", "pagoda.blend"))
from lib import env as E  # noqa: E402
from lib import geom as G  # noqa: E402
from lib import materials as M  # noqa: E402
from lib import studio as S  # noqa: E402
from lib.pagoda import layout  # noqa: E402

scene = bpy.context.scene
S.engine(scene, samples, W, H, exposure=EXPO)
scene.cycles.max_bounces = 10
# clear water: let light through enough surfaces, but skip refracted caustics (fireflies)
scene.cycles.transmission_bounces = 8
scene.cycles.transparent_max_bounces = 16
scene.cycles.volume_bounces = 1
scene.cycles.caustics_refractive = False
scene.cycles.caustics_reflective = False

# ── night sky: deep blue after dusk, faint moonlight ──
world = bpy.data.worlds.new("Night")
scene.world = world
world.use_nodes = True
nt = world.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
outw = nt.nodes.new("ShaderNodeOutputWorld")
bg = nt.nodes.new("ShaderNodeBackground")
sky = nt.nodes.new("ShaderNodeTexSky")
sky.sky_type = "MULTIPLE_SCATTERING"
sky.sun_disc = False
sky.sun_elevation = math.radians(-5.5)
sky.sun_rotation = math.radians(290)
sky.aerosol_density = 2.5
nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = 3.2
nt.links.new(bg.outputs["Background"], outw.inputs["Surface"])
moon = bpy.data.lights.new("Moon", "SUN")
moon.energy = 0.32
moon.color = (0.7, 0.8, 1.0)
moon.angle = math.radians(0.6)
mo = bpy.data.objects.new("Moon", moon)
scene.collection.objects.link(mo)
mo.rotation_euler = (math.radians(50), 0, math.radians(-30))
if os.environ.get("MOON_EL"):
    # same convention as the sun in env.setup_world: bearing clockwise from north
    m_el = math.radians(float(os.environ["MOON_EL"]))
    m_rot = math.radians(float(os.environ.get("MOON_ROT", "160")))
    m_dir = Vector((math.sin(m_rot) * math.cos(m_el), math.cos(m_rot) * math.cos(m_el), math.sin(m_el)))
    mo.rotation_euler = (-m_dir).to_track_quat("-Z", "Y").to_euler()
    if os.environ.get("MOON_E"):
        moon.energy = float(os.environ["MOON_E"])

E.build(scene, trees=True, bore_x=float(os.environ["BORE"]) if os.environ.get("BORE") else None)
# thin river mist so the lamp blooms
hm = bpy.data.materials.new("NightHaze")
hm.use_nodes = True
hn = hm.node_tree
for n in list(hn.nodes):
    hn.nodes.remove(n)
ho = hn.nodes.new("ShaderNodeOutputMaterial")
vol = hn.nodes.new("ShaderNodeVolumePrincipled")
vol.inputs["Color"].default_value = (0.75, 0.8, 0.9, 1)
vol.inputs["Density"].default_value = 0.0012
vol.inputs["Anisotropy"].default_value = 0.65
hn.links.new(vol.outputs["Volume"], ho.inputs["Volume"])
bm = bmesh.new()
G.bm_box(bm, (2400, 2400, 160), (0, -300, 70))
G.obj_from_bmesh(bm, "NightHaze", scene.collection, hm)

# ── the lamp in the top storey ──
tiers, storeys = layout()
top = tiers[12]
lamp_z = top["z0"] + 1.6
glow = bpy.data.materials.new("LampWindow")
glow.use_nodes = True
gn = glow.node_tree
for n in list(gn.nodes):
    gn.nodes.remove(n)
go = gn.nodes.new("ShaderNodeOutputMaterial")
em = gn.nodes.new("ShaderNodeEmission")
em.inputs["Color"].default_value = (1.0, 0.62, 0.26, 1)
em.inputs["Strength"].default_value = 45.0
gn.links.new(em.outputs["Emission"], go.inputs["Surface"])
for name in ("T12_wall",):
    ob = bpy.data.objects.get(name)
    if not ob:
        continue
    for slot in ob.material_slots:
        if slot.material and slot.material.name.startswith("WindowVoid"):
            slot.link = "OBJECT"
            slot.material = glow
pl = bpy.data.lights.new("Lamp", "POINT")
pl.energy = 9000
pl.color = (1.0, 0.66, 0.32)
pl.shadow_soft_size = 1.2
plo = bpy.data.objects.new("Lamp", pl)
scene.collection.objects.link(plo)
plo.location = (0, 0, lamp_z)
# lamplight spilling out of the eight windows onto the eaves above
for k in range(8):
    p = G.oct_point(top["R"] + 0.9, k, 0.5)
    sl = bpy.data.lights.new(f"Spill{k}", "POINT")
    sl.energy = 900
    sl.color = (1.0, 0.64, 0.3)
    sl.shadow_soft_size = 0.8
    so = bpy.data.objects.new(f"Spill{k}", sl)
    scene.collection.objects.link(so)
    so.location = (p.x, p.y, lamp_z - 0.3)

# faint light behind a few lower windows (monks' lamps)
dim = glow.copy()
dim.node_tree.nodes["Emission"].inputs["Strength"].default_value = 1.2
for name in ("T00_wall",):
    ob = bpy.data.objects.get(name)
    if ob:
        for slot in ob.material_slots:
            if slot.material and slot.material.name.startswith("WindowVoid"):
                slot.link = "OBJECT"
                slot.material = dim


# ── boats with lanterns ──
def boat(x, y, heading, scale=1.0):
    """A small covered river boat: tapered hull with an arched mat canopy."""
    bm = bmesh.new()
    L, Wd, Hh = 9.0 * scale, 2.2 * scale, 0.9 * scale
    res = bmesh.ops.create_cube(bm, size=1.0)
    for v in res["verts"]:
        x0, y0, z0 = v.co
        taper = 0.35 if abs(x0) > 0.4 else 1.0
        v.co = Vector((x0 * L, y0 * Wd * taper, z0 * Hh + (0.25 * Hh if abs(x0) > 0.4 and z0 > 0 else 0)))
    hull = G.obj_from_bmesh(bm, "Boat", scene.collection, M.timber_dark())
    bm = bmesh.new()
    prof = [(math.cos(a) * 1.0 * scale, math.sin(a) * 1.0 * scale) for a in [math.pi * i / 10 for i in range(11)]]
    path = [Vector((-2.6 * scale, 0, 0.45 * scale)), Vector((1.2 * scale, 0, 0.45 * scale))]
    G.bm_sweep(bm, path, prof, up_fn=lambda i, p: Vector((0, 0, 1)), closed_profile=False)
    canopy = G.obj_from_bmesh(bm, "Canopy", scene.collection, M.tiles())
    ob = G.join([hull, canopy], "Boat")
    ob.location = (x, y, E.RIVER_Z + 0.25)
    ob.rotation_euler = (0, 0, heading)
    lt = bpy.data.lights.new("Lantern", "POINT")
    lt.energy = 220
    lt.color = (1.0, 0.6, 0.28)
    lt.shadow_soft_size = 0.3
    lo = bpy.data.objects.new("Lantern", lt)
    scene.collection.objects.link(lo)
    lo.location = (x + math.cos(heading) * 3.6 * scale, y + math.sin(heading) * 3.6 * scale, E.RIVER_Z + 2.3 * scale)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.4 * scale)
    lamp = G.obj_from_bmesh(bm, "LanternGlass", scene.collection, glow)
    lamp.location = lo.location


CAM = Vector((-120, -470, 2.5))
fwd = (Vector((0, 0, 0)) - CAM).normalized()
fwd.z = 0
fwd.normalize()
side = Vector((fwd.y, -fwd.x, 0))
for (d, off, hd, sc) in ((190, -26, 25, 1.0), (250, 24, 200, 1.1), (300, -62, 10, 1.2)):
    p = CAM + fwd * d + side * off
    boat(p.x, p.y, math.radians(hd), sc)

# a slightly rougher river stretches the lamplight into long streaks
river = bpy.data.materials.get("River")
if river:
    river.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.09

cam = S.camera(scene)
if os.environ.get("CAM"):
    pos, tgt, lens = os.environ["CAM"].split(";")
    S.aim(cam, [float(v) for v in pos.split(",")], [float(v) for v in tgt.split(",")], float(lens))
else:
    S.aim(cam, CAM, (0, 0, 19), 80)
if os.environ.get("MOON_EL") and os.environ.get("MOON_DISC"):
    # the moon itself, in the moon lamp's direction from the camera (MOON_DISC is its strength)
    E.sky_disc("MoonDisc", mo, cam, 1.0, (0.86, 0.9, 1.0), float(os.environ["MOON_DISC"]))
scene.render.filepath = out
if not os.environ.get("NO_RENDER"):  # clip.py builds the scene this way, then animates it
    bpy.ops.render.render(write_still=True)
print("RENDERED", out)
