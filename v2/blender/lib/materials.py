"""Procedural PBR materials (Cycles). Colours follow photographs of the pagoda: weathered
maroon timber, grey tiles with moss, white lime plaster on the Song brick body, dark carved
stone plinths, cast-iron bells. Every surface gets ambient-occlusion grime in its crevices,
and exterior surfaces get rain streaks, so nothing reads as fresh CG."""
import bpy

_cache = {}


# ─────────────────────────── node helpers ───────────────────────────

def _new(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (900, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (600, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return m, nt, bsdf


def _coord(nt, kind="Object", scale=(1.0, 1.0, 1.0)):
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    if isinstance(scale, (int, float)):
        scale = (scale, scale, scale)
    mp.inputs["Scale"].default_value = scale
    nt.links.new(tc.outputs[kind], mp.inputs["Vector"])
    return mp.outputs["Vector"]


def _noise(nt, vec, scale, detail=6.0, rough=0.55):
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    n.inputs["Roughness"].default_value = rough
    nt.links.new(vec, n.inputs["Vector"])
    return n.outputs["Fac"]


def _ramp(nt, fac, stops):
    r = nt.nodes.new("ShaderNodeValToRGB")
    cr = r.color_ramp
    for i, (pos, col) in enumerate(stops):
        if i < 2:
            el = cr.elements[i]
            el.position = pos
        else:
            el = cr.elements.new(pos)
        el.color = (*col, 1.0) if len(col) == 3 else col
    nt.links.new(fac, r.inputs["Fac"])
    return r.outputs["Color"]


def _sock(node, ident):
    for s in node.inputs:
        if s.identifier == ident:
            return s
    raise KeyError(ident)


def _mixc(nt, fac, a, b, blend="MIX"):
    """Colour mix. fac/a/b may be sockets or constants."""
    m = nt.nodes.new("ShaderNodeMix")
    m.data_type = "RGBA"
    m.blend_type = blend
    m.clamp_result = True
    for ident, val in (("Factor_Float", fac), ("A_Color", a), ("B_Color", b)):
        s = _sock(m, ident)
        if hasattr(val, "is_linked") or hasattr(val, "links"):
            nt.links.new(val, s)
        elif isinstance(val, (int, float)):
            s.default_value = val
        else:
            s.default_value = (*val, 1.0) if len(val) == 3 else val
    for o in m.outputs:
        if o.identifier == "Result_Color":
            return o
    return m.outputs[2]


def _math(nt, op, a, b=None, clamp=True):
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = op
    n.use_clamp = clamp
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if hasattr(v, "links") or hasattr(v, "is_linked"):
            nt.links.new(v, n.inputs[i])
        else:
            n.inputs[i].default_value = v
    return n.outputs[0]


def _bump(nt, height, strength=0.3, distance=0.02, normal=None):
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = strength
    b.inputs["Distance"].default_value = distance
    nt.links.new(height, b.inputs["Height"])
    if normal is not None:
        nt.links.new(normal, b.inputs["Normal"])
    return b.outputs["Normal"]


def _ao(nt, distance=0.4):
    n = nt.nodes.new("ShaderNodeAmbientOcclusion")
    n.inputs["Distance"].default_value = distance
    n.samples = 4
    return n.outputs["AO"]


def _ramp_fac(nt, fac, lo, hi):
    """Map fac through a smooth step lo..hi → 0..1 (as a float)."""
    r = nt.nodes.new("ShaderNodeMapRange")
    r.interpolation_type = "SMOOTHSTEP"
    r.inputs["From Min"].default_value = lo
    r.inputs["From Max"].default_value = hi
    nt.links.new(fac, r.inputs["Value"])
    return r.outputs["Result"]


def _weather(nt, col, ao_amt=0.6, streak_amt=0.25, grime=(0.18, 0.15, 0.12), ao_dist=0.5):
    """Darken crevices (AO) and add vertical rain streaks."""
    ao = _ao(nt, ao_dist)
    crev = _math(nt, "MULTIPLY", _math(nt, "SUBTRACT", 1.0, ao), ao_amt)
    v = _coord(nt, "Object", (5.0, 5.0, 0.35))
    streak = _ramp_fac(nt, _noise(nt, v, 2.2, 4, 0.5), 0.52, 0.8)
    streak = _math(nt, "MULTIPLY", streak, streak_amt)
    dirt = _math(nt, "ADD", crev, streak)
    return _mixc(nt, dirt, col, srgb_t(grime), "MULTIPLY")


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def srgb_t(t):
    return t


# ─────────────────────────── materials ───────────────────────────

def tiles():
    if "tiles" in _cache:
        return _cache["tiles"]
    m, nt, bsdf = _new("Tiles")
    v = _coord(nt)
    base = _ramp(nt, _noise(nt, v, 3.0, 5), [(0.35, srgb("#23272a")), (0.6, srgb("#33393b")), (0.85, srgb("#454a49"))])
    # moss and lichen on upward faces
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Normal"], sep.inputs[0])
    up = _ramp_fac(nt, sep.outputs["Z"], 0.4, 0.9)
    moss_n = _ramp_fac(nt, _noise(nt, v, 1.4, 8, 0.6), 0.55, 0.72)
    moss = _math(nt, "MULTIPLY", up, moss_n)
    col = _mixc(nt, _math(nt, "MULTIPLY", moss, 0.75), base, srgb("#3d4a2a"))
    col = _weather(nt, col, ao_amt=0.75, streak_amt=0.15, grime=(0.25, 0.25, 0.24), ao_dist=0.25)
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.68
    nt.links.new(_bump(nt, _noise(nt, v, 45.0, 4), 0.2, 0.01), bsdf.inputs["Normal"])
    _cache["tiles"] = m
    return m


def lacquer(name="Lacquer", base="#4e2219", dark="#371710", light="#5e2b20", streak=0.3):
    """Weathered red-brown paint on timber."""
    if name in _cache:
        return _cache[name]
    m, nt, bsdf = _new(name)
    v = _coord(nt)
    col = _ramp(nt, _noise(nt, v, 2.5, 6), [(0.3, srgb(dark)), (0.55, srgb(base)), (0.8, srgb(light))])
    # sun-faded patches
    fade = _ramp_fac(nt, _noise(nt, v, 0.8, 3), 0.55, 0.75)
    col = _mixc(nt, _math(nt, "MULTIPLY", fade, 0.35), col, srgb("#8a5a48"))
    col = _weather(nt, col, ao_amt=0.7, streak_amt=streak, grime=(0.2, 0.13, 0.1), ao_dist=0.35)
    nt.links.new(col, bsdf.inputs["Base Color"])
    rough = _math(nt, "ADD", _math(nt, "MULTIPLY", _noise(nt, v, 6.0, 3), 0.25), 0.55)
    nt.links.new(rough, bsdf.inputs["Roughness"])
    w = nt.nodes.new("ShaderNodeTexWave")
    w.wave_type = "BANDS"
    w.bands_direction = "Z"
    w.inputs["Scale"].default_value = 7.0
    w.inputs["Distortion"].default_value = 7.0
    w.inputs["Detail"].default_value = 4.0
    nt.links.new(v, w.inputs["Vector"])
    nt.links.new(_bump(nt, w.outputs["Fac"], 0.12, 0.004), bsdf.inputs["Normal"])
    _cache[name] = m
    return m


def timber():
    return lacquer("Timber")


def timber_dark():
    return lacquer("TimberDark", base="#33160f", dark="#22100b", light="#40201a", streak=0.1)


def wall_board():
    """Vertical painted planks: per-plank tone, dark seams, rain streaks running down the boards."""
    if "WallBoard" in _cache:
        return _cache["WallBoard"]
    m, nt, bsdf = _new("WallBoard")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Position"], sep.inputs[0])
    ang = _math(nt, "ARCTAN2", sep.outputs["Y"], sep.outputs["X"], clamp=False)
    rad = _math(nt, "SQRT", _math(nt, "ADD", _math(nt, "MULTIPLY", sep.outputs["X"], sep.outputs["X"], clamp=False),
                                  _math(nt, "MULTIPLY", sep.outputs["Y"], sep.outputs["Y"], clamp=False), clamp=False), clamp=False)
    u = _math(nt, "MULTIPLY", ang, rad, clamp=False)          # arc length around the tower (m)
    w = 0.24                                                  # plank width
    idx = _math(nt, "FLOOR", _math(nt, "DIVIDE", u, w, clamp=False), clamp=False)
    wn = nt.nodes.new("ShaderNodeTexWhiteNoise")
    wn.noise_dimensions = "2D"
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(idx, comb.inputs["X"])
    nt.links.new(comb.outputs[0], wn.inputs["Vector"])
    tone = _ramp(nt, wn.outputs["Value"], [(0.0, srgb("#421a15")), (0.5, srgb("#4c1f18")), (1.0, srgb("#57251c"))])
    # slow fading along each plank so boards never look like tiles
    fade = _ramp_fac(nt, _noise(nt, comb.outputs[0], 0.7, 3), 0.3, 0.7)
    tone = _mixc(nt, _math(nt, "MULTIPLY", fade, 0.3), tone, srgb("#6a3326"))
    frac = _math(nt, "FRACT", _math(nt, "DIVIDE", u, w, clamp=False), clamp=False)
    seam = _math(nt, "SUBTRACT", 1.0, _ramp_fac(nt, _math(nt, "MINIMUM", frac, _math(nt, "SUBTRACT", 1.0, frac)), 0.0, 0.05))
    col = _mixc(nt, _math(nt, "MULTIPLY", seam, 0.85), tone, srgb("#1c0c08"))
    # long vertical streaks
    vs = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(_math(nt, "MULTIPLY", u, 3.0, clamp=False), vs.inputs["X"])
    nt.links.new(_math(nt, "MULTIPLY", sep.outputs["Z"], 0.25, clamp=False), vs.inputs["Y"])
    streak = _ramp_fac(nt, _noise(nt, vs.outputs[0], 2.5, 5, 0.5), 0.45, 0.75)
    col = _mixc(nt, _math(nt, "MULTIPLY", streak, 0.55), col, srgb("#3a1e16"), "MULTIPLY")
    ao = _ao(nt, 0.35)
    col = _mixc(nt, _math(nt, "MULTIPLY", _math(nt, "SUBTRACT", 1.0, ao), 0.7), col, (0.15, 0.1, 0.08), "MULTIPLY")
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.7
    nt.links.new(_bump(nt, _math(nt, "SUBTRACT", 1.0, seam), 0.6, 0.006), bsdf.inputs["Normal"])
    _cache["WallBoard"] = m
    return m


def wood_floor():
    return lacquer("FloorWood", base="#5a3a26", dark="#43291a", light="#6d4630", streak=0.0)


def lattice_dark():
    if "lattice" in _cache:
        return _cache["lattice"]
    m, nt, bsdf = _new("WindowVoid")
    bsdf.inputs["Base Color"].default_value = (*srgb("#0d0908"), 1)
    bsdf.inputs["Roughness"].default_value = 0.95
    _cache["lattice"] = m
    return m


def plaster_aged():
    """White lime plaster over the Song brick, greyed by damp and time."""
    if "plaster_aged" in _cache:
        return _cache["plaster_aged"]
    m, nt, bsdf = _new("PlasterAged")
    v = _coord(nt)
    col = _ramp(nt, _noise(nt, v, 0.5, 4, 0.45), [(0.3, srgb("#bfb8a8")), (0.7, srgb("#d4cec0"))])
    # blotches of damp
    damp = _ramp_fac(nt, _noise(nt, v, 1.2, 6, 0.6), 0.55, 0.75)
    col = _mixc(nt, _math(nt, "MULTIPLY", damp, 0.35), col, srgb("#948d7f"))
    # hairline cracks
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.feature = "DISTANCE_TO_EDGE"
    vor.inputs["Scale"].default_value = 1.6
    nt.links.new(v, vor.inputs["Vector"])
    crack = _math(nt, "SUBTRACT", 1.0, _ramp_fac(nt, vor.outputs["Distance"], 0.0, 0.012))
    crack = _math(nt, "MULTIPLY", crack, _ramp_fac(nt, _noise(nt, v, 3.0, 2), 0.55, 0.7))
    col = _mixc(nt, _math(nt, "MULTIPLY", crack, 0.22), col, srgb("#857e70"))
    col = _weather(nt, col, ao_amt=0.9, streak_amt=0.3, grime=(0.42, 0.39, 0.34), ao_dist=0.8)
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.93
    nt.links.new(_bump(nt, _noise(nt, v, 14.0, 6), 0.18, 0.01), bsdf.inputs["Normal"])
    _cache["plaster_aged"] = m
    return m


def stone():
    """Grey stone paving: large flags on horizontal faces."""
    if "stone" in _cache:
        return _cache["stone"]
    m, nt, bsdf = _new("Stone")
    v = _coord(nt)
    b = nt.nodes.new("ShaderNodeTexBrick")
    b.offset = 0.5
    b.inputs["Scale"].default_value = 1.0
    b.inputs["Brick Width"].default_value = 0.9
    b.inputs["Row Height"].default_value = 0.6
    b.inputs["Mortar Size"].default_value = 0.012
    nt.links.new(v, b.inputs["Vector"])
    var = _ramp(nt, _noise(nt, v, 2.0, 8), [(0.3, srgb("#6f716c")), (0.75, srgb("#9a9b94"))])
    nt.links.new(var, b.inputs["Color1"])
    b.inputs["Color2"].default_value = (*srgb("#85867f"), 1)
    b.inputs["Mortar"].default_value = (*srgb("#4b4c48"), 1)
    col = _weather(nt, b.outputs["Color"], ao_amt=0.7, streak_amt=0.0, grime=(0.3, 0.3, 0.28), ao_dist=0.5)
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.82
    h = _math(nt, "ADD", _math(nt, "MULTIPLY", _noise(nt, v, 20.0, 6), 0.3), _math(nt, "SUBTRACT", 1.0, b.outputs["Fac"]))
    nt.links.new(_bump(nt, h, 0.35, 0.01), bsdf.inputs["Normal"])
    _cache["stone"] = m
    return m


def dark_stone():
    """Dark carved plinths (须弥座): relief suggested by a strong voronoi + noise bump."""
    if "darkstone" in _cache:
        return _cache["darkstone"]
    m, nt, bsdf = _new("DarkStone")
    v = _coord(nt)
    col = _ramp(nt, _noise(nt, v, 3.0, 8), [(0.3, srgb("#2c2a27")), (0.75, srgb("#4a453f"))])
    col = _weather(nt, col, ao_amt=0.8, streak_amt=0.0, grime=(0.25, 0.24, 0.22), ao_dist=0.15)
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.62
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.feature = "SMOOTH_F1"
    vor.inputs["Scale"].default_value = 9.0
    nt.links.new(v, vor.inputs["Vector"])
    h = _math(nt, "ADD", vor.outputs["Distance"], _math(nt, "MULTIPLY", _noise(nt, v, 40.0, 4), 0.25))
    nt.links.new(_bump(nt, h, 0.7, 0.02), bsdf.inputs["Normal"])
    _cache["darkstone"] = m
    return m


def iron():
    if "iron" in _cache:
        return _cache["iron"]
    m, nt, bsdf = _new("Iron")
    v = _coord(nt)
    col = _ramp(nt, _noise(nt, v, 8.0, 6), [(0.45, srgb("#1f1d1a")), (0.75, srgb("#3d2b1f"))])
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Metallic"].default_value = 0.55
    bsdf.inputs["Roughness"].default_value = 0.6
    nt.links.new(_bump(nt, _noise(nt, v, 60.0, 4), 0.3, 0.005), bsdf.inputs["Normal"])
    _cache["iron"] = m
    return m


def brick_cut():
    """Brick revealed by a section cut: the plaster is only a skin over Song brick."""
    if "brick_cut" in _cache:
        return _cache["brick_cut"]
    m, nt, bsdf = _new("BrickCut")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    comb = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(_math(nt, "ADD", sep.outputs["X"], sep.outputs["Y"], clamp=False), comb.inputs["X"])
    nt.links.new(sep.outputs["Z"], comb.inputs["Y"])
    br = nt.nodes.new("ShaderNodeTexBrick")
    br.offset = 0.5
    br.inputs["Scale"].default_value = 1.0
    br.inputs["Brick Width"].default_value = 0.36
    br.inputs["Row Height"].default_value = 0.075
    br.inputs["Mortar Size"].default_value = 0.01
    var = _ramp(nt, _noise(nt, comb.outputs[0], 5.0, 4), [(0.3, srgb("#5a3527")), (0.75, srgb("#7a4a35"))])
    nt.links.new(var, br.inputs["Color1"])
    br.inputs["Color2"].default_value = (*srgb("#6a3e2d"), 1)
    br.inputs["Mortar"].default_value = (*srgb("#9a9180"), 1)
    nt.links.new(comb.outputs[0], br.inputs["Vector"])
    nt.links.new(br.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.9
    nt.links.new(_bump(nt, _math(nt, "SUBTRACT", 1.0, br.outputs["Fac"]), 0.5, 0.01), bsdf.inputs["Normal"])
    _cache["brick_cut"] = m
    return m


# kept for compatibility with older scripts
def brick(*a, **k):
    return brick_cut()


def brick_inner():
    return brick_cut()


def plaster():
    return plaster_aged()


def paint_teal():
    return timber_dark()


def gilt():
    return iron()
