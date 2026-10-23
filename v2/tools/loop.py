"""Turn a rendered clip into a seamless loop for the web.
python loop.py <name> [loop=120] [fade=24]
Reads blender/out/clips/<name>/f_####.png (loop + fade frames), blends the last <fade> frames
into the first ones so the end runs straight into the start, and writes
web/public/media/<name>.mp4 (H.264) and <name>.webp (the first frame, shown until the video plays)."""
import os
import shutil
import subprocess
import sys
import tempfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIPS = os.path.join(ROOT, "blender", "out", "clips")
MEDIA = os.path.join(ROOT, "web", "public", "media")


def main():
    name = sys.argv[1]
    loop = int(sys.argv[2]) if len(sys.argv) > 2 else 96
    fade = int(sys.argv[3]) if len(sys.argv) > 3 else 24
    src = os.path.join(CLIPS, name)
    frame = lambda i: Image.open(os.path.join(src, f"f_{i + 1:04d}.png")).convert("RGB")  # noqa: E731
    tmp = tempfile.mkdtemp(prefix=f"loop_{name}_")
    try:
        for i in range(loop):
            im = frame(i)
            if i < fade:
                # the start fades in over the frames that follow the end
                im = Image.blend(frame(loop + i), im, i / fade)
            im.save(os.path.join(tmp, f"l_{i:04d}.png"))
            if i == 0:
                im.save(os.path.join(MEDIA, f"{name}.webp"), "WEBP", quality=84, method=6)
        out = os.path.join(MEDIA, f"{name}.mp4")
        ffmpeg = shutil.which("ffmpeg") or "ffmpeg"
        subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-framerate", "24", "-i", os.path.join(tmp, "l_%04d.png"),
                        "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], check=True)
        print(name, round(os.path.getsize(out) / 1e6, 2), "MB")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
