"""Procedural Liuhe Pagoda (六和塔) for Blender, matched to photographs.

Exterior (Qing timber, rebuilt 1900): 13 tiers of dark maroon plank walls, three bays a side
between square posts, a large dark window in every bay, a waist rail over the windows and a
lintel on top; grey-tiled eaves about 2 m deep, level along the middle of each side and sweeping
up and out at the corners, where the hip ridges rise into a curled horn and a red corner beam
carries the wind-bell; a row of tile ends bedded in white lime along every eave, red rafter ends
in two rows below it, dense dark bracket sets in front of a red board wall, a tall steep
octagonal roof on top and an iron finial.
Interior (Southern Song brick, white lime plaster): seven storeys of a "double tube" -
outer wall, corridor, inner wall, central chamber - pierced by cusped (lobed) doorways
that line up from the gallery to the chamber; dark carved Sumeru plinths (须弥座)
flank the passages; stone floors; stairs wind up through the corridor.

Each part is its own object, parented to an empty per tier / storey for the exploded view:
    T00..T12   timber tiers   children: _floor _wall _bracketwall _bracket* _roof _bells
    S0..S6     brick storeys  children: _shell _core _plinth _floor _stairs _altar
    Finial, Podium
Reconstruction for teaching, not a survey.
"""
import math
import bmesh
import bpy
from mathutils import Vector, Matrix

from . import geom as G
from . import materials as M

PODIUM_H = 0.73
N_TIERS = 13


# ─────────────────────────── layout ───────────────────────────

def layout():
    tiers = []
    z = PODIUM_H
    for i in range(N_TIERS):
        h = 4.6 - 0.105 * i
        R = 10.2 - 0.31 * i
        tiers.append(dict(
            i=i, z0=z, z1=z + h, h=h, R=R,
            overhang=1.95 - 0.045 * i,
            kind="ming" if i % 2 == 0 else "an",
        ))
        z += h
    storeys = []
    for f in range(7):
        a = tiers[2 * f]
        b = tiers[min(2 * f + 1, 12)]
        storeys.append(dict(
            f=f, z0=a["z0"], z1=b["z1"] if f < 6 else a["z1"],
            R=a["R"] - 2.0, Rt=b["R"] - 2.0,
        ))
    return tiers, storeys


# ─────────────────────────── roof surface ───────────────────────────

class Roof:
    """Octagonal eave skirt: concave, nearly level along the middle of each side, sweeping up and
    out toward the corners (嫩戗发戗), so the hip ridges rise toward their tips."""

    def __init__(self, r_in, z_root, r_out, z_edge, upturn=0.9, flare=0.7, sag=1.55):
        self.a_in = G.apothem(r_in)
        self.a_out = G.apothem(r_out)
        self.hw_in = G.side_len(r_in) / 2
        self.hw_out = G.side_len(r_out) / 2
        self.z_root = z_root
        self.drop = z_root - z_edge
        self.upturn = upturn
        self.flare = flare
        self.sag = sag

    def hw(self, s):
        return self.hw_in + (self.hw_out - self.hw_in) * s

    @staticmethod
    def sweep(tt):
        """Share of the corner lift at |x| / half-width = tt: a long, almost level middle, then the rise."""
        return 0.25 * tt * tt + 0.75 * tt ** 6

    def point(self, k, x, s, lift=0.0):
        n, t = G.face_frame(k)
        a = self.a_in + (self.a_out - self.a_in) * s
        hw = self.hw(s)
        tt = min(1.0, abs(x) / hw) if hw > 0 else 0.0
        c = self.sweep(tt)
        p = n * a + t * x
        side = 1 if x >= 0 else -1
        nb, _ = G.face_frame((k + side) % 8)
        bis = (n + nb).normalized()
        p = p + bis * (self.flare * c * s ** 1.5)
        # concave (steeper near the wall); the corners lift toward the tip
        z = self.z_root - self.drop * (self.sag * s - (self.sag - 1) * s * s) + self.upturn * c * s ** 2.2 + lift
        return Vector((p.x, p.y, z))

    def corner(self, k, s, lift=0.0):
        """Point on the hip between side k and side k + 1."""
        return self.point(k, self.hw(s), s, lift)

    def normal(self, k, x, s):
        e = 0.05
        p = self.point(k, x, s)
        px = self.point(k, x + e, s) - p
        ps = self.point(k, x, min(1.0, s + e)) - p
        nrm = ps.cross(px)
        if nrm.z < 0:
            nrm = -nrm
        return nrm.normalized()


def _roof_skin(name, roof, col, U=24, S=8, lift=0.0, flip=False, mat=None):
    """The tiled surface (faces up) or, with flip, the boarded soffit under it (faces down)."""
    verts, faces = [], []
    for k in range(8):
        base = len(verts)
        for si in range(S + 1):
            s = si / S
            hw = roof.hw(s)
            for ui in range(U + 1):
                x = -hw + 2 * hw * ui / U
                verts.append(roof.point(k, x, s, lift * (0.35 + 0.65 * s)))
        W = U + 1
        for si in range(S):
            for ui in range(U):
                a = base + si * W + ui
                faces.append((a, a + 1, a + W + 1, a + W) if flip else (a, a + W, a + W + 1, a + 1))
    return G.obj_from_pydata(name, verts, faces, col, mat, smooth=True)


SOFFIT = -0.22


def _soffit(s):
    """How far the soffit boards sit below the tiles at s (the same lift _roof_skin gives them)."""
    return SOFFIT * (0.35 + 0.65 * s)


def _eave_band(bm, roof, k, z_top, z_bot, U=24):
    """A vertical strip along the eave of side k, z_top..z_bot from the tile edge, facing outward."""
    hw = roof.hw(1.0)
    top, bot = [], []
    for u in range(U + 1):
        p = roof.point(k, -hw + 2 * hw * u / U, 1.0)
        top.append(bm.verts.new(p + Vector((0, 0, z_top))))
        bot.append(bm.verts.new(p + Vector((0, 0, z_bot))))
    for u in range(U):
        bm.faces.new((top[u], bot[u], bot[u + 1], top[u + 1]))


def _fan(tt):
    """How far a rafter near the corner turns toward it (翼角椽 fan out from the corner beam)."""
    return math.radians(22.5) * max(0.0, min(1.0, (tt - 0.6) / 0.4)) ** 1.4


def _eave_dir(roof, k, x):
    """Unit direction down the roof at the eave at x on side k, fanned toward the nearer corner."""
    d = roof.point(k, x, 1.0) - roof.point(k, x, 0.86)
    th = _fan(abs(x) / roof.hw(1.0))
    return (Matrix.Rotation(th if x >= 0 else -th, 3, "Z") @ d).normalized()


def _ngon_facing(bm, pts, out):
    f = bm.faces.new([bm.verts.new(p) for p in pts])
    f.normal_update()
    if f.normal.dot(out) < 0:
        f.normal_flip()


def _horn(bm, path, prof, size):
    """The hip ridge's end sweeping up into a horn that curls back at the top (戗头)."""
    tan = (path[-1] - path[-2]).normalized()
    dh = Vector((tan.x, tan.y, 0)).normalized()
    phi0 = math.atan2(tan.z, Vector((tan.x, tan.y)).length)
    N = 12
    ang = [phi0 + (math.radians(128) - phi0) * (i / N) ** 1.3 for i in range(N + 1)]
    pts = [path[-1].copy()]
    for i in range(1, N + 1):
        a = 0.5 * (ang[i - 1] + ang[i])
        pts.append(pts[-1] + (dh * math.cos(a) + Vector((0, 0, math.sin(a)))) * (size / N))
    ups = [dh * -math.sin(a) + Vector((0, 0, math.cos(a))) for a in ang]
    rings = G.bm_sweep(bm, pts, prof, up_fn=lambda i, p: ups[i], closed_profile=True, cap=True)
    for i, ring in enumerate(rings):  # taper toward the tip
        sc = 1.0 - 0.75 * (i / N) ** 0.9
        for v in ring:
            v.co = pts[i] + (v.co - pts[i]) * sc


def build_roof(name, roof, col, tile_spacing=0.3, ornament=True, horn=1.1):
    """Skin and soffit; along the eave, tile ends bedded in white lime, the fascia and two rows of
    red rafters; cover-tile ridges; hip ridges rising into a horn; corner beams.
    Returns (obj, hooks): the corner-beam ends the wind-bells hang from."""
    objs = [
        _roof_skin(f"{name}_skin", roof, col, mat=M.tiles()),
        _roof_skin(f"{name}_soffit", roof, col, lift=SOFFIT, flip=True, mat=M.timber_dark()),
    ]
    # the eave from the top down: lime bedding behind the tile ends, then the fascia (连檐),
    # which closes the gap down to the soffit
    bm_lime, bm_fascia = bmesh.new(), bmesh.new()
    for k in range(8):
        _eave_band(bm_lime, roof, k, 0.05, -0.08)
        _eave_band(bm_fascia, roof, k, -0.08, -0.27)
    objs.append(G.obj_from_bmesh(bm_lime, f"{name}_lime", col, M.plaster_aged()))
    objs.append(G.obj_from_bmesh(bm_fascia, f"{name}_fascia", col, M.timber_dark()))

    # cover tiles (筒瓦) as rounded ridges on the skin; at the eave a round end tile (勾头) on each
    # and a pointed drip tile (滴水) between them, both standing in front of the lime
    bm_t, bm_e, bm_d = bmesh.new(), bmesh.new(), bmesh.new()
    prof = [(0.075 * math.cos(a), 0.065 * math.sin(a) + 0.015) for a in [math.pi * (4 - i) / 4 for i in range(5)]]
    rafters = []  # (k, x) under each cover tile
    for k in range(8):
        hw_out = roof.hw(1.0)
        nstrip = max(4, int((2 * hw_out) / tile_spacing))
        sp = 2 * hw_out / nstrip
        for j in range(nstrip + 1):
            x = -hw_out + j * sp
            if abs(x) > hw_out - 0.16:
                continue
            rafters.append((k, x))
            end = roof.point(k, x, 1.0)
            dh = _eave_dir(roof, k, x)
            dh.z = 0
            dh.normalize()
            tv = Vector((0, 0, 1)).cross(dh)
            c = end + dh * 0.06 + Vector((0, 0, 0.015))
            _ngon_facing(bm_e, [c + (tv * math.cos(a) + Vector((0, 0, math.sin(a)))) * 0.076
                                for a in [math.tau * q / 10 for q in range(10)]], dh)
            s0 = 0.0 if abs(x) <= roof.hw_in - 0.1 else (abs(x) + 0.1 - roof.hw_in) / (roof.hw_out - roof.hw_in)
            if s0 <= 0.93:
                steps = max(2, int((1 - s0) * 6))
                path = [roof.point(k, x, s0 + (1 - s0) * q / steps) for q in range(steps + 1)]
                G.bm_sweep(bm_t, path, prof, up_fn=lambda i, p, k=k, x=x, s0=s0, steps=steps:
                           roof.normal(k, x, s0 + (1 - s0) * i / steps), closed_profile=False)
        for j in range(nstrip):
            x = -hw_out + (j + 0.5) * sp
            if abs(x) > hw_out - 0.2:
                continue
            c = roof.point(k, x, 1.0)
            dh = _eave_dir(roof, k, x)
            dh.z = 0
            dh.normalize()
            tv = Vector((0, 0, 1)).cross(dh)
            w = sp * 0.27
            c = c + dh * 0.03
            _ngon_facing(bm_d, [c + tv * w + Vector((0, 0, -0.02)), c - tv * w + Vector((0, 0, -0.02)),
                                c - tv * w + Vector((0, 0, -0.08)), c + dh * 0.03 + Vector((0, 0, -0.16)),
                                c + tv * w + Vector((0, 0, -0.08))], dh)
    objs.append(G.obj_from_bmesh(bm_t, f"{name}_tiles", col, M.tiles(), smooth=True))
    objs.append(G.obj_from_bmesh(bm_e, f"{name}_tileends", col, M.tiles()))
    objs.append(G.obj_from_bmesh(bm_d, f"{name}_drips", col, M.tiles()))

    # rafters: square flying-rafter ends (飞椽), painted red, out of the fascia under each tile, and
    # dark round eave rafters (檐椽) running under the soffit, their ends set back from the edge;
    # near the corners both fan out toward the corner beam
    bm_f, bm_c = bmesh.new(), bmesh.new()
    for (k, x) in rafters:
        tt = abs(x) / roof.hw(1.0)
        d = _eave_dir(roof, k, x)
        q = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
        G.bm_box(bm_f, (0.075, 0.075, 0.3), (0, 0, 0), Matrix.Translation(roof.point(k, x, 1.0, -0.18) + d * 0.02) @ q)
        b = roof.point(k, x, 0.94, _soffit(0.94) - 0.065)
        if tt < 0.62:
            a = roof.point(k, x, 0.44, _soffit(0.44) - 0.065)
        else:
            a = b - d * 0.9
        ab = b - a
        G.bm_cylinder(bm_c, 0.058, ab.length, 6, Matrix.Translation((a + b) / 2) @ ab.to_track_quat("Z", "Y").to_matrix().to_4x4())
    objs.append(G.obj_from_bmesh(bm_f, f"{name}_flyrafters", col, M.timber()))
    objs.append(G.obj_from_bmesh(bm_c, f"{name}_rafters", col, M.timber_dark(), smooth=True))

    # hip ridges (戗脊), their outer half bedded in lime, rising with the corner and curling up into
    # a horn; under each a red corner beam (角梁) whose end sticks out past the eave and turns up to
    # carry the bell
    bm_r, bm_l, bm_b = bmesh.new(), bmesh.new(), bmesh.new()
    rp = [(-0.13, 0.0), (-0.13, 0.19), (0.0, 0.27), (0.13, 0.19), (0.13, 0.0)]
    lp = [(-0.17, -0.05), (-0.17, 0.06), (0.17, 0.06), (0.17, -0.05)]
    bp = [(-0.1, -0.13), (-0.1, 0.13), (0.1, 0.13), (0.1, -0.13)]
    hooks = []
    for k in range(8):
        # a few millimetres into side k, so everything at this corner splits off with side k
        nudge = G.face_frame(k)[1] * -0.004
        path = [roof.corner(k, q / 14, 0.03) + nudge for q in range(15)]
        G.bm_sweep(bm_r, path, rp, closed_profile=True, cap=True)
        G.bm_sweep(bm_l, path[6:], lp, closed_profile=True, cap=True)
        if ornament:
            _horn(bm_r, path, rp, horn)
        beam = [roof.corner(k, s, _soffit(s) - 0.15) + nudge for s in (0.2, 0.4, 0.6, 0.8, 1.0)]
        d = beam[-1] - beam[-2]
        d.z = 0
        d.normalize()
        beam += [beam[4] + d * (0.5 * q) + Vector((0, 0, 0.3 * q * q)) for q in (0.35, 0.7, 1.0)]
        G.bm_sweep(bm_b, beam, bp, closed_profile=True, cap=True)
        hooks.append(beam[-1] - d * 0.06 - Vector((0, 0, 0.13)))
    for bm in (bm_r, bm_l, bm_b):
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    objs.append(G.obj_from_bmesh(bm_r, f"{name}_ridges", col, M.tiles(), smooth=False))
    objs.append(G.obj_from_bmesh(bm_l, f"{name}_ridgelime", col, M.plaster_aged()))
    objs.append(G.obj_from_bmesh(bm_b, f"{name}_cornerbeams", col, M.timber()))
    roof_obj = G.join(objs, name)
    return roof_obj, hooks


# ─────────────────────────── bracket set (斗拱) ───────────────────────────

def _slab(bm, outline, width, along="X", offset=(0, 0, 0)):
    """Extrude a closed outline [(a, z)] by `width` across it; a runs along local X or Y."""
    ox, oy, oz = offset
    hw = width / 2
    if along == "X":
        front = [bm.verts.new((ox + a, oy + hw, oz + z)) for (a, z) in outline]
        back = [bm.verts.new((ox + a, oy - hw, oz + z)) for (a, z) in outline]
    else:
        front = [bm.verts.new((ox + hw, oy + a, oz + z)) for (a, z) in outline]
        back = [bm.verts.new((ox - hw, oy + a, oz + z)) for (a, z) in outline]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    m = len(outline)
    for i in range(m):
        j = (i + 1) % m
        bm.faces.new((front[i], back[i], back[j], front[j]))


def _arm_outline(length, height, ends=(True, True), cut=0.45, reach=0.2, segs=3):
    """Side view of a bracket arm (栱), centred, its lower ends rounded off in facets (卷杀)."""
    hl, hh = length / 2, height / 2
    ch, cl = height * cut, min(reach, 0.3 * length)
    pts = [(-hl, hh)]
    if ends[0]:
        pts += [(-hl + cl - cl * math.cos(math.pi / 2 * i / segs), -hh + ch - ch * math.sin(math.pi / 2 * i / segs)) for i in range(segs + 1)]
    else:
        pts.append((-hl, -hh))
    if ends[1]:
        pts += [(hl - cl + cl * math.cos(math.pi / 2 * i / segs), -hh + ch - ch * math.sin(math.pi / 2 * i / segs)) for i in reversed(range(segs + 1))]
    else:
        pts.append((hl, -hh))
    pts.append((hl, hh))
    return pts


def bracket_mesh(name="Bracket"):
    """Bracket set facing +X, about 1.27 m tall and 1.75 m deep at scale 1: blocks (斗) on arms
    (栱) with rounded ends, two jumps out, a slanting cantilever (昂) with a pointed beak under the
    outer arm, a cross-arm on every jump and a beam end (耍头) on top."""
    bm = bmesh.new()

    def block(cx, cy, cz, sx, sy, sz):
        G.bm_box(bm, (sx, sy, sz), (cx, cy, cz))

    def dou(cx, cy, cz, w):
        bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=w * 0.5, radius2=w * 0.72, depth=0.12,
                              matrix=Matrix.Translation((cx, cy, cz - 0.06)) @ Matrix.Rotation(math.pi / 4, 4, "Z"))
        block(cx, cy, cz + 0.06, w, w, 0.12)

    def arm(along, cx, cy, cz, length, height, width, ends=(True, True)):
        _slab(bm, _arm_outline(length, height, ends), width, along, (cx, cy, cz))

    dou(0, 0, 0.1, 0.5)                                    # 栌斗
    arm("Y", 0, 0, 0.3, 1.25, 0.2, 0.26)                   # 泥道拱
    for y in (-0.5, 0.5):
        dou(0, y, 0.46, 0.26)                              # 散斗
    arm("X", 0.35, 0, 0.3, 0.95, 0.2, 0.24, (False, True))  # 华拱 (first jump)
    dou(0.72, 0, 0.46, 0.28)                               # 交互斗
    arm("Y", 0.72, 0, 0.6, 1.0, 0.18, 0.22)                # 瓜子拱 on the first jump
    for y in (-0.4, 0.4):
        dou(0.72, y, 0.75, 0.22)
    arm("Y", 0, 0, 0.6, 1.8, 0.18, 0.24)                   # 慢拱
    for y in (-0.78, 0.78):
        dou(0, y, 0.75, 0.24)
    arm("X", 0.4, 0, 0.6, 1.0, 0.2, 0.24, (False, True))   # 华拱 (second jump, inner part)
    # 昂: slants down and out under the outer arm, ending in a pointed beak
    _slab(bm, [(0.45, 0.86), (0.45, 0.66), (1.42, 0.43), (1.6, 0.4), (1.7, 0.47), (1.62, 0.6)], 0.22)
    dou(1.3, 0, 0.76, 0.3)                                 # 交互斗 on the 昂
    arm("Y", 1.3, 0, 0.9, 1.2, 0.18, 0.24)                 # 令拱
    for y in (-0.48, 0.48):
        dou(1.3, y, 1.04, 0.24)
    dou(1.3, 0, 1.04, 0.26)                                # 齐心斗
    # 耍头: the beam end over the outer arm, cut to a point (蚂蚱头)
    _slab(bm, [(0.1, 1.02), (1.5, 1.02), (1.74, 1.1), (1.74, 1.17), (1.6, 1.22), (0.1, 1.22)], 0.2)
    block(1.32, 0, 1.18, 0.26, 1.6, 0.16)                  # 撩檐方
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.016, segments=1, affect="EDGES", profile=0.5, clamp_overlap=True)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(M.timber_dark())
    return me


# ─────────────────────────── timber tier ───────────────────────────

BEVEL_W = "bevel_weight_edge"


def bevel(obj, width=0.015, segments=2, angle=40):
    """Rounded edges catch the light; this is most of what separates a model from a box.
    A mesh with edge bevel weights gets them only where marked (posts and beams, not the plank seams)."""
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    if BEVEL_W in obj.data.attributes:
        mod.limit_method = "WEIGHT"
    else:
        mod.limit_method = "ANGLE"
        mod.angle_limit = math.radians(angle)
    return mod


def bays_for(R):
    """Three bays on every side, each with its window, as the photographs show at every tier."""
    return 3


def split_parts(objs, col, prefix, keep_whole=(), bevel_parts=(), cap_material=None, whole_share=None):
    """Split each part into its eight octagon sides so the tower can burst outward like a top."""
    out = []
    for o in objs:
        part = o.name[len(prefix) + 1:] if o.name.startswith(prefix + "_") else o.name
        if part in keep_whole:
            o["part"] = part
            o["face"] = -1
            out.append(o)
            continue
        for k, piece in sorted(G.split_by_sector(o, col, cap_material, whole_share).items()):
            piece.name = f"{prefix}_{part}_{k}"
            piece.data.name = piece.name
            piece["part"] = part
            piece["face"] = k
            if part in bevel_parts:
                bevel(piece)
            out.append(piece)
    return out


def _parent(objs, emp):
    for o in objs:
        o.parent = emp
        o.matrix_parent_inverse = Matrix.Translation(-emp.location)


def _boards(bm, w, h, center, matrix, pitch=0.25, thick=0.1, groove=0.03, depth=0.014):
    """Plank infill facing local +X with a V-groove between every two planks (竖向板缝).
    Winding is fixed afterwards with recalc_face_normals."""
    if w <= 0.02 or h <= 0.02:
        return
    n = max(1, round(w / pitch))
    f = thick / 2
    loop = [(-w / 2, f)]  # (y, x) along the front, then back round the rear
    for i in range(1, n):
        y = -w / 2 + w * i / n
        loop += [(y - groove / 2, f), (y, f - depth), (y + groove / 2, f)]
    loop += [(w / 2, f), (w / 2, -f), (-w / 2, -f)]
    cx, cy, cz = center
    bot = [bm.verts.new(matrix @ Vector((cx + x, cy + y, cz - h / 2))) for (y, x) in loop]
    top = [bm.verts.new(matrix @ Vector((cx + x, cy + y, cz + h / 2))) for (y, x) in loop]
    bm.faces.new(bot)
    bm.faces.new(list(reversed(top)))
    m = len(loop)
    for i in range(m):
        j = (i + 1) % m
        bm.faces.new((bot[i], bot[j], top[j], top[i]))


def build_tier(t, nxt, col, bracket_me, storey_R):
    i, z0, z1, R = t["i"], t["z0"], t["z1"], t["R"]
    name = f"T{i:02d}"
    is_top = nxt is None
    wall_b = z0 + 0.22
    wall_t = z1 - 1.15 if not is_top else z0 + t["h"] * 0.62
    objs = []

    # gallery floor (wooden planks) between the white brick wall and the timber wall,
    # carried on joists that show as the gallery ceiling of the tier below
    bm = bmesh.new()
    for k in range(8):
        G.bm_ring_seg(bm, R + 0.2, storey_R - 0.05, R + 0.2, storey_R - 0.05, 0.22, z0, k)
    nbj = bays_for(R)
    for k in range(8):
        for q in range(nbj * 2):
            u = q / (nbj * 2) + 0.0005
            a = G.oct_point(storey_R - 0.05, k, u)
            b = G.oct_point(R, k, u)
            mid = (a + b) / 2
            d = b - a
            ang = math.atan2(d.y, d.x)
            m = Matrix.Translation((mid.x, mid.y, z0 - 0.14)) @ Matrix.Rotation(ang, 4, "Z")
            G.bm_box(bm, (d.length, 0.16 if q % 2 else 0.24, 0.28 if q % 2 else 0.36), (0, 0, 0), m)
        # a ring beam along the timber wall
        c0, c1 = G.oct_point(R - 0.1, k, 0), G.oct_point(R - 0.1, k, 1)
        mid = (c0 + c1) / 2
        m = Matrix.Translation((mid.x, mid.y, z0 - 0.2)) @ Matrix.Rotation(G.face_angle(k), 4, "Z")
        G.bm_box(bm, (0.26, (c1 - c0).length, 0.4), (0, 0, 0), m)
    objs.append(G.obj_from_bmesh(bm, f"{name}_floor", col, M.wood_floor()))

    # wall: three bays a side between square posts, a large dark window in each bay, plank infill
    # with vertical seams; a waist rail over the windows (腰串), the lintel (阑额) and plate (普拍枋)
    # on top. Every beam stops short of the corner post, so each stays with its own side.
    bm_post, bm_beam, bm_board, bm_void, bm_frame = (bmesh.new() for _ in range(5))
    nb = bays_for(R)
    pw = 0.36 if i < 7 else 0.3
    ob = wall_b + 0.4                 # window sill, just clear of the roof below
    lint_b = wall_t - 0.34            # underside of the lintel
    oh = 0.5 * (lint_b - ob)          # about square low down, wider than tall higher up
    ot = ob + oh
    hb = wall_b + 0.18
    for k in range(8):
        rot = Matrix.Rotation(G.face_angle(k), 4, "Z")
        a0, a1 = G.oct_point(R, k, 0), G.oct_point(R, k, 1)
        mid = (a0 + a1) / 2
        L = (a1 - a0).length
        mr = Matrix.Translation((mid.x, mid.y, 0)) @ rot
        for b in range(nb):
            p = G.oct_point(R, k, b / nb + 0.0005)  # the corner post goes with side k
            ang = G.face_angle(k) - math.pi / 8 if b == 0 else G.face_angle(k)
            m = Matrix.Translation((p.x, p.y, (wall_b + wall_t) / 2)) @ Matrix.Rotation(ang, 4, "Z")
            G.bm_box(bm_post, (0.3, pw, wall_t - wall_b), (0.02, 0, 0), m)
        G.bm_box(bm_frame, (0.28, L - 0.1, 0.18), (0, 0, wall_b + 0.09), mr)          # 地栿 sill beam
        G.bm_box(bm_beam, (0.2, L - 0.1, 0.16), (0.03, 0, ot + 0.08), mr)              # 腰串
        G.bm_box(bm_beam, (0.3, L - 0.1, 0.34), (0, 0, wall_t - 0.17), mr)            # 阑额
        G.bm_box(bm_beam, (0.46, L - 0.1, 0.1), (0, 0, wall_t + 0.05), mr)            # 普拍枋
        bay_w = L / nb
        ow = min(1.25, max(0.8, 0.5 * bay_w))
        iw = bay_w - pw
        sw = (iw - ow) / 2
        for b in range(nb):
            c = G.oct_point(R, k, (b + 0.5) / nb)
            mb = Matrix.Translation((c.x, c.y, 0)) @ rot
            _boards(bm_board, iw, ob - hb, (0, 0, (ob + hb) / 2), mb)
            _boards(bm_board, iw, lint_b - ot - 0.16, (0, 0, (ot + 0.16 + lint_b) / 2), mb)
            for sgn in (-1, 1):
                _boards(bm_board, sw, oh, (0, sgn * (ow + sw) / 2, (ob + ot) / 2), mb)
            G.bm_box(bm_void, (0.03, ow, oh), (-0.08, 0, (ob + ot) / 2), mb)
            # the opening's lining: jambs through the planks and a sill board
            for sgn in (-1, 1):
                G.bm_box(bm_frame, (0.15, 0.05, oh), (0.0, sgn * (ow / 2 - 0.025), (ob + ot) / 2), mb)
            G.bm_box(bm_frame, (0.18, ow + 0.1, 0.06), (0.02, 0, ob + 0.03), mb)
    for bm in (bm_post, bm_beam):
        w = bm.edges.layers.float.new(BEVEL_W)
        for e in bm.edges:
            e[w] = 1.0
    bmesh.ops.recalc_face_normals(bm_board, faces=bm_board.faces)
    wall = G.join([
        G.obj_from_bmesh(bm_post, f"{name}_posts", col, M.timber()),
        G.obj_from_bmesh(bm_beam, f"{name}_beams", col, M.timber()),
        G.obj_from_bmesh(bm_board, f"{name}_boards", col, M.wall_board()),
        G.obj_from_bmesh(bm_void, f"{name}_void", col, M.lattice_dark()),
        G.obj_from_bmesh(bm_frame, f"{name}_frames", col, M.timber_dark()),
    ], f"{name}_wall")
    objs.append(wall)

    # roof
    if is_top:
        roof = Roof(0.75, z1 + 4.6, R + t["overhang"] + 0.3, wall_t + 0.6, upturn=1.0, flare=0.8, sag=1.8)
    else:
        roof = Roof(nxt["R"] - 0.2, z1 + 0.55, R + t["overhang"], wall_t + 0.55)
    roof_obj, hooks = build_roof(f"{name}_roof", roof, col, horn=1.25 - 0.025 * i)
    objs.append(roof_obj)

    # 栱眼壁: the red board wall behind the brackets, closing the gap up to the roof
    bm = bmesh.new()
    top_z = (z1 + 0.5) if not is_top else (wall_t + 1.4)
    rin = (nxt["R"] - 0.35) if not is_top else R - 0.5
    for k in range(8):
        G.bm_ring_seg(bm, R - 0.12, rin, R - 0.12, rin, top_z - wall_t, wall_t, k)
    objs.append(G.obj_from_bmesh(bm, f"{name}_bracketwall", col, M.timber()))

    # brackets on every column top + one centred in each bay (instances of one mesh)
    bscale = 0.47
    brackets = []
    for k in range(8):
        for b in range(nb):
            p = G.oct_point(R, k, b / nb + 0.0005)
            ang = G.face_angle(k) - math.pi / 8 if b == 0 else G.face_angle(k)
            for (pp, aa, tag) in ((p, ang, "c"), (G.oct_point(R, k, (b + 0.5) / nb), G.face_angle(k), "m")):
                ob_ = bpy.data.objects.new(f"{name}_bracket_{k}_{b}{tag}", bracket_me)
                col.objects.link(ob_)
                ob_.location = (pp.x, pp.y, wall_t + 0.1)
                ob_.rotation_euler = (0, 0, aa)
                ob_.scale = (bscale, bscale, bscale * 0.95)
                brackets.append(ob_)

    # bells (风铎) hanging from the corner-beam ends, one at every corner
    bm_b = bmesh.new()
    prof = [(0.0, -0.35), (0.17, -0.35), (0.14, -0.3), (0.08, -0.1), (0.05, -0.02), (0.0, 0.0)]
    for h in hooks:
        rings = G.bm_lathe(bm_b, prof, segments=10)
        off = Matrix.Translation(h + Vector((0, 0, -0.16)))
        for ring in rings:
            for v in ring:
                v.co = off @ v.co
        G.bm_box(bm_b, (0.02, 0.15, 0.2), h + Vector((0, 0, -0.66)))
        G.bm_cylinder(bm_b, 0.012, 0.2, 5, Matrix.Translation(h + Vector((0, 0, -0.08))))
    objs.append(G.obj_from_bmesh(bm_b, f"{name}_bells", col, M.iron(), smooth=True))

    objs = split_parts(objs, col, name, bevel_parts=("wall",), whole_share=0.7)
    for ob_ in brackets:
        ob_["part"] = "bracket"
        ob_["face"] = G.sector_of(ob_.location.x, ob_.location.y)

    emp = bpy.data.objects.new(name, None)
    col.objects.link(emp)
    emp.location = (0, 0, z0)
    _parent(objs + brackets, emp)
    emp["kind"] = t["kind"]
    emp["tier"] = i
    return emp, hooks, roof


# ─────────────────────────── brick storey ───────────────────────────

def _uv_wall(bm):
    uv = bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        n = f.normal
        for loop in f.loops:
            co = loop.vert.co
            if abs(n.z) > 0.7:
                loop[uv].uv = (co.x, co.y)
            else:
                ang = math.atan2(co.y, co.x)
                loop[uv].uv = (ang * math.hypot(co.x, co.y), co.z)


def cusped_arch(width, height, spring_ratio=0.55, lobes=5, steps=60):
    """Outline (x, y) of a cusped / lobed doorway like Liuhe's 壶门, base at y = 0."""
    hw = width / 2
    spring = height * spring_ratio
    rise = height - spring
    pts = [(-hw, 0.0), (hw, 0.0), (hw, spring)]
    for i in range(1, steps):
        a = i * math.pi / steps
        lobe = abs(math.sin(lobes * a))        # 0 at the cusps, 1 mid-lobe
        r = 1.0 - 0.11 * (1 - lobe) ** 3       # sharp inward points between lobes
        pts.append((hw * math.cos(a) * r, spring + rise * math.sin(a) * r))
    pts.append((-hw, spring))
    return pts


def _cutters(col, radius, depth_out, depth_in, width, height, z_base, faces, name):
    cut = []
    outline = cusped_arch(width, height)
    for k in faces:
        bm = bmesh.new()
        n, tg = G.face_frame(k)
        a = G.apothem(radius)
        front = [bm.verts.new(n * (a + depth_out) + tg * x + Vector((0, 0, z_base + y))) for (x, y) in outline]
        back = [bm.verts.new(n * (a - depth_in) + tg * x + Vector((0, 0, z_base + y))) for (x, y) in outline]
        m = len(outline)
        bm.faces.new(front)
        bm.faces.new(list(reversed(back)))
        for q in range(m):
            q2 = (q + 1) % m
            bm.faces.new((front[q2], front[q], back[q], back[q2]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        cut.append(G.obj_from_bmesh(bm, f"{name}_cut{k}", col))
    return cut


def _apply_boolean(obj, cutters):
    if not cutters:
        return
    cutter = G.join(cutters, obj.name + "_cutters")
    mod = obj.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.object = cutter
    with bpy.context.temp_override(object=obj, active_object=obj):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def build_storey(s, col):
    f, z0, z1 = s["f"], s["z0"], s["z1"]
    name = f"S{f}"
    Rb, Rt = s["R"], s["Rt"]
    H = z1 - z0
    k_wall, k_corr, k_inner = 0.15, 0.2, 0.13
    rwi_b, rwi_t = Rb * (1 - k_wall), Rt * (1 - k_wall)           # outer wall, inner face
    rco_b, rco_t = Rb * (1 - k_wall - k_corr), Rt * (1 - k_wall - k_corr)
    rci_b, rci_t = Rb * (1 - k_wall - k_corr - k_inner), Rt * (1 - k_wall - k_corr - k_inner)
    parts = []
    door_faces = [0, 2, 4, 6] if f % 2 == 0 else [1, 3, 5, 7]
    niche_faces = [k for k in range(8) if k not in door_faces]
    dw = min(1.25, 0.19 * G.side_len(Rb))
    dh = min(2.75, H * 0.34)

    # outer wall (white plaster over brick) with cusped doorways and niches
    bm = bmesh.new()
    for k in range(8):
        G.bm_ring_seg(bm, Rb, rwi_b, Rt, rwi_t, H, z0, k)
    _uv_wall(bm)
    shell = G.obj_from_bmesh(bm, f"{name}_shell", col, M.plaster_aged())
    cuts = _cutters(col, Rb, 0.6, Rb * k_wall + 0.6, dw, dh, z0 + 0.3, door_faces, name)
    cuts += _cutters(col, Rb, 0.6, Rb * k_wall * 0.4, dw * 0.85, dh * 0.75, z0 + 0.9, niche_faces, name + "n")
    _apply_boolean(shell, cuts)
    parts.append(shell)

    # inner wall (塔心) pierced on the same faces: passages run straight to the chamber
    bm = bmesh.new()
    for k in range(8):
        G.bm_ring_seg(bm, rco_b, rci_b, rco_t, rci_t, H, z0, k)
    _uv_wall(bm)
    core = G.obj_from_bmesh(bm, f"{name}_core", col, M.plaster_aged())
    cuts = _cutters(col, rco_b, 0.5, rco_b - rci_b + 0.5, dw * 0.85, dh * 0.92, z0 + 0.3, door_faces, name + "c")
    _apply_boolean(core, cuts)
    parts.append(core)

    # dark carved Sumeru plinths along the foot of both corridor walls
    bm = bmesh.new()
    for (r_face, outward) in ((rco_b, 1), (rwi_b, -1)):
        for (dz, hh, off) in ((0.0, 0.18, 0.2), (0.18, 0.1, 0.12), (0.28, 0.42, 0.05), (0.7, 0.1, 0.12), (0.8, 0.14, 0.2)):
            ro = r_face + (off if outward > 0 else 0.02)
            ri = r_face - (0.02 if outward > 0 else off)
            for k in range(8):
                G.bm_ring_seg(bm, ro, ri, ro, ri, hh, z0 + 0.3 + dz, k)
    _uv_wall(bm)
    plinth = G.obj_from_bmesh(bm, f"{name}_plinthband", col, M.dark_stone())
    bm = bmesh.new()
    for k in range(8):
        n, tg = G.face_frame(k)
        for (r_face, sgn) in ((rco_b + 0.05, 1), (rwi_b - 0.05, -1)):
            a = G.apothem(r_face)
            L = G.side_len(r_face)
            npan = 3 if L > 3 else 2
            for q in range(npan):
                x = -L / 2 + L * (q + 0.5) / npan
                c = n * (a + sgn * 0.02) + tg * x
                m = Matrix.Translation((c.x, c.y, z0 + 0.79)) @ Matrix.Rotation(G.face_angle(k), 4, "Z")
                pw = L / npan * 0.74
                for (sx, sy, sz, oy, oz) in ((0.05, pw, 0.04, 0, 0.17), (0.05, pw, 0.04, 0, -0.17), (0.05, 0.04, 0.34, -pw / 2, 0), (0.05, 0.04, 0.34, pw / 2, 0)):
                    G.bm_box(bm, (sx, sy, sz), (0, oy, oz), m)
                G.bm_box(bm, (0.04, pw * 0.55, 0.2), (0, 0, 0), m)
    relief = G.obj_from_bmesh(bm, f"{name}_relief", col, M.dark_stone())
    plinth_all = G.join([plinth, relief], f"{name}_plinth")
    # the plinths stop at the doorways so the passages stay open
    cuts = _cutters(col, Rb, 0.6, Rb * k_wall + 0.8, dw + 0.1, dh, z0 + 0.25, door_faces, name + "p1")
    cuts += _cutters(col, rco_b, 0.8, rco_b - rci_b + 0.5, dw * 0.85 + 0.1, dh, z0 + 0.25, door_faces, name + "p2")
    _apply_boolean(plinth_all, cuts)
    parts.append(plinth_all)
    # stone thresholds in every doorway
    bm = bmesh.new()
    for k in door_faces:
        n, tg = G.face_frame(k)
        for (r_out, r_in, w) in ((Rb, rwi_b, dw), (rco_b, rci_b, dw * 0.85)):
            a_out, a_in = G.apothem(r_out), G.apothem(r_in)
            c = n * ((a_out + a_in) / 2)
            m = Matrix.Translation((c.x, c.y, z0 + 0.3)) @ Matrix.Rotation(G.face_angle(k), 4, "Z")
            G.bm_box(bm, (a_out - a_in + 0.12, w + 0.04, 0.06), (0, 0, 0.03), m)
    parts.append(G.obj_from_bmesh(bm, f"{name}_thresholds", col, M.dark_stone()))

    # stone floors: corridor ring and chamber
    bm = bmesh.new()
    for k in range(8):
        G.bm_ring_seg(bm, rwi_b + 0.02, rco_b - 0.02, rwi_b + 0.02, rco_b - 0.02, 0.3, z0, k)
    parts.append(G.obj_from_bmesh(bm, f"{name}_floor", col, M.stone()))
    bm = bmesh.new()
    G.bm_prism(bm, rci_b + 0.02, rci_b + 0.02, 0.3, z0)
    parts.append(G.obj_from_bmesh(bm, f"{name}_chamberfloor", col, M.stone()))

    # stair winding up the corridor to the next storey
    if f < 6:
        bm = bmesh.new()
        r_mid = (rwi_b + rco_b) / 2
        steps = int(H / 0.19)
        start = G.face_angle(niche_faces[0]) - 0.35
        sweep = math.radians(140)
        for q in range(steps):
            a = start + sweep * q / steps
            zq = z0 + 0.3 + H * q / steps
            m = Matrix.Translation((r_mid * math.cos(a), r_mid * math.sin(a), zq + 0.09)) @ Matrix.Rotation(a, 4, "Z")
            G.bm_box(bm, (Rb * k_corr * 0.85, 0.32, 0.18), (0, 0, 0), m)
        parts.append(G.obj_from_bmesh(bm, f"{name}_stairs", col, M.stone()))


    parts = split_parts(parts, col, name, keep_whole=("stairs", "chamberfloor"), cap_material=M.brick_cut())

    emp = bpy.data.objects.new(name, None)
    col.objects.link(emp)
    emp.location = (0, 0, z0)
    _parent(parts, emp)
    emp["storey"] = f
    return emp


# ─────────────────────────── finial, podium ───────────────────────────

def build_finial(z, col):
    bm = bmesh.new()
    prof = [(0.0, 0.0), (0.95, 0.0), (0.95, 0.22), (0.78, 0.28), (0.82, 0.5), (0.72, 0.56),
            (0.78, 0.8), (0.7, 1.0), (0.45, 1.2), (0.16, 1.28), (0.12, 1.32), (0.12, 3.9), (0.0, 3.9)]
    G.bm_lathe(bm, prof, 24, z)
    for r in range(6):
        G.bm_cylinder(bm, 0.6 - r * 0.06, 0.08, 24, Matrix.Translation((0, 0, z + 1.55 + r * 0.32)))
    G.bm_lathe(bm, [(0.0, 0.0), (0.55, 0.0), (0.42, 0.1), (0.0, 0.16)], 24, z + 3.55)
    G.bm_lathe(bm, [(0.0, 0.0), (0.24, 0.1), (0.3, 0.27), (0.21, 0.45), (0.12, 0.52), (0.2, 0.62), (0.23, 0.74), (0.13, 0.88), (0.0, 0.93)], 20, z + 3.72)
    return G.obj_from_bmesh(bm, "Finial", col, M.iron(), smooth=True)


def build_podium(R, col):
    bm = bmesh.new()
    G.bm_prism(bm, R + 0.3, R + 0.3, PODIUM_H - 0.12, 0)
    G.bm_prism(bm, R + 0.42, R + 0.42, 0.12, PODIUM_H - 0.12)
    for q in range(4):
        G.bm_box(bm, (3.4, 0.4, PODIUM_H * (q + 1) / 4), (0, -(G.apothem(R + 0.3) + 1.6 - q * 0.4), PODIUM_H * (q + 1) / 8))
    _uv_wall(bm)
    ob = G.obj_from_bmesh(bm, "Podium", col, M.stone())
    bevel(ob, 0.03, 2)
    return ob


# ─────────────────────────── whole tower ───────────────────────────

def build(col):
    tiers, storeys = layout()
    bracket_me = bracket_mesh()
    tier_objs, roofs = [], []
    for idx, t in enumerate(tiers):
        nxt = tiers[idx + 1] if idx + 1 < len(tiers) else None
        st = storeys[min(t["i"] // 2, 6)]
        sR = st["R"] + (st["Rt"] - st["R"]) * ((t["i"] % 2) / 2)
        emp, hooks, roof = build_tier(t, nxt, col, bracket_me, sR)
        tier_objs.append(emp)
        roofs.append(roof)
    storey_objs = [build_storey(s, col) for s in storeys]
    finial = build_finial(roofs[-1].z_root - 0.25, col)
    podium = build_podium(tiers[0]["R"] + 0.9, col)
    return dict(tiers=tier_objs, storeys=storey_objs, finial=finial, podium=podium, layout=(tiers, storeys))
