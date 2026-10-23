"""Geometry helpers for building the Liuhe Pagoda in Blender (Z up, metres).

Octagon convention: side k (0..7) faces the direction a_k = -90deg + k*45deg,
so side 0 faces -Y (the front, toward the river). Vertices sit at a_k +- 22.5deg.
"""
import math
import bmesh
import bpy
from mathutils import Vector, Matrix

TAU = math.tau
HALF = math.pi / 8
COS_H = math.cos(HALF)


def face_angle(k):
    return -math.pi / 2 + k * math.pi / 4


def oct_vertex(R, j):
    """Vertex j (0..7) of an octagon with circumradius R; vertex j is the start of side j."""
    a = face_angle(j) - HALF
    return Vector((R * math.cos(a), R * math.sin(a), 0.0))


def oct_point(R, k, u):
    """Point on side k at parameter u (0..1) of an octagon with circumradius R."""
    a = oct_vertex(R, k)
    b = oct_vertex(R, (k + 1) % 8)
    return a.lerp(b, u)


def face_frame(k):
    """(normal, tangent) of side k in the XY plane. Tangent runs from vertex k to k+1."""
    a = face_angle(k)
    n = Vector((math.cos(a), math.sin(a), 0.0))
    t = Vector((-math.sin(a), math.cos(a), 0.0))
    return n, t


def apothem(R):
    return R * COS_H


def side_len(R):
    return 2 * R * math.sin(HALF)


# ─────────────────────────── object helpers ───────────────────────────

def get_collection(name, parent=None):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        (parent or bpy.context.scene.collection).children.link(col)
    return col


def obj_from_bmesh(bm, name, collection, material=None, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    collection.objects.link(obj)
    if material is not None:
        me.materials.append(material)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    return obj


def obj_from_pydata(name, verts, faces, collection, material=None, smooth=False, uvs=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.validate(clean_customdata=False)
    if uvs is not None:
        uv = me.uv_layers.new(name="UVMap")
        for poly in me.polygons:
            for li in poly.loop_indices:
                vi = me.loops[li].vertex_index
                uv.data[li].uv = uvs[vi]
    obj = bpy.data.objects.new(name, me)
    collection.objects.link(obj)
    if material is not None:
        me.materials.append(material)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    return obj


def set_origin(obj, point):
    """Move the object's origin to `point` (world) without moving its geometry."""
    offset = Vector(point) - obj.location
    obj.data.transform(Matrix.Translation(-offset))
    obj.location = Vector(point)


def join(objs, name):
    """Join objects into the first one (keeps materials)."""
    objs = [o for o in objs if o is not None]
    if not objs:
        return None
    if len(objs) == 1:
        objs[0].name = name
        return objs[0]
    ctx = {"active_object": objs[0], "selected_editable_objects": objs, "selected_objects": objs}
    with bpy.context.temp_override(**ctx):
        bpy.ops.object.join()
    objs[0].name = name
    objs[0].data.name = name
    return objs[0]


# ─────────────────────────── primitives (bmesh) ───────────────────────────

def bm_box(bm, size, center=(0, 0, 0), matrix=None):
    sx, sy, sz = size
    m = Matrix.Translation(Vector(center)) @ Matrix.Diagonal((sx, sy, sz, 1.0))
    if matrix is not None:
        m = matrix @ m
    bmesh.ops.create_cube(bm, size=1.0, matrix=m)


def bm_prism(bm, r_bottom, r_top, height, z0, sides=8, offset=None, cap=True):
    """Regular prism / frustum. With sides=8 the flats align with the pagoda faces."""
    if offset is None:
        offset = -math.pi / 2 - HALF if sides == 8 else 0.0
    verts_b, verts_t = [], []
    for i in range(sides):
        a = offset + i * TAU / sides
        verts_b.append(bm.verts.new((r_bottom * math.cos(a), r_bottom * math.sin(a), z0)))
        verts_t.append(bm.verts.new((r_top * math.cos(a), r_top * math.sin(a), z0 + height)))
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((verts_b[i], verts_b[j], verts_t[j], verts_t[i]))
    if cap:
        bm.faces.new(list(reversed(verts_b)))
        bm.faces.new(verts_t)


def bm_ring(bm, ro_b, ri_b, ro_t, ri_t, height, z0, sides=8):
    """Thick octagonal ring (a wall with an open middle)."""
    off = -math.pi / 2 - HALF if sides == 8 else 0.0
    ob, ib, ot, it = [], [], [], []
    for i in range(sides):
        a = off + i * TAU / sides
        c, s = math.cos(a), math.sin(a)
        ob.append(bm.verts.new((ro_b * c, ro_b * s, z0)))
        ib.append(bm.verts.new((ri_b * c, ri_b * s, z0)))
        ot.append(bm.verts.new((ro_t * c, ro_t * s, z0 + height)))
        it.append(bm.verts.new((ri_t * c, ri_t * s, z0 + height)))
    for i in range(sides):
        j = (i + 1) % sides
        bm.faces.new((ob[i], ob[j], ot[j], ot[i]))  # outer
        bm.faces.new((ib[j], ib[i], it[i], it[j]))  # inner
        bm.faces.new((ot[i], ot[j], it[j], it[i]))  # top
        bm.faces.new((ob[j], ob[i], ib[i], ib[j]))  # bottom


def bm_cylinder(bm, radius, depth, segments=8, matrix=None, cap=True):
    m = matrix if matrix is not None else Matrix()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=segments,
                          radius1=radius, radius2=radius, depth=depth, matrix=m)


def bm_lathe(bm, profile, segments=24, z_offset=0.0):
    """Revolve a (r, z) profile around Z."""
    rings = []
    for i in range(segments):
        a = i * TAU / segments
        c, s = math.cos(a), math.sin(a)
        rings.append([bm.verts.new((r * c, r * s, z + z_offset)) for (r, z) in profile])
    n = len(profile)
    for i in range(segments):
        j = (i + 1) % segments
        for p in range(n - 1):
            bm.faces.new((rings[i][p], rings[j][p], rings[j][p + 1], rings[i][p + 1]))
    return rings


def bm_sweep(bm, path, profile, up_fn=None, closed_profile=True, cap=False):
    """Sweep a 2D profile [(x, y)] along a 3D polyline `path`.
    The profile's x runs along the side vector, y along `up` (default world Z)."""
    rings = []
    n = len(path)
    for i, p in enumerate(path):
        t = (path[min(i + 1, n - 1)] - path[max(i - 1, 0)]).normalized()
        up = up_fn(i, p) if up_fn else Vector((0, 0, 1))
        side = t.cross(up)
        if side.length < 1e-6:
            side = t.cross(Vector((1, 0, 0)))
        side.normalize()
        upn = side.cross(t).normalized()
        rings.append([bm.verts.new(p + side * x + upn * y) for (x, y) in profile])
    m = len(profile)
    rng = m if closed_profile else m - 1
    for i in range(n - 1):
        for k in range(rng):
            k2 = (k + 1) % m
            bm.faces.new((rings[i][k], rings[i][k2], rings[i + 1][k2], rings[i + 1][k]))
    if cap and closed_profile:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    return rings


def arch_outline(width, height, spring_ratio=0.62, steps=10):
    """2D outline (x, y) of a round-headed opening, counter-clockwise, base at y=0."""
    hw = width / 2
    spring = height * spring_ratio
    pts = [(-hw, 0.0), (hw, 0.0), (hw, spring)]
    for i in range(1, steps):
        a = i * math.pi / steps
        pts.append((hw * math.cos(a), spring + (height - spring) * math.sin(a)))
    pts.append((-hw, spring))
    return pts


def bm_ring_seg(bm, ro_b, ri_b, ro_t, ri_t, height, z0, k):
    """One side (k) of a thick octagonal ring, as a closed solid (so it reads as solid when exploded)."""
    p = []
    for (r, z) in ((ro_b, z0), (ri_b, z0), (ro_t, z0 + height), (ri_t, z0 + height)):
        a = oct_vertex(r, k)
        b = oct_vertex(r, (k + 1) % 8)
        p.append((a, b, z))
    ob0 = bm.verts.new((p[0][0].x, p[0][0].y, p[0][2]))
    ob1 = bm.verts.new((p[0][1].x, p[0][1].y, p[0][2]))
    ib0 = bm.verts.new((p[1][0].x, p[1][0].y, p[1][2]))
    ib1 = bm.verts.new((p[1][1].x, p[1][1].y, p[1][2]))
    ot0 = bm.verts.new((p[2][0].x, p[2][0].y, p[2][2]))
    ot1 = bm.verts.new((p[2][1].x, p[2][1].y, p[2][2]))
    it0 = bm.verts.new((p[3][0].x, p[3][0].y, p[3][2]))
    it1 = bm.verts.new((p[3][1].x, p[3][1].y, p[3][2]))
    bm.faces.new((ob0, ob1, ot1, ot0))   # outer
    bm.faces.new((ib1, ib0, it0, it1))   # inner
    bm.faces.new((ot0, ot1, it1, it0))   # top
    bm.faces.new((ob1, ob0, ib0, ib1))   # bottom
    bm.faces.new((ob0, ot0, it0, ib0))   # end at vertex k
    bm.faces.new((ob1, ib1, it1, ot1))   # end at vertex k+1


def sector_of(x, y):
    """Which octagon side (0..7) an angle around the axis belongs to."""
    a = math.atan2(y, x) - face_angle(0)
    return int(round(a / (math.pi / 4))) % 8


def split_by_sector(obj, collection, cap_material=None):
    """Split a joined mesh into 8 objects by octagon side. Small connected pieces stay whole
    (a bracket on a corner goes with the side its bulk is on); a piece that wraps around the
    tower (a welded wall ring) is cut face by face at the corners, and the cut ends are capped
    with cap_material so the burst shows solid masonry. Returns {k: object}; the original is removed."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    bm.edges.index_update()
    island = [-1] * len(bm.faces)
    face_sector = [0] * len(bm.faces)
    nid = 0
    for f in bm.faces:
        if island[f.index] >= 0:
            continue
        stack = [f]
        island[f.index] = nid
        members = []
        while stack:
            cur = stack.pop()
            members.append(cur)
            for v in cur.verts:
                for nf in v.link_faces:
                    if island[nf.index] < 0:
                        island[nf.index] = nid
                        stack.append(nf)
        own = [sector_of(*m.calc_center_median().xy) for m in members]
        if len(set(own)) > 2:
            for m, k in zip(members, own):
                face_sector[m.index] = k
        else:
            c = Vector((0, 0, 0))
            area = 0.0
            for m in members:
                a = m.calc_area()
                c += m.calc_center_median() * a
                area += a
            c = c / area if area > 0 else members[0].calc_center_median()
            k = sector_of(c.x, c.y)
            for m in members:
                face_sector[m.index] = k
        nid += 1
    cut = [e.index for e in bm.edges
           if len({face_sector[lf.index] for lf in e.link_faces}) > 1]
    mats = list(obj.data.materials)
    cap_idx = -1
    if cut and cap_material is not None:
        if cap_material.name not in [m.name for m in mats if m]:
            mats.append(cap_material)
        cap_idx = [m.name if m else "" for m in mats].index(cap_material.name)
    out = {}
    for k in range(8):
        b2 = bm.copy()
        b2.faces.ensure_lookup_table()
        b2.edges.ensure_lookup_table()
        kill = [b2.faces[i] for i in range(len(b2.faces)) if face_sector[i] != k]
        if len(kill) == len(b2.faces):
            b2.free()
            continue
        cut_e = [b2.edges[i] for i in cut]
        bmesh.ops.delete(b2, geom=kill, context="FACES")
        loose = [v for v in b2.verts if not v.link_faces]
        if loose:
            bmesh.ops.delete(b2, geom=loose, context="VERTS")
        cut_e = [e for e in cut_e if e.is_valid and e.is_boundary]
        if cut_e and cap_idx >= 0:
            caps = bmesh.ops.holes_fill(b2, edges=cut_e, sides=0)["faces"]
            for cf in caps:
                cf.material_index = cap_idx
                cf.smooth = False
            if caps:
                bmesh.ops.recalc_face_normals(b2, faces=caps)
        me = bpy.data.meshes.new(f"{obj.name}_{k}")
        b2.to_mesh(me)
        b2.free()
        for m in mats:
            me.materials.append(m)
        ob = bpy.data.objects.new(f"{obj.name}_{k}", me)
        collection.objects.link(ob)
        ob["face"] = k
        out[k] = ob
    bm.free()
    smooth = any(p.use_smooth for p in obj.data.polygons)
    if smooth:
        for ob in out.values():
            for p in ob.data.polygons:
                if p.material_index != cap_idx:
                    p.use_smooth = True
    bpy.data.objects.remove(obj, do_unlink=True)
    return out
