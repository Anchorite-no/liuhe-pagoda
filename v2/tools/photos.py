"""Real photographs of the pagoda, the tide and the old days, from Wikimedia Commons.
python photos.py [--cache DIR]

Downloads each file in PHOTOS below (1920 px wide, one of Commons' standard thumbnail sizes:
other sizes are rate-limited hard), saves it as web/public/media/photos/<id>.webp (1600 px on
the long side, or 1920 px for full-screen pictures)
and writes web/src/photo-credits.js: author, licence and source page of every photograph,
which the site prints under each picture and in the footer. Every file here is either in the
public domain or under a Creative Commons licence that allows reuse with credit (CC BY / BY-SA).
Captions are written by hand in web/src/photos.js. Commons rate-limits downloads, so files
are cached (default: tools/.photo-cache) and a second run only converts."""
import argparse
import hashlib
import io
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "web", "public", "media", "photos")
OUT_JS = os.path.join(ROOT, "web", "src", "photo-credits.js")
API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "LiuhePagodaCourseSite/1.0 (ZJU course project; contact via Commons)"}

# id, Commons file, long side of the web copy
PHOTOS = [
    ("river", "20240128 Liuhe Pagoda 02.jpg", 1920),
    ("storm", "201608 Views of the Liuhe Pagoda from Qiantang River Bridge.jpg", 1920),
    ("front", "Hangzhou Liuhe Ta 20120518-01.jpg", 1600),
    ("tiers", "Hangzhou Liuhe Ta 20120518-02.jpg", 1600),
    ("lookup", "Hangzhou Liuhe Ta 20120518-06.jpg", 1600),
    ("eavebells", "Liuhe Pagoda in Hangzhou, 2015-03-01 03.jpg", 1600),
    ("archway", "Liuhe Pagoda 2016 January.jpg", 1600),
    ("entrance", "Liuhe Pagoda in Hangzhou, 2015-03-01 11.jpg", 1600),
    ("gallery", "Liuhe Pagoda in Hangzhou, 2015-03-01 05.jpg", 1600),
    ("plaque1", "Hangzhou Liuhe Ta 20120518-07.jpg", 1600),
    ("ceil2", "Liuhe Pagoda in Hangzhou, 2015-03-01 29.jpg", 1600),
    ("ceil3", "Liuhe Pagoda in Hangzhou, 2015-03-01 31.jpg", 1600),
    ("ceil4", "Liuhe Pagoda in Hangzhou, 2015-03-01 36.jpg", 1600),
    ("ceil5", "Liuhe Pagoda in Hangzhou, 2015-03-01 38.jpg", 1600),
    ("pillar", "Hangzhou Liuhe Ta 20120518-14.jpg", 1600),
    ("carving", "20250226 Liuhe Ta (140505).jpg", 1600),
    ("dragon", "20250226 Liuhe Ta (140306).jpg", 1600),
    ("songmodel", "Hangzhou Liuhe Ta 20120518-16.jpg", 1600),
    ("bell", "Liuhe Pagoda Bell.jpg", 1600),
    ("bridge", "20201217钱塘江大桥.jpg", 1600),
    ("bridgetop", "Hangzhou Qiantangjiang Daqiao 20120518-05.jpg", 1600),
    ("h1891", "Six Harmonies ca 1891.jpg", 1600),
    ("h1900", "Liu Ho Pagoda, Hangchow.jpg", 1600),
    ("h1910", "Liuhe Pagoda taken by Erwoxuan Photo Studio.jpg", 1600),
    ("h1918", "Liuhe Pagoda on the side of Qiantang River.jpg", 1600),
    ("h1918in", "Liuhe Pagoda (The interior).jpg", 1600),
    ("h1926", '亜細亜大観 03 010 "六和塔 （杭州）".jpg', 1600),
    ("h1959", "Zhejiang tartomány, Hat Harmónia (Liuhe) pagoda. Fortepan 30571.jpg", 1600),
    ("hymca", "Six Harmonies Pagoda. On the shore of Chien dong River.jpg", 1600),
    ("h1987", "Hangzhou, 1987.jpg", 1600),
    ("boreline", "海宁盐官一线潮.jpg", 1920),
    ("borecurve", "盐官一线潮5.jpg", 1920),
    ("boredragon", "盐官龙头潮.jpg", 1600),
    ("boreback", "海宁盐官回头潮.jpg", 1600),
    ("borecity", "20190916钱江潮通过城市阳台.jpg", 1600),
    ("boreroad", "20240921钱江潮冲上之江路.png", 1600),
    ("bore1892", "Bore of the Tsien-tang-kiang Moore 1893 01.png", 1600),
    ("mural", "Old custom to surf the tidal bores.jpg", 1600),
    ("chart", "Approaches to the Tsien-Tang Kiang Moore 1888.png", 1600),
    ("crowd", "盐官观潮.jpg", 1600),
    ("yulemap", "Hang-Chau-Fu with the Lake.png", 1600),
]


# where the Commons “author” field is a sentence rather than a name
AUTHOR = {
    "h1891": "from a book by A. E. Moule (1891)",
    "h1959": "Fortepan / Kina (ID 30571)",
    "hymca": "Kautz Family YMCA Archives, University of Minnesota",
    "bore1892": "W. U. Moore (1893)",
    "chart": "W. U. Moore (1888)",
    "mural": "方的1P",
}


def api(params):
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json"})
    return json.load(fetch(url))


def fetch(url):
    for k in range(14):
        try:
            time.sleep(1.0)
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90)
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(min(90, 15 * (k + 1)))
    raise RuntimeError("Commons keeps saying 429: try again later")


def thumb_url(ii):
    """A thumbnail in one of Commons' standard widths, smaller than the original: originals and
    odd sizes are refused (429) to scripts, standard thumbnails are served from the cache."""
    std = max([w for w in (960, 1280, 1920) if w < ii["width"]] or [960])
    url = ii.get("thumburl") or ii["url"]
    if f"/{std}px-" in url:
        return url
    m = re.match(r"(https://upload\.wikimedia\.org/wikipedia/commons/)(\w/\w\w/)([^?]+)", ii["url"])
    return f"{m.group(1)}thumb/{m.group(2)}{m.group(3)}/{std}px-{m.group(3)}"


def clean(html):
    text = re.sub(r"<[^>]+>", "", html or "")
    return re.sub(r"\s+", " ", text).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default=os.path.join(ROOT, "tools", ".photo-cache"))
    args = ap.parse_args()
    os.makedirs(args.cache, exist_ok=True)
    os.makedirs(OUT_DIR, exist_ok=True)
    credits = {}
    titles = ["File:" + t for _, t, _ in PHOTOS]
    info = {}
    for i in range(0, len(titles), 30):
        d = api({"action": "query", "titles": "|".join(titles[i:i + 30]), "prop": "imageinfo", "iiprop": "url|size|extmetadata", "iiurlwidth": 1920})
        norm = {n["to"]: n["from"] for n in d["query"].get("normalized", [])}
        for p in d["query"]["pages"].values():
            info[norm.get(p["title"], p["title"])] = p.get("imageinfo", [None])[0]
    for pid, title, size in PHOTOS:
        ii = info.get("File:" + title)
        if not ii:
            print("MISSING", title)
            continue
        cached = os.path.join(args.cache, hashlib.md5(("File:" + title).encode()).hexdigest()[:8])
        if not os.path.exists(cached):
            print("download", title)
            data = fetch(thumb_url(ii)).read()
            open(cached, "wb").write(data)
        im = Image.open(cached)
        im = im.convert("RGB")
        im.thumbnail((size, size), Image.LANCZOS)
        im.save(os.path.join(OUT_DIR, pid + ".webp"), "WEBP", quality=74, method=6)
        em = ii.get("extmetadata", {})
        g = lambda k: clean((em.get(k) or {}).get("value"))
        artist = g("Artist") or g("Credit")
        artist = AUTHOR.get(pid) or re.sub(r"^(Unknown author)+", "Unknown author", artist)[:90]
        credits[pid] = {
            "src": f"media/photos/{pid}.webp",
            "w": im.width,
            "h": im.height,
            "author": artist,
            "license": g("LicenseShortName"),
            "licenseUrl": g("LicenseUrl"),
            "page": ii.get("descriptionurl"),
        }
        print("ok", pid, im.size, credits[pid]["license"], "·", artist[:40])
    body = json.dumps(credits, ensure_ascii=False, indent=1)
    with open(OUT_JS, "w", encoding="utf-8") as fh:
        fh.write("// written by tools/photos.py: who took each photograph, under which licence, and where it lives on Wikimedia Commons\n")
        fh.write(f"export const CREDITS = {body};\n")


if __name__ == "__main__":
    main()
