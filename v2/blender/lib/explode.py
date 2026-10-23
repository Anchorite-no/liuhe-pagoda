"""Mechanical exploded view of the pagoda, taken apart like an engine: every part keeps its
shape and moves only along the axis it was assembled on, one group after another.

One number u runs the disassembly (the web viewer uses the same numbers, see viewer.js):
  0 → 1  the finial lifts; the Qing timber casing splits into two halves through two opposite
         corners and the halves slide apart, leaving the Southern Song brick body standing
  1 → 2  the tower parts into seven groups (one brick storey with its two eaves), top first
  2 → 3  the groups above make room, then the lowest group's eaves come apart layer by layer:
         gallery floor, plank wall, bracket sets, roof (top layer first)
  3 → 4  a section cut opens the brick body (done with a boolean in the film, cut twins on the web)
The film also plays a reassembly in historical order (Song brick, Yuan finial, Qing timber);
offset() takes per-component weights so that order can be keyed separately.
"""
import math

from mathutils import Vector

from . import geom as G

AZ = math.radians(-22.5)                # the split plane runs through the corners at 67.5° / 247.5°
N = Vector((math.cos(AZ), math.sin(AZ), 0))  # the halves slide along ±N
OPEN = 17.0       # how far each half of the timber casing slides
GAP = 3.0         # vertical gap between the seven storey groups
LAYER = 2.4       # vertical gap between the layers of one eave
LAYER_OUT = 2.2   # ...and how far each layer steps outward, so the stack reads like a staircase
FINIAL_UP = 6.0
TIMBER = ("roof", "bells", "bracket", "bracketwall", "wall", "floor")
LAYER_OF = {"floor": 0, "wall": 1, "bracket": 2, "bracketwall": 2, "roof": 3, "bells": 3}
ROOM = LAYER * 7 + 2.0   # what the upper groups rise to let the lowest group's eaves spread


def smooth(u):
    u = max(0.0, min(1.0, u))
    return u * u * u * (u * (u * 6 - 15) + 10)


def seg(u, a, b):
    return smooth((u - a) / (b - a))


def world_center(ob):
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    return sum(bb, Vector()) / 8.0


class Piece:
    """What the timeline needs to know about one piece."""

    def __init__(self, ob):
        self.ob = ob
        self.part = ob.get("part", "")
        face = ob.get("face", -1)
        self.face = -1 if face is None else int(face)
        pname = ob.parent.name
        self.timber = pname.startswith("T")
        self.index = int(pname[1:3]) if self.timber else int(pname[1:2])
        self.group = self.index // 2 if self.timber else self.index
        if self.face < 0:
            self.side = 0
        else:
            a = G.face_angle(self.face)
            self.side = 1 if math.cos(a) * N.x + math.sin(a) * N.y > 0 else -1
        # layer inside the lowest group: eave 0 then eave 1, each floor → wall → brackets → roof
        self.layer = (self.index % 2) * 4 + LAYER_OF.get(self.part, 0) if self.timber else 0


def offset(p, w):
    """Translation (tower frame) of piece p; w(component, p) gives each component's weight 0..1."""
    off = Vector((0, 0, 0))
    if p.timber and p.side:
        off += N * (p.side * OPEN * w("open", p))
    off.z += GAP * p.group * w("lift", p)
    if p.group >= 1:
        off.z += ROOM * w("room", p)
    elif p.timber:
        k = w("spread", p)
        off.z += LAYER * p.layer * k
        if p.side:
            off += N * (p.side * LAYER_OUT * LAYER_OF.get(p.part, 0) * k)
    return off


def finial_offset(w):
    return Vector((0, 0, FINIAL_UP * w("cap", None) + GAP * 6 * w("lift_top", None) + ROOM * w("room_top", None)))


def timeline(u):
    """Component weights for the disassembly at u (0..4)."""
    def w(comp, p):
        if comp == "cap":
            return seg(u, 0.0, 0.3)
        if comp == "open":
            return seg(u, 0.2, 1.0)
        if comp in ("lift", "lift_top"):
            g = 6 if p is None else p.group
            start = 1.0 + (6 - g) / 6 * 0.35  # the top group moves first
            return seg(u, start, start + 0.65)
        if comp in ("room", "room_top"):
            return seg(u, 2.0, 2.35)
        if comp == "spread":
            start = 2.3 + (7 - p.layer) / 7 * 0.35  # the top layer first
            return seg(u, start, start + 0.35)
        return 0.0
    return w


def pieces(objs):
    """All pieces that move (children of the tier / storey empties)."""
    return [Piece(o) for o in objs if o.parent and (o.parent.name[:1] in ("T", "S")) and "part" in o]
