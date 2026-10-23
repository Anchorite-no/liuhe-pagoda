"""Trees for Yuelun Hill that read as trees, not as heaps of moss: a curved trunk, limbs, twigs,
and hundreds of sprays of leaves at the ends of the twigs, with gaps between them so the crown
breaks up into light and shade, and a leaf material the low sun shines through."""
import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector

from . import geom as G
from . import materials as M


def leaf_material(name, dark, light, autumn=None):
    """Leaves: colour varies spray by spray (an attribute), a little light comes through."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m, nt, bsdf = M._new(name)
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "tone"
    stops = [(0.0, M.srgb(dark)), (0.7, M.srgb(light))]
    if autumn:
        stops.append((1.0, M.srgb(autumn)))
    col = M._ramp(nt, attr.outputs["Fac"], stops)
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.55
    # light through the leaf: mix in a translucent shader of the same colour
    out = next(n for n in nt.nodes if n.type == "OUTPUT_MATERIAL")
    tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    nt.links.new(col, tr.inputs["Color"])
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = 0.4
    nt.links.new(bsdf.outputs["BSDF"], mix.inputs[1])
    nt.links.new(tr.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def bark_material():
    if "Bark" in bpy.data.materials:
        return bpy.data.materials["Bark"]
    m, nt, bsdf = M._new("Bark")
    v = M._coord(nt, "Object", (1.0, 1.0, 0.25))
    col = M._ramp(nt, M._noise(nt, v, 6.0, 6), [(0.3, M.srgb("#2a231c")), (0.7, M.srgb("#4a3f33"))])
    nt.links.new(col, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.9
    return m


def _tube(bm, pts, r0, r1, sides=6):
    """A tapered tube through pts, radius r0 at the start to r1 at the end."""
    rings = []
    for i, p in enumerate(pts):
        d = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        a = Vector((0, 0, 1)) if abs(d.z) < 0.95 else Vector((1, 0, 0))
        u = d.cross(a).normalized()
        v = d.cross(u).normalized()
        r = r0 + (r1 - r0) * i / (len(pts) - 1)
        rings.append([bm.verts.new(p + (u * math.cos(k * 2 * math.pi / sides) + v * math.sin(k * 2 * math.pi / sides)) * r) for k in range(sides)])
    for a, b in zip(rings, rings[1:]):
        for k in range(sides):
            bm.faces.new((a[k], a[(k + 1) % sides], b[(k + 1) % sides], b[k]))


def _limb(start, direction, length, droop, rnd, segs=4):
    """Points along a gently curving limb."""
    pts = [start]
    d = direction.normalized()
    p = start
    for _ in range(segs):
        d = (d + Vector((rnd.uniform(-0.25, 0.25), rnd.uniform(-0.25, 0.25), -droop))).normalized()
        p = p + d * (length / segs)
        pts.append(p)
    return pts


def _spray(bm, layer, c, n, size, tone, rnd, blades=6):
    """A spray of leaves: blades fanning out round point c, facing roughly along n."""
    a = Vector((0, 0, 1)) if abs(n.z) < 0.9 else Vector((1, 0, 0))
    u = n.cross(a).normalized()
    v = n.cross(u).normalized()
    for k in range(blades):
        ang = k * 2 * math.pi / blades + rnd.uniform(-0.3, 0.3)
        d = (u * math.cos(ang) + v * math.sin(ang) + n * rnd.uniform(0.0, 0.5)).normalized()
        side = n.cross(d).normalized()
        L = size * rnd.uniform(0.75, 1.15)
        w = L * 0.36
        q0 = c
        q1 = c + d * L * 0.45 + side * w / 2
        q2 = c + d * L
        q3 = c + d * L * 0.45 - side * w / 2
        f = bm.faces.new([bm.verts.new(q) for q in (q0, q1, q2, q3)])
        t = min(1.0, max(0.0, tone + rnd.uniform(-0.08, 0.08)))
        for loop in f.loops:
            loop[layer] = (t, t, t, 1.0)


def broadleaf(name, col, seed, height=12.0, crown=6.0, leaves=None, autumn_share=0.0):
    rnd = random.Random(seed)
    bm_w = bmesh.new()
    bm_l = bmesh.new()
    layer = bm_l.loops.layers.float_color.new("tone")
    trunk_top = Vector((rnd.uniform(-0.4, 0.4), rnd.uniform(-0.4, 0.4), height * 0.62))
    trunk = [Vector((0, 0, 0)), Vector((0.1, 0, height * 0.2)), trunk_top * 0.7 + Vector((0, 0, height * 0.12)), trunk_top]
    _tube(bm_w, trunk, 0.32, 0.2, 7)
    n_limbs = rnd.randint(9, 12)
    for i in range(n_limbs):
        t = 0.3 + 0.7 * i / n_limbs
        base = trunk[1].lerp(trunk_top, t)
        az = i * 2.4 + rnd.uniform(-0.4, 0.4)
        el = rnd.uniform(0.45, 1.05)
        d = Vector((math.cos(az) * math.cos(el), math.sin(az) * math.cos(el), math.sin(el)))
        L = crown * rnd.uniform(0.6, 0.9) * (1.15 - 0.4 * t)
        limb = _limb(base, d, L, 0.06, rnd)
        _tube(bm_w, limb, 0.14 * (1.1 - 0.4 * t), 0.04, 5)
        # twigs off the outer part of each limb, each ending in sprays of leaves
        # leaves along the limb itself, so the crown is full near the middle too
        for q in range(rnd.randint(4, 7)):
            f = rnd.uniform(0.4, 1.0)
            k = min(len(limb) - 2, int(f * (len(limb) - 1)))
            c = limb[k].lerp(limb[k + 1], f * (len(limb) - 1) - k) + Vector((rnd.uniform(-0.5, 0.5), rnd.uniform(-0.5, 0.5), rnd.uniform(-0.2, 0.5)))
            _spray(bm_l, layer, c, (c - trunk_top * 0.8).normalized(), crown * 0.1, rnd.uniform(0.0, 0.7), rnd)
        for j in range(rnd.randint(5, 7)):
            s = rnd.uniform(0.35, 1.0)
            k = min(len(limb) - 2, int(s * (len(limb) - 1)))
            p = limb[k].lerp(limb[k + 1], s * (len(limb) - 1) - k)
            td = (d + Vector((rnd.uniform(-0.8, 0.8), rnd.uniform(-0.8, 0.8), rnd.uniform(-0.1, 0.6)))).normalized()
            twig = _limb(p, td, L * rnd.uniform(0.3, 0.5), 0.12, rnd, 3)
            _tube(bm_w, twig, 0.035, 0.012, 4)
            tone = rnd.uniform(0.0, 0.7) if rnd.random() > autumn_share else rnd.uniform(0.85, 1.0)
            for q in range(rnd.randint(16, 24)):
                f = rnd.uniform(0.25, 1.0)
                kk = min(len(twig) - 2, int(f * (len(twig) - 1)))
                c = twig[kk].lerp(twig[kk + 1], f * (len(twig) - 1) - kk)
                c += Vector((rnd.uniform(-0.8, 0.8), rnd.uniform(-0.8, 0.8), rnd.uniform(-0.4, 0.6)))
                n = (c - trunk_top * 0.9 + Vector((0, 0, 1.2))).normalized()
                _spray(bm_l, layer, c, n, crown * 0.11, tone, rnd, blades=7)
    wood = G.obj_from_bmesh(bm_w, f"{name}_wood", col, bark_material(), smooth=True)
    leaf = G.obj_from_bmesh(bm_l, f"{name}_leaves", col, leaves)
    return G.join([wood, leaf], name)


def conifer(name, col, seed, height=16.0, width=4.2, needles=None):
    rnd = random.Random(seed)
    bm_w = bmesh.new()
    bm_l = bmesh.new()
    layer = bm_l.loops.layers.float_color.new("tone")
    trunk = [Vector((0, 0, 0)), Vector((0.1, 0.05, height * 0.5)), Vector((0.05, 0.1, height))]
    _tube(bm_w, trunk, 0.3, 0.06, 7)
    tiers = 12
    for i in range(tiers):
        f = i / (tiers - 1)
        z = height * (0.32 + 0.66 * f)
        reach = width * (1.0 - 0.78 * f) * rnd.uniform(0.85, 1.1)
        for j in range(rnd.randint(6, 8)):
            az = j * 2 * math.pi / 7 + rnd.uniform(-0.4, 0.4) + i
            d = Vector((math.cos(az), math.sin(az), rnd.uniform(-0.15, 0.1)))
            base = Vector((0, 0, z))
            limb = _limb(base, d, reach, 0.05, rnd, 3)
            _tube(bm_w, limb, 0.07, 0.02, 4)
            tone = rnd.uniform(0.0, 0.55)
            for q in range(rnd.randint(12, 17)):
                s = rnd.uniform(0.2, 1.0)
                k = min(len(limb) - 2, int(s * (len(limb) - 1)))
                c = limb[k].lerp(limb[k + 1], s * (len(limb) - 1) - k) + Vector((rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3), rnd.uniform(-0.1, 0.25)))
                n = Vector((rnd.uniform(-0.2, 0.2), rnd.uniform(-0.2, 0.2), 1.0)).normalized()  # needle sprays lie flat
                _spray(bm_l, layer, c, n, 0.95 + 0.6 * (1 - f), tone, rnd, blades=8)
    wood = G.obj_from_bmesh(bm_w, f"{name}_wood", col, bark_material(), smooth=True)
    leaf = G.obj_from_bmesh(bm_l, f"{name}_needles", col, needles)
    return G.join([wood, leaf], name)


def build_prototypes(col, seed=3):
    """The set the hillside is planted from: camphors, a few maples and ginkgos turning, pines."""
    camphor = leaf_material("LeafCamphor", "#27391b", "#62783a", "#8a9440")
    maple = leaf_material("LeafMaple", "#40261a", "#86412a", "#a85a32")
    ginkgo = leaf_material("LeafGinkgo", "#4d4f20", "#9a8a34", "#b9a24a")
    pine = leaf_material("LeafPine", "#132015", "#2c3d24")
    # mostly evergreen camphor; a turning maple or ginkgo here and there, not confetti
    specs = [(11, 5.2, camphor, 0.04), (13, 6.2, camphor, 0.02), (15, 7.0, camphor, 0.05), (10, 5.0, camphor, 0.0),
             (12, 6.0, maple, 0.5), (11, 5.4, ginkgo, 0.4), (14, 6.6, camphor, 0.06), (9, 4.6, camphor, 0.0),
             (12.5, 5.8, camphor, 0.03), (10.5, 5.3, camphor, 0.0), (13.5, 6.4, camphor, 0.04), (11.5, 5.6, camphor, 0.02),
             (14.5, 6.9, camphor, 0.0), (10, 4.9, camphor, 0.05)]
    protos = []
    for i, (h, c, mat, aut) in enumerate(specs):
        protos.append(broadleaf(f"Tree{i}", col, seed + i, height=h, crown=c, leaves=mat, autumn_share=aut))
    for i, (h, w) in enumerate([(17, 4.4), (14, 3.8)]):
        protos.append(conifer(f"Pine{i}", col, seed + 40 + i, height=h, width=w, needles=pine))
    return protos
