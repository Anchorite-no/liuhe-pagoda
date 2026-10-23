"""What stands around the pagoda, so it is not set down bare among the trees: a stone terrace
with a balustrade, a white temple wall with a dark tiled coping (粉墙黛瓦) and a gate, a long
stone stair down the slope to the riverside road; the road itself with its markings, street
lamps and the railing along the embankment; and people along the bank, watching the tide."""
import math
import random

import bmesh
import bpy
from mathutils import Matrix

from . import geom as G
from . import materials as M

RIVER_Z = -9.0
NEAR_Y = -95.0
EMB_Y = NEAR_Y + 4          # the embankment wall
ROAD_Y = EMB_Y + 6.5        # centre of the road
ROAD_W = 10.0
ROAD_TOP = RIVER_Z + 4.1
TERRACE_R = 21.0
WALL_R = 25.5
STAIR_W = 5.0


def asphalt():
    if "Asphalt" in bpy.data.materials:
        return bpy.data.materials["Asphalt"]
    m, nt, bsdf = M._new("Asphalt")
    v = M._coord(nt)
    col = M._ramp(nt, M._noise(nt, v, 1.4, 6), [(0.3, M.srgb("#2a2a29")), (0.75, M.srgb("#3b3a37"))])
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.85
    return m


def paint():
    if "RoadPaint" in bpy.data.materials:
        return bpy.data.materials["RoadPaint"]
    m, nt, bsdf = M._new("RoadPaint")
    bsdf.inputs["Base Color"].default_value = (*M.srgb("#d8d4c8"), 1)
    bsdf.inputs["Roughness"].default_value = 0.6
    return m


def cloth(seed):
    """Muted clothing colours for the crowd."""
    palette = ["#2b2d33", "#4a4b52", "#6b5a45", "#8a8578", "#3c4a5c", "#7a2f25", "#b8b2a3", "#2f3b31", "#5d4a63", "#c4a35a"]
    hexc = palette[seed % len(palette)]
    name = f"Cloth{seed % len(palette)}"
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m, nt, bsdf = M._new(name)
    bsdf.inputs["Base Color"].default_value = (*M.srgb(hexc), 1)
    bsdf.inputs["Roughness"].default_value = 0.8
    return m


def build_terrace(col):
    """An octagonal stone terrace around the podium, edged by a low balustrade, open to the south."""
    bm = bmesh.new()
    G.bm_prism(bm, TERRACE_R, TERRACE_R, 3.2, -3.2 + 0.02)
    floor = G.obj_from_bmesh(bm, "Terrace", col, M.stone())
    bm = bmesh.new()
    for k in range(8):
        a0, a1 = G.oct_point(TERRACE_R - 0.3, k, 0), G.oct_point(TERRACE_R - 0.3, k, 1)
        L = (a1 - a0).length
        n = max(2, int(L / 2.4))
        for i in range(n + 1):
            u = i / n
            if k == 0 and abs(u - 0.5) * L < STAIR_W / 2 + 0.4:
                continue  # the opening for the stair
            p = a0.lerp(a1, u)
            G.bm_box(bm, (0.32, 0.32, 1.0), (p.x, p.y, 0.5))
            if i < n and not (k == 0 and abs((i + 0.5) / n - 0.5) * L < STAIR_W / 2 + 1.2):
                q = a0.lerp(a1, (i + 0.5) / n)
                rot = Matrix.Rotation(math.atan2(a1.y - a0.y, a1.x - a0.x), 4, "Z")
                G.bm_box(bm, (L / n, 0.18, 0.12), (0, 0, 0), Matrix.Translation((q.x, q.y, 0.92)) @ rot)
                G.bm_box(bm, (L / n, 0.14, 0.5), (0, 0, 0), Matrix.Translation((q.x, q.y, 0.3)) @ rot)
    rail = G.obj_from_bmesh(bm, "Balustrade", col, M.stone())
    return floor, rail


def build_stair(col, terrain_height):
    """A long stone stair from the terrace down to the road, following the slope in flights."""
    y_top = -G.apothem(TERRACE_R) + 0.2
    y_bot = ROAD_Y + ROAD_W / 2 + 0.2
    bm = bmesh.new()
    cheek = bmesh.new()
    steps = 140
    prev = None
    for i in range(steps):
        y0 = y_top + (y_bot - y_top) * i / steps
        y1 = y_top + (y_bot - y_top) * (i + 1) / steps
        zt = max(terrain_height(0, (y0 + y1) / 2), ROAD_TOP) + 0.12
        z = math.floor(zt / 0.16) * 0.16 if i else 0.02
        if prev is not None and z > prev:
            z = prev  # the stair never climbs on the way down
        prev = z
        G.bm_box(bm, (STAIR_W, abs(y1 - y0) + 0.02, 2.4), (0, (y0 + y1) / 2, z - 1.2))
        for sgn in (-1, 1):
            G.bm_box(cheek, (0.45, abs(y1 - y0) + 0.02, 3.0), (sgn * (STAIR_W / 2 + 0.22), (y0 + y1) / 2, z - 1.2 + 0.35))
    stair = G.obj_from_bmesh(bm, "Stair", col, M.stone())
    walls = G.obj_from_bmesh(cheek, "StairWalls", col, M.dark_stone())
    return stair, walls


def build_wall(col, terrain_height):
    """The temple wall: white plaster, a dark tiled coping, a gate over the top of the stair."""
    bm = bmesh.new()
    cap = bmesh.new()
    for k in range(8):
        a0, a1 = G.oct_point(WALL_R, k, 0), G.oct_point(WALL_R, k, 1)
        L = (a1 - a0).length
        n = 6
        for i in range(n):
            u0, u1 = i / n, (i + 1) / n
            if k == 0 and abs((u0 + u1) / 2 - 0.5) * L < 4.2:
                continue  # the gate
            p0, p1 = a0.lerp(a1, u0), a0.lerp(a1, u1)
            m = (p0 + p1) / 2
            ground = min(terrain_height(p.x, p.y) for p in (p0, m, p1))
            top = max(terrain_height(m.x, m.y), 0.0) + 2.9
            rot = Matrix.Rotation(math.atan2(a1.y - a0.y, a1.x - a0.x), 4, "Z")
            mt = Matrix.Translation((m.x, m.y, 0)) @ rot
            G.bm_box(bm, (L / n + 0.02, 0.5, top - ground + 0.6), (0, 0, (top + ground - 0.6) / 2), mt)
            # the coping: a little gable of dark tiles
            G.bm_box(cap, (L / n + 0.05, 0.95, 0.12), (0, 0, top + 0.06), mt)
            G.bm_box(cap, (L / n + 0.05, 0.62, 0.22), (0, 0, top + 0.28), mt)
            G.bm_box(cap, (L / n + 0.05, 0.3, 0.16), (0, 0, top + 0.47), mt)
    wall = G.obj_from_bmesh(bm, "TempleWall", col, M.plaster_aged())
    coping = G.obj_from_bmesh(cap, "WallCoping", col, M.tiles())
    # the gate: two piers, a lintel and a small tiled roof
    gy = -G.apothem(WALL_R)
    gate = bmesh.new()
    for sgn in (-1, 1):
        G.bm_box(gate, (0.9, 0.9, 4.6), (sgn * 3.6, gy, 2.3))
    G.bm_box(gate, (8.4, 0.7, 0.6), (0, gy, 4.3))
    gate_ob = G.obj_from_bmesh(gate, "Gate", col, M.timber())
    groof = bmesh.new()
    G.bm_box(groof, (10.0, 3.0, 0.18), (0, gy, 4.75))
    G.bm_box(groof, (9.0, 2.2, 0.35), (0, gy, 5.0))
    G.bm_box(groof, (8.0, 1.3, 0.35), (0, gy, 5.32))
    G.bm_box(groof, (8.4, 0.35, 0.3), (0, gy, 5.6))
    roof_ob = G.obj_from_bmesh(groof, "GateRoof", col, M.tiles())
    return wall, coping, gate_ob, roof_ob


def build_road_details(col):
    """Lane markings, the kerb, street lamps, and a stone railing along the embankment."""
    lines = bmesh.new()
    for x in range(-1500, 1500, 9):
        G.bm_box(lines, (3.2, 0.16, 0.02), (x, ROAD_Y, ROAD_TOP + 0.21))
    G.bm_box(lines, (3000, 0.14, 0.02), (0, ROAD_Y - ROAD_W / 2 + 0.6, ROAD_TOP + 0.21))
    G.bm_box(lines, (3000, 0.14, 0.02), (0, ROAD_Y + ROAD_W / 2 - 0.6, ROAD_TOP + 0.21))
    paint_ob = G.obj_from_bmesh(lines, "RoadLines", col, paint())
    bm = bmesh.new()
    G.bm_box(bm, (3000, ROAD_W - 0.2, 0.42), (0, ROAD_Y, ROAD_TOP))
    road = G.obj_from_bmesh(bm, "RoadSurface", col, asphalt())
    kerb = bmesh.new()
    G.bm_box(kerb, (3000, 2.6, 0.55), (0, EMB_Y + 1.6, ROAD_TOP + 0.05))   # the riverside walk
    G.bm_box(kerb, (3000, 1.4, 0.55), (0, ROAD_Y + ROAD_W / 2 + 0.7, ROAD_TOP + 0.05))
    kerb_ob = G.obj_from_bmesh(kerb, "Walks", col, M.stone())
    rail = bmesh.new()
    for x in range(-1500, 1500, 3):
        G.bm_box(rail, (0.22, 0.22, 1.0), (x, EMB_Y + 0.45, ROAD_TOP + 0.8))
    G.bm_box(rail, (3000, 0.2, 0.14), (0, EMB_Y + 0.45, ROAD_TOP + 1.28))
    G.bm_box(rail, (3000, 0.12, 0.1), (0, EMB_Y + 0.45, ROAD_TOP + 0.75))
    rail_ob = G.obj_from_bmesh(rail, "RiverRailing", col, M.stone())
    lamps = bmesh.new()
    heads = bmesh.new()
    for x in range(-1500, 1500, 32):
        G.bm_cylinder(lamps, 0.1, 6.2, 8, Matrix.Translation((x, EMB_Y + 1.2, ROAD_TOP + 3.4)))
        G.bm_box(lamps, (0.12, 1.4, 0.1), (x, EMB_Y + 1.8, ROAD_TOP + 6.4))
        G.bm_box(heads, (0.5, 0.7, 0.18), (x, EMB_Y + 2.4, ROAD_TOP + 6.32))
    lamp_ob = G.obj_from_bmesh(lamps, "LampPosts", col, M.iron())
    head_ob = G.obj_from_bmesh(heads, "LampHeads", col, M.iron())
    return road, paint_ob, kerb_ob, rail_ob, lamp_ob, head_ob


def build_crowd(col, seed=8, count=260, span=(-320, 260)):
    """People along the riverside walk, in knots where the view is best, watching the tide."""
    rnd = random.Random(seed)
    obs = []
    x = span[0]
    while x < span[1] and len(obs) < count:
        knot = rnd.random() < 0.35
        n = rnd.randint(3, 9) if knot else 1
        for _ in range(n):
            px = x + rnd.uniform(-1.5, 1.5)
            py = EMB_Y + rnd.uniform(0.9, 2.6)
            h = rnd.uniform(1.55, 1.82)
            bm = bmesh.new()
            body = Matrix.Translation((px, py, ROAD_TOP + 0.33 + h * 0.42)) @ Matrix.Diagonal((1.0, 0.75, 1.0, 1.0))
            G.bm_cylinder(bm, 0.21, h * 0.62, 8, body)
            legs = Matrix.Translation((px, py, ROAD_TOP + 0.33 + h * 0.12))
            G.bm_cylinder(bm, 0.15, h * 0.24, 6, legs)
            res = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.115)
            bmesh.ops.translate(bm, verts=res["verts"], vec=(px, py, ROAD_TOP + 0.33 + h * 0.86))
            obs.append(G.obj_from_bmesh(bm, "Person", col, cloth(rnd.randint(0, 9)), smooth=True))
        x += rnd.uniform(2.0, 9.0) if knot else rnd.uniform(1.5, 6.0)
    return G.join(obs, "Crowd") if obs else None


def red_wall():
    if "TempleRed" in bpy.data.materials:
        return bpy.data.materials["TempleRed"]
    m, nt, bsdf = M._new("TempleRed")
    v = M._coord(nt)
    col = M._ramp(nt, M._noise(nt, v, 0.8, 5), [(0.3, M.srgb("#7d2a1c")), (0.75, M.srgb("#96402a"))])
    col = M._weather(nt, col, ao_amt=0.6, streak_amt=0.3)
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.85
    return m


def build_gatehouse(col):
    """The entrance at the foot of the stair, by the road: red walls, a door, a tiled hip roof."""
    y = ROAD_Y + ROAD_W / 2 + 4.6
    z0 = ROAD_TOP + 0.3
    bm = bmesh.new()
    for sgn in (-1, 1):
        G.bm_box(bm, (4.2, 4.2, 5.2), (sgn * 4.6, y, z0 + 2.6))
    G.bm_box(bm, (5.2, 4.2, 1.6), (0, y, z0 + 4.4))
    walls = G.obj_from_bmesh(bm, "GateHouse", col, red_wall())
    bm = bmesh.new()
    for sgn in (-1, 1):
        for dx in (-1.6, 1.6):
            G.bm_cylinder(bm, 0.22, 5.4, 10, Matrix.Translation((sgn * 4.6 + dx, y - 2.15, z0 + 2.7)))
    G.bm_box(bm, (14.0, 0.5, 0.45), (0, y - 2.2, z0 + 5.45))
    G.bm_box(bm, (2.6, 0.12, 0.9), (0, y - 2.2, z0 + 4.65))  # the name board
    posts = G.obj_from_bmesh(bm, "GatePosts", col, M.timber())
    roof = bmesh.new()
    for i, (w, d, h) in enumerate([(16.0, 7.6, 0.25), (15.0, 6.6, 0.45), (13.6, 5.2, 0.55), (11.8, 3.6, 0.6), (10.0, 1.8, 0.55), (10.4, 0.5, 0.5)]):
        G.bm_box(roof, (w, d, h), (0, y, z0 + 5.8 + sum(hh for (_, _, hh) in [(16.0, 7.6, 0.25), (15.0, 6.6, 0.45), (13.6, 5.2, 0.55), (11.8, 3.6, 0.6), (10.0, 1.8, 0.55)][:i])))
    roof_ob = G.obj_from_bmesh(roof, "GateHouseRoof", col, M.tiles())
    return walls, posts, roof_ob


def build(col, terrain_height):
    build_terrace(col)
    build_stair(col, terrain_height)
    build_wall(col, terrain_height)
    build_road_details(col)
    build_gatehouse(col)
    build_crowd(col)
