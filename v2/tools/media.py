"""Convert Blender renders into web media.
python media.py            -> stills + sequence + glb into web/public/media
"""
import os
import shutil
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "blender", "out")
MEDIA = os.path.join(ROOT, "web", "public", "media")


def webp(src, dst, width=None, q=82):
    im = Image.open(src).convert("RGB")
    if width and im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, "WEBP", quality=q, method=6)
    return os.path.getsize(dst)


# what the page shows besides the live model
STILLS = ("tide", "listen", "night", "interior")


def main():
    os.makedirs(MEDIA, exist_ok=True)
    total = 0
    keep = {f"{n}.webp" for n in STILLS} | {"pagoda.glb"}
    for f in os.listdir(MEDIA):
        if f not in keep and os.path.isfile(os.path.join(MEDIA, f)):
            os.remove(os.path.join(MEDIA, f))
    if os.path.isdir(os.path.join(MEDIA, "seq")):
        shutil.rmtree(os.path.join(MEDIA, "seq"))  # the pre-rendered film was replaced by the live model
    for name in STILLS:
        src = os.path.join(OUT, f"{name}_web.png")
        if not os.path.exists(src):
            src = os.path.join(OUT, f"{name}.png")
        if os.path.exists(src):
            total += webp(src, os.path.join(MEDIA, f"{name}.webp"), 2000, 86)
            print("still", name)
    glb = os.path.join(OUT, "pagoda.glb")
    if os.path.exists(glb):
        shutil.copy(glb, os.path.join(MEDIA, "pagoda.glb"))
        total += os.path.getsize(glb)
    print("TOTAL MB", round(total / 1e6, 1))


if __name__ == "__main__":
    main()
