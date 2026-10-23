"""Cut the Chinese font down to the characters the site uses.
python subset_fonts.py   (runs before every `npm run build`)

The @fontsource package splits Noto Serif SC into ~100 slices per weight so any page can load
just the slices it needs; this page uses ~500 characters spread over most of them, so a reader
downloaded ~60 files and 2.3 MB. This script reads every character in the site's source (story,
quiz, labels, part descriptions, interface), takes those glyphs from the slices and merges them
into one small file per weight: web/src/fonts/noto-serif-sc-<weight>.woff2, declared in fonts.css.
Run it again whenever the text changes; a character missing from the subset falls back to the
system font."""
import json
import os
import re
import sys

from fontTools.merge import Merger
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, "web")
SRC = os.path.join(WEB, "src")
PKG = os.path.join(WEB, "node_modules", "@fontsource", "noto-serif-sc")
OUT = os.path.join(SRC, "fonts")
WEIGHTS = (400, 600, 900)


def site_characters():
    chars = set(chr(c) for c in range(0x20, 0x7F))  # Latin and digits inside Chinese sentences
    files = [os.path.join(SRC, f) for f in os.listdir(SRC) if f.endswith((".js", ".css"))]
    files.append(os.path.join(WEB, "index.html"))
    for path in files:
        if os.path.basename(path) == "fonts.css":
            continue
        chars |= {c for c in open(path, encoding="utf-8").read() if ord(c) > 0x7F}
    return chars


def slice_files(weight):
    """Slice files of one weight, with the code points each covers (from the package's unicode map)."""
    ranges = json.load(open(os.path.join(PKG, "unicode.json"), encoding="utf-8"))
    out = []
    for name, spec in ranges.items():
        cps = set()
        for part in spec.split(","):
            a, _, b = part.strip().replace("U+", "").partition("-")
            lo = int(a.replace("?", "0"), 16)
            hi = int(b, 16) if b else int(a.replace("?", "F"), 16)
            cps.update(range(lo, hi + 1))
        key = name.strip("[]")
        path = os.path.join(PKG, "files", f"noto-serif-sc-{key}-{weight}-normal.woff2")
        if os.path.exists(path):
            out.append((path, cps))
    return out


def build(weight, chars):
    want = {ord(c) for c in chars}
    pieces = []
    for path, cps in slice_files(weight):
        need = want & cps
        if not need:
            continue
        font = TTFont(path)
        have = need & set(font.getBestCmap())
        if not have:
            continue
        opts = Options()
        opts.layout_features = ["*"]
        opts.notdef_outline = True
        opts.name_IDs = ["*"]
        sub = Subsetter(opts)
        sub.populate(unicodes=sorted(have))
        sub.subset(font)
        tmp = os.path.join(OUT, f"_part{len(pieces)}.ttf")
        font.flavor = None
        font.save(tmp)
        pieces.append(tmp)
        want -= have
    merged = Merger().merge(pieces)
    for p in pieces:
        os.remove(p)
    merged.flavor = "woff2"
    dst = os.path.join(OUT, f"noto-serif-sc-{weight}.woff2")
    merged.save(dst)
    return dst, want


def main():
    sys.stdout.reconfigure(encoding="utf-8")  # the Windows console is not UTF-8 by default
    os.makedirs(OUT, exist_ok=True)
    chars = site_characters()
    missing_all = set()
    for w in WEIGHTS:
        dst, missing = build(w, chars)
        missing_all |= {chr(c) for c in missing if c > 0x7F}
        print(f"{os.path.basename(dst)}: {os.path.getsize(dst) / 1024:.0f} KB")
    # symbols the font does not have (arrows, ticks…) come from the system font, as before
    if missing_all:
        print("not in Noto Serif SC (system font):", "".join(sorted(missing_all)))
    print(f"{len(chars)} characters")
    return 0


if __name__ == "__main__":
    sys.exit(main())
