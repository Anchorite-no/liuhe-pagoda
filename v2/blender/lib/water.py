"""The Qiantang as real water: an ocean-spectrum surface (Blender's Ocean modifier displacing a
graded mesh: fine near the pagoda, coarse far off), murky and reflective, with foam where the
waves break; and the tidal bore (一线潮), a breaking front of foam with raised, churned water
behind it, rolling up the river from the east."""
import math
import random

import bmesh
import bpy
from mathutils import Vector, noise

from . import geom as G
from . import materials as M

RIVER_Z = -9.0
NEAR_Y = -95.0       # the bank below the pagoda
FAR_Y = -1250.0


def water_material():
    """Silt-laden river water you can see into: a clear, glossy surface over a volume that absorbs
    and scatters light the colour of the Qiantang, so thin crests glow when the light comes
    through and deep water stays murky; foam is crisp lace and bubbles, solid at a breaking crest."""
    if "QiantangWater" in bpy.data.materials:
        return bpy.data.materials["QiantangWater"]
    m, nt, bsdf = M._new("QiantangWater")
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    bsdf.inputs["Base Color"].default_value = (0.92, 0.95, 0.9, 1)
    bsdf.inputs["Roughness"].default_value = 0.02
    bsdf.inputs["IOR"].default_value = 1.333
    bsdf.inputs["Transmission Weight"].default_value = 1.0
    v = M._coord(nt, "Object", (1.0, 2.6, 1.0))
    ripples = M._math(nt, "ADD", M._noise(nt, v, 1.6, 4), M._math(nt, "MULTIPLY", M._noise(nt, v, 7.0, 3), 0.45), clamp=False)
    ripples = M._math(nt, "ADD", ripples, M._math(nt, "MULTIPLY", M._noise(nt, M._coord(nt, "Object", (1.0, 1.6, 1.0)), 24.0, 2), 0.22), clamp=False)
    nt.links.new(M._bump(nt, ripples, 0.42, 0.12), bsdf.inputs["Normal"])

    # foam: lace along the edges of cells, bubbles inside them, solid where the wave breaks
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "foam"
    vf = M._coord(nt, "Object", (1.0, 1.0, 1.0))
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.feature = "DISTANCE_TO_EDGE"
    vor.inputs["Scale"].default_value = 1.4
    nt.links.new(vf, vor.inputs["Vector"])
    lace = M._math(nt, "SUBTRACT", 1.0, M._ramp_fac(nt, vor.outputs["Distance"], 0.0, 0.07))
    bub = nt.nodes.new("ShaderNodeTexVoronoi")
    bub.inputs["Scale"].default_value = 9.0
    nt.links.new(vf, bub.inputs["Vector"])
    bubbles = M._math(nt, "SUBTRACT", 1.0, M._ramp_fac(nt, bub.outputs["Distance"], 0.12, 0.2))
    # foam lies in streaks and patches drawn out by the current, never as an even net
    vs = M._coord(nt, "Object", (0.35, 0.09, 1.0))
    patches = M._ramp_fac(nt, M._noise(nt, vs, 1.0, 6), 0.42, 0.62)
    amount = M._math(nt, "MULTIPLY", M._ramp_fac(nt, attr.outputs["Fac"], 0.25, 0.75), patches)
    pattern = M._math(nt, "MAXIMUM", lace, M._math(nt, "MULTIPLY", bubbles, 0.8))
    # the breaking crest: solid, but torn at its edges
    tear = M._noise(nt, M._coord(nt, "Object", (1.0, 1.0, 1.0)), 0.6, 6)
    solid = M._ramp_fac(nt, M._math(nt, "ADD", attr.outputs["Fac"], M._math(nt, "MULTIPLY", tear, 0.3)), 0.82, 1.05)
    foam = M._math(nt, "MAXIMUM", M._math(nt, "MULTIPLY", amount, pattern), solid)
    fb = nt.nodes.new("ShaderNodeBsdfPrincipled")
    # foam is clumped and shaded, not a flat white: brightness and relief from small noise
    fv = M._coord(nt, "Object", (1.0, 1.0, 1.0))
    clump = M._noise(nt, fv, 4.5, 8)
    nt.links.new(M._mixc(nt, clump, M.srgb("#b9b5aa"), M.srgb("#f2f0ea")), fb.inputs["Base Color"])
    nt.links.new(M._bump(nt, clump, 0.7, 0.25), fb.inputs["Normal"])
    fb.inputs["Roughness"].default_value = 0.5
    try:
        fb.inputs["Subsurface Weight"].default_value = 0.3
    except KeyError:
        pass
    ftr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    ftr.inputs["Color"].default_value = (*M.srgb("#efe8d8"), 1)
    fmix = nt.nodes.new("ShaderNodeMixShader")
    fmix.inputs["Fac"].default_value = 0.4
    nt.links.new(fb.outputs["BSDF"], fmix.inputs[1])
    nt.links.new(ftr.outputs["BSDF"], fmix.inputs[2])
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(foam, mix.inputs["Fac"])
    nt.links.new(bsdf.outputs["BSDF"], mix.inputs[1])
    nt.links.new(fmix.outputs["Shader"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

    # the body of the water
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Color"].default_value = (*M.srgb("#958859"), 1)
    vol.inputs["Density"].default_value = 0.35
    vol.inputs["Anisotropy"].default_value = 0.0  # silt scatters light back up, so the river is brown, not black
    vol.inputs["Absorption Color"].default_value = (*M.srgb("#5e5a35"), 1)
    nt.links.new(vol.outputs["Volume"], out.inputs["Volume"])
    return m


def _grid(bm, x0, x1, y0, y1, step, hole=None):
    """A grid of quads, optionally leaving out the cells inside hole = (x0, x1, y0, y1)."""
    nx = max(1, int(round((x1 - x0) / step)))
    ny = max(1, int(round((y1 - y0) / step)))
    verts = {}

    def vert(i, j):
        if (i, j) not in verts:
            verts[(i, j)] = bm.verts.new((x0 + (x1 - x0) * i / nx, y0 + (y1 - y0) * j / ny, 0.0))
        return verts[(i, j)]

    for j in range(ny):
        for i in range(nx):
            if hole:
                cx = x0 + (x1 - x0) * (i + 0.5) / nx
                cy = y0 + (y1 - y0) * (j + 0.5) / ny
                if hole[0] < cx < hole[1] and hole[2] < cy < hole[3]:
                    continue
            bm.faces.new((vert(i, j), vert(i + 1, j), vert(i + 1, j + 1), vert(i, j + 1)))


def _ocean(ob, seed=7, scale=1.0, size=190.0, res=12, wind=6.0, direction=185, foam=True, chop=1.3):
    mod = ob.modifiers.new(f"ocean{seed}", "OCEAN")
    mod.geometry_mode = "DISPLACE"
    mod.spectrum = "PIERSON_MOSKOWITZ"
    mod.resolution = res
    mod.viewport_resolution = 6
    mod.spatial_size = int(size)
    mod.wave_scale = 1.0 * scale
    mod.wave_scale_min = 0.02
    mod.choppiness = chop
    mod.wind_velocity = wind
    mod.wave_alignment = 0.15
    mod.wave_direction = math.radians(direction)   # wind from the east, up the river
    mod.damping = 0.3
    mod.depth = 40.0
    mod.random_seed = seed
    mod.use_normals = True
    mod.use_foam = foam
    if foam:
        mod.foam_layer_name = "foam"
        mod.foam_coverage = 0.5
    mod.time = 3.0
    return mod


def _waves(ob, scale=1.0, depth=6.0, foam=True):
    """Two ocean spectra of very different tile sizes, so no pattern repeats; then thickness,
    so light has water to travel through."""
    _ocean(ob, seed=7, scale=0.7 * scale, size=190, res=12, wind=6.0, direction=185, foam=foam)
    _ocean(ob, seed=3, scale=0.45 * scale, size=47, res=11, wind=5.0, direction=160, foam=False, chop=1.1)
    _ocean(ob, seed=5, scale=0.3 * scale, size=11, res=10, wind=3.0, direction=200, foam=False, chop=1.4)
    sol = ob.modifiers.new("depth", "SOLIDIFY")
    sol.thickness = depth
    sol.offset = -1.0
    sol.use_even_offset = False


def build_water(col, near=(-520, 520, -560, NEAR_Y + 2), fine=0.7, coarse=8.0):
    """The river: a fine patch where the cameras look closely, a medium ring round it, the rest
    coarse; all displaced by the same ocean, so their waves meet without a seam."""
    mat = water_material()
    obs = []
    bm = bmesh.new()
    _grid(bm, near[0], near[1], near[2], near[3], fine)
    ob = G.obj_from_bmesh(bm, "RiverNear", col, mat, smooth=True)
    obs.append(ob)
    # a medium ring out to where the shots look into the sun, so the glitter has waves to sit on
    # (its edges fall on the coarse grid's lines, so there is no gap between them)
    mid = (-1496, 2600, -1094, NEAR_Y + 2)
    bm = bmesh.new()
    _grid(bm, mid[0], mid[1], mid[2], mid[3], 2.0, hole=near)
    obs.append(G.obj_from_bmesh(bm, "RiverMid", col, mat, smooth=True))
    bm = bmesh.new()
    _grid(bm, -2600, 2600, FAR_Y - 20, NEAR_Y + 2, coarse, hole=mid)
    obs.append(G.obj_from_bmesh(bm, "RiverFar", col, mat, smooth=True))
    for o in obs:
        o.location.z = RIVER_Z
        _waves(o)
    return obs


def build_bore(col, x=160.0, height=4.0):
    """The tidal bore crossing the river at x, travelling west (towards -x): a steep breaking
    front, then a long plateau of raised, churning water that slowly settles behind it."""
    mat = water_material()
    # (distance behind the front, height above the river, foam)
    # the face is aerated white water, not a dark wall; the raised water behind fades away slowly
    prof = [(-14, -0.1, 0.0), (-5, -0.04, 0.0), (-2.4, 0.15, 0.1), (-1.5, 0.6, 0.55), (-0.8, 1.3, 0.85), (-0.2, 2.0, 0.95),
            (0.4, 2.5, 1.0), (1.1, 2.65, 1.0), (2.2, 2.45, 1.0), (3.6, 2.1, 0.95), (6, 1.75, 0.8), (10, 1.5, 0.6),
            (18, 1.3, 0.45), (34, 1.15, 0.32), (70, 1.0, 0.2), (130, 0.8, 0.12), (220, 0.45, 0.06), (330, 0.15, 0.02), (420, 0.0, 0.0)]
    def at(d):
        for (d0, h0, f0), (d1, h1, f1) in zip(prof, prof[1:]):
            if d0 <= d <= d1:
                t = (d - d0) / (d1 - d0)
                return (d, h0 + (h1 - h0) * t, f0 + (f1 - f0) * t)
        return (d, 0.0, 0.0)

    # columns: fine through the front, coarser over the raised water behind, so the waves on it
    # are sampled evenly (too few columns stretched them into long stripes)
    cols = [-14 + i for i in range(11)] + [-3 + 0.3 * i for i in range(27)] + [5 + 0.75 * i for i in range(20)] + [20 + 2 * i for i in range(201)]
    rows_prof = [at(d) for d in cols]
    bm = bmesh.new()
    foam_layer = bm.loops.layers.float_color.new("foam")
    y0, y1 = FAR_Y + 4, NEAR_Y - 4
    n = int((y1 - y0) / 1.0)
    rows = []
    crest = []
    for j in range(n + 1):
        y = y0 + (y1 - y0) * j / n
        # the front is not straight: it wanders, leads in mid-river and lags near the banks
        lead = noise.noise(Vector((y * 0.012, 3.1, 0.0))) * 9 + noise.noise(Vector((y * 0.07, 5.3, 0.0))) * 2.5
        lead += 22 * math.sin(math.pi * (y - y0) / (y1 - y0))
        # the front rises and falls along its length: tall where it breaks hard, low where it only swells
        hk = 0.5 + 0.45 * (noise.noise(Vector((y * 0.011, 9.7, 0.0))) * 0.5 + 0.5) + 0.3 * (noise.noise(Vector((y * 0.06, 2.3, 0.0))) * 0.5 + 0.5)
        row = []
        for (d, h, f) in rows_prof:
            px = x - lead + d
            row.append((bm.verts.new((px, y, RIVER_Z + h * hk * (height / 2.6))), f))
        rows.append(row)
        crest.append((x - lead, y, hk * (height / 2.6)))
    for j in range(n):
        for i in range(len(rows_prof) - 1):
            a, b = rows[j][i], rows[j][i + 1]
            c, d = rows[j + 1][i + 1], rows[j + 1][i]
            face = bm.faces.new((a[0], b[0], c[0], d[0]))
            for loop in face.loops:
                f = next(r[1] for r in (a, b, c, d) if r[0] == loop.vert)
                loop[foam_layer] = (f, f, f, 1.0)
    ob = G.obj_from_bmesh(bm, "TidalBore", col, mat, smooth=True)
    # churn: the surface of the bore is broken up, most of all at the crest
    tex = bpy.data.textures.new("BoreChurn", "CLOUDS")
    tex.noise_scale = 2.2
    tex.noise_depth = 4
    sub = ob.modifiers.new("sub", "SUBSURF")
    sub.levels = sub.render_levels = 1
    disp = ob.modifiers.new("churn", "DISPLACE")
    disp.texture = tex
    disp.strength = 1.1
    disp.mid_level = 0.5
    disp.texture_coords = "GLOBAL"
    _waves(ob, scale=1.1, depth=4.0, foam=False)  # keeps its own crest foam; the raised water behind the front is choppier than the river ahead

    # spray hanging over the crest
    sm = bpy.data.materials.new("BoreSpray")
    sm.use_nodes = True
    sn = sm.node_tree
    for nd in list(sn.nodes):
        sn.nodes.remove(nd)
    so = sn.nodes.new("ShaderNodeOutputMaterial")
    sv = sn.nodes.new("ShaderNodeVolumePrincipled")
    sv.inputs["Color"].default_value = (0.95, 0.94, 0.9, 1)
    sv.inputs["Anisotropy"].default_value = 0.6  # spray shines when the sun is behind it
    tc = sn.nodes.new("ShaderNodeTexCoord")
    sep = sn.nodes.new("ShaderNodeSeparateXYZ")
    sn.links.new(tc.outputs["Generated"], sep.inputs[0])
    nz = sn.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 0.7
    nz.inputs["Detail"].default_value = 6.0
    sn.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    # plumes and wisps, clear air between them (not an even fog over the crest)
    wisp = sn.nodes.new("ShaderNodeMapRange")
    wisp.inputs["From Min"].default_value = 0.5
    wisp.inputs["From Max"].default_value = 0.72
    sn.links.new(nz.outputs["Fac"], wisp.inputs["Value"])
    fall = sn.nodes.new("ShaderNodeMath")
    fall.operation = "POWER"
    one_minus = sn.nodes.new("ShaderNodeMath")
    one_minus.operation = "SUBTRACT"
    one_minus.inputs[0].default_value = 1.0
    sn.links.new(sep.outputs["Z"], one_minus.inputs[1])
    sn.links.new(one_minus.outputs[0], fall.inputs[0])
    fall.inputs[1].default_value = 3.0
    dens = sn.nodes.new("ShaderNodeMath")
    dens.operation = "MULTIPLY"
    sn.links.new(fall.outputs[0], dens.inputs[0])
    sn.links.new(wisp.outputs["Result"], dens.inputs[1])
    k = sn.nodes.new("ShaderNodeMath")
    k.operation = "MULTIPLY"
    sn.links.new(dens.outputs[0], k.inputs[0])
    k.inputs[1].default_value = 3.0
    sn.links.new(k.outputs[0], sv.inputs["Density"])
    sn.links.new(sv.outputs["Volume"], so.inputs["Volume"])
    bm = bmesh.new()
    ring = []
    for (cx, cy, k) in crest[::2]:
        cx, cz = cx + 1.0, RIVER_Z + 2.7 * k
        # a box section round the crest: a little ahead of it, mostly over and behind it
        ring.append([bm.verts.new(v) for v in ((cx - 2.0, cy, cz - 2.0), (cx + 5.0, cy, cz - 2.0), (cx + 5.0, cy, cz + 4.5), (cx - 2.0, cy, cz + 4.5))])
    for a, b in zip(ring, ring[1:]):
        for i in range(4):
            bm.faces.new((a[i], a[(i + 1) % 4], b[(i + 1) % 4], b[i]))
    bm.faces.new(ring[0][::-1])
    bm.faces.new(ring[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    G.obj_from_bmesh(bm, "BoreSpray", col, sm)
    _whitewater(col, crest, prof)
    return ob


def _points_modifier(ob, mat, jitter=0.0):
    """Render a mesh's vertices as spheres of the radius stored in its 'radius' attribute;
    jitter: how far (m) they tumble about over time."""
    ng = bpy.data.node_groups.new(f"{ob.name}Points", "GeometryNodeTree")
    ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    gi = ng.nodes.new("NodeGroupInput")
    go = ng.nodes.new("NodeGroupOutput")
    m2p = ng.nodes.new("GeometryNodeMeshToPoints")
    rad = ng.nodes.new("GeometryNodeInputNamedAttribute")
    rad.data_type = "FLOAT"
    rad.inputs["Name"].default_value = "radius"
    sm = ng.nodes.new("GeometryNodeSetMaterial")
    sm.inputs["Material"].default_value = mat
    src = gi.outputs[0]
    if jitter:
        t = ng.nodes.new("GeometryNodeInputSceneTime")
        pos = ng.nodes.new("GeometryNodeInputPosition")
        nz = ng.nodes.new("ShaderNodeTexNoise")
        nz.noise_dimensions = "4D"
        nz.inputs["Scale"].default_value = 0.8
        ng.links.new(pos.outputs["Position"], nz.inputs["Vector"])
        ng.links.new(t.outputs["Seconds"], nz.inputs["W"])
        centre = ng.nodes.new("ShaderNodeVectorMath")
        centre.operation = "SUBTRACT"
        centre.inputs[1].default_value = (0.5, 0.5, 0.5)
        ng.links.new(nz.outputs["Color"], centre.inputs[0])
        amp = ng.nodes.new("ShaderNodeVectorMath")
        amp.operation = "SCALE"
        amp.inputs["Scale"].default_value = jitter
        ng.links.new(centre.outputs["Vector"], amp.inputs[0])
        sp = ng.nodes.new("GeometryNodeSetPosition")
        ng.links.new(src, sp.inputs["Geometry"])
        ng.links.new(amp.outputs["Vector"], sp.inputs["Offset"])
        src = sp.outputs["Geometry"]
    ng.links.new(src, m2p.inputs["Mesh"])
    ng.links.new(rad.outputs["Attribute"], m2p.inputs["Radius"])
    ng.links.new(m2p.outputs["Points"], sm.inputs["Geometry"])
    ng.links.new(sm.outputs["Geometry"], go.inputs[0])
    mod = ob.modifiers.new("points", "NODES")
    mod.node_group = ng


def foam_material():
    """Whitewater: bright, rough, a little light through it, clumped."""
    if "BoreFoam" in bpy.data.materials:
        return bpy.data.materials["BoreFoam"]
    m, nt, bsdf = M._new("BoreFoam")
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    v = M._coord(nt, "Object", (1.0, 1.0, 1.0))
    clump = M._noise(nt, v, 3.0, 8)
    col = M._mixc(nt, clump, M.srgb("#c9c4b6"), M.srgb("#f7f5ef"))
    nt.links.new(col, bsdf.inputs["Base Color"])
    nt.links.new(M._bump(nt, clump, 0.8, 0.3), bsdf.inputs["Normal"])
    bsdf.inputs["Roughness"].default_value = 0.45
    tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    nt.links.new(col, tr.inputs["Color"])
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.5
    nt.links.new(bsdf.outputs["BSDF"], mix.inputs[1])
    nt.links.new(tr.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def _whitewater(col, crest, prof):
    """The broken crest of the bore: clumps of foam tumbling over the front, torn rafts of foam
    left behind it, and droplets thrown up where it breaks hardest."""
    rnd = random.Random(11)

    def h_at(d):
        for (d0, h0, _), (d1, h1, _) in zip(prof, prof[1:]):
            if d0 <= d <= d1:
                return h0 + (h1 - h0) * (d - d0) / (d1 - d0)
        return 0.0

    bm = bmesh.new()
    radius = bm.verts.layers.float.new("radius")

    def add(p, r):
        v = bm.verts.new(p)
        v[radius] = r

    for i, (cx, cy, k) in enumerate(crest):
        # how hard the front is breaking here: in bursts along its length
        burst = max(0.0, noise.noise(Vector((cy * 0.03, 1.7, 0.0))) * 0.8 + noise.noise(Vector((cy * 0.15, 4.1, 0.0))) * 0.4 + 0.45)
        for _ in range(rnd.randint(30, 42)):
            # the roller: clumps tumbling over the crest and spilling down the face, mostly sunk
            # into the water so only their tops break the surface
            d = rnd.triangular(-1.8, 3.5, 0.4)
            r = rnd.uniform(0.07, 0.24) * (0.7 + 0.5 * burst)
            add((cx + d, cy + rnd.uniform(-0.45, 0.45), RIVER_Z + k * h_at(d) + rnd.uniform(-0.25, 0.25)), r)
        for _ in range(int(30 * burst)):
            # droplets: up from the crest and blown back over the raised water
            up = rnd.expovariate(1 / (0.8 + 1.6 * burst))
            d = rnd.uniform(-0.6, 1.8) + up * rnd.uniform(0.2, 1.0)
            add((cx + d, cy + rnd.uniform(-0.45, 0.45), RIVER_Z + k * (h_at(min(d, 3.0)) + 0.2) + up), rnd.uniform(0.025, 0.07))
    ob = G.obj_from_bmesh(bm, "BoreWhitewater", col, None)
    _points_modifier(ob, foam_material(), jitter=0.5)
    return ob
