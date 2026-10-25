"""Setting for the hero shots: the pagoda on its terrace on Yuelun Hill, wooded slopes
behind and to the sides, the Qiantang River in front (-Y, south), the far bank and its
hills across the water, all softened by river haze."""
import math
import os
import random

import bmesh
import bpy
from mathutils import Vector, noise

from . import geom as G
from . import materials as M

RIVER_Z = -9.0
RIVER_NEAR_Y = -95.0     # the river bank in front of the pagoda
FAR_BANK_Y = -1250.0


def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def terrain_height(x, y):
    n = noise.noise(Vector((x * 0.004, y * 0.004, 0.3)))
    n2 = noise.noise(Vector((x * 0.02, y * 0.02, 1.7)))
    # terrace around the pagoda
    terrace = 1 - smooth(20, 34, math.hypot(x, y * 1.1))
    if y > RIVER_NEAR_Y:
        # Yuelun Hill: rises behind (north) from just behind the terrace; ridge runs east-west
        ridge = 120 * smooth(45, 380, y) * (0.75 + 0.45 * n)
        side = 18 * smooth(70, 260, abs(x)) * smooth(-80, 20, y) * (0.6 + 0.6 * n)
        bank = (RIVER_Z + 3.6) + (-0.05 - RIVER_Z - 3.6) * smooth(RIVER_NEAR_Y + 18, RIVER_NEAR_Y + 70, y)
        h = bank + ridge + side + 2.5 * n2 * smooth(-60, 100, y)
        return h * (1 - terrace) + (-0.05) * terrace
    if y > FAR_BANK_Y:
        return RIVER_Z - 6
    # far bank: low fields then hills
    return RIVER_Z - 6 + 9 * smooth(FAR_BANK_Y, FAR_BANK_Y - 40, y) + 220 * smooth(FAR_BANK_Y - 300, FAR_BANK_Y - 1400, y) * (0.6 + 0.6 * n)


def build_terrain(col, size=3600, res=260, center_y=-500):
    bm = bmesh.new()
    verts = []
    for j in range(res + 1):
        row = []
        y = center_y - size / 2 + size * j / res
        for i in range(res + 1):
            x = -size / 2 + size * i / res
            row.append(bm.verts.new((x, y, terrain_height(x, y))))
        verts.append(row)
    for j in range(res):
        for i in range(res):
            bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
    ob = G.obj_from_bmesh(bm, "Terrain", col, ground_material(), smooth=True)
    return ob


def ground_material():
    m, nt, bsdf = M._new("Ground")
    v = M._coord(nt)
    # under the canopy: dark leaf litter, so gaps between crowns read as shade, not bare ground
    col = M._ramp(nt, M._noise(nt, v, 0.05, 6), [(0.35, M.srgb("#10170c")), (0.6, M.srgb("#1a2312")), (0.85, M.srgb("#262c1a"))])
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.95
    return m


def leaf_material(name, a, b):
    m, nt, bsdf = M._new(name)
    v = M._coord(nt)
    col = M._ramp(nt, M._noise(nt, v, 1.6, 6), [(0.35, M.srgb(a)), (0.75, M.srgb(b))])
    col = M._weather(nt, col, ao_amt=0.8, streak_amt=0.0, grime=(0.25, 0.3, 0.2), ao_dist=1.2)
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.7
    try:
        bsdf.inputs["Subsurface Weight"].default_value = 0.15
    except KeyError:
        pass
    nt.links.new(M._bump(nt, M._noise(nt, v, 9.0, 6), 0.6, 0.15), bsdf.inputs["Normal"])
    return m


def make_tree(name, col, seed, height=12.0, crown=6.0, leaves=None):
    """Broadleaf tree (camphor-like): tapered trunk, a few limbs, and a crown built from many
    small leaf clumps, so the canopy breaks up into light and shade instead of a few blobs."""
    rnd = random.Random(seed)
    Mx = __import__("mathutils").Matrix
    bm = bmesh.new()
    G.bm_cylinder(bm, 0.35, height * 0.55, 8, Mx.Translation((0, 0, height * 0.275)))
    for k in range(4):  # limbs reaching into the crown
        a = k * math.pi / 2 + rnd.uniform(-0.4, 0.4)
        tilt = rnd.uniform(0.5, 0.9)
        m = Mx.Translation((0, 0, height * 0.5)) @ Mx.Rotation(a, 4, "Z") @ Mx.Rotation(tilt, 4, "Y") @ Mx.Translation((0, 0, crown * 0.35))
        G.bm_cylinder(bm, 0.14, crown * 0.7, 6, m)
    trunk = G.obj_from_bmesh(bm, f"{name}_trunk", col, M.timber_dark())
    bm = bmesh.new()
    n = int(70 + crown * 9)
    for _ in range(n):
        # clumps fill an irregular dome, denser and larger towards the middle
        u = rnd.random() ** 0.6
        th = rnd.uniform(0, 2 * math.pi)
        ph = math.acos(rnd.uniform(-0.35, 1.0))
        c = Vector((math.cos(th) * math.sin(ph) * crown * 0.75 * u,
                    math.sin(th) * math.sin(ph) * crown * 0.75 * u,
                    height * 0.62 + math.cos(ph) * crown * 0.55 * u))
        r = crown * rnd.uniform(0.09, 0.2) * (1.15 - 0.4 * u)
        res = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r)
        for v in res["verts"]:
            p = v.co.copy()
            d = (noise.noise(Vector((p.x * 1.4 + seed, p.y * 1.4, p.z * 1.4))) * 0.5 + noise.noise(Vector((p.x * 4.0, p.y * 4.0 + seed, p.z * 4.0))) * 0.22) * r
            v.co = c + p + p.normalized() * d
    canopy = G.obj_from_bmesh(bm, f"{name}_crown", col, leaves, smooth=True)
    return G.join([trunk, canopy], name)


def make_conifer(name, col, seed, height=16.0, width=4.5, leaves=None):
    """A pine / cypress: tiers of ragged needle masses round a straight trunk."""
    rnd = random.Random(seed)
    Mx = __import__("mathutils").Matrix
    bm = bmesh.new()
    G.bm_cylinder(bm, 0.28, height * 0.9, 8, Mx.Translation((0, 0, height * 0.45)))
    trunk = G.obj_from_bmesh(bm, f"{name}_trunk", col, M.timber_dark())
    bm = bmesh.new()
    tiers = 9
    for k in range(tiers):
        f = k / (tiers - 1)
        z = height * (0.3 + 0.68 * f)
        rad = width * (1.0 - 0.8 * f) * rnd.uniform(0.85, 1.1)
        for j in range(7):
            a = j / 7 * 2 * math.pi + rnd.uniform(-0.3, 0.3)
            c = Vector((math.cos(a) * rad * 0.55, math.sin(a) * rad * 0.55, z + rnd.uniform(-0.4, 0.4)))
            r = rad * rnd.uniform(0.35, 0.5)
            res = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r)
            for v in res["verts"]:
                p = v.co.copy()
                p.z *= 0.45
                d = noise.noise(Vector((p.x * 3.0 + seed, p.y * 3.0, p.z * 3.0))) * 0.35 * r
                v.co = c + p + p.normalized() * d
    canopy = G.obj_from_bmesh(bm, f"{name}_crown", col, leaves, smooth=True)
    return G.join([trunk, canopy], name)


def scatter_trees(terrain, col, count=200000, seed=3):
    """Instance trees over the slopes with a particle system (rendered as instances)."""
    proto_col = bpy.data.collections.new("TreeProtos")
    bpy.context.scene.collection.children.link(proto_col)
    from . import trees as TR
    TR.build_prototypes(proto_col, seed)

    # density: slopes only, not the terrace, the river or the road along the bank
    vg = terrain.vertex_groups.new(name="trees")
    for v in terrain.data.vertices:
        x, y, z = v.co
        d = math.hypot(x, y * 1.1)
        w = 0.0
        stair = abs(x) < 7.0 and y < -15
        if y > RIVER_NEAR_Y + 19 and d > 27 and z > -9 and not stair:
            w = 1.0 * smooth(27, 31, d)
            # a real hillside forest is uneven: groves and clearings
            grove = noise.noise(Vector((x * 0.011, y * 0.011, 4.2))) * 0.5 + 0.5
            w *= 0.25 + 0.75 * smooth(0.3, 0.62, grove)
        elif y < FAR_BANK_Y - 60:
            w = 0.6
        if w > 0:
            vg.add([v.index], w, "REPLACE")
    mod = terrain.modifiers.new("trees", "PARTICLE_SYSTEM")
    ps = mod.particle_system
    ps.vertex_group_density = "trees"
    st = ps.settings
    st.type = "HAIR"
    st.count = count
    st.hair_length = 1.0
    st.use_advanced_hair = True
    st.render_type = "COLLECTION"
    st.instance_collection = proto_col
    st.use_collection_pick_random = True
    st.particle_size = 1.35
    st.size_random = 0.35
    st.use_rotations = True
    st.rotation_mode = "GLOB_Z"
    st.phase_factor_random = 2.0
    st.distribution = "RAND"
    st.use_emit_random = True
    ps.seed = seed
    # the prototypes sit at the origin (inside the pagoda); exclude them from the view layer,
    # particle instancing still uses them
    bpy.context.view_layer.layer_collection.children[proto_col.name].exclude = True
    return proto_col


def build_river(col):
    bm = bmesh.new()
    G.bm_box(bm, (5000, abs(FAR_BANK_Y - RIVER_NEAR_Y) + 80, 0.1), ((0, (FAR_BANK_Y + RIVER_NEAR_Y) / 2, RIVER_Z)))
    m, nt, bsdf = M._new("River")
    v = M._coord(nt, "Object", (0.08, 0.6, 1.0))
    bsdf.inputs["Base Color"].default_value = (*M.srgb("#3d3a2a"), 1)
    bsdf.inputs["Roughness"].default_value = 0.035
    bsdf.inputs["IOR"].default_value = 1.33
    nt.links.new(M._bump(nt, M._noise(nt, v, 4.0, 6), 0.12, 0.3), bsdf.inputs["Normal"])
    return G.obj_from_bmesh(bm, "River", col, m)


def setup_world(scene, sun_elev_deg=12, sun_rot_deg=120, strength=0.28, haze=0.0016):
    world = bpy.data.worlds.new("SkyHaze")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    sky = nt.nodes.new("ShaderNodeTexSky")
    sky.sky_type = "MULTIPLE_SCATTERING"
    sky.sun_disc = False
    sky.sun_elevation = math.radians(sun_elev_deg)
    sky.sun_rotation = math.radians(sun_rot_deg)
    sky.aerosol_density = float(os.environ.get("AEROSOL", "3.0"))
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = strength
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])
    if haze > 0:
        # a bounded slab of haze over the valley (a world volume would swallow the sky)
        hm = bpy.data.materials.new("Haze")
        hm.use_nodes = True
        hn = hm.node_tree
        for n in list(hn.nodes):
            hn.nodes.remove(n)
        ho = hn.nodes.new("ShaderNodeOutputMaterial")
        vol = hn.nodes.new("ShaderNodeVolumePrincipled")
        vol.inputs["Color"].default_value = (0.8, 0.82, 0.84, 1)
        vol.inputs["Density"].default_value = haze
        vol.inputs["Anisotropy"].default_value = 0.72  # forward scattering: the air glows round the sun
        hn.links.new(vol.outputs["Volume"], ho.inputs["Volume"])
        bm = bmesh.new()
        G.bm_box(bm, (5000, 5000, 260), (0, -300, 118))
        hz = G.obj_from_bmesh(bm, "HazeVolume", scene.collection, hm)

    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 5.0
    sun.angle = math.radians(1.0)
    sun.color = (1.0, 0.82, 0.62)
    so = bpy.data.objects.new("Sun", sun)
    scene.collection.objects.link(so)
    el = math.radians(sun_elev_deg)
    rot = math.radians(sun_rot_deg)
    # sun direction from the sky node convention (rotation measured from +Y? align by matching)
    d = Vector((math.sin(rot) * math.cos(el), math.cos(rot) * math.cos(el), math.sin(el)))
    so.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    return so


def sky_disc(name, lamp, cam, diameter_deg, color, strength, distance=3000.0):
    """The sun or moon itself, for shots that look towards it: seen by the camera only (the lamp
    already lights the scene and shows in reflections). It rides along with the camera, offset
    along the lamp's direction, so from wherever the camera is it sits exactly where the lamp
    shines from, like a body at infinity, right above its glitter on the river. (Fixed at a point
    in the world it drifted off the glitter by parallax: ~4 degrees from 300 m off the pagoda.)"""
    toward = (lamp.rotation_euler.to_matrix() @ Vector((0, 0, 1))).normalized()
    bpy.ops.mesh.primitive_uv_sphere_add(radius=distance * math.tan(math.radians(diameter_deg / 2)), location=toward * distance)
    disc = bpy.context.active_object
    disc.name = name
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    em = m.node_tree.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*color, 1)
    em.inputs["Strength"].default_value = strength
    m.node_tree.links.new(em.outputs[0], next(n for n in m.node_tree.nodes if n.type == "OUTPUT_MATERIAL").inputs["Surface"])
    disc.data.materials.append(m)
    for vis in ("visible_diffuse", "visible_glossy", "visible_transmission", "visible_volume_scatter", "visible_shadow"):
        setattr(disc, vis, False)
    follow = disc.constraints.new("COPY_LOCATION")
    follow.target = cam
    follow.use_offset = True  # camera position + the offset above, also when the camera moves
    return disc


def build_embankment(col):
    """Stone river wall below the pagoda (the road, walks and railing are in site.py)."""
    bm = bmesh.new()
    y = RIVER_NEAR_Y + 4
    G.bm_box(bm, (5000, 2.0, 4.6), (0, y, RIVER_Z + 1.7))
    return G.obj_from_bmesh(bm, "Embankment", col, M.dark_stone())


def build(scene, trees=True, bore_x=None, fine_water=(-520, 520, -560, RIVER_NEAR_Y + 2)):
    """The whole setting. bore_x: where the tidal bore is crossing the river (None: no bore)."""
    from . import site as S
    from . import water as Wt
    col = bpy.data.collections.new("Environment")
    scene.collection.children.link(col)
    terrain = build_terrain(col)
    Wt.build_water(col, near=fine_water)
    if bore_x is not None:
        Wt.build_bore(col, x=bore_x)
    build_embankment(col)
    S.build(col, terrain_height)
    if trees:
        scatter_trees(terrain, col)
    return col
