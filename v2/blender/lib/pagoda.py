"""Procedural Liuhe Pagoda (六和塔) for Blender, matched to photographs.

Exterior (Qing timber, rebuilt 1900): 13 tiers of maroon timber walls with small square
windows, short grey-tiled eaves (about 2 m) with gently lifted corners and a pointed
ridge-end ornament, dense dark bracket sets under every eave, a tall steep octagonal
roof on top and an iron finial.
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
    """Octagonal eave skirt: slightly concave, corners gently lifted and flared."""

    def __init__(self, r_in, z_root, r_out, z_edge, upturn=0.4, flare=0.45):
        self.a_in = G.apothem(r_in)
        self.a_out = G.apothem(r_out)
        self.hw_in = G.side_len(r_in) / 2
        self.hw_out = G.side_len(r_out) / 2
        self.z_root = z_root
        self.drop = z_root - z_edge
        self.upturn = upturn
        self.flare = flare

    def hw(self, s):
        return self.hw_in + (self.hw_out - self.hw_in) * s

    def point(self, k, x, s, lift=0.0):
        n, t = G.face_frame(k)
        a = self.a_in + (self.a_out - self.a_in) * s
        hw = self.hw(s)
        tt = min(1.0, abs(x) / hw) if hw > 0 else 0.0
        p = n * a + t * x
        side = 1 if x >= 0 else -1
        nb, _ = G.face_frame((k + side) % 8)
        bis = (n + nb).normalized()
        p = p + bis * (self.flare * tt ** 4 * s ** 1.5)
        # mild concavity (steeper near the wall); corners lift only toward the tip
        z = self.z_root - self.drop * (1.55 * s - 0.55 * s * s) + self.upturn * tt ** 4 * s ** 2.5 + lift
        return Vector((p.x, p.y, z))

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
                faces.append((a, a + W, a + W + 1, a + 1) if flip else (a, a + 1, a + W + 1, a + W))
    return G.obj_from_pydata(name, verts, faces, col, mat, smooth=True)


def build_roof(name, roof, col, tile_spacing=0.3, ornament=True):
    """Skin, soffit, fascia, cover-tile ridges, hip ridges with a pointed end. Returns (obj, tips)."""
    objs = [
        _roof_skin(f"{name}_skin", roof, col, mat=M.tiles()),
        _roof_skin(f"{name}_soffit", roof, col, lift=-0.22, flip=True, mat=M.timber_dark()),
    ]
    bm = bmesh.new()
    U = 24
    for k in range(8):
        hw = roof.hw(1.0)
        pts = [roof.point(k, -hw + 2 * hw * u / U, 1.0) for u in range(U + 1)]
        top = [bm.verts.new(p + Vector((0, 0, 0.02))) for p in pts]
        bot = [bm.verts.new(p - Vector((0, 0, 0.26))) for p in pts]
        for u in range(U):
            bm.faces.new((top[u], bot[u], bot[u + 1], top[u + 1]))
    objs.append(G.obj_from_bmesh(bm, f"{name}_fascia", col, M.timber_dark()))

    # cover tiles (筒瓦) as low rounded ridges on the skin + eave discs (瓦当)
    bm_t = bmesh.new()
    prof = [(0.075 * math.cos(a), 0.065 * math.sin(a) + 0.015) for a in [math.pi * i / 4 for i in range(5)]]
    for k in range(8):
        hw_out = roof.hw(1.0)
        nstrip = max(4, int((2 * hw_out) / tile_spacing))
        for j in range(nstrip + 1):
            x = -hw_out + j * (2 * hw_out / nstrip)
            if abs(x) > hw_out - 0.14:
                continue
            s0 = 0.0 if abs(x) <= roof.hw_in - 0.1 else (abs(x) + 0.1 - roof.hw_in) / (roof.hw_out - roof.hw_in)
            if s0 > 0.93:
                continue
            steps = max(2, int((1 - s0) * 6))
            path = [roof.point(k, x, s0 + (1 - s0) * q / steps) for q in range(steps + 1)]
            G.bm_sweep(bm_t, path, prof, up_fn=lambda i, p, k=k, x=x, s0=s0, steps=steps:
                       roof.normal(k, x, s0 + (1 - s0) * i / steps), closed_profile=False)
            end = path[-1]
            d = (path[-1] - path[-2]).normalized()
            m = Matrix.Translation(end + d * 0.01 + Vector((0, 0, 0.02))) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
            bmesh.ops.create_circle(bm_t, cap_ends=True, segments=8, radius=0.07, matrix=m)
    objs.append(G.obj_from_bmesh(bm_t, f"{name}_tiles", col, M.tiles(), smooth=True))

    # hip ridges ending in a small upturned blade (the pointed corner ornament)
    bm_r = bmesh.new()
    rp = [(-0.13, 0.0), (0.13, 0.0), (0.13, 0.2), (0.0, 0.27), (-0.13, 0.2)]
    tips = []
    for k in range(8):
        path = [roof.point(k, roof.hw(q / 10), q / 10) + Vector((0, 0, 0.03)) for q in range(11)]
        end, prev = path[-1], path[-2]
        tips.append(end.copy())
        G.bm_sweep(bm_r, path, rp, closed_profile=True, cap=True)
        if ornament:
            d = end - prev
            d.z = 0
            d.normalize()
            blade = [end + d * (0.1 + 0.32 * (q / 5)) + Vector((0, 0, 0.1 + 0.62 * (q / 5) ** 1.6)) for q in range(6)]
            rings = G.bm_sweep(bm_r, blade, [(-0.09, 0.0), (0.09, 0.0), (0.0, 0.16)], closed_profile=True, cap=True)
            for qi, ring in enumerate(rings):  # taper toward the tip
                sc = 1.0 - 0.8 * qi / (len(rings) - 1)
                c = blade[qi]
                for v in ring:
                    v.co = c + (v.co - c) * sc
    objs.append(G.obj_from_bmesh(bm_r, f"{name}_ridges", col, M.tiles(), smooth=False))

    # rafter ends along the eave: round 檐椽 below, square 飞椽 above
    bm_e = bmesh.new()
    for k in range(8):
        hw = roof.hw(1.0)
        cnt = max(6, int(2 * hw / 0.3))
        for j in range(1, cnt):
            x = -hw + 2 * hw * j / cnt
            if abs(x) > hw - 0.3:
                continue
            a = roof.point(k, x, 0.86, -0.3)
            b = roof.point(k, x, 1.0, -0.3)
            d = (b - a).normalized()
            q = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
            G.bm_cylinder(bm_e, 0.055, 0.34, 6, Matrix.Translation(b + d * 0.02) @ q)
            a2 = roof.point(k, x, 0.9, -0.15)
            b2 = roof.point(k, x, 1.0, -0.15)
            d2 = (b2 - a2).normalized()
            q2 = d2.to_track_quat("Z", "Y").to_matrix().to_4x4()
            G.bm_box(bm_e, (0.065, 0.065, 0.26), (0, 0, 0), Matrix.Translation(b2 + d2 * 0.04) @ q2)
    objs.append(G.obj_from_bmesh(bm_e, f"{name}_rafterends", col, M.timber_dark(), smooth=False))
    roof_obj = G.join(objs, name)
    return roof_obj, tips


# ─────────────────────────── bracket set (斗拱) ───────────────────────────

def bracket_mesh(name="Bracket"):
    """Song-style bracket set facing +X, about 1.27 m tall and 1.45 m deep at scale 1."""
    bm = bmesh.new()

    def block(cx, cy, cz, sx, sy, sz):
        G.bm_box(bm, (sx, sy, sz), (cx, cy, cz))

    def dou(cx, cy, cz, w):
        bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=w * 0.5, radius2=w * 0.72, depth=0.12,
                              matrix=Matrix.Translation((cx, cy, cz - 0.06)) @ Matrix.Rotation(math.pi / 4, 4, "Z"))
        block(cx, cy, cz + 0.06, w, w, 0.12)

    dou(0, 0, 0.1, 0.5)                       # 栌斗
    block(0, 0, 0.3, 0.26, 1.25, 0.2)         # 泥道拱
    for y in (-0.5, 0.5):
        dou(0, y, 0.46, 0.26)                 # 散斗
    block(0.35, 0, 0.3, 0.95, 0.24, 0.2)      # 华拱 (first projection)
    dou(0.72, 0, 0.46, 0.28)
    block(0, 0, 0.6, 0.24, 1.8, 0.18)         # 慢拱
    block(0.65, 0, 0.6, 1.5, 0.24, 0.2)       # 华拱 (second projection)
    dou(1.3, 0, 0.76, 0.3)
    block(1.3, 0, 0.9, 0.24, 1.2, 0.18)       # 令拱
    for y in (-0.48, 0.48):
        dou(1.3, y, 1.04, 0.24)
    block(0.9, 0, 1.12, 1.6, 0.2, 0.2)        # 耍头
    block(1.32, 0, 1.18, 0.26, 1.6, 0.16)     # 撩檐方
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=0.018, segments=1, affect="EDGES", profile=0.5, clamp_overlap=True)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(M.timber_dark())
    return me


# ─────────────────────────── timber tier ───────────────────────────

def bevel(obj, width=0.015, segments=2, angle=40):
    """Rounded edges catch the light; this is most of what separates a model from a box."""
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = width
    mod.segments = segments
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(angle)
    return mod


def bays_for(R):
    return 3 if G.side_len(R) > 6.6 else 2


def split_parts(objs, col, prefix, keep_whole=(), bevel_parts=(), cap_material=None):
    """Split each part into its eight octagon sides so the tower can burst outward like a top."""
    out = []
    for o in objs:
        part = o.name[len(prefix) + 1:] if o.name.startswith(prefix + "_") else o.name
        if part in keep_whole:
            o["part"] = part
            o["face"] = -1
            out.append(o)
            continue
        for k, piece in sorted(G.split_by_sector(o, col, cap_material).items()):
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
            u = q / (nbj * 2)
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

    # wall: columns, beams, boards, small square windows
    bm_col, bm_beam, bm_board, bm_void, bm_lat = (bmesh.new() for _ in range(5))
    nb = bays_for(R)
    colr = 0.19 if i < 7 else 0.16
    col_h = wall_t - wall_b
    for k in range(8):
        rot = Matrix.Rotation(G.face_angle(k), 4, "Z")
        for b in range(nb):
            p = G.oct_point(R, k, b / nb)
            G.bm_cylinder(bm_col, colr, col_h, 10, Matrix.Translation((p.x, p.y, wall_b + col_h / 2)))
        a0, a1 = G.oct_point(R, k, 0), G.oct_point(R, k, 1)
        mid = (a0 + a1) / 2
        L = (a1 - a0).length
        mr = Matrix.Translation((mid.x, mid.y, 0)) @ rot
        G.bm_box(bm_beam, (0.3, L + 0.2, 0.3), (0, 0, wall_t - 0.15), mr)      # 阑额
        G.bm_box(bm_beam, (0.46, L + 0.36, 0.1), (0, 0, wall_t + 0.05), mr)    # 普拍枋
        G.bm_box(bm_beam, (0.28, L, 0.18), (0, 0, wall_b + 0.09), mr)          # sill
        bay_w = L / nb
        for b in range(nb):
            c = G.oct_point(R, k, (b + 0.5) / nb)
            mb = Matrix.Translation((c.x, c.y, 0)) @ rot
            inner_w = bay_w - 2 * colr
            door = t["kind"] == "ming" and k % 2 == 0 and b == nb // 2 and nb % 2 == 1
            if door:
                ow, oh = 0.95, min(2.05, col_h - 0.75)
                ob = wall_b + 0.18
            else:
                ow = 0.62 if t["kind"] == "ming" else 0.5
                oh = ow * 1.1
                ob = wall_b + (col_h - oh) * 0.55
            ot = ob + oh
            hb, ht = wall_b + 0.18, wall_t - 0.3
            if ob - hb > 0.02:
                G.bm_box(bm_board, (0.12, inner_w, ob - hb), (0, 0, (ob + hb) / 2), mb)
            G.bm_box(bm_board, (0.12, inner_w, ht - ot), (0, 0, (ot + ht) / 2), mb)
            sw = (inner_w - ow) / 2
            for sgn in (-1, 1):
                G.bm_box(bm_board, (0.12, sw, oh), (0, sgn * (ow + sw) / 2, (ob + ot) / 2), mb)
            G.bm_box(bm_void, (0.03, ow, oh), (-0.1, 0, (ob + ot) / 2), mb)
            fr = 0.07
            G.bm_box(bm_beam, (0.16, ow + 2 * fr, fr), (0.03, 0, ot + fr / 2), mb)
            G.bm_box(bm_beam, (0.16, ow + 2 * fr, fr), (0.03, 0, ob - fr / 2), mb)
            for sgn in (-1, 1):
                G.bm_box(bm_beam, (0.16, fr, oh), (0.03, sgn * (ow / 2 + fr / 2), (ob + ot) / 2), mb)
            if not door:
                for q in (1, 2):
                    G.bm_box(bm_lat, (0.04, 0.03, oh), (0.0, -ow / 2 + ow * q / 3, (ob + ot) / 2), mb)
                G.bm_box(bm_lat, (0.04, ow, 0.03), (0.0, 0, (ob + ot) / 2), mb)
    wall = G.join([
        G.obj_from_bmesh(bm_col, f"{name}_columns", col, M.timber(), smooth=True),
        G.obj_from_bmesh(bm_beam, f"{name}_beams", col, M.timber_dark()),
        G.obj_from_bmesh(bm_board, f"{name}_boards", col, M.wall_board()),
        G.obj_from_bmesh(bm_void, f"{name}_void", col, M.lattice_dark()),
        G.obj_from_bmesh(bm_lat, f"{name}_lattice", col, M.timber_dark()),
    ], f"{name}_wall")
    bevel(wall)
    objs.append(wall)

    # roof
    if is_top:
        roof = Roof(0.75, z1 + 4.6, R + t["overhang"] + 0.3, wall_t + 0.6, upturn=0.5, flare=0.5)
    else:
        roof = Roof(nxt["R"] - 0.2, z1 + 0.55, R + t["overhang"], wall_t + 0.55)
    roof_obj, tips = build_roof(f"{name}_roof", roof, col)
    objs.append(roof_obj)

    # 栱眼壁: the board wall behind the brackets, closing the gap up to the roof
    bm = bmesh.new()
    top_z = (z1 + 0.5) if not is_top else (wall_t + 1.4)
    rin = (nxt["R"] - 0.35) if not is_top else R - 0.5
    for k in range(8):
        G.bm_ring_seg(bm, R - 0.12, rin, R - 0.12, rin, top_z - wall_t, wall_t, k)
    objs.append(G.obj_from_bmesh(bm, f"{name}_bracketwall", col, M.timber_dark()))

    # brackets on every column top + one centred in each bay (instances of one mesh)
    bscale = 0.47
    brackets = []
    for k in range(8):
        for b in range(nb):
            p = G.oct_point(R, k, b / nb)
            ang = G.face_angle(k) - math.pi / 8 if b == 0 else G.face_angle(k)
            for (pp, aa, tag) in ((p, ang, "c"), (G.oct_point(R, k, (b + 0.5) / nb), G.face_angle(k), "m")):
                ob = bpy.data.objects.new(f"{name}_bracket_{k}_{b}{tag}", bracket_me)
                col.objects.link(ob)
                ob.location = (pp.x, pp.y, wall_t + 0.1)
                ob.rotation_euler = (0, 0, aa)
                ob.scale = (bscale, bscale, bscale * 0.95)
                brackets.append(ob)

    # bells (风铎) at the corner tips
    bm_b = bmesh.new()
    prof = [(0.0, 0.0), (0.05, -0.02), (0.08, -0.1), (0.14, -0.3), (0.17, -0.35), (0.0, -0.35)]
    for tip in tips:
        rings = G.bm_lathe(bm_b, prof, segments=10)
        off = Matrix.Translation(tip + Vector((0, 0, -0.32)))
        for ring in rings:
            for v in ring:
                v.co = off @ v.co
        G.bm_box(bm_b, (0.02, 0.15, 0.2), tip + Vector((0, 0, -0.82)))
        G.bm_cylinder(bm_b, 0.01, 0.34, 5, Matrix.Translation(tip + Vector((0, 0, -0.17))))
    objs.append(G.obj_from_bmesh(bm_b, f"{name}_bells", col, M.iron(), smooth=True))

    objs = split_parts(objs, col, name, bevel_parts=("wall",))
    for ob in brackets:
        ob["part"] = "bracket"
        ob["face"] = G.sector_of(ob.location.x, ob.location.y)

    emp = bpy.data.objects.new(name, None)
    col.objects.link(emp)
    emp.location = (0, 0, z0)
    _parent(objs + brackets, emp)
    emp["kind"] = t["kind"]
    emp["tier"] = i
    return emp, tips, roof


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
        emp, tips, roof = build_tier(t, nxt, col, bracket_me, sR)
        tier_objs.append(emp)
        roofs.append(roof)
    storey_objs = [build_storey(s, col) for s in storeys]
    finial = build_finial(roofs[-1].z_root - 0.25, col)
    podium = build_podium(tiers[0]["R"] + 0.9, col)
    return dict(tiers=tier_objs, storeys=storey_objs, finial=finial, podium=podium, layout=(tiers, storeys))
