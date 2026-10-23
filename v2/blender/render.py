"""Render stills of the pagoda.
Usage: ./run.sh render.py <mode> <out.png> [samples] [width] [height]
  hero       the pagoda on Yuelun Hill above the river, morning haze (telephoto)
  hero_wide  the same, wider
  assembled  the tower on a plain ground, late light
  detail     close-up of three tiers
  exploded   studio sweep: Song brick body (7 storeys) beside the lifted Qing timber tiers (13)
  section    studio sweep: lower three storeys cut away to show the double tube
  mech       one stage of the mechanical exploded view (STAGE=0..3), lit like the film
  dawn       first light on the river, mist low on the water
Loads out/pagoda.blend; Cycles + OptiX."""
import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
mode = argv[0] if argv else "assembled"
out = argv[1] if len(argv) > 1 else os.path.join(HERE, "out", f"{mode}.png")
samples = int(argv[2]) if len(argv) > 2 else 96
W = int(argv[3]) if len(argv) > 3 else 1200
H = int(argv[4]) if len(argv) > 4 else 1600

bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "out", "pagoda.blend"))
from lib import materials as M  # noqa: E402
from lib import env as E  # noqa: E402

scene = bpy.context.scene
objs = bpy.data.objects
STUDIO = mode in ("exploded", "section", "tier", "mech")
HERO = mode in ("hero", "hero_wide", "dawn")

# ─────────────────────────── engine ───────────────────────────
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
scene.cycles.device = "GPU"
scene.cycles.samples = samples
scene.cycles.use_denoising = True
scene.cycles.blur_glossy = 0.0  # keep the sun's glitter on the water as sparkles, not a smear
scene.cycles.max_bounces = 8
# clear water: let light through enough surfaces, but skip refracted caustics (fireflies)
scene.cycles.transmission_bounces = 8
scene.cycles.transparent_max_bounces = 16
scene.cycles.volume_bounces = 1
scene.cycles.caustics_refractive = False
scene.cycles.caustics_reflective = False
scene.render.resolution_x = W
scene.render.resolution_y = H
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = "AgX"
try:
    scene.view_settings.look = os.environ.get("AGX_LOOK", "AgX - Medium High Contrast")
except TypeError:
    pass
scene.view_settings.exposure = float(os.environ.get("EXPO", -0.75 if STUDIO else (-0.35 if HERO else -0.45)))
if os.environ.get("BLOOM"):
    comp = bpy.data.node_groups.new("Bloom", "CompositorNodeTree")
    comp.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    rl = comp.nodes.new("CompositorNodeRLayers")
    gl = comp.nodes.new("CompositorNodeGlare")
    gl.inputs["Type"].default_value = "Bloom"
    gl.inputs["Quality"].default_value = "High"
    gl.inputs["Threshold"].default_value = 2.0
    gl.inputs["Strength"].default_value = float(os.environ["BLOOM"])
    gl.inputs["Size"].default_value = 0.6
    go = comp.nodes.new("NodeGroupOutput")
    hs = comp.nodes.new("CompositorNodeHueSat")
    hs.inputs["Saturation"].default_value = float(os.environ.get("SAT", "1.0"))
    comp.links.new(rl.outputs["Image"], gl.inputs["Image"])
    comp.links.new(gl.outputs["Image"], hs.inputs["Image"])
    comp.links.new(hs.outputs["Image"], go.inputs[0])
    scene.compositing_node_group = comp
    scene.render.use_compositing = True


# ─────────────────────────── light & ground ───────────────────────────

def plain_world(sun_elev_deg, sun_rot_deg, strength=0.3, warm=True):
    world = bpy.data.worlds.new("Sky")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    bg = nt.nodes.new("ShaderNodeBackground")
    outw = nt.nodes.new("ShaderNodeOutputWorld")
    sky = nt.nodes.new("ShaderNodeTexSky")
    sky.sky_type = "MULTIPLE_SCATTERING"
    sky.sun_disc = False
    sky.sun_elevation = math.radians(sun_elev_deg)
    sky.sun_rotation = math.radians(sun_rot_deg)
    sky.aerosol_density = 2.0
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = strength
    nt.links.new(bg.outputs["Background"], outw.inputs["Surface"])
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 3.0
    sun.angle = math.radians(1.2)
    sun.color = (1.0, 0.86, 0.7) if warm else (1.0, 0.94, 0.86)
    so = bpy.data.objects.new("Sun", sun)
    scene.collection.objects.link(so)
    el = math.radians(sun_elev_deg)
    so.rotation_euler = (math.pi / 2 - el, 0, math.radians(sun_rot_deg) + math.pi / 2)


def studio_sweep():
    import bmesh as _bm
    gm = bpy.data.materials.new("Sweep")
    gm.use_nodes = True
    gb = gm.node_tree.nodes["Principled BSDF"]
    gb.inputs["Base Color"].default_value = (0.52, 0.5, 0.47, 1)
    gb.inputs["Roughness"].default_value = 0.95
    bm = _bm.new()
    prof = [(-600 + i * 20, 0.0) for i in range(41)]
    for i in range(1, 25):
        a = (i / 24) * (math.pi / 2)
        prof.append((200 + 160 * math.sin(a), 160 - 160 * math.cos(a)))
    prof.append((360, 900))
    rows = [[bm.verts.new((-700, y, z)), bm.verts.new((700, y, z))] for (y, z) in prof]
    for i in range(len(rows) - 1):
        bm.faces.new((rows[i][0], rows[i][1], rows[i + 1][1], rows[i + 1][0]))
    me = bpy.data.meshes.new("Sweep")
    bm.to_mesh(me)
    ob = bpy.data.objects.new("Sweep", me)
    scene.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(gm)


def plain_ground():
    gm = bpy.data.materials.new("Ground")
    gm.use_nodes = True
    gb = gm.node_tree.nodes["Principled BSDF"]
    gb.inputs["Base Color"].default_value = (0.3, 0.29, 0.26, 1)
    gb.inputs["Roughness"].default_value = 0.95
    bpy.ops.mesh.primitive_plane_add(size=4000)
    bpy.context.active_object.data.materials.append(gm)


if mode == "dawn":
    E.setup_world(scene, sun_elev_deg=float(os.environ.get("SUN_EL", "4")), sun_rot_deg=float(os.environ.get("SUN_ROT", "100")),
                  strength=0.32, haze=float(os.environ.get("HAZE", "0.0010")))
    E.build(scene, trees=True, bore_x=float(os.environ["BORE"]) if os.environ.get("BORE") else None)
    if os.environ.get("SUN_DISC"):
        # the sun itself, for shots that look towards it: seen by the camera only (the sun lamp
        # already lights the scene and shows in reflections)
        el = math.radians(float(os.environ.get("SUN_EL", "13")))
        rot = math.radians(float(os.environ.get("SUN_ROT", "125")))
        d = Vector((math.sin(rot) * math.cos(el), math.cos(rot) * math.cos(el), math.sin(el)))
        bpy.ops.mesh.primitive_uv_sphere_add(radius=3000 * math.tan(math.radians(0.45)), location=d * 3000)
        disc = bpy.context.active_object
        disc.name = "SunDisc"
        dm = bpy.data.materials.new("SunDisc")
        dm.use_nodes = True
        em = dm.node_tree.nodes.new("ShaderNodeEmission")
        em.inputs["Color"].default_value = (1.0, 0.86, 0.66, 1)
        em.inputs["Strength"].default_value = float(os.environ["SUN_DISC"])
        dm.node_tree.links.new(em.outputs[0], next(n for n in dm.node_tree.nodes if n.type == "OUTPUT_MATERIAL").inputs["Surface"])
        disc.data.materials.append(dm)
        for vis in ("visible_diffuse", "visible_glossy", "visible_transmission", "visible_volume_scatter", "visible_shadow"):
            setattr(disc, vis, False)
    # mist lying on the water and the foot of the hill
    import bmesh as _bm
    from lib import geom as G
    mm = bpy.data.materials.new("RiverMist")
    mm.use_nodes = True
    mn = mm.node_tree
    for n in list(mn.nodes):
        mn.nodes.remove(n)
    mo = mn.nodes.new("ShaderNodeOutputMaterial")
    mv = mn.nodes.new("ShaderNodeVolumePrincipled")
    mv.inputs["Color"].default_value = (0.92, 0.9, 0.86, 1)
    mv.inputs["Anisotropy"].default_value = 0.55
    mn.links.new(mv.outputs["Volume"], mo.inputs["Volume"])
    # thickest on the water, thinning upward and toward the box's front and back faces
    tc = mn.nodes.new("ShaderNodeTexCoord")
    sep = mn.nodes.new("ShaderNodeSeparateXYZ")
    mn.links.new(tc.outputs["Generated"], sep.inputs[0])

    def op(kind, a, b=None):
        n = mn.nodes.new("ShaderNodeMath")
        n.operation = kind
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, float):
                n.inputs[i].default_value = v
            else:
                mn.links.new(v, n.inputs[i])
        return n.outputs[0]
    up = op("POWER", op("SUBTRACT", 1.0, sep.outputs["Z"]), 2.5)
    across = op("MULTIPLY", op("MULTIPLY", sep.outputs["Y"], op("SUBTRACT", 1.0, sep.outputs["Y"])), 4.0)
    dens = op("MULTIPLY", op("MULTIPLY", up, across), float(os.environ.get("MIST", "0.012")))
    mn.links.new(dens, mv.inputs["Density"])
    bm = _bm.new()
    G.bm_box(bm, (3000, 240, 22), (0, -120, 1.5))
    G.obj_from_bmesh(bm, "RiverMist", scene.collection, mm)
elif HERO:
    # SUN_EL / SUN_ROT override the morning light (e.g. 7 / 235 for a low sun from the south-west)
    E.setup_world(scene, sun_elev_deg=float(os.environ.get("SUN_EL", "13")), sun_rot_deg=float(os.environ.get("SUN_ROT", "125")),
                  strength=float(os.environ.get("SKY", "0.2")), haze=float(os.environ.get("HAZE", "0.0005")))
    if os.environ.get("SUN_E"):
        sun_light = next(o for o in bpy.data.objects if o.type == "LIGHT" and o.data.type == "SUN")
        sun_light.data.energy = float(os.environ["SUN_E"])
        # low sun is orange; above ~15 degrees it is a warm white
        el = float(os.environ.get("SUN_EL", "13"))
        sun_light.data.color = (1.0, 0.68, 0.4) if el < 7 else ((1.0, 0.76, 0.52) if el < 13 else (1.0, 0.84, 0.64))
    E.build(scene, trees=True, bore_x=float(os.environ["BORE"]) if os.environ.get("BORE") else None)
    if os.environ.get("SUN_DISC"):
        # the sun itself, for shots that look towards it: seen by the camera only (the sun lamp
        # already lights the scene and shows in reflections)
        el = math.radians(float(os.environ.get("SUN_EL", "13")))
        rot = math.radians(float(os.environ.get("SUN_ROT", "125")))
        d = Vector((math.sin(rot) * math.cos(el), math.cos(rot) * math.cos(el), math.sin(el)))
        bpy.ops.mesh.primitive_uv_sphere_add(radius=3000 * math.tan(math.radians(0.45)), location=d * 3000)
        disc = bpy.context.active_object
        disc.name = "SunDisc"
        dm = bpy.data.materials.new("SunDisc")
        dm.use_nodes = True
        em = dm.node_tree.nodes.new("ShaderNodeEmission")
        em.inputs["Color"].default_value = (1.0, 0.86, 0.66, 1)
        em.inputs["Strength"].default_value = float(os.environ["SUN_DISC"])
        dm.node_tree.links.new(em.outputs[0], next(n for n in dm.node_tree.nodes if n.type == "OUTPUT_MATERIAL").inputs["Surface"])
        disc.data.materials.append(dm)
        for vis in ("visible_diffuse", "visible_glossy", "visible_transmission", "visible_volume_scatter", "visible_shadow"):
            setattr(disc, vis, False)
elif mode == "mech":
    from lib import studio as S
    S.plain_world(scene, 32, 205, warm=False)
    S.sweep(scene, half_width=3000, depth=1500, back=500, radius=400, top=3000)
elif STUDIO:
    plain_world(28, 205, warm=False)
    studio_sweep()
else:
    plain_world(14, 205, warm=True)
    plain_ground()

# ─────────────────────────── layouts ───────────────────────────
tiers = sorted([o for o in objs if o.type == "EMPTY" and o.name.startswith("T")], key=lambda o: o.name)
storeys = sorted([o for o in objs if o.type == "EMPTY" and o.name.startswith("S")], key=lambda o: o.name)
finial = objs.get("Finial")
podium = objs.get("Podium")


def children(emp):
    return [c for c in objs if c.parent == emp]


def hide(ob, h=True):
    ob.hide_render = h
    for c in children(ob):
        c.hide_render = h


def cut_away_quarter(emps):
    """Real boolean cut of the front-left quarter (x < 0 and y < 0); brick shows on the cut."""
    cutmat = M.brick_cut()
    bpy.ops.mesh.primitive_cube_add(size=1)
    cutter = bpy.context.active_object
    cutter.name = "Cutter"
    cutter.scale = (200, 200, 400)
    cutter.location = (-100, -100, 150)
    cutter.data.materials.append(cutmat)
    cutter.hide_render = True
    for emp in emps:
        for ob in children(emp):
            if ob.type != "MESH":
                continue
            if cutmat.name not in [m.name for m in ob.data.materials if m]:
                ob.data.materials.append(cutmat)
            mod = ob.modifiers.new("cut", "BOOLEAN")
            mod.operation = "DIFFERENCE"
            mod.solver = "EXACT"
            mod.material_mode = "TRANSFER"
            mod.object = cutter
            with bpy.context.temp_override(object=ob, active_object=ob):
                bpy.ops.object.modifier_apply(modifier=mod.name)


if mode == "mech":
    # one stage of the mechanical exploded view: STAGE=0..3 (see lib/explode.py)
    from lib import explode as X
    w = X.timeline(float(os.environ.get("STAGE", "1")))
    for p in X.pieces(objs):
        p.ob.location = p.ob.location + X.offset(p, w)
    if finial:
        finial.location = finial.location + X.finial_offset(w)
elif mode == "exploded":
    dx = 15.5
    for f, st in enumerate(storeys):
        st.location.x -= dx
        st.location.z += f * 0.9
    if podium:
        podium.location.x -= dx
    for i, t in enumerate(tiers):
        t.location.x += dx
        t.location.z += 2.5 + i * 1.55
    if finial:
        finial.location.x += dx
        finial.location.z += 2.5 + 12 * 1.55 + 2.0
elif mode == "section":
    for t in tiers:
        hide(t)
    if finial:
        finial.hide_render = True
    for st in storeys[3:]:
        hide(st)
    bpy.context.view_layer.update()
    cut_away_quarter(storeys[:3])
    for f, st in enumerate(storeys[:3]):
        st.location.z += f * 3.2

# ─────────────────────────── camera ───────────────────────────
cam_data = bpy.data.cameras.new("Cam")
cam = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam_data.clip_end = 6000


def look(pos, target, lens):
    cam.location = Vector(pos)
    cam.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    cam_data.lens = lens


if mode == "dawn":
    a, b, c = os.environ.get("LOOK", "-330,-390,3;0,0,27;95").split(";")
    look(tuple(map(float, a.split(","))), tuple(map(float, b.split(","))), float(c))
elif mode == "hero":
    look((-120, -470, 3), (0, 0, 24), 105)
elif mode == "hero_wide":
    look((-260, -700, 30), (0, 0, 40), 55)
elif mode == "assembled":
    look((-46, -88, 8), (0, 0, 27), 50)
elif mode == "mech":
    if os.environ.get("LOOK"):  # "x,y,z;tx,ty,tz;lens"
        a, b, c = os.environ["LOOK"].split(";")
        look(tuple(map(float, a.split(","))), tuple(map(float, b.split(","))), float(c))
    else:
        look((-118, -200, 46), (0, 0, 41), 44)
elif mode == "exploded":
    if W > H:
        look((-72, -198, 46), (0, 0, 40), 50)
    else:
        look((-55, -165, 62), (0, 0, 36), 62)
elif mode == "section":
    if W > H:
        look((-44, -54, 34), (0, 0, 12.5), 36)
    else:
        look((-40, -50, 40), (0, 0, 12), 42)
elif mode == "detail":
    if W > H:
        look((-17, -24, 7), (0, 0, 12.5), 30)
    else:
        look((-14, -20, 6), (0, 0, 10), 35)

if os.environ.get("OPEN_VOIDS"):
    # look out through the doors and windows: their dark panels become clear
    void = bpy.data.materials.get("WindowVoid")
    if void:
        vnt = void.node_tree
        for n in list(vnt.nodes):
            vnt.nodes.remove(n)
        vo = vnt.nodes.new("ShaderNodeOutputMaterial")
        vt = vnt.nodes.new("ShaderNodeBsdfTransparent")
        vnt.links.new(vt.outputs["BSDF"], vo.inputs["Surface"])
if os.environ.get("CAM") and mode != "dawn":  # "x,y,z;tx,ty,tz;lens" overrides any mode's camera
    a, b, c = os.environ["CAM"].split(";")
    look(tuple(map(float, a.split(","))), tuple(map(float, b.split(","))), float(c))
scene.render.filepath = out
if not os.environ.get("NO_RENDER"):  # clip.py builds the scene this way, then animates it
    bpy.ops.render.render(write_still=True)
print("RENDERED", out)
